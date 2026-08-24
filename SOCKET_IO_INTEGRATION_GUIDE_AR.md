# دليل تنفيذ سيرفر العميل (Socket.io)

**الإصدار:** 2.0  
**تاريخ التحديث:** مارس 2026  
**الهيكلية:** لامركزية (BYOD)

---

## 📋 نظرة عامة

في هيكلية بوابة الرسائل هذه، **أنت (العميل)** من يقوم باستضافة سيرفر Socket.io. يقوم تطبيق البوابة على الأندرويد بالاتصال **بسيرفرك** لاستقبال أوامر الإرسال. هذا يضمن أن بيانات رسائلك تتدفق مباشرة من نظامك إلى جهازك، دون المرور عبر سيرفرات "آيديا".

### آلية العمل:
1.  تقوم أنت بتشغيل سيرفر Socket.io (باستخدام Node.js, Python, إلخ).
2.  تقوم بإدخال رابط السيرفر الخاص بك في تطبيق الأندرويد (شاشة إدارة الاتصال).
3.  يتصل التطبيق بسيرفرك.
4.  يقوم نظامك بإرسال أوامر `send_message` إلى التطبيق.
5.  يعالج التطبيق الطلب ويرسل تقرير `message_response` عائداً إلى سيرفرك.

---

## 🚀 إعداد السيرفر (مثال Node.js)

### 1. تثبيت المكتبات
```bash
npm install socket.io
```

### 2. كود السيرفر (`server.js`)

```javascript
const { Server } = require("socket.io");

const io = new Server(3000, {
  cors: {
    origin: "*", // السماح بالاتصال من التطبيق
  }
});

// Middleware for Authentication (وسيط للمصادقة)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const MY_SECRET_TOKEN = "your_secure_random_string"; // قم بتغيير هذا الرمز!

  if (token === MY_SECRET_TOKEN) {
    next();
  } else {
    next(new Error("Authentication error: Invalid Token"));
  }
});

console.log("🚀 Client Socket Server running on port 3000");

io.on("connection", (socket) => {
  console.log(`📱 Gateway Connected: ${socket.id}`);

  // 1. الاستماع لتقارير حالة الجهاز
  socket.on("device_status", (status) => {
    console.log("🔋 Device Status:", status);
    // قم بحفظ الحالة في قاعدة بياناتك...
  });

  // 2. الاستماع لتقارير تسليم الرسائل
  socket.on("message_response", (response) => {
    console.log("📨 Message Report:", response);
    // قم بتحديث حالة الطلب في نظامك...
  });

  socket.on("disconnect", () => {
    console.log("⚠️ Gateway Disconnected");
  });
});

// مثال: دالة لإرسال رسالة عبر البوابة المتصلة
function sendMessage(type, phoneNumber, text) {
  if (type !== 'whatsapp' && type !== 'sms') {
    throw new Error('يجب أن يكون type هو whatsapp أو sms');
  }

  const messagePayload = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    phoneNumber,
    message: text,
    timestamp: Date.now()
  };

  // أرسل إلى البوابة المستهدفة فقط في الإنتاج، وليس إلى جميع الأجهزة عشوائياً.
  io.emit("send_message", messagePayload);
  console.log(`📤 تم إرسال أمر ${type} إلى البوابة`);
}

// بالنسبة إلى SMS، انتظر message_response بحالة sent.
// مسار SMS الخلفي يتطلب DirectSms داخل عميل Android المخصص.
setTimeout(() => {
  sendMessage("sms", "+966500000000", "مرحباً من سيرفري!");
}, 10000);
```

---

## 📡 مرجع الواجهة البرمجية (الأحداث - Events)

### 1. من السيرفر -> إلى التطبيق (أوامر)

#### `send_message`
أرسل هذا الحدث لتوجيه أمر إرسال رسالة عبر الجهاز.

**الحمولة (Payload):**
```json
{
  "id": "unique_id_123",
  "type": "whatsapp", 
  "phoneNumber": "+96650xxxxxxx",
  "message": "رمز التحقق الخاص بك هو 1234",
  "timestamp": 1715421234567
}
```
*   `type`: حقل مطلوب ويجب أن يكون بالضبط `"whatsapp"` أو `"sms"`؛ لا يتم افتراض WhatsApp عند غياب النوع.
*   عند استخدام `"sms"` يجب أن يوفّر عميل Android المخصص الوحدة `DirectSms.sendSms`. محرر SMS الموجه للمستخدم مسار منفصل ولا يمثل تأكيداً للإرسال الخلفي.
*   تعني حالة `sent` نجاح استدعاء إرسال SMS الأصلي فقط. أما غياب الوحدة أو فشل التحقق أو تجاوز الحصة أو فشل الجهاز/الموفر فينتج حالة `failed`.

### 2. من التطبيق -> إلى السيرفر (تقارير)

#### `device_status`
يتم إرساله دورياً من التطبيق للإبلاغ عن حالته الصحية.

**الحمولة (Payload):**
```json
{
  "timestamp": 1715421234567,
  "platform": "android",
  "batteryLevel": 0.85,
  "batteryState": "charging",
  "isCharging": true,
  "networkType": "wifi",
  "isOnline": true
}
```

#### `message_response`
يتم إرساله بعد محاولة التطبيق معالجة الرسالة.

**الحمولة (Payload):**
```json
{
  "messageId": "unique_id_123",
  "status": "sent", 
  "error": null,
  "timestamp": 1715421239999
}
```
*   `status`: `"sent"` (تم الإرسال), `"failed"` (فشل), أو `"pending"` (قيد الانتظار).
*   `error`: وصف الخطأ في حال الفشل.

---

## 🔒 أفضل ممارسات الأمان

1.  **المصادقة (Authentication)**: قم بتنفيذ آلية مصافحة (Handshake) تتطلب من التطبيق إرسال رمز سري (Secret Token) عند الاتصال لمنع الأجهزة غير المصرح بها من الاتصال بسيرفرك.
2.  **التشفير (SSL/TLS)**: استخدم دائماً `wss://` (HTTPS) في البيئة الحية لتشفير الاتصال.


## CORS الخاص بلوحة التحكم في الإنتاج

تعمل لوحة التحكم المستقلة على النطاق `https://msgatewayadm-4pkhhml8.manus.space`. يجب أن يتضمن الخادم المركزي هذا النطاق حرفياً ضمن المتغير `CORS_ALLOWED_ORIGINS` من دون شرطة مائلة في النهاية، ثم يجب إعادة تشغيل الخادم وإعادة نشره قبل أن يعمل تسجيل الدخول أو تحديثات حالة Socket.io من المتصفح.

```env
CORS_ALLOWED_ORIGINS=https://msgatewayadm-4pkhhml8.manus.space
```

لا تخضع اتصالات تطبيق أندرويد الأصلية لقيود CORS الخاصة بالمتصفح، بينما تخضع لها لوحة التحكم. يجب إبقاء المصادقة والوصول إلى قاعدة البيانات داخل الخادم المركزي، وعدم وضع بيانات الاعتماد داخل ملفات الواجهة.


## عزل قناة WhatsApp عن SMS

تُقبل أوامر WhatsApp فقط عندما تكون قيمة `type` مساوية تماماً لـ `whatsapp`، ثم تمر عبر `messageHandlerService` إلى محول WebView الفعلي `whatsAppService`. لا يجوز لـ hook الواجهة تسجيل مستمع ثانٍ لحدث `send_message` أو استدعاء محول WhatsApp مباشرة؛ يحتفظ `socketService` بمستمع واحد للأوامر، ويوفر `off()` لتنظيف دورة الحياة. تبقى رسالة WhatsApp في حالة `pending` حتى تصبح WebView جاهزة، ولا تُرسل نتيجة `sent` قبل وصول تأكيد WebView.

يستمر SMS عبر `smsService` المستقل، ولا يُعاد توجيهه إلى WhatsApp، كما لا يجوز مشاركة جاهزية WhatsApp أو طول طابوره أو أحداثه أو آلية إعادة محاولته مع حالة SMS. يجب أن تستخدم أحداث مراقبة WebView الصيغة `window.ReactNativeWebView.postMessage(JSON.stringify(...))` حتى تصل إلى معالج `onMessage` الأصلي في التطبيق.

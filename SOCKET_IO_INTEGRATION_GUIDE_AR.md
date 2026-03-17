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
function sendWhatsApp(phoneNumber, text) {
  const messagePayload = {
    id: `msg_${Date.now()}`,
    type: 'whatsapp',
    phoneNumber: phoneNumber, // مثال: "+96650xxxxxxx"
    message: text,
    timestamp: Date.now()
  };

  // إرسال الأمر لجميع البوابات المتصلة (أو يمكن تحديد socket id معين)
  io.emit("send_message", messagePayload);
  console.log("📤 Command sent to Gateway");
}

// تجربة إرسال رسالة بعد 10 ثواني
setTimeout(() => {
  sendWhatsApp("+966500000000", "مرحباً من السيرفر الخاص بي!");
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
*   `type`: يمكن أن يكون `"whatsapp"` أو `"sms"`.

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

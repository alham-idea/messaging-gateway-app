# دليل ربط Socket.io - بوابة الرسائل

**الإصدار:** 1.0  
**آخر تحديث:** مارس 2026  
**المالك:** آيديا للاستشارات والحلول التسويقية والتقنية

---

## 📋 نظرة عامة

هذا الدليل موجه للمبرمجين الذين يريدون ربط أنظمتهم أو مواقعهم أو منصاتهم مع تطبيق **بوابة الرسائل** عبر **Socket.io**. 

### آلية العمل:
1. نظام العميل يتصل بـ Socket.io باستخدام API Key
2. نظام العميل يرسل أمر إرسال رسالة (SMS أو WhatsApp)
3. التطبيق يستقبل الأمر ويرسل الرسالة من هاتف العميل
4. التطبيق يرسل تقرير بحالة الرسالة (نجح/فشل)

---

## 🔑 الحصول على API Key

1. قم بتسجيل الدخول إلى **لوحة التحكم الإدارية**
2. انتقل إلى **الإعدادات** → **API Keys**
3. انقر على **إنشاء مفتاح جديد**
4. انسخ المفتاح واحفظه في مكان آمن

**⚠️ تحذير أمني:** لا تشارك API Key مع أحد، واستخدمه فقط على الخادم الخاص بك.

---

## 🔌 الاتصال بـ Socket.io

### URL الاتصال:
```
wss://your-server-url/socket.io/?apiKey=YOUR_API_KEY
```

### مثال باستخدام Node.js:
```javascript
const io = require('socket.io-client');

const socket = io('wss://your-server-url', {
  query: {
    apiKey: 'YOUR_API_KEY'
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 5000,
  reconnectionDelayMax: 10000,
  reconnectionAttempts: 10,
  autoConnect: true,
  forceNew: true
});

socket.on('connect', () => {
  console.log('✓ متصل بـ بوابة الرسائل');
  console.log('Client ID:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('✗ خطأ في الاتصال:', error);
});

socket.on('disconnect', (reason) => {
  console.log('✗ تم قطع الاتصال:', reason);
});

socket.on('error', (error) => {
  console.error('⚠️ خطأ:', error);
});
```

### مثال باستخدام Python:
```python
from socketio import Client

sio = Client(transports=['websocket', 'polling'])

@sio.event
def connect():
    print('✓ متصل بـ بوابة الرسائل')

@sio.event
def connect_error(data):
    print('✗ خطأ في الاتصال:', data)

@sio.event
def disconnect():
    print('✗ تم قطع الاتصال')

sio.connect('wss://your-server-url',
            auth={'apiKey': 'YOUR_API_KEY'})
```

---

## 📤 الأحداث المرسلة من النظام إلى التطبيق

### 1. إرسال رسالة (`send_message`)

**الوصف:** إرسال أمر من نظام العميل إلى التطبيق لإرسال رسالة SMS أو WhatsApp.

**البيانات المرسلة:**
```json
{
  "id": "msg-12345",
  "type": "whatsapp",
  "phoneNumber": "+966501234567",
  "message": "مرحباً بك في متجرنا",
  "timestamp": 1678900000000
}
```

**شرح الحقول:**

| الحقل | النوع | الوصف | مثال |
|------|------|-------|-------|
| `id` | string | معرّف فريد للرسالة | `order-001`, `msg-12345` |
| `type` | string | نوع الرسالة | `"whatsapp"` أو `"sms"` |
| `phoneNumber` | string | رقم الهاتف (صيغة دولية) | `"+966501234567"` |
| `message` | string | نص الرسالة | `"تم استلام طلبك"` |
| `timestamp` | number | وقت الإرسال (milliseconds) | `Date.now()` |

**مثال على الإرسال:**
```javascript
socket.emit('send_message', {
  id: 'order-12345',
  type: 'whatsapp',
  phoneNumber: '+966501234567',
  message: 'طلبك رقم #12345 جاهز للاستلام',
  timestamp: Date.now()
});
```

---

## 📥 الأحداث المستقبلة من التطبيق إلى النظام

### 1. حالة الجهاز (`device_status`)

**الوصف:** التطبيق يرسل معلومات حالة الجهاز بشكل دوري.

**البيانات المستقبلة:**
```json
{
  "timestamp": 1678900000000,
  "platform": "ios",
  "batteryLevel": 85,
  "batteryState": "charging",
  "isCharging": true,
  "networkType": "wifi",
  "isOnline": true
}
```

**شرح الحقول:**

| الحقل | النوع | الوصف | القيم الممكنة |
|------|------|-------|--------------|
| `timestamp` | number | وقت الإرسال | - |
| `platform` | string | نظام التشغيل | `"ios"`, `"android"` |
| `batteryLevel` | number | مستوى البطارية (0-100) | 0-100 |
| `batteryState` | string | حالة البطارية | `"charging"`, `"discharging"`, `"full"` |
| `isCharging` | boolean | هل الجهاز يشحن | `true` / `false` |
| `networkType` | string | نوع الشبكة | `"wifi"`, `"cellular"`, `"none"` |
| `isOnline` | boolean | هل الجهاز متصل بالإنترنت | `true` / `false` |

**مثال على الاستقبال:**
```javascript
socket.on('device_status', (status) => {
  console.log('📱 حالة الجهاز:', status);
  
  // تسجيل الحالة في قاعدة البيانات
  logDeviceStatus(status);
  
  // تنبيهات مهمة
  if (status.batteryLevel < 20) {
    console.warn('⚠️ البطارية منخفضة جداً');
    sendAlert('البطارية منخفضة');
  }
  
  if (!status.isOnline) {
    console.warn('⚠️ الجهاز غير متصل بالإنترنت');
    sendAlert('الجهاز غير متصل');
  }
});
```

### 2. نتيجة الرسالة (`message_response`)

**الوصف:** التطبيق يرسل تقرير عن حالة الرسالة المرسلة.

**البيانات المستقبلة (نجح):**
```json
{
  "messageId": "msg-12345",
  "status": "sent",
  "timestamp": 1678900005000
}
```

**البيانات المستقبلة (فشل):**
```json
{
  "messageId": "msg-12345",
  "status": "failed",
  "error": "رقم الهاتف غير صحيح",
  "timestamp": 1678900005000
}
```

**شرح الحقول:**

| الحقل | النوع | الوصف | القيم الممكنة |
|------|------|-------|--------------|
| `messageId` | string | معرّف الرسالة (نفس الـ ID المرسل) | - |
| `status` | string | حالة الرسالة | `"sent"`, `"failed"`, `"pending"` |
| `error` | string | رسالة الخطأ (إن وجدت) | - |
| `timestamp` | number | وقت التقرير | - |

**مثال على الاستقبال:**
```javascript
socket.on('message_response', (response) => {
  console.log('📨 نتيجة الرسالة:', response);
  
  if (response.status === 'sent') {
    console.log(`✓ تم إرسال الرسالة ${response.messageId}`);
    updateDatabase(response.messageId, 'sent');
  } else if (response.status === 'failed') {
    console.error(`✗ فشل الإرسال: ${response.error}`);
    updateDatabase(response.messageId, 'failed', response.error);
    // إعادة محاولة أو تنبيه
    retryMessage(response.messageId);
  } else if (response.status === 'pending') {
    console.log(`⏳ الرسالة قيد الانتظار`);
  }
});
```

---

## 🔄 دورة حياة الرسالة

```
النظام                          التطبيق
  │                              │
  ├─ send_message ────────────→  │
  │                              ├─ معالجة الرسالة
  │                              ├─ إرسالها عبر WhatsApp/SMS
  │                              │
  │  ←─ message_response ────────┤
  │     (status: sent/failed)     │
  │                              │
```

---

## 📊 مثال عملي كامل

```javascript
const io = require('socket.io-client');

// الاتصال بـ Socket.io
const socket = io('wss://your-server-url', {
  query: { apiKey: 'YOUR_API_KEY' },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 5000,
  reconnectionAttempts: 10
});

// الاتصال الناجح
socket.on('connect', () => {
  console.log('✓ متصل بـ بوابة الرسائل');
  console.log('Client ID:', socket.id);
});

// استقبال نتيجة الرسالة
socket.on('message_response', (response) => {
  if (response.status === 'sent') {
    console.log(`✓ تم إرسال الرسالة ${response.messageId}`);
    // تحديث قاعدة البيانات
    updateMessageStatus(response.messageId, 'sent');
  } else if (response.status === 'failed') {
    console.error(`✗ فشل: ${response.error}`);
    // إعادة محاولة
    retryMessage(response.messageId);
  }
});

// استقبال حالة الجهاز
socket.on('device_status', (status) => {
  console.log('📱 حالة الجهاز:', {
    battery: status.batteryLevel + '%',
    network: status.networkType,
    online: status.isOnline
  });
});

// معالجة الأخطاء
socket.on('error', (error) => {
  console.error('⚠️ خطأ:', error);
});

// قطع الاتصال
socket.on('disconnect', (reason) => {
  console.log('✗ تم قطع الاتصال:', reason);
});

// دالة لإرسال رسالة
function sendMessage(phoneNumber, message, type = 'whatsapp') {
  const messageData = {
    id: `msg-${Date.now()}`,
    type: type,
    phoneNumber: phoneNumber,
    message: message,
    timestamp: Date.now()
  };
  
  socket.emit('send_message', messageData);
  console.log('📤 تم إرسال أمر الرسالة:', messageData.id);
}

// مثال على الاستخدام
sendMessage('+966501234567', 'مرحباً بك في متجرنا', 'whatsapp');
```

---

## ⚠️ معالجة الأخطاء والحالات الاستثنائية

### 1. فشل الاتصال الأولي
```javascript
socket.on('connect_error', (error) => {
  console.error('خطأ الاتصال:', error.message);
  // تحقق من:
  // - صحة API Key
  // - صحة Server URL
  // - الاتصال بالإنترنت
  // - جدار الحماية (Firewall)
});
```

### 2. انقطاع الاتصال المفاجئ
```javascript
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // الخادم قطع الاتصال (قد يكون بسبب انتهاء الاشتراك)
    console.log('الخادم قطع الاتصال');
    socket.connect();
  } else if (reason === 'io client namespace disconnect') {
    // العميل قطع الاتصال
    console.log('تم قطع الاتصال من قبل العميل');
  } else {
    // انقطاع الشبكة أو خطأ آخر
    console.log('انقطع الاتصال بسبب:', reason);
  }
});
```

### 3. إعادة محاولة الرسائل الفاشلة
```javascript
const failedMessages = [];

socket.on('message_response', (response) => {
  if (response.status === 'failed') {
    failedMessages.push({
      messageId: response.messageId,
      error: response.error,
      retries: 0
    });
    
    // إعادة محاولة بعد 30 ثانية
    setTimeout(() => {
      const message = getMessageById(response.messageId);
      if (message) {
        socket.emit('send_message', message);
      }
    }, 30000);
  }
});
```

---

## 🔒 أفضل الممارسات الأمنية

1. **حماية API Key:**
   - لا تضع API Key في الكود الأمامي (Frontend)
   - استخدمه فقط على الخادم الخاص بك
   - غيّره بشكل دوري من لوحة التحكم
   - استخدم متغيرات البيئة

2. **التحقق من البيانات:**
   ```javascript
   function validateMessage(message) {
     if (!message.id || !message.type || !message.phoneNumber || !message.message) {
       throw new Error('بيانات الرسالة غير كاملة');
     }
     
     if (!['whatsapp', 'sms'].includes(message.type)) {
       throw new Error('نوع الرسالة غير صحيح');
     }
     
     if (!message.phoneNumber.match(/^\+\d{10,15}$/)) {
       throw new Error('صيغة رقم الهاتف غير صحيحة');
     }
     
     if (message.message.length > 1000) {
       throw new Error('الرسالة طويلة جداً');
     }
     
     return true;
   }
   ```

3. **تسجيل العمليات (Logging):**
   ```javascript
   socket.on('send_message', (message) => {
     console.log(`[${new Date().toISOString()}] إرسال رسالة:`, {
       id: message.id,
       type: message.type,
       phoneNumber: message.phoneNumber.substring(0, 5) + '***',
       timestamp: message.timestamp
     });
   });
   ```

---

## 🚀 الخطوات التالية

1. **اختبر الاتصال** باستخدام أداة مثل Postman أو Socket.io Tester
2. **راقب السجلات** (Logs) للتأكد من أن كل شيء يعمل بشكل صحيح
3. **اقرأ دليل الميزات** (CLIENT_FEATURES_GUIDE.md) لفهم جميع الإمكانيات
4. **تواصل مع الدعم** إذا واجهت أي مشاكل

---

## 📞 الدعم والمساعدة

للحصول على المساعدة:
- **البريد الإلكتروني:** support@idea-solutions.com
- **الهاتف:** +966-1-XXXX-XXXX
- **الموقع:** https://idea-solutions.com/support

---

**ملاحظة:** هذا المستند يتم تحديثه بشكل مستمر مع كل تحديث للتطبيق. تأكد من قراءة أحدث نسخة.

# دليل ربط Socket.io - بوابة الرسائل

**الإصدار:** 1.0  
**آخر تحديث:** مارس 2026  
**المؤلف:** فريق تطوير بوابة الرسائل

---

## جدول المحتويات

1. [مقدمة](#مقدمة)
2. [متطلبات التكامل](#متطلبات-التكامل)
3. [بنية الاتصال](#بنية-الاتصال)
4. [الأحداث والرسائل](#الأحداث-والرسائل)
5. [أمثلة عملية](#أمثلة-عملية)
6. [معالجة الأخطاء](#معالجة-الأخطاء)
7. [الأمان والمصادقة](#الأمان-والمصادقة)
8. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## مقدمة

تطبيق **بوابة الرسائل** يوفر نظام اتصال فوري وموثوق عبر **Socket.io** يسمح لأنظمتك أو مواقعك بـ:

- **استقبال الرسائل الفورية** من العملاء في الوقت الحقيقي
- **إرسال الرسائل والإخطارات** إلى العملاء فوراً
- **تتبع حالة الاتصال** والعمليات
- **مزامنة البيانات** بين أنظمتك والتطبيق

هذا الدليل يشرح كيفية دمج نظامك مع بوابة الرسائل بشكل آمن وفعال.

---

## متطلبات التكامل

### المتطلبات الأساسية

قبل البدء، تأكد من توفر:

| المتطلب | الوصف | الإصدار الأدنى |
|--------|-------|----------------|
| **Node.js** | بيئة تشغيل JavaScript | 14.0.0 |
| **Socket.io Client** | مكتبة الاتصال | 4.0.0+ |
| **API Token** | رمز المصادقة من بوابة الرسائل | - |
| **HTTPS/WSS** | اتصال آمن مشفر | - |

### تثبيت المكتبات

```bash
# Node.js / Express
npm install socket.io-client

# Python
pip install python-socketio python-engineio

# PHP
composer require socketio/socket-io-php

# JavaScript / Browser
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
```

---

## بنية الاتصال

### معلومات الخادم

```
الخادم: https://api.messaging-gateway.com
WebSocket: wss://api.messaging-gateway.com/socket.io
المنفذ: 443 (HTTPS/WSS)
```

### الاتصال الأولي

```javascript
const io = require('socket.io-client');

const socket = io('https://api.messaging-gateway.com', {
  auth: {
    token: 'YOUR_API_TOKEN_HERE',
    clientId: 'your-system-id',
    clientSecret: 'your-system-secret'
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket', 'polling']
});

// الاتصال الناجح
socket.on('connect', () => {
  console.log('تم الاتصال بنجاح:', socket.id);
  // يمكنك الآن إرسال واستقبال الرسائل
});

// فشل الاتصال
socket.on('connect_error', (error) => {
  console.error('خطأ الاتصال:', error);
});

// قطع الاتصال
socket.on('disconnect', (reason) => {
  console.log('تم قطع الاتصال:', reason);
});
```

---

## الأحداث والرسائل

### 1. أحداث الاستقبال (من التطبيق إلى نظامك)

#### `message:received` - استقبال رسالة جديدة

**الوصف:** يتم إطلاق هذا الحدث عندما يرسل العميل رسالة جديدة.

**البيانات المستقبلة:**

```javascript
socket.on('message:received', (data) => {
  console.log('رسالة جديدة:', data);
  
  // البيانات المرسلة:
  // {
  //   id: "msg_123456",                    // معرف الرسالة الفريد
  //   userId: "user_789",                  // معرف المستخدم
  //   businessId: "bus_456",               // معرف المنشأة
  //   content: "محتوى الرسالة",            // نص الرسالة
  //   type: "text",                        // نوع الرسالة (text, image, file, etc)
  //   attachments: [],                     // المرفقات
  //   timestamp: 1678901234567,            // الوقت بالميلي ثانية
  //   metadata: {                          // بيانات إضافية
  //     deviceType: "mobile",
  //     appVersion: "1.0.0",
  //     location: { lat: 25.2048, lng: 55.2708 }
  //   }
  // }
});
```

**مثال عملي:**

```javascript
socket.on('message:received', (data) => {
  // حفظ الرسالة في قاعدة البيانات
  saveMessageToDatabase(data);
  
  // إرسال إشعار للموظفين
  notifyStaff({
    userId: data.userId,
    message: data.content,
    timestamp: data.timestamp
  });
  
  // تحديث واجهة المستخدم
  updateUI(data);
  
  // إرسال تأكيد الاستقبال
  socket.emit('message:ack', {
    messageId: data.id,
    status: 'received',
    timestamp: Date.now()
  });
});
```

---

#### `notification:sent` - إخطار تم إرساله

**الوصف:** يتم إطلاق هذا الحدث عندما يتم إرسال إخطار للعميل.

**البيانات المستقبلة:**

```javascript
socket.on('notification:sent', (data) => {
  // {
  //   id: "notif_123",
  //   userId: "user_789",
  //   title: "عنوان الإخطار",
  //   message: "محتوى الإخطار",
  //   type: "order_update",  // نوع الإخطار
  //   actionUrl: "https://...",
  //   timestamp: 1678901234567,
  //   priority: "high"  // low, normal, high
  // }
});
```

---

#### `user:status:changed` - تغيير حالة المستخدم

**الوصف:** يتم إطلاق هذا الحدث عند تغيير حالة المستخدم (متصل، غير متصل، مشغول، إلخ).

**البيانات المستقبلة:**

```javascript
socket.on('user:status:changed', (data) => {
  // {
  //   userId: "user_789",
  //   status: "online",  // online, offline, busy, away
  //   timestamp: 1678901234567,
  //   lastSeen: 1678901234567
  // }
});
```

---

#### `subscription:updated` - تحديث الاشتراك

**الوصف:** يتم إطلاق هذا الحدث عند تحديث بيانات الاشتراك.

**البيانات المستقبلة:**

```javascript
socket.on('subscription:updated', (data) => {
  // {
  //   userId: "user_789",
  //   planId: "plan_premium",
  //   status: "active",  // active, expired, cancelled
  //   expiryDate: 1678901234567,
  //   features: ["sms", "email", "push"],
  //   messageLimit: 10000,
  //   messagesUsed: 2500
  // }
});
```

---

### 2. أحداث الإرسال (من نظامك إلى التطبيق)

#### `message:send` - إرسال رسالة

**الوصف:** إرسال رسالة من نظامك إلى العميل.

**البيانات المرسلة:**

```javascript
socket.emit('message:send', {
  recipientId: "user_789",              // معرف المستقبل
  content: "محتوى الرسالة",             // نص الرسالة
  type: "text",                         // نوع الرسالة
  priority: "normal",                   // low, normal, high
  attachments: [                        // المرفقات (اختياري)
    {
      type: "image",
      url: "https://example.com/image.jpg",
      size: 102400
    }
  ],
  metadata: {                           // بيانات إضافية
    orderId: "order_123",
    source: "web_portal"
  }
}, (response) => {
  // رد الخادم
  if (response.success) {
    console.log('تم إرسال الرسالة:', response.messageId);
  } else {
    console.error('فشل الإرسال:', response.error);
  }
});
```

**أمثلة عملية:**

```javascript
// إرسال تحديث الطلب
socket.emit('message:send', {
  recipientId: "user_789",
  content: "تم تحديث حالة طلبك إلى 'قيد التوصيل'",
  type: "text",
  priority: "high",
  metadata: {
    orderId: "order_123",
    status: "in_delivery"
  }
});

// إرسال صورة
socket.emit('message:send', {
  recipientId: "user_789",
  content: "صورة الفاتورة",
  type: "image",
  attachments: [{
    type: "image",
    url: "https://example.com/invoice.jpg",
    size: 204800
  }]
});
```

---

#### `notification:push` - إرسال إخطار

**الوصف:** إرسال إخطار فوري للعميل.

**البيانات المرسلة:**

```javascript
socket.emit('notification:push', {
  recipientId: "user_789",
  title: "عنوان الإخطار",
  message: "محتوى الإخطار",
  type: "order_update",
  priority: "high",
  actionUrl: "https://app.example.com/orders/123",
  icon: "https://example.com/icon.png",
  sound: true,
  vibrate: true
}, (response) => {
  console.log('حالة الإخطار:', response);
});
```

---

#### `broadcast:message` - بث رسالة لعدة مستخدمين

**الوصف:** إرسال رسالة واحدة لعدة مستخدمين في نفس الوقت.

**البيانات المرسلة:**

```javascript
socket.emit('broadcast:message', {
  recipientIds: ["user_1", "user_2", "user_3"],
  content: "رسالة موجهة للجميع",
  type: "text",
  priority: "normal"
}, (response) => {
  console.log('عدد الرسائل المرسلة:', response.sentCount);
  console.log('الفشل:', response.failedCount);
});
```

---

#### `user:update:status` - تحديث حالة المستخدم

**الوصف:** تحديث حالة المستخدم في النظام.

**البيانات المرسلة:**

```javascript
socket.emit('user:update:status', {
  userId: "user_789",
  status: "busy",  // online, offline, busy, away
  statusMessage: "في اجتماع الآن",
  timestamp: Date.now()
});
```

---

#### `analytics:track` - تتبع الأحداث التحليلية

**الوصف:** إرسال بيانات تحليلية للنظام.

**البيانات المرسلة:**

```javascript
socket.emit('analytics:track', {
  eventName: "user_action",
  userId: "user_789",
  eventData: {
    action: "clicked_button",
    buttonName: "subscribe",
    timestamp: Date.now()
  },
  metadata: {
    source: "web_portal",
    version: "1.0.0"
  }
});
```

---

## أمثلة عملية

### مثال 1: نظام إدارة الطلبات

```javascript
const io = require('socket.io-client');

const socket = io('https://api.messaging-gateway.com', {
  auth: {
    token: 'YOUR_API_TOKEN',
    clientId: 'order-management-system'
  }
});

socket.on('connect', () => {
  console.log('تم الاتصال بنظام بوابة الرسائل');
});

// استقبال رسالة من العميل
socket.on('message:received', (data) => {
  // تحديث حالة الطلب في قاعدة البيانات
  updateOrderStatus(data.metadata.orderId, 'customer_contacted');
  
  // إرسال رد تلقائي
  socket.emit('message:send', {
    recipientId: data.userId,
    content: 'شكراً لتواصلك معنا. سيتم الرد عليك قريباً.',
    type: 'text',
    metadata: {
      orderId: data.metadata.orderId,
      autoReply: true
    }
  });
});

// عند تحديث حالة الطلب
function updateOrderStatus(orderId, newStatus) {
  // حفظ في قاعدة البيانات
  db.orders.update({ id: orderId }, { status: newStatus });
  
  // إرسال إخطار للعميل
  const order = db.orders.findOne({ id: orderId });
  socket.emit('notification:push', {
    recipientId: order.userId,
    title: 'تحديث الطلب',
    message: `تم تحديث حالة طلبك إلى: ${newStatus}`,
    type: 'order_update',
    actionUrl: `https://app.example.com/orders/${orderId}`,
    priority: 'high'
  });
}
```

---

### مثال 2: موقع التجارة الإلكترونية

```javascript
// اتصال العميل
const socket = io('https://api.messaging-gateway.com', {
  auth: {
    token: 'YOUR_API_TOKEN',
    clientId: 'ecommerce-platform'
  }
});

// عند إتمام عملية شراء
function completeCheckout(orderId, userId) {
  // إرسال تأكيد الطلب
  socket.emit('message:send', {
    recipientId: userId,
    content: `تم استلام طلبك برقم ${orderId}. سيتم معالجته قريباً.`,
    type: 'text',
    priority: 'high',
    metadata: {
      orderId: orderId,
      eventType: 'order_confirmed'
    }
  });
  
  // إرسال إخطار
  socket.emit('notification:push', {
    recipientId: userId,
    title: 'تم تأكيد طلبك',
    message: 'شكراً لك على الشراء',
    actionUrl: `https://shop.example.com/orders/${orderId}`,
    priority: 'high'
  });
}

// استقبال استفسارات العملاء
socket.on('message:received', (data) => {
  // تسجيل الاستفسار
  logCustomerInquiry({
    userId: data.userId,
    message: data.content,
    timestamp: data.timestamp
  });
  
  // إرسال إخطار للفريق
  notifyCustomerServiceTeam(data);
});
```

---

### مثال 3: تطبيق الخدمات

```javascript
const socket = io('https://api.messaging-gateway.com', {
  auth: {
    token: 'YOUR_API_TOKEN',
    clientId: 'service-app'
  }
});

// تحديث حالة الخدمة
function updateServiceStatus(serviceId, userId, status) {
  const statusMessages = {
    'accepted': 'تم قبول طلب الخدمة',
    'in_progress': 'الخدمة قيد التنفيذ',
    'completed': 'تم إنهاء الخدمة',
    'cancelled': 'تم إلغاء الخدمة'
  };
  
  socket.emit('message:send', {
    recipientId: userId,
    content: statusMessages[status],
    type: 'text',
    metadata: {
      serviceId: serviceId,
      status: status
    }
  });
  
  // إذا اكتملت الخدمة، طلب التقييم
  if (status === 'completed') {
    setTimeout(() => {
      socket.emit('notification:push', {
        recipientId: userId,
        title: 'قيّم الخدمة',
        message: 'هل استمتعت بالخدمة؟ شارك رأيك معنا',
        actionUrl: `https://app.example.com/rate/${serviceId}`,
        priority: 'normal'
      });
    }, 3600000); // بعد ساعة
  }
}
```

---

## معالجة الأخطاء

### أنواع الأخطاء الشائعة

```javascript
socket.on('error', (error) => {
  console.error('خطأ عام:', error);
});

// خطأ المصادقة
socket.on('auth:failed', (data) => {
  console.error('فشل المصادقة:', data.message);
  // تحديث الرمز والاتصال مجدداً
});

// خطأ في الإرسال
socket.emit('message:send', { /* ... */ }, (response) => {
  if (!response.success) {
    switch(response.errorCode) {
      case 'INVALID_RECIPIENT':
        console.error('المستقبل غير صحيح');
        break;
      case 'QUOTA_EXCEEDED':
        console.error('تم تجاوز حد الرسائل');
        break;
      case 'INVALID_MESSAGE':
        console.error('محتوى الرسالة غير صحيح');
        break;
      default:
        console.error('خطأ غير معروف:', response.error);
    }
  }
});

// معالجة فشل الاتصال
socket.on('connect_error', (error) => {
  console.error('خطأ الاتصال:', error.message);
  
  // إعادة محاولة الاتصال
  setTimeout(() => {
    socket.connect();
  }, 5000);
});
```

---

## الأمان والمصادقة

### توليد الرمز (Token)

```javascript
// في الخادم الخاص بك
const jwt = require('jsonwebtoken');

function generateToken(clientId, clientSecret) {
  const token = jwt.sign(
    {
      clientId: clientId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // ينتهي بعد ساعة
    },
    clientSecret,
    { algorithm: 'HS256' }
  );
  
  return token;
}

// الاستخدام
const token = generateToken('your-client-id', 'your-client-secret');
```

### التحقق من الأمان

```javascript
// استخدم HTTPS/WSS دائماً
const socket = io('wss://api.messaging-gateway.com', {
  auth: {
    token: token,
    clientId: 'your-client-id'
  },
  secure: true,
  rejectUnauthorized: true
});

// تحديث الرمز قبل انتهاء صلاحيته
setInterval(() => {
  const newToken = generateToken('your-client-id', 'your-client-secret');
  socket.auth.token = newToken;
  socket.connect();
}, 3000000); // كل 50 دقيقة
```

---

## استكشاف الأخطاء

### تفعيل وضع التصحيح

```javascript
const socket = io('https://api.messaging-gateway.com', {
  auth: { token: 'YOUR_TOKEN' },
  debug: true,
  logger: console
});

// تسجيل جميع الأحداث
socket.onAny((event, ...args) => {
  console.log(`[${new Date().toISOString()}] Event: ${event}`, args);
});

// تسجيل الأخطاء
socket.onAnyOutgoing((event, ...args) => {
  console.log(`[OUTGOING] ${event}`, args);
});
```

### فحص الاتصال

```javascript
// التحقق من حالة الاتصال
console.log('معرف الاتصال:', socket.id);
console.log('حالة الاتصال:', socket.connected);
console.log('المحرك المستخدم:', socket.io.engine.transport.name);

// قائمة الأحداث المسجلة
console.log('الأحداث:', Object.keys(socket._events));
```

---

## ملخص البيانات المتبادلة

| الحدث | الاتجاه | الوصف |
|------|--------|-------|
| `message:received` | ← | استقبال رسالة من العميل |
| `message:send` | → | إرسال رسالة للعميل |
| `notification:sent` | ← | إخطار تم إرساله |
| `notification:push` | → | إرسال إخطار فوري |
| `user:status:changed` | ← | تغيير حالة المستخدم |
| `user:update:status` | → | تحديث حالة المستخدم |
| `subscription:updated` | ← | تحديث الاشتراك |
| `broadcast:message` | → | بث رسالة لعدة مستخدمين |
| `analytics:track` | → | تتبع الأحداث |

---

## الخطوات التالية

1. **الحصول على API Token** - تواصل مع فريق الدعم للحصول على رمز المصادقة
2. **اختبار الاتصال** - استخدم أحد الأمثلة أعلاه للتأكد من الاتصال
3. **تطبيق الأحداث** - أضف معالجات الأحداث المطلوبة لنظامك
4. **اختبار شامل** - تأكد من أن جميع الأحداث تعمل بشكل صحيح
5. **النشر** - انشر التطبيق في بيئة الإنتاج

---

## الدعم والمساعدة

للمساعدة والدعم الفني:

- **البريد الإلكتروني:** support@messaging-gateway.com
- **الهاتف:** +971-4-XXXX-XXXX
- **الموقع:** https://messaging-gateway.com/support
- **التوثيق:** https://docs.messaging-gateway.com

---

**ملاحظة:** يتم تحديث هذا الدليل بانتظام. تأكد من مراجعة أحدث إصدار قبل التطوير.

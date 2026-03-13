# دليل ربط Socket.io - بوابة الرسائل

**الإصدار:** 2.0  
**آخر تحديث:** مارس 2026  
**المالك:** آيديا للاستشارات والحلول التسويقية والتقنية  
**الغرض:** دليل تقني شامل لمبرمجي الشركات والمتاجر والمؤسسات لربط أنظمتهم مع بوابة الرسائل

---

## جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [المتطلبات](#المتطلبات)
3. [بنية الاتصال](#بنية-الاتصال)
4. [المصادقة والأمان](#المصادقة-والأمان)
5. [أحداث الإرسال](#أحداث-الإرسال)
6. [أحداث الاستقبال](#أحداث-الاستقبال)
7. [معالجة الأخطاء](#معالجة-الأخطاء)
8. [أمثلة عملية](#أمثلة-عملية)
9. [استكشاف الأخطاء](#استكشاف-الأخطاء)

---

## نظرة عامة

**بوابة الرسائل** هي منصة متكاملة تمكّن الشركات والمتاجر والمؤسسات من إرسال رسائل SMS و WhatsApp إلى عملائهم من خلال تطبيق موبايل آمن وموثوق. يتم الربط بين نظام الشركة وبوابة الرسائل عبر بروتوكول Socket.io الذي يوفر اتصالاً ثنائي الاتجاه في الوقت الفعلي.

### آلية العمل

```
نظام الشركة → Socket.io → تطبيق بوابة الرسائل → SMS/WhatsApp Gateway → العملاء
```

**المراحل:**

1. **الشركة تسجل الدخول** إلى تطبيق بوابة الرسائل وتختار خطة اشتراك
2. **الشركة تحصل على رابط الاتصال** (Socket.io URL) ومفتاح API
3. **نظام الشركة يتصل** بـ Socket.io باستخدام المفتاح
4. **الشركة ترسل الرسائل** عبر Socket.io
5. **التطبيق يستقبل الرسائل** ويرسلها عبر SMS أو WhatsApp
6. **التطبيق يرسل حالة الرسالة** (نجح، فشل، معلق) إلى نظام الشركة

---

## المتطلبات

### على جانب الشركة (Client)

**المكتبات المطلوبة:**

```bash
# Node.js / JavaScript
npm install socket.io-client

# Python
pip install python-socketio[client]

# PHP
composer require socketio/socket-io-php-client

# Java
# استخدم مكتبة Socket.IO Java Client
```

**المعلومات المطلوبة:**

| المعلومة | الوصف | مثال |
|---------|-------|-------|
| **Socket URL** | رابط الاتصال بـ Socket.io | `https://api.messaging-gateway.com` |
| **API Key** | مفتاح المصادقة الفريد | `sk_live_abc123xyz789` |
| **Company ID** | معرّف الشركة الفريد | `comp_12345` |
| **Webhook URL** (اختياري) | رابط استقبال الإخطارات | `https://company.com/webhooks` |

### على جانب بوابة الرسائل (Server)

- **Node.js 18+** مع Express
- **Socket.io 4.5+**
- **قاعدة بيانات PostgreSQL**
- **خدمات SMS و WhatsApp** (Twilio, Vonage, إلخ)

---

## بنية الاتصال

### خطوات الاتصال

**الخطوة 1: الاتصال الأولي**

```javascript
const io = require('socket.io-client');

const socket = io('https://api.messaging-gateway.com', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 5000,
  reconnectionDelayMax: 10000,
  reconnectionAttempts: 10,
  autoConnect: true,
  forceNew: true,
  extraHeaders: {
    'User-Agent': 'CompanyName/1.0'
  }
});
```

**الخطوة 2: معالجة الاتصال الناجح**

```javascript
socket.on('connect', () => {
  console.log('✓ متصل بنجاح');
  console.log('Socket ID:', socket.id);
  
  // إرسال بيانات المصادقة
  socket.emit('auth:connect', {
    apiKey: 'sk_live_abc123xyz789',
    companyId: 'comp_12345',
    version: '1.0'
  }, (response) => {
    if (response.success) {
      console.log('✓ تم المصادقة بنجاح');
    } else {
      console.error('✗ فشلت المصادقة:', response.error);
    }
  });
});
```

**الخطوة 3: معالجة الأخطاء والقطع**

```javascript
socket.on('connect_error', (error) => {
  console.error('✗ خطأ في الاتصال:', error);
});

socket.on('disconnect', (reason) => {
  console.log('✗ تم قطع الاتصال:', reason);
  // سيحاول Socket.io إعادة الاتصال تلقائياً
});

socket.on('error', (error) => {
  console.error('✗ خطأ:', error);
});
```

---

## المصادقة والأمان

### آلية المصادقة

**المصادقة تتم عبر API Key:**

```javascript
socket.emit('auth:connect', {
  apiKey: 'sk_live_abc123xyz789',  // مفتاح API الفريد
  companyId: 'comp_12345',         // معرّف الشركة
  version: '1.0'                   // إصدار التطبيق
}, (response) => {
  if (response.success) {
    console.log('✓ مصادق');
  } else {
    console.error('✗ فشلت المصادقة');
    socket.disconnect();
  }
});
```

### معايير الأمان

**التشفير:**
- جميع الاتصالات عبر HTTPS/WSS (WebSocket Secure)
- جميع البيانات مشفرة بـ TLS 1.3

**المصادقة:**
- API Key يجب أن يكون سري وآمن
- لا تشارك API Key في الكود العام
- استخدم متغيرات البيئة لتخزين API Key

**التفويض:**
- كل شركة لها صلاحيات محددة
- لا يمكن الوصول إلى بيانات شركات أخرى
- يتم تسجيل جميع العمليات للمراجعة

**مثال آمن:**

```javascript
// ❌ غير آمن
const socket = io('https://api.messaging-gateway.com', {
  apiKey: 'sk_live_abc123xyz789'
});

// ✅ آمن
const apiKey = process.env.MESSAGING_GATEWAY_API_KEY;
const socket = io('https://api.messaging-gateway.com', {
  apiKey: apiKey
});
```

---

## أحداث الإرسال

### 1. إرسال رسالة SMS

**الحدث:** `message:send:sms`

**البيانات المطلوبة:**

```javascript
socket.emit('message:send:sms', {
  id: 'msg_unique_id_123',           // معرّف فريد للرسالة
  phoneNumber: '+971501234567',      // رقم الهاتف (بصيغة دولية)
  message: 'مرحباً! هذه رسالة اختبار', // محتوى الرسالة
  timestamp: Date.now(),             // الوقت الحالي
  priority: 'normal',                // الأولوية (low, normal, high)
  metadata: {
    orderId: 'ORD-2026-001',        // معرّف الطلب (اختياري)
    customerId: 'cust_123',          // معرّف العميل (اختياري)
    source: 'order_confirmation'     // مصدر الرسالة (اختياري)
  }
}, (response) => {
  if (response.success) {
    console.log('✓ تم إرسال الرسالة:', response.messageId);
  } else {
    console.error('✗ فشل الإرسال:', response.error);
  }
});
```

**الاستجابة:**

```javascript
{
  success: true,
  messageId: 'msg_abc123xyz789',
  status: 'pending',
  timestamp: 1678901234567,
  estimatedDeliveryTime: '2026-03-13T21:15:00Z'
}
```

### 2. إرسال رسالة WhatsApp

**الحدث:** `message:send:whatsapp`

**البيانات المطلوبة:**

```javascript
socket.emit('message:send:whatsapp', {
  id: 'msg_unique_id_456',
  phoneNumber: '+971501234567',
  message: 'مرحباً! هذه رسالة واتساب',
  timestamp: Date.now(),
  priority: 'normal',
  attachments: [                     // المرفقات (اختياري)
    {
      type: 'image',
      url: 'https://example.com/image.jpg',
      caption: 'صورة المنتج'
    }
  ],
  metadata: {
    orderId: 'ORD-2026-001',
    customerId: 'cust_123',
    source: 'order_confirmation'
  }
}, (response) => {
  if (response.success) {
    console.log('✓ تم إرسال الرسالة:', response.messageId);
  } else {
    console.error('✗ فشل الإرسال:', response.error);
  }
});
```

### 3. إرسال رسائل جماعية

**الحدث:** `message:send:batch`

**البيانات المطلوبة:**

```javascript
socket.emit('message:send:batch', {
  batchId: 'batch_unique_id_789',
  messages: [
    {
      id: 'msg_1',
      phoneNumber: '+971501234567',
      message: 'رسالة 1',
      type: 'sms'
    },
    {
      id: 'msg_2',
      phoneNumber: '+971509876543',
      message: 'رسالة 2',
      type: 'whatsapp'
    }
  ],
  timestamp: Date.now(),
  metadata: {
    campaignId: 'camp_123',
    source: 'marketing_campaign'
  }
}, (response) => {
  if (response.success) {
    console.log('✓ تم إرسال الرسائل:', response.batchId);
    console.log('عدد الرسائل:', response.totalMessages);
  } else {
    console.error('✗ فشل الإرسال:', response.error);
  }
});
```

### 4. جدولة الرسائل

**الحدث:** `message:schedule`

**البيانات المطلوبة:**

```javascript
socket.emit('message:schedule', {
  id: 'msg_scheduled_123',
  phoneNumber: '+971501234567',
  message: 'رسالة مجدولة',
  type: 'sms',
  scheduleTime: 1678901234567,      // الوقت المطلوب (timestamp)
  timezone: 'Asia/Dubai',            // المنطقة الزمنية
  priority: 'normal',
  metadata: {
    orderId: 'ORD-2026-001'
  }
}, (response) => {
  if (response.success) {
    console.log('✓ تم جدولة الرسالة:', response.messageId);
  } else {
    console.error('✗ فشل الجدولة:', response.error);
  }
});
```

---

## أحداث الاستقبال

### 1. تحديث حالة الرسالة

**الحدث:** `message:status:updated`

يتم استقبال هذا الحدث عندما تتغير حالة الرسالة:

```javascript
socket.on('message:status:updated', (data) => {
  console.log('تحديث حالة الرسالة:', {
    messageId: data.messageId,
    status: data.status,              // pending, sent, delivered, failed, read
    timestamp: data.timestamp,
    error: data.error                 // رسالة الخطأ إن وجدت
  });
  
  // تحديث قاعدة البيانات الخاصة بك
  updateMessageStatus(data.messageId, data.status);
});
```

**الحالات الممكنة:**

| الحالة | الوصف |
|--------|-------|
| **pending** | الرسالة في انتظار الإرسال |
| **sent** | تم إرسال الرسالة |
| **delivered** | تم استلام الرسالة من قبل العميل |
| **failed** | فشل إرسال الرسالة |
| **read** | تم قراءة الرسالة (WhatsApp فقط) |

### 2. استقبال إخطارات الأحداث

**الحدث:** `event:notification`

يتم استقبال إخطارات الأحداث المهمة:

```javascript
socket.on('event:notification', (data) => {
  console.log('إخطار حدث:', {
    eventType: data.eventType,
    severity: data.severity,          // info, warning, error
    message: data.message,
    timestamp: data.timestamp
  });
  
  // معالجة الإخطار
  handleNotification(data);
});
```

**أنواع الأحداث:**

| النوع | الوصف |
|------|-------|
| **quota_warning** | تنبيه من اقتراب الحد الأقصى للرسائل |
| **quota_exceeded** | تم تجاوز الحد الأقصى للرسائل |
| **payment_failed** | فشل الدفع |
| **subscription_expiring** | الاشتراك سينتهي قريباً |
| **service_maintenance** | صيانة الخدمة |

### 3. استقبال تقارير الأداء

**الحدث:** `analytics:report`

يتم استقبال تقارير الأداء الدورية:

```javascript
socket.on('analytics:report', (data) => {
  console.log('تقرير الأداء:', {
    period: data.period,              // hourly, daily, weekly
    totalSent: data.totalSent,
    totalDelivered: data.totalDelivered,
    deliveryRate: data.deliveryRate,
    failureRate: data.failureRate,
    timestamp: data.timestamp
  });
});
```

---

## معالجة الأخطاء

### أنواع الأخطاء

| الكود | الوصف | الحل |
|------|-------|-------|
| **AUTH_FAILED** | فشلت المصادقة | تحقق من API Key |
| **INVALID_PHONE** | رقم الهاتف غير صحيح | استخدم صيغة دولية (+971...) |
| **QUOTA_EXCEEDED** | تم تجاوز الحد الأقصى | ترقية الخطة أو انتظر التجديد |
| **SERVICE_ERROR** | خطأ في الخدمة | أعد المحاولة لاحقاً |
| **NETWORK_ERROR** | خطأ في الشبكة | تحقق من الاتصال |

### معالجة الأخطاء

```javascript
socket.on('error:message', (error) => {
  console.error('خطأ:', {
    code: error.code,
    message: error.message,
    details: error.details
  });
  
  // معالجة الخطأ بناءً على نوعه
  switch (error.code) {
    case 'QUOTA_EXCEEDED':
      console.log('تم تجاوز الحد الأقصى للرسائل');
      // إخطار المستخدم بالترقية
      break;
    case 'INVALID_PHONE':
      console.log('رقم الهاتف غير صحيح');
      // تصحيح رقم الهاتف
      break;
    case 'SERVICE_ERROR':
      console.log('خطأ في الخدمة، سيتم إعادة المحاولة');
      // إعادة محاولة لاحقاً
      break;
  }
});
```

### إعادة المحاولة التلقائية

```javascript
function sendMessageWithRetry(message, maxRetries = 3) {
  let attempts = 0;
  
  function attempt() {
    attempts++;
    socket.emit('message:send:sms', message, (response) => {
      if (response.success) {
        console.log('✓ تم الإرسال بنجاح');
      } else if (attempts < maxRetries) {
        console.log(`محاولة ${attempts + 1} من ${maxRetries}`);
        setTimeout(attempt, 5000); // انتظر 5 ثوان قبل إعادة المحاولة
      } else {
        console.error('✗ فشل الإرسال بعد عدة محاولات');
      }
    });
  }
  
  attempt();
}
```

---

## أمثلة عملية

### مثال 1: متجر إلكتروني

**السيناريو:** إرسال تأكيد الطلب للعميل

```javascript
// عند إنشاء طلب جديد
function handleOrderCreated(order) {
  socket.emit('message:send:sms', {
    id: `order_${order.id}`,
    phoneNumber: order.customer.phone,
    message: `تم تأكيد طلبك #${order.id}. المبلغ: ${order.total} درهم. سيتم التوصيل خلال 24 ساعة.`,
    timestamp: Date.now(),
    priority: 'high',
    metadata: {
      orderId: order.id,
      customerId: order.customer.id,
      source: 'order_confirmation'
    }
  }, (response) => {
    if (response.success) {
      console.log('✓ تم إرسال تأكيد الطلب');
      // تحديث قاعدة البيانات
      updateOrderStatus(order.id, 'confirmation_sent');
    }
  });
}

// عند شحن الطلب
function handleOrderShipped(order) {
  socket.emit('message:send:whatsapp', {
    id: `shipped_${order.id}`,
    phoneNumber: order.customer.phone,
    message: `تم شحن طلبك #${order.id}. رقم التتبع: ${order.trackingNumber}`,
    timestamp: Date.now(),
    priority: 'normal',
    metadata: {
      orderId: order.id,
      customerId: order.customer.id,
      source: 'order_shipped'
    }
  });
}
```

### مثال 2: تطبيق الخدمات

**السيناريو:** إخطار العميل بقبول الطلب

```javascript
function handleServiceAccepted(service) {
  socket.emit('message:send:whatsapp', {
    id: `service_${service.id}`,
    phoneNumber: service.customer.phone,
    message: `تم قبول طلب الخدمة الخاص بك. سيصل ${service.provider.name} خلال ${service.estimatedTime} دقيقة.`,
    timestamp: Date.now(),
    priority: 'high',
    attachments: [
      {
        type: 'image',
        url: service.provider.photo,
        caption: 'صورة مقدم الخدمة'
      }
    ],
    metadata: {
      serviceId: service.id,
      customerId: service.customer.id,
      providerId: service.provider.id,
      source: 'service_accepted'
    }
  });
}
```

### مثال 3: نظام الدعم الفني

**السيناريو:** إخطار العميل بحل المشكلة

```javascript
function handleTicketResolved(ticket) {
  socket.emit('message:send:sms', {
    id: `ticket_${ticket.id}`,
    phoneNumber: ticket.customer.phone,
    message: `تم حل مشكلتك برقم التذكرة #${ticket.id}. شكراً لتواصلك معنا.`,
    timestamp: Date.now(),
    priority: 'normal',
    metadata: {
      ticketId: ticket.id,
      customerId: ticket.customer.id,
      source: 'ticket_resolved'
    }
  }, (response) => {
    if (response.success) {
      // إرسال رسالة متابعة بعد 24 ساعة
      socket.emit('message:schedule', {
        id: `followup_${ticket.id}`,
        phoneNumber: ticket.customer.phone,
        message: 'هل تم حل المشكلة بشكل كامل؟ نرجو تقييم الخدمة.',
        type: 'sms',
        scheduleTime: Date.now() + (24 * 60 * 60 * 1000),
        timezone: 'Asia/Dubai',
        metadata: {
          ticketId: ticket.id,
          source: 'ticket_followup'
        }
      });
    }
  });
}
```

---

## استكشاف الأخطاء

### المشكلة: لا يمكن الاتصال بـ Socket.io

**الأسباب المحتملة:**

1. **رابط الاتصال غير صحيح** - تحقق من الرابط
2. **مشكلة في الشبكة** - تحقق من الاتصال بالإنترنت
3. **جدار الحماية** - قد يحجب WebSocket

**الحل:**

```javascript
// تفعيل السجلات التفصيلية
const socket = io('https://api.messaging-gateway.com', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  debug: true  // تفعيل السجلات
});

socket.on('connect_error', (error) => {
  console.error('تفاصيل الخطأ:', error);
  console.error('الرسالة:', error.message);
  console.error('الكود:', error.code);
});
```

### المشكلة: فشل المصادقة

**الأسباب المحتملة:**

1. **API Key غير صحيح** - تحقق من المفتاح
2. **انتهت صلاحية API Key** - طلب مفتاح جديد
3. **الشركة غير مسجلة** - تحقق من معرّف الشركة

**الحل:**

```javascript
socket.on('auth:failed', (error) => {
  console.error('فشلت المصادقة:', error.message);
  
  // إعادة محاولة المصادقة
  setTimeout(() => {
    socket.emit('auth:connect', {
      apiKey: process.env.MESSAGING_GATEWAY_API_KEY,
      companyId: process.env.COMPANY_ID,
      version: '1.0'
    });
  }, 5000);
});
```

### المشكلة: الرسائل لا تُرسل

**الأسباب المحتملة:**

1. **أرقام الهاتف غير صحيحة** - استخدم صيغة دولية
2. **تم تجاوز الحد الأقصى** - ترقية الخطة
3. **الخدمة معطلة** - تحقق من حالة الخدمة

**الحل:**

```javascript
// التحقق من صيغة الهاتف
function isValidPhoneNumber(phone) {
  return /^\+\d{1,15}$/.test(phone);
}

// إرسال مع التحقق
socket.emit('message:send:sms', {
  id: 'msg_123',
  phoneNumber: '+971501234567',  // يجب أن تبدأ بـ +
  message: 'رسالة اختبار',
  timestamp: Date.now()
}, (response) => {
  if (!response.success) {
    console.error('خطأ:', response.error);
    
    if (response.error === 'INVALID_PHONE') {
      console.log('رقم الهاتف غير صحيح');
    } else if (response.error === 'QUOTA_EXCEEDED') {
      console.log('تم تجاوز الحد الأقصى');
    }
  }
});
```

---

## الخلاصة

هذا الدليل يوفر جميع المعلومات اللازمة لربط نظام الشركة مع بوابة الرسائل بنجاح. تأكد من:

- ✅ استخدام صيغة صحيحة للبيانات
- ✅ معالجة الأخطاء بشكل صحيح
- ✅ الحفاظ على أمان API Key
- ✅ مراقبة حالة الاتصال
- ✅ تسجيل جميع العمليات

---

## الدعم والمساعدة

للمساعدة والدعم الفني:

- **البريد الإلكتروني:** support@idea-solutions.com
- **الهاتف:** +971-4-XXXX-XXXX
- **الموقع:** https://messaging-gateway.idea-solutions.com/support
- **التوثيق:** https://docs.messaging-gateway.idea-solutions.com

---

**ملاحظة مهمة:** يتم تحديث هذا الدليل بانتظام مع إضافة ميزات جديدة أو تحسينات. تأكد من مراجعة أحدث إصدار قبل البدء بالتطوير.

**آخر تحديث:** مارس 2026

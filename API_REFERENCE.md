# مرجع API - بوابة الرسائل

**الإصدار:** 1.0  
**آخر تحديث:** مارس 2026  
**المالك:** آيديا للاستشارات والحلول التسويقية والتقنية

---

## جدول المحتويات

1. [المقدمة](#المقدمة)
2. [المصادقة](#المصادقة)
3. [الأخطاء والاستجابات](#الأخطاء-والاستجابات)
4. [API Endpoints](#api-endpoints)
5. [Socket.io Events](#socketio-events)
6. [أمثلة عملية](#أمثلة-عملية)

---

## المقدمة

**عنوان الخادم:** `https://api.messaging-gateway.com`  
**إصدار API:** v1  
**صيغة البيانات:** JSON  
**المصادقة:** JWT Token و API Key

---

## المصادقة

### JWT Token

**الحصول على Token:**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "company@example.com",
  "password": "password123"
}
```

**الاستجابة:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "company@example.com",
    "company_name": "Company Name",
    "phone": "+971501234567"
  }
}
```

**استخدام Token:**

```http
GET /api/messages
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Key

**الحصول على API Key:**

1. سجّل الدخول إلى التطبيق
2. انتقل إلى الإعدادات
3. اختر "API Keys"
4. انسخ المفتاح

**استخدام API Key:**

```http
GET /api/messages
X-API-Key: sk_live_abc123xyz789
```

---

## الأخطاء والاستجابات

### رموز الحالة HTTP

| الكود | الوصف |
|------|-------|
| **200** | نجح الطلب |
| **201** | تم الإنشاء بنجاح |
| **400** | طلب غير صحيح |
| **401** | غير مصرح (عدم المصادقة) |
| **403** | محظور (عدم التفويض) |
| **404** | غير موجود |
| **429** | تم تجاوز حد الطلبات |
| **500** | خطأ في الخادم |

### صيغة الخطأ

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PHONE",
    "message": "رقم الهاتف غير صحيح",
    "details": "يجب أن يبدأ برمز الدولة (+971)"
  }
}
```

---

## API Endpoints

### المصادقة

#### تسجيل الدخول

```http
POST /auth/login
Content-Type: application/json

{
  "email": "company@example.com",
  "password": "password123"
}
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "company@example.com",
    "company_name": "Company Name"
  }
}
```

#### التسجيل الجديد

```http
POST /auth/register
Content-Type: application/json

{
  "email": "company@example.com",
  "password": "password123",
  "company_name": "Company Name",
  "phone": "+971501234567"
}
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "message": "تم التسجيل بنجاح",
  "user": {
    "id": 1,
    "email": "company@example.com"
  }
}
```

### الرسائل

#### إرسال رسالة SMS

```http
POST /api/messages/sms
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "+971501234567",
  "message": "مرحباً! هذه رسالة اختبار",
  "priority": "normal",
  "metadata": {
    "orderId": "ORD-2026-001"
  }
}
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "messageId": "msg_abc123xyz789",
  "status": "pending",
  "timestamp": 1678901234567
}
```

#### إرسال رسالة WhatsApp

```http
POST /api/messages/whatsapp
Authorization: Bearer <token>
Content-Type: application/json

{
  "phoneNumber": "+971501234567",
  "message": "مرحباً! هذه رسالة واتساب",
  "attachments": [
    {
      "type": "image",
      "url": "https://example.com/image.jpg",
      "caption": "صورة المنتج"
    }
  ]
}
```

#### جلب سجل الرسائل

```http
GET /api/messages?limit=20&offset=0&status=all
Authorization: Bearer <token>
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "messages": [
    {
      "id": 1,
      "phoneNumber": "+971501234567",
      "message": "رسالة الاختبار",
      "type": "sms",
      "status": "delivered",
      "sentAt": "2026-03-13T21:00:00Z",
      "deliveredAt": "2026-03-13T21:00:05Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

#### الحصول على تفاصيل الرسالة

```http
GET /api/messages/{messageId}
Authorization: Bearer <token>
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "message": {
    "id": 1,
    "phoneNumber": "+971501234567",
    "message": "رسالة الاختبار",
    "type": "sms",
    "status": "delivered",
    "sentAt": "2026-03-13T21:00:00Z",
    "deliveredAt": "2026-03-13T21:00:05Z",
    "metadata": {
      "orderId": "ORD-2026-001"
    }
  }
}
```

### الاشتراكات

#### جلب الخطط المتاحة

```http
GET /api/subscriptions/plans
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "plans": [
    {
      "id": 1,
      "name": "Basic",
      "price": 99,
      "currency": "AED",
      "billingCycle": "monthly",
      "smsLimit": 500,
      "whatsappLimit": 1000,
      "features": [
        "إرسال SMS",
        "إرسال WhatsApp",
        "سجل الرسائل"
      ]
    },
    {
      "id": 2,
      "name": "Professional",
      "price": 299,
      "currency": "AED",
      "billingCycle": "monthly",
      "smsLimit": 5000,
      "whatsappLimit": 10000,
      "features": [
        "إرسال SMS",
        "إرسال WhatsApp",
        "سجل الرسائل",
        "API متقدم"
      ]
    }
  ]
}
```

#### جلب الاشتراك الحالي

```http
GET /api/subscriptions/current
Authorization: Bearer <token>
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "subscription": {
    "id": 1,
    "planId": 1,
    "planName": "Basic",
    "status": "active",
    "startedAt": "2026-03-01T00:00:00Z",
    "expiresAt": "2026-04-01T00:00:00Z",
    "smsUsed": 150,
    "smsLimit": 500,
    "whatsappUsed": 200,
    "whatsappLimit": 1000
  }
}
```

#### تغيير الخطة

```http
POST /api/subscriptions/change
Authorization: Bearer <token>
Content-Type: application/json

{
  "newPlanId": 2,
  "billingCycle": "monthly"
}
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "message": "تم تغيير الخطة بنجاح",
  "subscription": {
    "id": 1,
    "planId": 2,
    "planName": "Professional",
    "status": "active"
  }
}
```

### المدفوعات

#### إنشاء دفعة

```http
POST /api/payments/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 299,
  "paymentMethod": "credit_card",
  "description": "اشتراك خطة Professional"
}
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "paymentId": "pay_abc123xyz789",
  "status": "pending",
  "amount": 299,
  "currency": "AED"
}
```

#### جلب سجل المدفوعات

```http
GET /api/payments/history?limit=10&offset=0
Authorization: Bearer <token>
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "payments": [
    {
      "id": 1,
      "amount": 299,
      "currency": "AED",
      "status": "completed",
      "paymentMethod": "credit_card",
      "createdAt": "2026-03-13T21:00:00Z"
    }
  ],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

#### الحصول على تفاصيل الدفعة

```http
GET /api/payments/{paymentId}
Authorization: Bearer <token>
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "payment": {
    "id": 1,
    "amount": 299,
    "currency": "AED",
    "status": "completed",
    "paymentMethod": "credit_card",
    "stripePaymentId": "pi_abc123xyz789",
    "createdAt": "2026-03-13T21:00:00Z",
    "updatedAt": "2026-03-13T21:00:05Z"
  }
}
```

### الإخطارات

#### جلب الإخطارات

```http
GET /api/notifications?limit=20&unreadOnly=false
Authorization: Bearer <token>
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "type": "message_delivered",
      "title": "تم استلام الرسالة",
      "message": "تم استلام الرسالة من قبل العميل",
      "read": false,
      "createdAt": "2026-03-13T21:00:00Z"
    }
  ],
  "total": 25,
  "unreadCount": 5
}
```

#### تحديد الإخطار كمقروء

```http
PUT /api/notifications/{notificationId}/read
Authorization: Bearer <token>
```

**الاستجابة الناجحة:**

```json
{
  "success": true,
  "message": "تم تحديد الإخطار كمقروء"
}
```

---

## Socket.io Events

### الاتصال والمصادقة

#### الاتصال الأولي

```javascript
socket.on('connect', () => {
  console.log('متصل بنجاح');
  
  socket.emit('auth:connect', {
    apiKey: 'sk_live_abc123xyz789',
    companyId: 'comp_12345',
    version: '1.0'
  }, (response) => {
    if (response.success) {
      console.log('تم المصادقة');
    }
  });
});
```

#### قطع الاتصال

```javascript
socket.on('disconnect', (reason) => {
  console.log('تم قطع الاتصال:', reason);
  // سيحاول Socket.io إعادة الاتصال تلقائياً
});
```

### إرسال الرسائل

#### إرسال رسالة SMS

```javascript
socket.emit('message:send:sms', {
  id: 'msg_unique_id_123',
  phoneNumber: '+971501234567',
  message: 'مرحباً! هذه رسالة اختبار',
  timestamp: Date.now(),
  priority: 'normal',
  metadata: {
    orderId: 'ORD-2026-001'
  }
}, (response) => {
  if (response.success) {
    console.log('تم إرسال الرسالة:', response.messageId);
  }
});
```

#### إرسال رسالة WhatsApp

```javascript
socket.emit('message:send:whatsapp', {
  id: 'msg_unique_id_456',
  phoneNumber: '+971501234567',
  message: 'مرحباً! هذه رسالة واتساب',
  timestamp: Date.now(),
  priority: 'normal',
  attachments: [
    {
      type: 'image',
      url: 'https://example.com/image.jpg',
      caption: 'صورة المنتج'
    }
  ]
}, (response) => {
  if (response.success) {
    console.log('تم إرسال الرسالة:', response.messageId);
  }
});
```

#### إرسال رسائل جماعية

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
  timestamp: Date.now()
}, (response) => {
  if (response.success) {
    console.log('تم إرسال الرسائل:', response.batchId);
  }
});
```

### استقبال التحديثات

#### تحديث حالة الرسالة

```javascript
socket.on('message:status:updated', (data) => {
  console.log('تحديث حالة الرسالة:', {
    messageId: data.messageId,
    status: data.status,
    timestamp: data.timestamp
  });
});
```

#### الإخطارات

```javascript
socket.on('event:notification', (data) => {
  console.log('إخطار:', {
    eventType: data.eventType,
    severity: data.severity,
    message: data.message
  });
});
```

#### تقارير الأداء

```javascript
socket.on('analytics:report', (data) => {
  console.log('تقرير الأداء:', {
    period: data.period,
    totalSent: data.totalSent,
    deliveryRate: data.deliveryRate
  });
});
```

---

## أمثلة عملية

### مثال 1: إرسال رسالة SMS عبر REST API

```bash
curl -X POST https://api.messaging-gateway.com/api/messages/sms \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+971501234567",
    "message": "مرحباً! هذه رسالة اختبار",
    "priority": "normal"
  }'
```

### مثال 2: إرسال رسالة WhatsApp عبر Socket.io

```javascript
const io = require('socket.io-client');

const socket = io('https://api.messaging-gateway.com', {
  transports: ['websocket'],
  reconnection: true
});

socket.on('connect', () => {
  // المصادقة
  socket.emit('auth:connect', {
    apiKey: 'sk_live_abc123xyz789',
    companyId: 'comp_12345',
    version: '1.0'
  }, (response) => {
    if (response.success) {
      // إرسال الرسالة
      socket.emit('message:send:whatsapp', {
        id: 'msg_123',
        phoneNumber: '+971501234567',
        message: 'مرحباً! هذه رسالة واتساب',
        timestamp: Date.now()
      }, (response) => {
        if (response.success) {
          console.log('✓ تم إرسال الرسالة');
        }
      });
    }
  });
});

// استقبال التحديثات
socket.on('message:status:updated', (data) => {
  console.log('حالة الرسالة:', data.status);
});
```

### مثال 3: جلب سجل الرسائل

```bash
curl -X GET "https://api.messaging-gateway.com/api/messages?limit=20&offset=0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## ملاحظات مهمة

1. **صيغة الهاتف:** استخدم صيغة دولية (+971...)
2. **الحد الأقصى للرسائل:** حسب الخطة المختارة
3. **التشفير:** جميع الاتصالات عبر HTTPS/WSS
4. **المصادقة:** استخدم JWT Token أو API Key
5. **معدل الطلبات:** 100 طلب لكل 15 دقيقة

---

**آخر تحديث:** مارس 2026

# البنية المعمارية - بوابة الرسائل

**الإصدار:** 1.0  
**آخر تحديث:** مارس 2026  
**المالك:** آيديا للاستشارات والحلول التسويقية والتقنية

---

## جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [المكونات الرئيسية](#المكونات-الرئيسية)
3. [تدفق البيانات](#تدفق-البيانات)
4. [قاعدة البيانات](#قاعدة-البيانات)
5. [الخدمات الخارجية](#الخدمات-الخارجية)
6. [الأمان والمصادقة](#الأمان-والمصادقة)
7. [الأداء والقابلية للتوسع](#الأداء-والقابلية-للتوسع)

---

## نظرة عامة

بوابة الرسائل تتكون من ثلاث طبقات رئيسية:

```
┌─────────────────────────────────────────────────────┐
│         تطبيق الموبايل (Expo React Native)         │
│  - واجهة المستخدم للشركات                           │
│  - إدارة الاتصال والرسائل                           │
│  - تتبع الإحصائيات                                 │
└────────────────┬────────────────────────────────────┘
                 │ Socket.io
┌────────────────▼────────────────────────────────────┐
│         خادم الويب (Node.js + Express)              │
│  - معالجة الطلبات                                   │
│  - إدارة المستخدمين والاشتراكات                     │
│  - معالجة الدفع                                     │
│  - إدارة الرسائل                                    │
└────────────────┬────────────────────────────────────┘
                 │ API
┌────────────────▼────────────────────────────────────┐
│      قاعدة البيانات والخدمات الخارجية               │
│  - PostgreSQL                                        │
│  - Stripe (الدفع)                                   │
│  - Twilio (SMS)                                      │
│  - WhatsApp Business API                            │
└─────────────────────────────────────────────────────┘
```

---

## المكونات الرئيسية

### 1. تطبيق الموبايل (Mobile App)

**التقنيات:**
- React Native مع Expo SDK 54
- TypeScript 5.9
- NativeWind (Tailwind CSS)
- React Router (التنقل)

**الشاشات الرئيسية:**

| الشاشة | الوصف | الميزات |
|--------|-------|--------|
| **Home** | الشاشة الرئيسية | حالة الاتصال، إحصائيات سريعة |
| **Messages** | إدارة الرسائل | SMS, WhatsApp, السجل، الفاشلة |
| **Invoices** | إدارة الفواتير | الفواتير، المدفوعات، الاشتراكات |
| **Settings** | الإعدادات | الملف الشخصي، التفضيلات، تسجيل الخروج |
| **Notifications** | التنبيهات | الإخطارات الجديدة والقديمة |

**الخدمات:**

```
lib/
├── services/
│   ├── socket-service.ts       # خدمة Socket.io
│   ├── notificationService.ts  # خدمة الإخطارات
│   └── api.ts                  # خدمة API
├── hooks/
│   ├── use-auth.ts             # Hook المصادقة
│   ├── use-colors.ts           # Hook الألوان
│   └── use-notifications.ts    # Hook الإخطارات
└── utils/
    └── utils.ts                # دوال مساعدة
```

### 2. خادم الويب (Backend Server)

**التقنيات:**
- Node.js 18+
- Express.js
- TRPC (RPC Framework)
- Socket.io
- Drizzle ORM

**المسارات الرئيسية:**

```
server/
├── routers/
│   ├── auth.ts                 # المصادقة
│   ├── subscriptions.ts        # الاشتراكات
│   ├── payments.ts             # المدفوعات
│   ├── notifications.ts        # الإخطارات
│   ├── admin.ts                # الإدارة
│   └── messages.ts             # الرسائل
├── services/
│   ├── emailService.ts         # خدمة البريد
│   ├── stripeService.ts        # خدمة Stripe
│   ├── monitoringService.ts    # خدمة المراقبة
│   ├── backupService.ts        # خدمة النسخ الاحتياطي
│   └── queueService.ts         # خدمة الرسائل الفورية
├── _core/
│   ├── index.ts                # نقطة الدخول
│   ├── trpc.ts                 # إعدادات TRPC
│   └── middleware.ts           # Middleware الأمان
└── db.ts                       # دوال قاعدة البيانات
```

**الـ Endpoints الرئيسية:**

| الـ Endpoint | الوصف |
|------------|-------|
| `/auth/login` | تسجيل الدخول |
| `/auth/register` | التسجيل الجديد |
| `/subscriptions/plans` | الخطط المتاحة |
| `/subscriptions/current` | الاشتراك الحالي |
| `/payments/create` | إنشاء دفعة |
| `/messages/send` | إرسال رسالة |
| `/messages/history` | سجل الرسائل |
| `/admin/users` | إدارة المستخدمين |
| `/admin/subscriptions` | إدارة الاشتراكات |

### 3. لوحة التحكم الإدارية (Admin Dashboard)

**التقنيات:**
- React 19
- TypeScript
- Recharts (الرسوم البيانية)
- Tailwind CSS

**الصفحات الرئيسية:**

```
admin/src/pages/
├── Dashboard.tsx              # لوحة التحكم الرئيسية
├── Users.tsx                  # إدارة المستخدمين
├── UserDetails.tsx            # تفاصيل المستخدم
├── Subscriptions.tsx          # إدارة الاشتراكات
├── SubscriptionDetails.tsx    # تفاصيل الاشتراك
├── Payments.tsx               # إدارة المدفوعات
├── Invoices.tsx               # إدارة الفواتير
├── InvoiceDetails.tsx         # تفاصيل الفاتورة
├── Reports.tsx                # التقارير والإحصائيات
└── Security.tsx               # الأمان والاختبارات
```

---

## تدفق البيانات

### تدفق إرسال الرسالة

```
1. الشركة تفتح التطبيق
   ↓
2. تسجيل الدخول والمصادقة
   ↓
3. الاتصال بـ Socket.io
   ↓
4. إدخال رقم الهاتف والرسالة
   ↓
5. الضغط على "إرسال"
   ↓
6. التطبيق يرسل الرسالة عبر Socket.io
   ↓
7. الخادم يستقبل الرسالة
   ↓
8. الخادم يتحقق من الصلاحيات
   ↓
9. الخادم يحفظ الرسالة في قاعدة البيانات
   ↓
10. الخادم يرسل الرسالة عبر SMS/WhatsApp
   ↓
11. الخادم يرسل تحديث الحالة للتطبيق
   ↓
12. التطبيق يعرض حالة الرسالة
```

### تدفق الدفع

```
1. الشركة تختار خطة جديدة
   ↓
2. التطبيق يعرض نموذج الدفع
   ↓
3. الشركة تدخل بيانات الدفع
   ↓
4. التطبيق يرسل البيانات للخادم
   ↓
5. الخادم يرسل الطلب إلى Stripe
   ↓
6. Stripe يعالج الدفع
   ↓
7. Stripe يرسل تأكيد الدفع
   ↓
8. الخادم يحدّث الاشتراك في قاعدة البيانات
   ↓
9. الخادم يرسل تأكيد للتطبيق
   ↓
10. التطبيق يعرض رسالة النجاح
```

---

## قاعدة البيانات

### الجداول الرئيسية

**جدول Users**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**جدول Subscriptions**
```sql
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  plan_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**جدول Messages**
```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  phone_number VARCHAR(20) NOT NULL,
  message_text TEXT NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'sms' or 'whatsapp'
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  failed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**جدول Payments**
```sql
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'AED',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  stripe_payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**جدول Notifications**
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## الخدمات الخارجية

### 1. Stripe (المدفوعات)

**الاستخدام:**
- معالجة الدفع بالبطاقات الائتمانية
- إدارة الاشتراكات المتكررة
- إصدار الفواتير

**التكامل:**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// إنشاء عميل
const customer = await stripe.customers.create({
  email: user.email,
  name: user.company_name
});

// إنشاء اشتراك
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: plan.stripe_price_id }],
  payment_behavior: 'default_incomplete'
});
```

### 2. Twilio (SMS)

**الاستخدام:**
- إرسال رسائل SMS
- تتبع حالة الرسائل

**التكامل:**
```javascript
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const message = await client.messages.create({
  body: 'رسالة الاختبار',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: '+971501234567'
});
```

### 3. WhatsApp Business API

**الاستخدام:**
- إرسال رسائل WhatsApp
- إرسال الصور والملفات

**التكامل:**
```javascript
const whatsapp = require('whatsapp-web.js');

const message = await whatsapp.sendMessage(
  '+971501234567@c.us',
  'رسالة WhatsApp'
);
```

### 4. SendGrid (البريد الإلكتروني)

**الاستخدام:**
- إرسال رسائل البريد الإلكتروني
- إرسال الفواتير

**التكامل:**
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

await sgMail.send({
  to: user.email,
  from: 'noreply@messaging-gateway.com',
  subject: 'تأكيد الدفع',
  html: '<h1>تم استقبال دفعتك</h1>'
});
```

---

## الأمان والمصادقة

### المصادقة

**JWT (JSON Web Tokens):**
```javascript
// إنشاء Token
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// التحقق من Token
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

**Socket.io Authentication:**
```javascript
socket.on('auth:connect', (data, callback) => {
  const { apiKey, companyId } = data;
  
  // التحقق من API Key
  const user = verifyApiKey(apiKey);
  
  if (user && user.companyId === companyId) {
    socket.userId = user.id;
    socket.companyId = companyId;
    callback({ success: true });
  } else {
    callback({ success: false, error: 'Invalid credentials' });
  }
});
```

### Middleware الأمان

**CORS (Cross-Origin Resource Sharing):**
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
```

**Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100 // 100 طلب لكل IP
});

app.use('/api/', limiter);
```

**HTTPS/TLS:**
- جميع الاتصالات عبر HTTPS
- استخدام TLS 1.3
- شهادات SSL من Let's Encrypt

---

## الأداء والقابلية للتوسع

### التخزين المؤقت (Caching)

**Redis:**
```javascript
const redis = require('redis');
const client = redis.createClient();

// تخزين البيانات
await client.setex(`user:${userId}`, 3600, JSON.stringify(user));

// استرجاع البيانات
const cachedUser = await client.get(`user:${userId}`);
```

### قاعدة البيانات

**الفهارس:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
```

### التوسع الأفقي

**Load Balancing:**
```
┌─────────────────────────────────┐
│      Nginx Load Balancer        │
└────────┬────────────────────────┘
         │
    ┌────┴────┬────────┬────────┐
    │          │        │        │
┌───▼──┐  ┌───▼──┐ ┌──▼───┐ ┌──▼───┐
│ App1 │  │ App2 │ │ App3 │ │ App4 │
└──────┘  └──────┘ └──────┘ └──────┘
    │          │        │        │
    └────┬────┬────────┬────────┘
         │    │        │
    ┌────▼────▼────────▼────┐
    │   PostgreSQL Cluster   │
    └────────────────────────┘
```

---

## الخلاصة

البنية المعمارية لبوابة الرسائل مصممة لتوفير:

- **الموثوقية:** نظام متين يعمل 24/7
- **الأمان:** حماية شاملة للبيانات والمعاملات
- **الأداء:** سرعة عالية وتجربة سلسة
- **القابلية للتوسع:** يمكن التوسع مع نمو الخدمة
- **سهولة الصيانة:** كود منظم وموثق جيداً

---

**آخر تحديث:** مارس 2026

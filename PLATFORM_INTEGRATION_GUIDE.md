# دليل ربط منصة بوابة الرسائل
**الإصدار:** 1.0  
**التاريخ:** 2 مارس 2026  
**الحالة:** جاهز للربط

---

## 📋 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [معمارية النظام](#معمارية-النظام)
3. [API Endpoints](#api-endpoints)
4. [نموذج البيانات](#نموذج-البيانات)
5. [تدفقات المستخدم](#تدفقات-المستخدم)
6. [متطلبات الربط](#متطلبات-الربط)
7. [خطوات التكامل](#خطوات-التكامل)
8. [الأمان والمصادقة](#الأمان-والمصادقة)
9. [معالجة الأخطاء](#معالجة-الأخطاء)
10. [الاختبار والنشر](#الاختبار-والنشر)

---

## 🎯 نظرة عامة

منصة بوابة الرسائل هي نظام شامل لإدارة الرسائل والاشتراكات والمدفوعات. يتكون من ثلاثة مكونات رئيسية:

| المكون | الوصف | التقنية |
|------|--------|---------|
| **تطبيق الموبايل** | تطبيق React Native للمستخدمين | Expo SDK 54 |
| **لوحة التحكم الويب** | واجهة إدارة للمسؤولين | React 19 + TypeScript |
| **خادم الويب** | API وقاعدة البيانات | Node.js + Express + MySQL |

---

## 🏗️ معمارية النظام

```
┌─────────────────────────────────────────────────────────────────┐
│                    تطبيق الموبايل (Expo)                        │
│  - الشاشة الرئيسية                                             │
│  - إدارة الاشتراكات                                            │
│  - التنبيهات والإشعارات                                        │
│  - الملف الشخصي والإعدادات                                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ TRPC + REST API
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                  خادم الويب (Node.js)                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ API Routes                                               │   │
│  │ - Authentication (JWT)                                  │   │
│  │ - Users Management                                      │   │
│  │ - Subscriptions                                         │   │
│  │ - Payments (Stripe)                                     │   │
│  │ - Notifications                                         │   │
│  │ - Admin Dashboard                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Services                                                 │   │
│  │ - Email Service (SMTP)                                  │   │
│  │ - Payment Service (Stripe)                              │   │
│  │ - Notification Service                                  │   │
│  │ - Database Service                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ MySQL Driver
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                  قاعدة البيانات (MySQL)                         │
│  - Users Table                                                  │
│  - Subscriptions Table                                          │
│  - Payments Table                                               │
│  - Invoices Table                                               │
│  - Notifications Table                                          │
│  - Admin Users Table                                            │
└─────────────────────────────────────────────────────────────────┘
                     │
                     │ SMTP
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                  خدمات خارجية                                   │
│  - Stripe (المدفوعات)                                          │
│  - SMTP Server (البريد الإلكتروني)                             │
│  - Twilio (SMS - اختياري)                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### 1. المصادقة والمستخدمين

#### تسجيل مستخدم جديد
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "User Name",
  "password": "SecurePassword123",
  "loginMethod": "email"
}

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### تسجيل الدخول
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### الحصول على بيانات المستخدم
```
GET /api/users/me
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "email": "user@example.com",
  "name": "User Name",
  "role": "user",
  "createdAt": "2026-03-02T00:00:00Z"
}
```

### 2. الاشتراكات

#### الحصول على خطط الاشتراك
```
GET /api/subscriptions/plans
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "id": 1,
    "name": "Basic",
    "monthlyPrice": 29.99,
    "yearlyPrice": 299.99,
    "whatsappMessagesLimit": 1000,
    "smsMessagesLimit": 500,
    "features": ["Feature 1", "Feature 2"]
  },
  ...
]
```

#### إنشاء اشتراك
```
POST /api/subscriptions
Authorization: Bearer {token}
Content-Type: application/json

{
  "planId": 1,
  "billingCycle": "monthly",
  "paymentMethodId": "pm_123456"
}

Response: 201 Created
{
  "id": 1,
  "userId": 1,
  "planId": 1,
  "status": "active",
  "startDate": "2026-03-02T00:00:00Z",
  "nextBillingDate": "2026-04-02T00:00:00Z"
}
```

#### الحصول على الاشتراك الحالي
```
GET /api/subscriptions/current
Authorization: Bearer {token}

Response: 200 OK
{
  "id": 1,
  "userId": 1,
  "planId": 1,
  "status": "active",
  "startDate": "2026-03-02T00:00:00Z",
  "endDate": null,
  "autoRenew": true,
  "billingCycle": "monthly",
  "nextBillingDate": "2026-04-02T00:00:00Z"
}
```

### 3. المدفوعات

#### الحصول على الفواتير
```
GET /api/payments/invoices?limit=10&offset=0
Authorization: Bearer {token}

Response: 200 OK
{
  "invoices": [
    {
      "id": 1,
      "userId": 1,
      "amount": 29.99,
      "currency": "USD",
      "status": "paid",
      "invoiceNumber": "INV-001",
      "dueDate": "2026-03-09T00:00:00Z",
      "paidDate": "2026-03-02T00:00:00Z",
      "items": [
        {
          "description": "Basic Plan - Monthly",
          "quantity": 1,
          "unitPrice": 29.99,
          "totalPrice": 29.99
        }
      ]
    }
  ],
  "total": 1
}
```

#### إنشاء دفعة
```
POST /api/payments
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 29.99,
  "currency": "USD",
  "paymentMethodId": "pm_123456",
  "description": "Basic Plan - Monthly"
}

Response: 201 Created
{
  "id": 1,
  "transactionId": "ch_123456789",
  "amount": 29.99,
  "currency": "USD",
  "status": "completed",
  "createdAt": "2026-03-02T00:00:00Z"
}
```

### 4. التنبيهات

#### الحصول على التنبيهات
```
GET /api/notifications?limit=20&offset=0&unreadOnly=false
Authorization: Bearer {token}

Response: 200 OK
{
  "notifications": [
    {
      "id": 1,
      "type": "payment_received",
      "title": "تم استقبال الدفع",
      "message": "تم استقبال دفعتك بنجاح",
      "isRead": false,
      "createdAt": "2026-03-02T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### تحديد التنبيه كمقروء
```
PUT /api/notifications/{id}/read
Authorization: Bearer {token}

Response: 200 OK
{
  "success": true
}
```

### 5. لوحة التحكم (Admin)

#### الحصول على إحصائيات لوحة التحكم
```
GET /api/admin/dashboard/stats
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "totalUsers": 150,
  "activeSubscriptions": 120,
  "monthlyRevenue": 3599.88,
  "failedPayments": 5,
  "chartData": {
    "monthlyRevenue": [...],
    "userGrowth": [...],
    "successRate": [...]
  }
}
```

#### الحصول على قائمة المستخدمين
```
GET /api/admin/users?limit=20&offset=0&search=email&sort=createdAt
Authorization: Bearer {admin_token}

Response: 200 OK
{
  "users": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "User Name",
      "role": "user",
      "createdAt": "2026-03-02T00:00:00Z",
      "subscription": {
        "planId": 1,
        "status": "active"
      }
    }
  ],
  "total": 150
}
```

---

## 📊 نموذج البيانات

### جدول المستخدمين (Users)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(320) UNIQUE NOT NULL,
  name TEXT,
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP
);
```

### جدول الاشتراكات (User Subscriptions)
```sql
CREATE TABLE userSubscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  planId INT NOT NULL,
  status ENUM('active', 'inactive', 'suspended', 'expired', 'cancelled') DEFAULT 'active',
  startDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  endDate TIMESTAMP,
  autoRenew BOOLEAN DEFAULT TRUE,
  billingCycle ENUM('monthly', 'yearly') DEFAULT 'monthly',
  nextBillingDate TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (planId) REFERENCES subscriptionPlans(id)
);
```

### جدول المدفوعات (Payments)
```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  invoiceId INT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  paymentStatus ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  paymentMethod VARCHAR(64),
  transactionId VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### جدول الفواتير (Invoices)
```sql
CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  subscriptionId INT,
  invoiceNumber VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('draft', 'sent', 'paid', 'overdue', 'cancelled') DEFAULT 'draft',
  dueDate TIMESTAMP,
  paidDate TIMESTAMP,
  items JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### جدول التنبيهات (Notifications)
```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  readAt TIMESTAMP,
  data JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  INDEX (userId, isRead)
);
```

---

## 👥 تدفقات المستخدم

### تدفق التسجيل والاشتراك

```
1. المستخدم يفتح التطبيق
   ↓
2. يختار "إنشاء حساب جديد"
   ↓
3. يملأ البيانات (البريد الإلكتروني، الاسم، كلمة المرور)
   ↓
4. يتم إرسال طلب POST /api/auth/register
   ↓
5. يتم إنشاء حساب جديد وإرسال رمز JWT
   ↓
6. يتم توجيه المستخدم لاختيار خطة اشتراك
   ↓
7. يختار خطة ويدخل بيانات الدفع
   ↓
8. يتم معالجة الدفع عبر Stripe
   ↓
9. يتم إنشاء الاشتراك وإرسال تأكيد بالبريد الإلكتروني
   ↓
10. يتم توجيه المستخدم للشاشة الرئيسية
```

### تدفق التجديد التلقائي للاشتراك

```
1. في تاريخ التجديد (nextBillingDate)
   ↓
2. يتم التحقق من autoRenew = true
   ↓
3. يتم محاولة خصم المبلغ من طريقة الدفع المحفوظة
   ↓
4. إذا نجح:
   - يتم تحديث الاشتراك
   - يتم إنشاء فاتورة جديدة
   - يتم إرسال إشعار بالتجديد
   ↓
5. إذا فشل:
   - يتم إنشاء إشعار بفشل الدفع
   - يتم إرسال بريد إلكتروني بطلب تحديث طريقة الدفع
   - يتم محاولة إعادة الدفع بعد 3 أيام
```

---

## 📋 متطلبات الربط

### المتطلبات الفنية

| المتطلب | الإصدار | الملاحظات |
|--------|--------|----------|
| Node.js | >= 18.0.0 | للخادم |
| MySQL | >= 8.0.0 | لقاعدة البيانات |
| npm/pnpm | >= 9.0.0 | لإدارة المكتبات |
| Redis | >= 7.0.0 | اختياري (للـ caching) |
| Docker | >= 20.0.0 | اختياري (للنشر) |

### المتطلبات الخارجية

| الخدمة | الغرض | الحالة |
|------|-------|--------|
| Stripe | معالجة المدفوعات | إجباري |
| SMTP Server | إرسال البريد الإلكتروني | إجباري |
| Twilio | إرسال SMS | اختياري |
| SendGrid | إرسال البريد الإلكتروني | بديل |

### المتطلبات الأمنية

- شهادة SSL/TLS للاتصال الآمن
- مفاتيح API قوية (32+ حرف)
- تشفير كلمات المرور (bcrypt)
- توقيع رموز JWT بمفتاح سري قوي
- حماية CORS مناسبة

---

## 🔧 خطوات التكامل

### الخطوة 1: إعداد البيئة

```bash
# 1. استنساخ المستودع
git clone <repository-url>
cd messaging-gateway-app

# 2. تثبيت المكتبات
pnpm install

# 3. إنشاء ملف .env
cp .env.example .env

# 4. تحديث متغيرات البيئة
# DATABASE_URL, STRIPE_SECRET_KEY, SMTP_HOST, etc.
```

### الخطوة 2: إعداد قاعدة البيانات

```bash
# 1. إنشاء قاعدة البيانات
mysql -u root -p -e "CREATE DATABASE messaging_gateway;"

# 2. تطبيق الهجرات
pnpm db:push

# 3. التحقق من الجداول
mysql -u root -p messaging_gateway -e "SHOW TABLES;"
```

### الخطوة 3: تكوين الخدمات الخارجية

#### Stripe
```
1. إنشاء حساب Stripe (https://stripe.com)
2. الحصول على مفاتيح API
3. تحديث STRIPE_SECRET_KEY و STRIPE_PUBLISHABLE_KEY
4. إنشاء webhook لمعالجة أحداث الدفع
```

#### SMTP
```
1. إعداد خادم SMTP (Gmail, SendGrid, etc.)
2. تحديث SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
3. اختبار الاتصال
```

### الخطوة 4: تشغيل التطبيق

```bash
# تطوير
pnpm dev

# الإنتاج
pnpm build
pnpm start
```

### الخطوة 5: الاختبار

```bash
# اختبارات الوحدة
pnpm test

# اختبارات التكامل
pnpm test:integration

# فحص TypeScript
pnpm check
```

---

## 🔐 الأمان والمصادقة

### JWT (JSON Web Tokens)

```typescript
// التوقيع
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// التحقق
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### معالجة المصادقة

```typescript
// Middleware للتحقق من التوكن
app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});
```

### حماية كلمات المرور

```typescript
// تشفير
const hashedPassword = await bcrypt.hash(password, 10);

// التحقق
const isValid = await bcrypt.compare(password, hashedPassword);
```

---

## ⚠️ معالجة الأخطاء

### أكواد الأخطاء

| الكود | الوصف |
|------|--------|
| 400 | طلب غير صحيح (Bad Request) |
| 401 | غير مصرح (Unauthorized) |
| 403 | ممنوع (Forbidden) |
| 404 | غير موجود (Not Found) |
| 409 | تضارب (Conflict) |
| 429 | عدد الطلبات كثير (Too Many Requests) |
| 500 | خطأ في الخادم (Internal Server Error) |

### مثال على معالجة الأخطاء

```typescript
try {
  const user = await getUserById(userId);
  if (!user) {
    return res.status(404).json({ 
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }
  res.json(user);
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
}
```

---

## 🧪 الاختبار والنشر

### الاختبار المحلي

```bash
# 1. تشغيل الخادم
pnpm dev:server

# 2. تشغيل التطبيق
pnpm dev:metro

# 3. اختبار API
curl -X GET http://localhost:3000/api/health

# 4. اختبار المصادقة
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### الاختبار في الإنتاج

```bash
# 1. بناء التطبيق
pnpm build

# 2. تشغيل الخادم
NODE_ENV=production pnpm start

# 3. التحقق من الصحة
curl https://yourdomain.com/api/health

# 4. مراقبة السجلات
tail -f logs/production.log
```

### نقاط التفتيش قبل النشر

- [ ] جميع المتغيرات البيئية مضبوطة
- [ ] قاعدة البيانات مهاجرة وتم اختبارها
- [ ] شهادة SSL مثبتة
- [ ] CORS مكون بشكل صحيح
- [ ] Rate limiting مفعل
- [ ] السجلات مفعلة
- [ ] النسخ الاحتياطية مجدولة
- [ ] المراقبة والتنبيهات مفعلة

---

## 📞 الدعم والتواصل

للأسئلة والدعم الفني، يرجى التواصل عبر:

- **البريد الإلكتروني:** support@messaginggateway.com
- **الهاتف:** +966 XX XXX XXXX
- **الموقع:** https://messaginggateway.com/support

---

**آخر تحديث:** 2 مارس 2026  
**الإصدار:** 1.0  
**الحالة:** جاهز للإنتاج

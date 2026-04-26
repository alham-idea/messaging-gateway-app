# لوحة التحكم - دليل النشر والتكامل الكامل

## نظرة عامة

تم إكمال وتحسين لوحة تحكم الويب لتطبيق بوابة الرسائل. هذا الدليل يشرح كيفية النشر والتكامل الكامل مع الخادم الرئيسي.

## التحسينات المُنجزة

### 1. إصلاح المصادقة (Authentication)
- **المشكلة السابقة**: كانت حالة المصادقة تُفقد عند تحديث الصفحة
- **الحل**: تم تحسين `authStore.ts` لاستعادة حالة المصادقة من `localStorage` تلقائياً
- **الملفات المُعدلة**: `admin/src/stores/authStore.ts`

```typescript
// الآن يتم حفظ واستعادة:
- adminToken (في localStorage)
- adminUser (في localStorage)
```

### 2. إصلاح التوجيه (Routing)
- **المشكلة السابقة**: صفحات التفاصيل (UserDetails, SubscriptionDetails, InvoiceDetails) لم تكن قابلة للوصول
- **الحل**: تم إضافة جميع المسارات المفقودة إلى `App.tsx`
- **الملفات المُعدلة**: `admin/src/App.tsx`

```typescript
// تم إضافة المسارات:
- /users/:userId (تفاصيل المستخدم)
- /subscriptions/:subscriptionId (تفاصيل الاشتراك)
- /invoices/:invoiceId (تفاصيل الفاتورة)
```

### 3. تحسين التنقل
- **المشكلة السابقة**: أزرار الإجراءات في الجداول لم تكن تعمل
- **الحل**: تم ربط جميع الأزرار بصفحات التفاصيل المناسبة
- **الملفات المُعدلة**: 
  - `admin/src/pages/Users.tsx`
  - `admin/src/pages/Subscriptions.tsx`
  - `admin/src/pages/Invoices.tsx`

### 4. توحيد استدعاءات API
- **المشكلة السابقة**: كانت الصفحات تستخدم مزيجاً من REST و tRPC
- **الحل**: تم توحيد جميع الاستدعاءات لاستخدام `adminApi` service
- **الملفات المُعدلة**:
  - `admin/src/pages/Dashboard.tsx`
  - `admin/src/pages/Subscriptions.tsx`
  - `admin/src/pages/Invoices.tsx`

## بنية المشروع

```
messaging-gateway-app/
├── admin/                          # مشروع لوحة التحكم (Vite + React)
│   ├── src/
│   │   ├── App.tsx                # التطبيق الرئيسي (تم تحسينه)
│   │   ├── pages/                 # صفحات لوحة التحكم
│   │   │   ├── Dashboard.tsx       # لوحة التحكم الرئيسية
│   │   │   ├── Users.tsx           # قائمة المستخدمين
│   │   │   ├── UserDetails.tsx     # تفاصيل المستخدم
│   │   │   ├── Subscriptions.tsx   # قائمة الاشتراكات
│   │   │   ├── SubscriptionDetails.tsx # تفاصيل الاشتراك
│   │   │   ├── Invoices.tsx        # قائمة الفواتير
│   │   │   ├── InvoiceDetails.tsx  # تفاصيل الفاتورة
│   │   │   ├── Analytics.tsx       # التحليلات
│   │   │   ├── Settings.tsx        # الإعدادات
│   │   │   └── Login.tsx           # صفحة تسجيل الدخول
│   │   ├── components/             # مكونات مشتركة
│   │   ├── services/               # خدمات API
│   │   │   ├── api.ts              # عميل Axios
│   │   │   ├── adminApi.ts         # خدمة Admin API
│   │   │   └── notificationService.ts
│   │   └── stores/                 # متاجر Zustand
│   │       └── authStore.ts        # متجر المصادقة
│   ├── dist/                       # الملفات المُبنية (جاهزة للنشر)
│   └── package.json
│
├── server/                         # الخادم الرئيسي (Node.js + Express)
│   ├── _core/
│   │   └── index.ts               # نقطة دخول الخادم
│   ├── public/
│   │   └── admin/                 # ملفات لوحة التحكم الثابتة
│   │       ├── index.html
│   │       └── assets/
│   ├── routers/
│   │   └── admin.ts               # API endpoints للإدارة
│   └── ...
│
└── ...
```

## متطلبات النشر

### 1. متغيرات البيئة (Environment Variables)

**للخادم الرئيسي (`.env`):**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@host:3306/messaging_gateway
JWT_SECRET=your-super-secret-key-min-32-chars
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
ADMIN_EMAIL=admin@messaginggateway.com
ADMIN_PASSWORD=change-me-in-production
```

**للوحة التحكم (`admin/.env.production`):**
```env
VITE_API_URL=https://your-api-domain.com/api/trpc
VITE_APP_TITLE=Messaging Gateway Admin
```

### 2. المتطلبات الأساسية

- **Node.js**: v18 أو أحدث
- **npm/pnpm**: لتثبيت المتطلبات
- **MySQL**: قاعدة البيانات
- **Stripe Account**: لمعالجة الدفعات (اختياري)

## خطوات النشر

### الخطوة 1: تثبيت المتطلبات

```bash
cd /home/ubuntu/messaging-gateway-app

# تثبيت متطلبات المشروع الرئيسي
pnpm install

# تثبيت متطلبات لوحة التحكم
cd admin && pnpm install && cd ..
```

### الخطوة 2: إعداد قاعدة البيانات

```bash
# إنشاء وتطبيق الهجرات
pnpm db:push
```

### الخطوة 3: بناء لوحة التحكم

```bash
cd admin

# بناء الملفات الثابتة
pnpm build

# سيتم إنشاء مجلد dist/ بالملفات المُحسّنة
```

### الخطوة 4: نسخ الملفات المُبنية

```bash
# نسخ ملفات لوحة التحكم إلى الخادم
rm -rf ../server/public/admin
cp -r dist ../server/public/admin
```

### الخطوة 5: بناء الخادم

```bash
cd ..

# بناء الخادم
pnpm build
```

### الخطوة 6: تشغيل الخادم

```bash
# في الإنتاج
NODE_ENV=production pnpm start

# أو في التطوير
pnpm dev
```

## الوصول إلى لوحة التحكم

بعد تشغيل الخادم، يمكنك الوصول إلى لوحة التحكم من:

```
http://localhost:3000/admin
```

أو في الإنتاج:
```
https://your-domain.com/admin
```

## بيانات الدخول الافتراضية

```
البريد الإلكتروني: admin@messaginggateway.com
كلمة المرور: (من متغير ADMIN_PASSWORD في .env)
```

## الميزات الرئيسية

### 1. لوحة التحكم (Dashboard)
- عرض إحصائيات شاملة عن المستخدمين والاشتراكات والإيرادات
- رسوم بيانية توضح الاتجاهات الشهرية
- عرض الأنشطة الأخيرة

### 2. إدارة المستخدمين (Users Management)
- عرض قائمة بجميع المستخدمين
- البحث والتصفية
- عرض تفاصيل المستخدم
- إدارة حالة المستخدم
- عرض الأجهزة المرتبطة

### 3. إدارة الاشتراكات (Subscriptions Management)
- عرض قائمة الاشتراكات النشطة
- تحديث حالة الاشتراك
- تغيير خطة الاشتراك
- تمديد فترة الاشتراك
- إعادة تعيين حد الاستخدام

### 4. إدارة الفواتير (Invoices Management)
- عرض قائمة الفواتير
- عرض تفاصيل الفاتورة
- تحديث حالة الفاتورة
- تحميل الفاتورة كـ PDF

### 5. التحليلات (Analytics)
- إحصائيات الاستخدام
- تقارير الإيرادات
- معدلات الاحتفاظ

### 6. الإعدادات (Settings)
- إعدادات التطبيق العامة
- إعدادات الإشعارات
- إعدادات النظام

## API Endpoints

جميع endpoints تتطلب مصادقة (JWT Token).

### Admin Endpoints

```
POST   /api/trpc/admin.getDashboardStats      - إحصائيات لوحة التحكم
POST   /api/trpc/admin.getUsers               - قائمة المستخدمين
POST   /api/trpc/admin.getUserDetails         - تفاصيل المستخدم
POST   /api/trpc/admin.updateUserStatus       - تحديث حالة المستخدم
POST   /api/trpc/admin.getSubscriptions       - قائمة الاشتراكات
POST   /api/trpc/admin.getSubscriptionDetails - تفاصيل الاشتراك
POST   /api/trpc/admin.updateSubscriptionStatus - تحديث حالة الاشتراك
POST   /api/trpc/admin.updateSubscriptionPlan - تغيير خطة الاشتراك
POST   /api/trpc/admin.extendSubscription     - تمديد الاشتراك
POST   /api/trpc/admin.resetSubscriptionQuota - إعادة تعيين الحد
POST   /api/trpc/admin.getInvoices            - قائمة الفواتير
POST   /api/trpc/admin.getInvoiceDetails      - تفاصيل الفاتورة
POST   /api/trpc/admin.updateInvoiceStatus    - تحديث حالة الفاتورة
POST   /api/trpc/admin.getUsageStatistics     - إحصائيات الاستخدام
POST   /api/trpc/admin.getSystemHealth        - صحة النظام
```

## استكشاف الأخطاء

### المشكلة: لا يمكن الوصول إلى لوحة التحكم

**الحل:**
1. تأكد من تشغيل الخادم على المنفذ الصحيح
2. تحقق من أن ملفات `server/public/admin/` موجودة
3. تحقق من سجلات الخادم للأخطاء

### المشكلة: خطأ في المصادقة

**الحل:**
1. تأكد من أن `JWT_SECRET` معرّف في `.env`
2. تأكد من أن قاعدة البيانات تحتوي على حساب admin
3. امسح `localStorage` وحاول تسجيل الدخول مرة أخرى

### المشكلة: الصفحات لا تحمل البيانات

**الحل:**
1. تحقق من أن `VITE_API_URL` صحيح
2. تأكد من أن الخادم يعمل بشكل صحيح
3. افتح أدوات المطور (F12) وتحقق من الأخطاء في console

## الخطوات التالية

### 1. تحسينات إضافية مقترحة

- [ ] إضافة رسائل تأكيد قبل الحذف
- [ ] تحسين معالجة الأخطاء والرسائل
- [ ] إضافة تصدير البيانات (CSV/Excel)
- [ ] تحسين الأداء مع pagination أفضل
- [ ] إضافة نمط مظلم (Dark Mode)
- [ ] إضافة دعم لغات متعددة

### 2. الأمان

- [ ] تفعيل HTTPS في الإنتاج
- [ ] إضافة Rate Limiting
- [ ] تفعيل CSRF Protection
- [ ] إضافة Audit Logging
- [ ] تحديث المتطلبات الأمنية بانتظام

### 3. المراقبة والتسجيل

- [ ] إضافة Logging شامل
- [ ] إعداد Monitoring و Alerting
- [ ] تتبع الأخطاء والاستثناءات
- [ ] إضافة Health Checks

## الدعم والمساعدة

للمزيد من المعلومات، راجع:

- [ADMIN_INTEGRATION.md](./ADMIN_INTEGRATION.md) - تفاصيل التكامل
- [API_SPEC.md](./API_SPEC.md) - مواصفات API
- [ARCHITECTURE.md](./ARCHITECTURE.md) - معمارية النظام

---

**آخر تحديث**: 2026-04-22
**الإصدار**: 1.0.0
**الحالة**: جاهز للنشر ✅

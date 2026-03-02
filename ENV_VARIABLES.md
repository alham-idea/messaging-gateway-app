# متغيرات البيئة المطلوبة

## قاعدة البيانات
```
DATABASE_URL=mysql://user:password@localhost:3306/messaging_gateway
```
- **النوع:** String
- **الإجباري:** نعم
- **الوصف:** رابط الاتصال بقاعدة البيانات MySQL

## البيئة
```
NODE_ENV=development|production
```
- **النوع:** String
- **الإجباري:** نعم
- **الخيارات:** `development`, `production`, `test`
- **الوصف:** بيئة التطبيق

## المصادقة
```
JWT_SECRET=your-super-secret-key
```
- **النوع:** String
- **الإجباري:** نعم
- **الوصف:** مفتاح سري لتوقيع رموز JWT
- **الملاحظة:** استخدم مفتاح قوي في الإنتاج (32+ حرف)

## البريد الإلكتروني (SMTP)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@messaginggateway.com
```
- **الإجباري:** نعم (لإرسال البريد)
- **الوصف:** إعدادات خادم SMTP لإرسال البريد الإلكتروني
- **ملاحظة Gmail:** استخدم كلمة مرور التطبيق (App Password) وليس كلمة المرور العادية

## Stripe (نظام الدفع)
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
- **النوع:** String
- **الإجباري:** نعم (للمدفوعات)
- **الوصف:** مفاتيح Stripe للمدفوعات
- **الحصول عليها:** من لوحة تحكم Stripe

## Redis (اختياري - للـ Caching)
```
REDIS_URL=redis://localhost:6379
```
- **النوع:** String
- **الإجباري:** لا
- **الوصف:** رابط الاتصال بـ Redis للتخزين المؤقت

## تكوين API
```
API_PORT=3000
API_HOST=localhost
CORS_ORIGIN=http://localhost:3000,http://localhost:8081
```
- **النوع:** String/Number
- **الإجباري:** نعم
- **الوصف:** إعدادات خادم API

## تكوين المسؤول
```
ADMIN_EMAIL=admin@messaginggateway.com
ADMIN_PASSWORD=change-me-in-production
```
- **النوع:** String
- **الإجباري:** نعم
- **الوصف:** بيانات حساب المسؤول الأولي

## WhatsApp (اختياري)
```
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_KEY=your-whatsapp-api-key
```
- **النوع:** String
- **الإجباري:** لا (إذا كنت تستخدم WhatsApp)
- **الوصف:** إعدادات WhatsApp API

## التسجيل (Logging)
```
LOG_LEVEL=info
LOG_FORMAT=json
```
- **النوع:** String
- **الإجباري:** لا
- **الخيارات:** `error`, `warn`, `info`, `debug`
- **الوصف:** مستوى وتنسيق السجلات

## تحديد السرعة (Rate Limiting)
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```
- **النوع:** Number
- **الإجباري:** لا
- **الوصف:** إعدادات تحديد السرعة

## جلسة المستخدم (Session)
```
SESSION_SECRET=your-session-secret-key
SESSION_TIMEOUT=3600000
```
- **النوع:** String/Number
- **الإجباري:** نعم
- **الوصف:** إعدادات جلسة المستخدم

## أعلام الميزات (Feature Flags)
```
ENABLE_2FA=true
ENABLE_SOCIAL_LOGIN=true
ENABLE_PAYMENT_GATEWAY=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=false
```
- **النوع:** Boolean
- **الإجباري:** لا
- **الوصف:** تفعيل/تعطيل الميزات

---

## مثال على ملف .env كامل

```env
# Database
DATABASE_URL=mysql://root:password@localhost:3306/messaging_gateway

# Environment
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-32-characters-minimum

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@messaginggateway.com

# Stripe
STRIPE_SECRET_KEY=sk_test_51234567890
STRIPE_PUBLISHABLE_KEY=pk_test_51234567890
STRIPE_WEBHOOK_SECRET=whsec_1234567890

# API
API_PORT=3000
API_HOST=localhost
CORS_ORIGIN=http://localhost:3000,http://localhost:8081

# Admin
ADMIN_EMAIL=admin@messaginggateway.com
ADMIN_PASSWORD=SecurePassword123!

# Session
SESSION_SECRET=your-session-secret-key-32-characters
SESSION_TIMEOUT=3600000

# Features
ENABLE_2FA=true
ENABLE_PAYMENT_GATEWAY=true
ENABLE_EMAIL_NOTIFICATIONS=true
```

---

## ملاحظات أمان مهمة

1. **لا تشارك ملف .env** - احفظه في `.gitignore`
2. **استخدم مفاتيح قوية** - خاصة في الإنتاج
3. **غيّر المفاتيح الافتراضية** - قبل النشر
4. **استخدم متغيرات بيئة آمنة** - في الإنتاج (AWS Secrets Manager, etc.)
5. **راجع السجلات** - تأكد من عدم تسجيل المفاتيح السرية

---

## التحقق من متغيرات البيئة

```bash
# التحقق من وجود جميع المتغيرات المطلوبة
node scripts/validate-env.js

# عرض المتغيرات المحملة
node scripts/show-env.js
```

---

**آخر تحديث:** 2 مارس 2026

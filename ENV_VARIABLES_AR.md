# تكوين متغيرات البيئة (Environment Variables)

توضح هذه الوثيقة جميع متغيرات البيئة المطلوبة لتشغيل نظام بوابة الرسائل (السيرفر ولوحة التحكم).

## 1. السيرفر الخلفي (`.env`)

يجب وضع هذه المتغيرات في ملف `.env` في المجلد الرئيسي للمشروع.

### قاعدة البيانات (مطلوب)
رابط الاتصال بقاعدة بيانات MySQL.
```env
DATABASE_URL=mysql://user:password@localhost:3306/messaging_gateway
```

### بيئة التطبيق (مطلوب)
تتحكم في وضع تشغيل التطبيق.
```env
NODE_ENV=development # أو 'production'
PORT=3000           # المنفذ الذي يستمع عليه السيرفر
```

### المصادقة (مطلوب)
المفتاح السري لتوقيع رموز JWT (JSON Web Tokens).
```env
JWT_SECRET=your-super-secret-key-min-32-chars
```

### خدمة البريد الإلكتروني (SMTP) (مطلوب للإشعارات)
إعدادات إرسال رسائل البريد الإلكتروني (الفواتير، الإيصالات، التنبيهات).
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_SECURE=false # true للمنفذ 465, false للمنافذ الأخرى
EMAIL_FROM=noreply@messaginggateway.com
```

### مدفوعات Stripe (مطلوب للفوترة)
مفاتيح معالجة مدفوعات الاشتراكات.
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### تهيئة المسؤول (اختياري)
بيانات حساب المسؤول الأولي الذي يتم إنشاؤه عند بدء التشغيل إذا لم يكن موجوداً.
```env
ADMIN_EMAIL=admin@messaginggateway.com
ADMIN_PASSWORD=change-me-in-production
```

---

## 2. لوحة تحكم المسؤول (`admin/.env`)

يجب وضع هذه المتغيرات في ملف `admin/.env`.

### الاتصال بالواجهة البرمجية (مطلوب)
رابط الواجهة البرمجية الخلفية (tRPC API).
```env
VITE_API_URL=http://localhost:3000/api/trpc
```

---

## ملاحظات أمان

1.  **لا تقم أبداً برفع ملفات `.env` إلى مستودع الأكواد (Git).**
2.  استخدم نصوصاً عشوائية وقوية للمتغير `JWT_SECRET` وكلمات المرور في بيئة الإنتاج.
3.  تأكد من أن `DATABASE_URL` يستخدم مستخدماً بصلاحيات محدودة في بيئة الإنتاج (وليس root).

# البدء السريع - لوحة التحكم

## التثبيت والتشغيل المحلي

### 1. استنساخ المستودع
```bash
git clone https://github.com/alham-idea/messaging-gateway-app.git
cd messaging-gateway-app
```

### 2. تثبيت المتطلبات
```bash
pnpm install
cd admin && pnpm install && cd ..
```

### 3. إعداد ملف البيئة
```bash
# في الجذر
cp .env.example .env
# عدّل المتغيرات حسب احتياجاتك

# في مجلد admin
cp admin/.env.example admin/.env
# تأكد من أن VITE_API_URL يشير إلى الخادم الصحيح
```

### 4. تشغيل الخادم والوحة التحكم

**في نافذة terminal واحدة (تطوير):**
```bash
pnpm dev
```

هذا سيشغل:
- الخادم على `http://localhost:3000`
- لوحة التحكم على `http://localhost:3001` (مع proxy إلى الخادم)

**أو في نافذتين منفصلتين:**

```bash
# النافذة 1 - الخادم
pnpm dev:server

# النافذة 2 - لوحة التحكم
cd admin && pnpm dev
```

### 5. الوصول إلى لوحة التحكم

افتح متصفحك واذهب إلى:
```
http://localhost:3001
```

أو عبر الخادم:
```
http://localhost:3000/admin
```

## بيانات الدخول

```
البريد الإلكتروني: admin@example.com
كلمة المرور: password
```

## البناء للإنتاج

### 1. بناء لوحة التحكم
```bash
cd admin
pnpm build
```

### 2. نسخ الملفات المُبنية
```bash
rm -rf ../server/public/admin
cp -r dist ../server/public/admin
```

### 3. بناء الخادم
```bash
cd ..
pnpm build
```

### 4. تشغيل الإنتاج
```bash
NODE_ENV=production pnpm start
```

## الوصول إلى الإنتاج

```
https://your-domain.com/admin
```

## الميزات الرئيسية

✅ لوحة تحكم شاملة  
✅ إدارة المستخدمين  
✅ إدارة الاشتراكات  
✅ إدارة الفواتير  
✅ التحليلات والتقارير  
✅ إعدادات النظام  

## استكشاف الأخطاء

### لا تظهر البيانات؟
- تحقق من أن الخادم يعمل
- تحقق من `VITE_API_URL` في `admin/.env`
- افتح أدوات المطور (F12) وتحقق من الأخطاء

### خطأ في المصادقة؟
- امسح `localStorage` وحاول مرة أخرى
- تأكد من بيانات الدخول صحيحة
- تحقق من أن `JWT_SECRET` معرّف

### الملفات الثابتة لا تُحمّل؟
- تأكد من وجود `server/public/admin/` بالملفات الصحيحة
- أعد بناء لوحة التحكم: `cd admin && pnpm build`

## الملفات المهمة

```
admin/
├── src/
│   ├── App.tsx              # التطبيق الرئيسي
│   ├── pages/               # الصفحات
│   ├── components/          # المكونات
│   ├── services/            # خدمات API
│   └── stores/              # متاجر الحالة
├── vite.config.ts           # إعدادات Vite
├── package.json             # المتطلبات
└── .env.production          # متغيرات الإنتاج
```

## الموارد الإضافية

- [دليل النشر الكامل](./ADMIN_DASHBOARD_DEPLOYMENT.md)
- [مواصفات API](./API_SPEC.md)
- [معمارية النظام](./ARCHITECTURE.md)

---

**نصيحة**: استخدم `pnpm` بدلاً من `npm` للأداء الأفضل والتثبيت الأسرع.

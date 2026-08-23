
## ربط JWT المدير مع tRPC
- [x] جعل createContext يتعرف على JWT الصادر من `/api/admin/login`
- [x] تمرير مدير نشط إلى protectedProcedure وrequireAdmin
- [x] اختبار admin.getDashboardStats بعد تسجيل الدخول


## فحص لوحة التحكم الإنتاجية
- [x] إضافة نطاق لوحة التحكم `https://msgatewayadm-4pkhhml8.manus.space` إلى قائمة CORS الاحتياطية
- [x] ضبط متغير البيئة `CORS_ALLOWED_ORIGINS` بالقيمة نفسها
- [x] إعادة تشغيل خادم التطوير والتحقق من ترويسة `Access-Control-Allow-Origin` محلياً
- [x] تشغيل اختبار Vitest لنقطة `/api/health` مع Origin لوحة التحكم
- [ ] إعادة نشر الخادم الإنتاجي حتى يلتقط إصلاح CORS
- [ ] إعادة اختبار تسجيل الدخول الإنتاجي وفحص الخدمات والبوابات بعد إعادة النشر

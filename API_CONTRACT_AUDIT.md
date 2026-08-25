# مراجعة عقود API بين لوحة التحكم والخادم

## النطاق

تمت مقارنة `server/routers/admin.ts` و`server/routers.ts` في الخادم مع `src/services/adminApi.ts` و`src/services/api.ts` و`src/config/runtime.ts` من المستودع البعيد `alham-idea/messaging-gateway-admin`. لم تُرسل طلبات تعديل إلى بيانات الإنتاج أثناء المراجعة.

## النتيجة التنفيذية

العقود الأساسية متطابقة من حيث namespace والمسارات وأسماء الإجراءات. يستخدم الطرفان `/api/trpc/admin.*`، ويستخدم عميل لوحة التحكم صيغة tRPC الصحيحة عبر query parameter `input` للاستعلامات وJSON body للعمليات mutation. عنوان الإنتاج في `.env.production` يطابق نطاق الخادم `https://msg-gateway-7lqw9uuq.manus.space`، كما يطابق fallback الموجود في `runtime.ts`.

| المجال | نتيجة المراجعة | الملاحظة |
|---|---|---|
| Namespace | مطابق | `appRouter.admin` يسجل `adminRouter`، والعميل يستدعي `admin.*`. |
| GET queries | مطابق | `input={json: ...}` مرمّز في query parameter. |
| POST mutations | مطابق | body يستخدم `{ json: ... }` بما يتوافق مع tRPC. |
| فك الاستجابة | يعمل | `readResult` يدعم الاستجابة المغلفة بـ `json` والاستجابة المباشرة. |
| API origin | مطابق | الإنتاج يشير إلى نطاق الخادم الحالي. |
| Socket origin | مطابق | يستخدم نفس نطاق الخادم مع `/socket.io` الافتراضي. |
| JWT | متوافق | interceptor يرسل `Authorization: Bearer`; الخادم يتحقق من adminId والدور. |
| إجراءات الإدارة | متطابقة | جميع الإجراءات الـ16 الموجودة في adminApi موجودة في adminRouter. |
| المدخلات | متوافقة | statuses وpagination وIDs متطابقة في الاستخدام الحالي. |
| CORS | يحتاج تحقق إنتاجي | الخادم يسمح بالنطاق المنشور المعرّف حالياً، لكن اختبار production smoke ما زال مطلوباً بعد آخر نشر. |

## الإجراءات التي تمت مطابقتها

`getDashboardStats`, `getUsers`, `getUserDetails`, `updateUserStatus`, `getSubscriptions`, `getSubscriptionDetails`, `updateSubscriptionStatus`, `updateSubscriptionPlan`, `extendSubscription`, `resetSubscriptionQuota`, `getInvoices`, `getInvoiceDetails`, `updateInvoiceStatus`, `getUsageStatistics`, و`getSystemHealth` موجودة في الطرفين وبنفس أسماء المسارات.

## فجوات أو مخاطر متبقية

أولاً، يعتمد `readResult` على وجود `response.data.result.data` ولا يحوّل أخطاء tRPC إلى رسالة موحدة؛ عند حدوث خطأ قد يحصل المستهلك على خطأ JavaScript عام بدلاً من `error.message` القادم من الخادم. هذه فجوة في تجربة الخطأ وليست عدم تطابق في عقد النجاح.

ثانياً، لا تفرض بعض دوال العميل حدوداً محلية على `limit` و`offset` وIDs قبل إرسال الطلب. الخادم يطبق مخططات Zod، لذلك لا توجد ثغرة صلاحيات مثبتة، لكن إضافة تحقق محلي ستحسن سرعة اكتشاف أخطاء الإدخال.

ثالثاً، النسخة المحلية الموجودة في `/home/ubuntu/messaging-gateway-admin` تحتوي فقط على نسخة محدودة من `src/services/adminApi.ts` وليست checkout Git كامل. مصدر المراجعة المعتمد هو المستودع البعيد، ويجب تنفيذ أي تعديل للوحة داخل المستودع المستقل ثم نشره منه.

رابعاً، تم العثور على 40 تحذيراً من lint في مراجعات سابقة دون أخطاء lint مانعة. لا ترتبط هذه التحذيرات بتعارض عقد API مثبت، لكنها تستحق معالجة في تدقيق اللوحة النهائي.

## التوصية

لا يوجد عدم تطابق حرج مثبت في عقود الإجراءات الأساسية. الأولوية التالية هي إضافة محول أخطاء موحد إلى `adminApi`، واختبارات contract حتمية للاستجابات الناجحة والفاشلة، ثم تنفيذ اختبار smoke على النطاق الإنتاجي يشمل `/api/health` وadmin login وقراءة Dashboard وUsers وSubscriptions وInvoices.

لم تُجرَ تغييرات مدمرة على قاعدة البيانات، ولم تُنفذ عمليات كتابة على بيانات الإنتاج خلال المراجعة.

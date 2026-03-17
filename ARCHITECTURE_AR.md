# بنية النظام (System Architecture)

## النموذج المعماري
يعمل النظام وفق نموذج "التنفيذ اللامركزي" (Decentralized Execution) مع إدارة مركزية للاشتراكات.

### مخطط الاتصال (Connectivity Diagram)

```mermaid
graph TD
    subgraph "البنية التحتية لـ آيديا (Idea)"
        IdeaServer[سيرفر آيديا الخلفي]
        AdminPanel[لوحة التحكم]
        DB[(قاعدة بيانات MySQL)]
        
        AdminPanel -->|HTTPS/tRPC| IdeaServer
        IdeaServer --> DB
    end

    subgraph "البنية التحتية للعميل"
        ClientServer[سيرفر Socket.io الخاص بالعميل]
        ClientSystem[نظام العميل الداخلي]
        
        ClientSystem --> ClientServer
    end

    subgraph "بوابة الأندرويد (جهاز المستخدم)"
        App[التطبيق المحمول]
        SocketService[خدمة السوكيت]
        WebView[متصفح واتساب]
        SMS[مدير الرسائل النصية]
        
        App -->|HTTPS/tRPC| IdeaServer
        SocketService -->|Socket.io| ClientServer
        
        SocketService -->|أمر إرسال| WebView
        SocketService -->|أمر إرسال| SMS
    end

    WebView -->|HTTPS| WhatsAppWeb[سيرفرات واتساب ويب]
    SMS -->|GSM| TelecomNetwork[شبكة الاتصالات]
    ```

## تفاصيل المكونات

### 1. تطبيق الأندرويد (`/app`)
هو جوهر الحل التقني. يحافظ التطبيق على اتصالين شبكيين منفصلين ومتميزين:
1.  **اتصال الإدارة (Management Connection)**: يتصل بسيرفر آيديا عبر tRPC.
    *   **الهدف**: تسجيل الدخول، التحقق من صلاحية الاشتراك، رفع تقارير الاستخدام (للفوترة).
    *   **ملفات الكود**: `lib/trpc.ts`, `hooks/use-auth.ts`.
2.  **اتصال التشغيل (Operation Connection)**: يتصل برابط Socket.io الذي يحدده العميل يدوياً.
    *   **الهدف**: استقبال محتوى الرسائل مباشرة من نظام العميل دون المرور بسيرفرات آيديا.
    *   **ملفات الكود**: `app/connection-manager.tsx`, `lib/services/socket-service.ts`.

#### نظام طابور الرسائل (Message Queueing)
*   **التقنية**: طابور محلي دائم باستخدام `expo-sqlite`.
*   **الهدف**: ضمان عدم ضياع الرسائل في حال تعطل التطبيق أو انقطاع الشبكة.
*   **ملفات الكود**: `lib/services/database-service.ts`, `lib/services/message-handler-service.ts`.

#### آلية أتمتة واتساب
*   **الملف**: `lib/services/whatsapp-service.ts`
*   **التقنية**: حقن الكود في المتصفح (WebView DOM Injection).
*   **العملية**:
    1.  يقوم بتحميل `web.whatsapp.com` داخل WebView.
    2.  ينتظر حتى يقوم المستخدم بمسح كود QR.
    3.  يقوم بحقن كود JavaScript للبحث عن "حقل كتابة الرسالة" (مثلاً عبر خاصية `contenteditable="true"`).
    4.  يحاكي أحداث الكتابة والنقر على زر الإرسال.

### 2. سيرفر آيديا الخلفي (`/server`)
*   **الدور**: منصة إدارة الخدمة (SaaS Platform).
*   **المسؤوليات**:
    *   مصادقة المستخدمين وصلاحياتهم.
    *   إدارة الباقات والاشتراكات (Stripe).
    *   التحليلات العامة للنظام.
*   **ملاحظة هامة**: هذا السيرفر **لا يعالج** محتوى الرسائل الفعلي في هذه البنية. الرسائل تتدفق مباشرة من سيرفر العميل -> التطبيق.

### 3. سيرفر السوكيت الخاص بالعميل (خارجي)
*   **الدور**: مصدر الرسائل.
*   **المسؤولية**: يجب على العميل تشغيل سيرفر Socket.io يقوم بإرسال أحداث `send_message` إلى بوابة الأندرويد المتصلة به.

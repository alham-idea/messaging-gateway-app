# مواصفات الواجهة البرمجية (API Specification)

## نظرة عامة
تشرح هذه الوثيقة نقاط الاتصال (Endpoints) الخاصة بـ tRPC المستخدمة لإدارة بوابة الرسائل. يتم استخدام هذه الواجهة بشكل أساسي من قبل تطبيق الأندرويد ولوحة التحكم الإدارية.

> **ملاحظة**: هذه الواجهة مخصصة لأغراض **الإدارة** (المصادقة، الاشتراكات، الفوترة). أما إرسال الرسائل الفعلي فيتم عبر اتصال Socket.io منفصل بسيرفر العميل.

## 1. المصادقة (`authRouter`)
**الغرض**: تسجيل المستخدمين، الدخول، وإدارة الملف الشخصي.

| الإجراء | النوع | المدخلات | المخرجات | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `register` | Mutation | `{ name, email, loginMethod?, planId }` | `{ success, user, token }` | تسجيل مستخدم جديد وتعيين اشتراك افتراضي. |
| `login` | Mutation | `{ email, name?, openId?, loginMethod }` | `{ success, user, token }` | تسجيل دخول (OAuth). ينشئ حساباً إذا لم يكن موجوداً. |
| `me` | Query | - | `User Profile Object` | جلب بيانات المستخدم الحالي وحالة اشتراكه. |
| `updateProfile` | Mutation | `{ name?, email? }` | `User Object` | تحديث بيانات الملف الشخصي. |

## 2. الاشتراكات (`subscriptionsRouter`)
**الغرض**: إدارة الباقات واشتراكات المستخدمين.

| الإجراء | النوع | المدخلات | المخرجات | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `getPlans` | Query | - | `Array<Plan>` | عرض جميع باقات الاشتراك المتاحة. |
| `getPlan` | Query | `{ id }` | `Plan` | جلب تفاصيل باقة محددة. |
| `getCurrentSubscription` | Query | - | `Subscription Object` | جلب الاشتراك النشط للمستخدم الحالي. |
| `changeSubscription` | Mutation | `{ newPlanId, billingCycle? }` | `{ success, message }` | ترقية أو خفض باقة المستخدم. |
| `cancel` | Mutation | - | `{ success, message }` | إلغاء الاشتراك الحالي. |
| `getUsageStats` | Query | - | `{ usage: { whatsappUsed, smsUsed, ... } }` | إرجاع الاستهلاك الحالي مقارنة بحدود الباقة. |

## 3. الإشعارات (`notificationsRouter`)
**الغرض**: تنبيهات النظام وإشعارات المستخدم.

| الإجراء | النوع | المدخلات | المخرجات | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `getNotifications` | Query | `{ limit, offset, unreadOnly }` | `Array<Notification>` | جلب إشعارات المستخدم. |
| `getUnreadCount` | Query | - | `number` | جلب عدد الإشعارات غير المقروءة. |
| `markAsRead` | Mutation | `{ notificationId }` | `boolean` | تحديد إشعار معين كمقروء. |
| `markAllAsRead` | Mutation | - | `boolean` | تحديد كل الإشعارات كمقروءة. |

## 4. المدفوعات (`paymentsRouter`)
**الغرض**: معالجة الفوترة وسجل العمليات.

| الإجراء | النوع | المدخلات | المخرجات | الوصف |
| :--- | :--- | :--- | :--- | :--- |
| `createPayment` | Mutation | `{ amount, paymentMethod }` | `{ success, paymentId }` | إنشاء طلب دفع جديد. |
| `getPaymentHistory` | Query | `{ limit, offset }` | `{ payments, total }` | عرض سجل العمليات السابقة. |

---

# واجهة Socket.io (تكامل العميل)

## نظرة عامة
يحدد هذا القسم العقد (Contract) بين **تطبيق بوابة الأندرويد** و **سيرفر Socket.io الخاص بالعميل**. العميل هو المسؤول عن استضافة هذا السيرفر.

## الاتصال
-   **الرابط**: يحدده المستخدم (يتم إدخاله في التطبيق).
-   **البروتوكول**: WebSocket / Polling.

## الأحداث (Events)

### 1. من السيرفر -> إلى التطبيق (أوامر)

#### `send_message`
يتم إطلاقه من سيرفر العميل عندما يريد إرسال رسالة عبر البوابة.

**الحمولة (Payload):**
```typescript
interface MessagePayload {
  id: string;              // معرف فريد للرسالة
  type: 'whatsapp' | 'sms'; // قناة الإرسال
  phoneNumber: string;     // رقم المستلم (مثلاً +96650xxxxxxx)
  message: string;         // محتوى الرسالة
  timestamp: number;       // طابع زمني
}
```

### 2. من التطبيق -> إلى السيرفر (تقارير)

#### `connect`
حدث Socket.io قياسي. يشير إلى أن البوابة أصبحت متصلة (Online).

#### `device_status`
تقرير دوري عن حالة الجهاز يرسله التطبيق.

**الحمولة (Payload):**
```typescript
interface DeviceStatus {
  timestamp: number;
  platform: 'android' | 'ios';
  batteryLevel: number;    // من 0.0 إلى 1.0
  batteryState: string;    // 'charging' (يشحن) أو 'unplugged' (مفصول)
  isCharging: boolean;
  networkType: string;     // 'wifi' أو 'cellular'
  isOnline: boolean;
}
```

#### `message_response`
يتم إرساله بعد محاولة معالجة الرسالة (سواء نجحت أو فشلت).

**الحمولة (Payload):**
```typescript
interface MessageResponse {
  messageId: string;       // معرف الرسالة الأصلي
  status: 'sent' | 'failed' | 'pending'; // الحالة
  error?: string;          // رسالة الخطأ في حال الفشل
  timestamp: number;
}
```

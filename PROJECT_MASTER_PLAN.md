# Project Master Plan

## 1. Project Vision (الرؤية)
**English**: To create a "Bring Your Own Device" (BYOD) messaging gateway that allows businesses to use their own Android devices as SMS and WhatsApp gateways. The solution provides a management layer (Idea Backend) for subscriptions and billing, while the actual message execution happens directly between the client's system and the Android device via a decentralized Socket.io connection.

**العربية**: إنشاء بوابة رسائل تعتمد على نموذج "جهازك هو البوابة"، مما يتيح للشركات استخدام أجهزة أندرويد الخاصة بها كبوابات لإرسال الرسائل النصية والواتساب. يوفر الحل طبقة إدارة مركزية (سيرفر آيديا) للاشتراكات والفوترة، بينما تتم عملية إرسال الرسائل فعلياً بشكل مباشر بين نظام العميل وجهاز الأندرويد عبر اتصال Socket.io لامركزي.

## 2. Gap Analysis (تحليل الفجوات)

### A. Critical Technical Gaps (فجوات تقنية حرجة)

| Gap | Severity | Description | Action Required |
| :--- | :--- | :--- | :--- |
| **Fragile WhatsApp Automation** | 🔴 High | The `WhatsAppService` relies on DOM injection with specific selectors (e.g., `aria-label="اكتب رسالة"`). This is prone to breaking if WhatsApp Web updates its UI or if the device language changes. | Implement a robust selector strategy with multiple fallbacks and language-agnostic selectors. Consider switching to Accessibility Services for better stability. |
| **Missing Message Queue Persistence** | 🔴 High | The Android app's message queue is in-memory only. If the app crashes or restarts, pending messages are lost. | Implement SQLite or persistent storage for the message queue in the Android app. |
| **No Usage Enforcement** | 🟠 Medium | While usage stats are collected (`usageStatistics` table), there is no **real-time mechanism** to block sending if the user exceeds their plan limit, because the sending happens via the Client <-> App direct connection. | The App needs to fetch the "remaining quota" from the Backend periodically and enforce it locally before processing `send_message` events. |
| **Lack of Client Integration SDK** | 🟠 Medium | Clients have to manually implement the Socket.io server. | Create a simple Node.js/PHP/Python SDK or example code to help clients set up their Socket.io server quickly. |

### B. Documentation Gaps (فجوات التوثيق)

| Gap | Severity | Description | Action Required |
| :--- | :--- | :--- | :--- |
| **Client Server Setup Guide** | 🔴 High | No documentation explains how the client should set up their Socket.io server to emit the correct events. | Create a detailed "Client Server Implementation Guide" with code examples. |

## 3. Roadmap (خارطة الطريق)

### Phase 1: Stability & Persistence (Est. 2 Weeks)
*   [ ] **Fix**: Implement persistent Queue in Android App (SQLite).
*   [ ] **Fix**: Improve WhatsApp DOM selectors (support English/Arabic + generic selectors).
*   [x] **Feature**: Add local quota enforcement in the App (sync with Backend + SQLite counters).

### Phase 2: Client Experience (Est. 1 Week)
*   [ ] **Docs**: Create "Client Server Setup Guide".
*   [ ] **Tooling**: Release a Docker container or Node.js package for the "Client Socket Server" to simplify setup.

### Phase 3: Advanced Features (Est. 3 Weeks)
*   [ ] **Feature**: Support for attachments (images/PDF) in WhatsApp.
*   [ ] **Feature**: "Campaign Mode" in the App for bulk sending with delays.
*   [ ] **Monitoring**: Add "Heartbeat" monitoring in the Backend to alert users if their gateway device goes offline.

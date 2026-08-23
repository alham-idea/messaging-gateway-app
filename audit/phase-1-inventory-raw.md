# Phase 1 Inventory Raw

## Backend files
server/README.md
server/_core/context.ts
server/_core/cookies.ts
server/_core/dataApi.ts
server/_core/env.ts
server/_core/imageGeneration.ts
server/_core/index.ts
server/_core/llm.ts
server/_core/middleware.ts
server/_core/notification.ts
server/_core/oauth.ts
server/_core/router-utils.ts
server/_core/sdk.ts
server/_core/systemRouter.ts
server/_core/trpc.ts
server/_core/types/cookie.d.ts
server/_core/types/manusTypes.ts
server/_core/voiceTranscription.ts
server/db.ts
server/public/admin/assets/index-BiqD5sT6.css
server/public/admin/assets/index-KfvUys2U.js
server/public/admin/index.html
server/routers.ts
server/routers/admin.ts
server/routers/auth.ts
server/routers/notifications.ts
server/routers/payments.ts
server/routers/subscriptions.ts
server/services/backupService.ts
server/services/emailService.ts
server/services/monitoringService.ts
server/services/queueService.ts
server/services/stripeService.ts
server/storage.ts
server/tests/security.test.ts

## Mobile app screens
app/(tabs)/_layout.tsx
app/(tabs)/billing.tsx
app/(tabs)/index.tsx
app/(tabs)/messages.tsx
app/(tabs)/profile.tsx
app/(tabs)/settings.tsx
app/_layout.tsx
app/add-payment-method.tsx
app/app-settings.tsx
app/apply-coupon.tsx
app/comprehensive-settings.tsx
app/connection-manager.tsx
app/dashboard.tsx
app/dev/theme-lab.tsx
app/failed-messages.tsx
app/invoice-details.tsx
app/invoices.tsx
app/login.tsx
app/logs.tsx
app/manage-subscription.tsx
app/notifications/index.tsx
app/notifications/notifications.test.ts
app/oauth/callback.tsx
app/payment-history.tsx
app/payment-methods.tsx
app/plans.tsx
app/profile.tsx
app/settings.tsx
app/setup.tsx
app/signup.tsx
app/subscription-confirmation.tsx
app/whatsapp.tsx

## Mobile services
lib/services/__tests__/integration.test.ts
lib/services/api-client.ts
lib/services/auth-client-service.ts
lib/services/auto-reconnect-service.ts
lib/services/background-service.ts
lib/services/command-handler-service.ts
lib/services/dashboard-client-service.ts
lib/services/database-service.ts
lib/services/device-status-service.ts
lib/services/log-service.ts
lib/services/message-handler-service.ts
lib/services/notification-service.ts
lib/services/retry-service.ts
lib/services/settings-service.ts
lib/services/sms-service.ts
lib/services/socket-service.ts
lib/services/subscription-client-service.ts
lib/services/whatsapp-desktop-service.ts
lib/services/whatsapp-service.ts

## Admin standalone screens
/home/ubuntu/messaging-gateway-admin/src/App.tsx
/home/ubuntu/messaging-gateway-admin/src/components/Header.tsx
/home/ubuntu/messaging-gateway-admin/src/components/NotificationCenter.tsx
/home/ubuntu/messaging-gateway-admin/src/components/Sidebar.tsx
/home/ubuntu/messaging-gateway-admin/src/hooks/useNotifications.ts
/home/ubuntu/messaging-gateway-admin/src/index.css
/home/ubuntu/messaging-gateway-admin/src/main.tsx
/home/ubuntu/messaging-gateway-admin/src/pages/Analytics.tsx
/home/ubuntu/messaging-gateway-admin/src/pages/Dashboard.tsx
/home/ubuntu/messaging-gateway-admin/src/pages/InvoiceDetails.tsx
/home/ubuntu/messaging-gateway-admin/src/pages/Invoices.tsx
/home/ubuntu/messaging-gateway-admin/src/pages/Login.tsx
/home/ubuntu/messaging-gateway-admin/src/pages/Reports.tsx
/home/ubuntu/messaging-gateway-admin/src/pages/Security.tsx
/home/ubuntu/messaging-gateway-admin/src/pages/Settings.tsx
/home/ubuntu/messaging-gateway-admin/src/pages/SubscriptionDetails.tsx
/home/ubuntu/messaging-gateway-admin/src/pages/Subscriptions.tsx
/home/ubuntu/messaging-gateway-admin/src/pages/UserDetails.tsx
/home/ubuntu/messaging-gateway-admin/src/pages/Users.tsx
/home/ubuntu/messaging-gateway-admin/src/services/adminApi.ts
/home/ubuntu/messaging-gateway-admin/src/services/api.ts
/home/ubuntu/messaging-gateway-admin/src/services/notificationService.ts
/home/ubuntu/messaging-gateway-admin/src/stores/authStore.ts
/home/ubuntu/messaging-gateway-admin/src/vite-env.d.ts

## Embedded admin screens
admin/src/App.tsx
admin/src/components/Header.tsx
admin/src/components/NotificationCenter.tsx
admin/src/components/Sidebar.tsx
admin/src/hooks/useNotifications.ts
admin/src/index.css
admin/src/main.tsx
admin/src/pages/Analytics.tsx
admin/src/pages/Dashboard.tsx
admin/src/pages/InvoiceDetails.tsx
admin/src/pages/Invoices.tsx
admin/src/pages/Login.tsx
admin/src/pages/Reports.tsx
admin/src/pages/Security.tsx
admin/src/pages/Settings.tsx
admin/src/pages/SubscriptionDetails.tsx
admin/src/pages/Subscriptions.tsx
admin/src/pages/UserDetails.tsx
admin/src/pages/Users.tsx
admin/src/services/adminApi.ts
admin/src/services/api.ts
admin/src/services/notificationService.ts
admin/src/stores/authStore.ts
admin/src/vite-env.d.ts

## Database tables
16:export const users = mysqlTable("users", {
34:export const subscriptionPlans = mysqlTable("subscriptionPlans", {
55:export const userSubscriptions = mysqlTable("userSubscriptions", {
75:export const subscriptionHistory = mysqlTable("subscriptionHistory", {
92:export const payments = mysqlTable("payments", {
112:export const invoices = mysqlTable("invoices", {
136:export const usageStatistics = mysqlTable("usageStatistics", {
153:export const coupons = mysqlTable("coupons", {
176:export const adminUsers = mysqlTable("adminUsers", {
194:export const devices = mysqlTable("devices", {
211:export const paymentMethods = mysqlTable("paymentMethods", {
232:export const refunds = mysqlTable("refunds", {
250:export const invoiceItems = mysqlTable("invoiceItems", {
266:export const userCouponUsage = mysqlTable("userCouponUsage", {
282:export const notifications = mysqlTable("notifications", {
320:export const notificationPreferences = mysqlTable("notificationPreferences", {
342:export const emailQueue = mysqlTable("emailQueue", {
367:export const notificationHistory = mysqlTable("notificationHistory", {

## Migration files
drizzle/0000_elite_eternals.sql
drizzle/0001_rapid_shen.sql
drizzle/0002_amused_young_avengers.sql
drizzle/0003_clean_sister_grimm.sql
drizzle/0004_bright_champions.sql

## Router procedures
server/routers/admin.ts:113:  updateUserStatus: protectedProcedure
server/routers/admin.ts:135:  getSubscriptions: protectedProcedure
server/routers/admin.ts:161:  getSubscriptionDetails: protectedProcedure
server/routers/admin.ts:16:  getDashboardStats: protectedProcedure
server/routers/admin.ts:182:  updateSubscriptionStatus: protectedProcedure
server/routers/admin.ts:204:  updateSubscriptionPlan: protectedProcedure
server/routers/admin.ts:221:  extendSubscription: protectedProcedure
server/routers/admin.ts:244:  resetSubscriptionQuota: protectedProcedure
server/routers/admin.ts:275:  getInvoices: protectedProcedure
server/routers/admin.ts:301:  getInvoiceDetails: protectedProcedure
server/routers/admin.ts:323:  updateInvoiceStatus: protectedProcedure
server/routers/admin.ts:343:  getUsageStatistics: protectedProcedure
server/routers/admin.ts:362:  getSystemHealth: protectedProcedure
server/routers/admin.ts:51:  getUsers: protectedProcedure
server/routers/admin.ts:91:  getUserDetails: protectedProcedure
server/routers/auth.ts:134:  me: protectedProcedure
server/routers/auth.ts:166:  updateProfile: protectedProcedure
server/routers/auth.ts:195:  logout: publicProcedure
server/routers/auth.ts:205:  getPlans: publicProcedure
server/routers/auth.ts:213:  upgradeSubscription: protectedProcedure
server/routers/auth.ts:37:  register: publicProcedure
server/routers/auth.ts:83:  login: publicProcedure
server/routers/notifications.ts:102:  sendTestNotification: protectedProcedure
server/routers/notifications.ts:145:  createNotification: protectedProcedure
server/routers/notifications.ts:174:  getEmailQueueStatus: protectedProcedure
server/routers/notifications.ts:188:  retryFailedEmail: protectedProcedure
server/routers/notifications.ts:21:  getNotifications: protectedProcedure
server/routers/notifications.ts:42:  getUnreadCount: protectedProcedure
server/routers/notifications.ts:49:  markAsRead: protectedProcedure
server/routers/notifications.ts:58:  markAllAsRead: protectedProcedure
server/routers/notifications.ts:65:  deleteNotification: protectedProcedure
server/routers/notifications.ts:74:  getPreferences: protectedProcedure
server/routers/notifications.ts:81:  updatePreferences: protectedProcedure
server/routers/payments.ts:135:  getInvoices: protectedProcedure
server/routers/payments.ts:156:  getInvoice: protectedProcedure
server/routers/payments.ts:15:  createPayment: protectedProcedure
server/routers/payments.ts:169:  markInvoiceAsPaid: protectedProcedure
server/routers/payments.ts:192:  addPaymentMethod: protectedProcedure
server/routers/payments.ts:225:  getPaymentMethods: protectedProcedure
server/routers/payments.ts:235:  deletePaymentMethod: protectedProcedure
server/routers/payments.ts:250:  requestRefund: protectedProcedure
server/routers/payments.ts:281:  getRefund: protectedProcedure
server/routers/payments.ts:294:  applyCoupon: protectedProcedure
server/routers/payments.ts:43:  getPaymentHistory: protectedProcedure
server/routers/payments.ts:63:  getPayment: protectedProcedure
server/routers/payments.ts:76:  updatePaymentStatus: protectedProcedure
server/routers/payments.ts:99:  createInvoice: protectedProcedure
server/routers/subscriptions.ts:107:  getHistory: protectedProcedure
server/routers/subscriptions.ts:10:  getPlans: publicProcedure
server/routers/subscriptions.ts:117:  cancel: protectedProcedure
server/routers/subscriptions.ts:138:  getUsageStats: protectedProcedure
server/routers/subscriptions.ts:23:  getPlan: publicProcedure
server/routers/subscriptions.ts:41:  getCurrentSubscription: protectedProcedure
server/routers/subscriptions.ts:62:  changeSubscription: protectedProcedure

## SMS references
app/(tabs)/billing.tsx
app/(tabs)/index.tsx
app/comprehensive-settings.tsx
app/dashboard.tsx
app/manage-subscription.tsx
app/plans.tsx
app/settings.tsx
components/failed-message-card.tsx
components/log-filter.tsx
components/log-item.tsx
components/plan-card.tsx
hooks/use-retry-manager.ts
hooks/use-subscriptions.ts
lib/notificationService.ts
lib/services/__tests__/integration.test.ts
lib/services/background-service.ts
lib/services/command-handler-service.ts
lib/services/dashboard-client-service.ts
lib/services/database-service.ts
lib/services/log-service.ts
lib/services/message-handler-service.ts
lib/services/retry-service.ts
lib/services/settings-service.ts
lib/services/sms-service.ts
lib/services/socket-service.ts
lib/services/subscription-client-service.ts
server/db.ts
server/public/admin/assets/index-KfvUys2U.js
server/routers.ts
server/routers/admin.ts
server/routers/notifications.ts
server/routers/subscriptions.ts

## WhatsApp references
app/(tabs)/billing.tsx
app/(tabs)/index.tsx
app/(tabs)/messages.tsx
app/_layout.tsx
app/comprehensive-settings.tsx
app/dashboard.tsx
app/manage-subscription.tsx
app/plans.tsx
app/settings.tsx
app/whatsapp.tsx
components/failed-message-card.tsx
components/log-filter.tsx
components/log-item.tsx
components/plan-card.tsx
components/whatsapp-webview.tsx
hooks/use-message-handler.ts
hooks/use-retry-manager.ts
hooks/use-subscriptions.ts
lib/services/command-handler-service.ts
lib/services/dashboard-client-service.ts
lib/services/database-service.ts
lib/services/log-service.ts
lib/services/message-handler-service.ts
lib/services/retry-service.ts
lib/services/settings-service.ts
lib/services/socket-service.ts
lib/services/subscription-client-service.ts
lib/services/whatsapp-desktop-service.ts
lib/services/whatsapp-service.ts
server/db.ts
server/routers.ts
server/routers/admin.ts
server/routers/subscriptions.ts

## Git state
 [31mM[m todo.md
[31m??[m audit/

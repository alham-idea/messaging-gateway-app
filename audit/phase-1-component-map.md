## Server DB exports
10:export async function getDb() {
26:export async function createUser(userData: {
48:export async function getUserByEmail(email: string) {
59:export async function getUserById(id: number) {
70:export async function updateUser(id: number, updates: Partial<InsertUser>) {
79:export async function verifyPassword(password: string, hash: string): Promise<boolean> {
86:export async function getAllDevices() {
97:export async function getUserDevices(userId: number) {
112:export async function getSubscriptionPlan(id: number) {
120:export async function getAllSubscriptionPlans() {
127:export async function createSubscriptionPlan(planData: {
160:export async function createUserSubscription(subscriptionData: {
192:export async function getUserSubscription(userId: number) {
206:export async function updateUserSubscription(id: number, updates: any) {
213:export async function upgradeSubscription(userId: number, newPlanId: number, changeType: "upgrade" | "downgrade") {
247:export async function createPayment(paymentData: {
271:export async function updatePaymentStatus(id: number, status: "pending" | "completed" | "failed" | "refunded", transactionId?: string) {
281:export async function getUserPayments(userId: number, limit: number = 10, offset: number = 0) {
288:export async function getPaymentById(id: number) {
300:export async function createInvoice(invoiceData: {
332:export async function getUserInvoices(userId: number) {
343:export async function recordUsageStatistics(userId: number, stats: {
362:export async function getUserUsageStatistics(userId: number, days: number = 30) {
381:export async function getCouponByCode(code: string) {
395:export async function useCoupon(couponId: number) {
418:export async function createAdminUser(adminData: {
442:export async function getAdminUserByUsername(username: string) {
450:export async function getAdminUserByEmail(email: string) {
463:export async function addPaymentMethod(methodData: {
495:export async function getPaymentMethodById(id: number) {
503:export async function getUserPaymentMethods(userId: number) {
510:export async function deletePaymentMethod(id: number) {
521:export async function createRefund(refundData: {
543:export async function getRefundById(id: number) {
555:export async function getInvoiceById(id: number) {
563:export async function updateInvoiceStatus(id: number, status: string) {
593:export async function createInvoiceForSubscription(
661:export async function createMonthlyInvoices(): Promise<number> {
690:export async function getPendingInvoices(): Promise<any[]> {
700:export async function getOverdueInvoices(): Promise<any[]> {
712:export async function createNotification(
749:export async function getNotifications(
783:export async function markNotificationAsRead(
807:export async function markAllNotificationsAsRead(userId: number): Promise<any> {
828:export async function deleteNotification(
847:export async function getUnreadNotificationCount(userId: number): Promise<number> {
864:export async function getNotificationPreferences(userId: number): Promise<any> {
881:export async function updateNotificationPreferences(
915:export async function createEmailQueueItem(data: {
948:export async function getEmailQueue(options: {
976:export async function updateEmailQueueStatus(
1004:export async function getAllUsers() {
1011:export async function getAllActiveSubscriptions() {
1018:export async function getAllPayments() {
1025:export async function getAllInvoices() {
1032:export async function getSubscriptionById(id: number) {
1040:export async function getAllUsageStatistics() {

## Root router composition
3:import { systemRouter } from "./_core/systemRouter";
5:import { authRouter } from "./routers/auth";
6:import { subscriptionsRouter } from "./routers/subscriptions";
7:import { paymentsRouter } from "./routers/payments";
8:import { notificationsRouter } from "./routers/notifications";
9:import { adminRouter } from "./routers/admin";
64:export const appRouter = router({
66:  system: systemRouter,
67:  auth: authRouter,
68:  subscriptions: subscriptionsRouter,
69:  payments: paymentsRouter,
70:  notifications: notificationsRouter,
71:  admin: adminRouter,
74:export type AppRouter = typeof appRouter;

## Mobile service exports
112:export const authService = new AuthClientService();
249:export const autoReconnectService = new AutoReconnectService();
286:export const backgroundService = new BackgroundService();
281:export const commandHandlerService = new CommandHandlerService();
41:export const dashboardService = new DashboardClientService();
251:export const databaseService = new DatabaseService();
136:export const deviceStatusService = new DeviceStatusService();
361:export const logService = new LogService();
328:export const messageHandlerService = new MessageHandlerService();
293:export const notificationService = new NotificationService();
314:export const retryService = new RetryService();
224:export const settingsService = new SettingsService();
165:export const smsService = new SmsService();
261:export const socketService = new SocketService();
433:export const subscriptionClientService = new SubscriptionClientService();
375:export const whatsAppDesktopService = new WhatsAppDesktopService();
389:export const whatsAppService = new WhatsAppService();
20:export class ApiRequestError extends Error {
33:export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
53:export async function apiPost<T>(path: string, body?: unknown): Promise<T> {

## Screens with navigation
67:      onPress={() => router.push(item.route as any)}
81:      router.replace('/(tabs)');
127:            router.replace('/(tabs)');
249:                onPress={() => router.push('/failed-messages')}
260:              onPress={() => router.push('/whatsapp')}
267:              onPress={() => router.push('/logs')}
274:              onPress={() => router.push('/settings')}
281:              onPress={() => router.push('/connection-manager')}
288:              onPress={() => router.push('/failed-messages')}
299:                onPress={() => router.push('/plans')}
306:                onPress={() => router.push('/manage-subscription')}
313:                onPress={() => router.push('/payment-methods')}
320:                onPress={() => router.push('/invoices')}
327:                onPress={() => router.push('/payment-history')}
334:                onPress={() => router.push('/apply-coupon')}
72:      onPress={() => router.push(item.route as any)}
50:              router.replace("/login");
115:              onPress={() => router.push("/manage-subscription")}
123:              onPress={() => router.push("/payment-methods")}
131:              onPress={() => router.push("/invoices")}
144:              onPress={() => router.push("/settings")}
44:      onPress={() => router.push(item.route as any)}
332:              onPress={() => router.push('/app-settings')}
83:      onPress={() => router.push({ pathname: "/invoice-details", params: { id: item.id } })}
29:        router.replace('/(tabs)');
90:              router.replace('/(tabs)');
32:              router.replace("/dashboard");
59:          onPress={() => router.push("/plans")}
155:            onPress={() => router.push("/plans")}
65:            router.replace("/(tabs)");
162:            router.replace("/(tabs)");
218:            router.replace("/(tabs)");
37:    router.push("/add-payment-method");
20:    router.push({
273:                  router.replace('/login');
332:              onPress={() => router.push('/app-settings')}
35:      router.replace('/(tabs)');
78:          onPress: () => router.replace('/login'),
297:              <TouchableOpacity onPress={() => router.push('/login' as any)}>
26:      router.replace("/manage-subscription");

## Database relations

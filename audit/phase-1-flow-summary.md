## Admin guards
server/routers/admin.ts:5:requireAdmin
server/routers/admin.ts:18:requireAdmin
server/routers/admin.ts:62:requireAdmin
server/routers/admin.ts:95:requireAdmin
server/routers/admin.ts:122:requireAdmin
server/routers/admin.ts:125:role
server/routers/admin.ts:145:requireAdmin
server/routers/admin.ts:165:requireAdmin
server/routers/admin.ts:190:requireAdmin
server/routers/admin.ts:207:requireAdmin
server/routers/admin.ts:224:requireAdmin
server/routers/admin.ts:247:requireAdmin
server/routers/admin.ts:285:requireAdmin
server/routers/admin.ts:305:requireAdmin
server/routers/admin.ts:332:requireAdmin
server/routers/admin.ts:352:requireAdmin
server/routers/admin.ts:364:requireAdmin
server/routers/notifications.ts:158:role
server/routers/notifications.ts:175:role
server/routers/notifications.ts:191:role
server/_core/context.ts:10:role
server/_core/context.ts:33:adminUser
server/_core/context.ts:34:adminUser
server/_core/context.ts:34:adminUser
server/_core/context.ts:35:adminUser
server/_core/context.ts:35:role
server/_core/context.ts:35:adminUser
server/_core/context.ts:35:role
server/_core/context.ts:38:adminUser
server/_core/context.ts:39:adminUser
server/_core/context.ts:40:adminUser
server/_core/context.ts:41:adminUser
server/_core/context.ts:43:role
server/_core/context.ts:54:adminUser
server/_core/context.ts:55:adminUser
server/_core/context.ts:59:adminUser

## SMS symbols
1:import * as SMS from 'expo-sms';
4:export interface SmsMessage {
13: * Service for handling SMS operations (Sending, Reading, Listening)
15: * This service expects a native module named 'DirectSms' or 'SmsReader' to be available
18:class SmsService {
20:  private smsListener: any = null;
23:   * Send SMS
24:   * Uses expo-sms (opens composer) or native module if available for direct send
26:  public async sendSms(phoneNumber: string, message: string): Promise<void> {
28:      throw new Error('SMS not supported on web');
31:    // Try to use direct SMS if available (requires native module)
32:    // if (NativeModules.DirectSms) { ... }
34:    // Fallback to Expo SMS (opens composer)
35:    const isAvailable = await SMS.isAvailableAsync();
37:      throw new Error('SMS service not available on this device');
40:    const { result } = await SMS.sendSMSAsync(
46:      throw new Error(`SMS send failed: ${result}`);
52:   * Requires 'react-native-get-sms-android' or similar native module
54:  public async getLastMessages(count: number = 50): Promise<SmsMessage[]> {
56:      console.warn('SMS reading only supported on Android');
63:      // import SmsAndroid from 'react-native-get-sms-android';
65:      //   SmsAndroid.list(JSON.stringify({ limit: count }), (fail) => reject(fail), (count, smsList) => resolve(JSON.parse(smsList)));
69:      const SmsModule = NativeModules.SmsAndroid || NativeModules.SmsReader;
71:      if (!SmsModule) {
72:        console.warn('Native SMS module not found. Please install react-native-get-sms-android in your dev client.');
78:        if (typeof SmsModule.list === 'function') {
79:           SmsModule.list(
82:               console.error('Failed to list SMS:', fail);
85:             (count: number, smsList: string) => {
87:                 const parsed = JSON.parse(smsList);
88:                 const messages: SmsMessage[] = parsed.map((msg: any) => ({
107:      console.error('Error reading SMS history:', error);
113:   * Start listening for incoming SMS
114:   * Requires 'react-native-android-sms-listener' or similar
116:  public startListener(onMessage: (message: SmsMessage) => void): void {
123:      // Example with react-native-android-sms-listener:
124:      // import SmsListener from 'react-native-android-sms-listener';
125:      // this.smsListener = SmsListener.addListener(onMessage);
127:      const SmsListenerModule = NativeModules.SmsListener;
128:      if (!SmsListenerModule) {
129:        console.warn('Native SMS Listener module not found.');
135:      this.smsListener = DeviceEventEmitter.addListener('SmsReceived', (event: any) => {
136:         const message: SmsMessage = {
137:           id: `sms_${Date.now()}_${Math.random()}`,
146:      console.log('Started SMS listener');
149:      console.error('Failed to start SMS listener:', error);
157:    if (this.smsListener) {
158:      this.smsListener.remove();
159:      this.smsListener = null;
165:export const smsService = new SmsService();
3:import { smsService, SmsMessage } from './sms-service';
31:      // Start SMS listener
33:        smsService.startListener(this.handleIncomingSms.bind(this));
52:      if (payload.type !== 'whatsapp' && payload.type !== 'sms') {
87:   * Handle incoming SMS from Device (Inbound)
89:  public async handleIncomingSms(sms: SmsMessage): Promise<void> {
90:    console.log('📨 Incoming SMS received:', sms);
95:        id: sms.id,
96:        type: 'sms',
97:        phoneNumber: sms.address,
98:        message: sms.body,
99:        timestamp: sms.date
108:      socketService.emit('sms_received', payload);
111:      console.error('Failed to handle incoming SMS:', error);
197:      } else if (message.type === 'sms') {
198:        await this.sendViaSMS(message);
277:   * Send via SMS
279:  private async sendViaSMS(payload: MessagePayload): Promise<void> {
280:    // Use the new SmsService
281:    await smsService.sendSms(payload.phoneNumber, payload.message);
21:  type: 'whatsapp' | 'sms';
26:          smsMessagesLimit: 500,
28:          features: JSON.stringify(["1,000 WhatsApp messages/month", "500 SMS messages/month", "Email support", "Basic analytics"]),
36:          smsMessagesLimit: 5000,
38:          features: JSON.stringify(["10,000 WhatsApp messages/month", "5,000 SMS messages/month", "Priority email support", "Advanced analytics", "API access"]),
46:          smsMessagesLimit: 50000,
48:          features: JSON.stringify(["100,000 WhatsApp messages/month", "50,000 SMS messages/month", "24/7 phone support", "Custom analytics", "Dedicated account manager", "Custom integrations"]),
133:  smsMessagesLimit: number;
146:    smsMessagesLimit: planData.smsMessagesLimit,
346:  smsMessagesSent?: number;
347:  smsMessagesFailed?: number;
357:    smsMessagesSent: stats.smsMessagesSent || 0,
358:    smsMessagesFailed: stats.smsMessagesFailed || 0,

## WhatsApp symbols
1:import { WebViewMessageEvent } from 'react-native-webview';
4:export interface WhatsAppMessage {
12:export interface WhatsAppSendRequest {
18:class WhatsAppService {
20:  private messageQueue: WhatsAppSendRequest[] = [];
22:  private incomingMessages: WhatsAppMessage[] = [];
23:  private messageListeners: ((message: WhatsAppMessage) => void)[] = [];
26:   * تعيين مرجع WebView
28:  public setWebViewRef(ref: any): void {
30:    console.log('✓ تم تعيين مرجع WebView');
34:   * معالجة الرسائل الواردة من WebView
36:  public handleWebViewMessage(event: WebViewMessageEvent): void {
39:      console.log('📨 رسالة من WebView:', data);
43:          this.handleWhatsAppReady();
58:      console.error('خطأ في معالجة رسالة WebView:', error);
64:   * حقن كود JavaScript في WebView
68:      throw new Error('مرجع WebView غير متوفر');
83:  public async sendMessage(phoneNumber: string, message: string, messageId: string): Promise<void> {
85:        console.warn('⚠️ مرجع WebView غير متوفر');
120:          // window.location.assign('https://web.whatsapp.com/send?phone=${cleanPhoneNumber}&text=${encodeURIComponent(message)}');
137:             window.location.href = 'https://web.whatsapp.com/send?phone=${cleanPhoneNumber}&text=${encodeURIComponent(message)}';
146:                    window.ReactNativeWebView.postMessage(JSON.stringify({
166:          window.location.href = 'https://web.whatsapp.com/send?phone=${cleanPhoneNumber}&text=${encodeURIComponent(message)}';
186:                window.ReactNativeWebView.postMessage(JSON.stringify({
200:          window.ReactNativeWebView.postMessage(JSON.stringify({
216:  private handleWhatsAppReady(): void {
231:        this.sendMessage(msg.phoneNumber, msg.message, msg.messageId);
249:    socketService.sendMessageResponse(response);
256:    const message: WhatsAppMessage = {
273:    // socketService.emit('whatsapp_message_received', message); // Removed direct emit
277:    // الخيار الأفضل: MessageHandlerService يجب أن يشترك في WhatsAppService
278:    // لكن حالياً، WhatsAppService يستدعي socketService مباشرة.
280:    // في message-handler-service.ts قمنا بإضافة handleIncomingWhatsApp.
281:    // سنقوم باستدعاء socketService.emit بحدث 'whatsapp_received' ونترك السيرفر يتعامل معه،
286:    socketService.emit('whatsapp_received', message);
303:    socketService.sendMessageResponse(response);
309:  public onMessageReceived(callback: (message: WhatsAppMessage) => void): () => void {
321:  public getIncomingMessages(): WhatsAppMessage[] {
335:  public isWhatsAppReady(): boolean {
389:export const whatsAppService = new WhatsAppService();
8:class WhatsAppDesktopService {
17:   * تعيين مرجع WebView
19:  public setWebViewRef(ref: any): void {
21:    console.log('✓ تم تعيين مرجع WebView');
26:      message: 'تم تعيين مرجع WebView للواتساب',
32:   * معالجة الرسائل الواردة من WebView
34:  public handleWebViewMessage(event: any): void {
37:      console.log('📨 رسالة من WebView:', data);
41:          this.handleWhatsAppReady(data);
59:      console.error('خطأ في معالجة رسالة WebView:', error);
64:   * حقن كود JavaScript في WebView
68:      console.warn('⚠️ مرجع WebView غير متوفر');
83:  public sendMessage(phoneNumber: string, message: string, messageId: string): void {
91:    const url = `https://web.whatsapp.com/send/?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
139:  private handleWhatsAppReady(data: any): void {
178:        this.sendMessage(msg.phoneNumber, msg.message, msg.messageId);
190:      type: 'whatsapp',
204:    socketService.sendMessageResponse(response);
212:      id: `whatsapp_${Date.now()}`,
222:      type: 'whatsapp',
236:    socketService.emit('whatsapp_message_received', message);
246:      type: 'whatsapp',
261:    socketService.sendMessageResponse(response);
293:  public isWhatsAppReady(): boolean {
375:export const whatsAppDesktopService = new WhatsAppDesktopService();
2:import { whatsAppService } from './whatsapp-service';
52:      if (payload.type !== 'whatsapp' && payload.type !== 'sms') {
116:   * Handle incoming WhatsApp from WebView (Inbound)
118:  public async handleIncomingWhatsApp(message: any): Promise<void> {
125:        type: 'whatsapp',
133:        // socketService.emit('whatsapp_message_received', payload); // Already emitted in WhatsAppService?
134:        // Let's check WhatsAppService. It emits 'whatsapp_message_received'.
137:        console.error('Failed to track incoming WhatsApp:', error);
195:      if (message.type === 'whatsapp') {
196:        await this.sendViaWhatsApp(message);
245:   * Send via WhatsApp
247:  private async sendViaWhatsApp(payload: MessagePayload): Promise<void> {
248:    if (!whatsAppService.isWhatsAppReady()) {
249:      throw new Error('WhatsApp is not ready');
254:        whatsAppService.sendMessage(
262:          reject(new Error('WhatsApp send timeout'));
265:        // TODO: Implement better callback mechanism from WhatsAppService
267:        // In real impl, we should wait for DOM event from WebView
295:    socketService.sendMessageResponse(response);
21:  type: 'whatsapp' | 'sms';
182:  public sendMessageResponse(response: MessageResponse): void {
3:import WebView from 'react-native-webview';
4:import { whatsAppService } from '@/lib/services/whatsapp-service';
6:interface WhatsAppWebViewProps {
11:export function WhatsAppWebView({ onReady, onError }: WhatsAppWebViewProps) {
12:  const webViewRef = useRef<WebView>(null);
19:    // تعيين مرجع WebView للخدمة
20:    whatsAppService.setWebViewRef(webViewRef.current);
23:  const handleWebViewMessage = (event: any) => {
24:    whatsAppService.handleWebViewMessage(event);
52:        if (isReady && !window.whatsappIsReadyFired) {
53:          window.whatsappIsReadyFired = true;
54:          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'WHATSAPP_READY' }));
114:      {/* WebView */}
115:      <WebView
117:        source={{ uri: 'https://web.whatsapp.com' }}
118:        onMessage={handleWebViewMessage}
4:import { WhatsAppWebView } from '@/components/whatsapp-webview';
5:import { whatsAppService } from '@/lib/services/whatsapp-service';
7:export default function WhatsAppScreen() {
23:  const handleWebViewReady = () => {
28:  const handleWebViewError = (errorMsg: string) => {
91:      {/* محتوى WebView */}
92:      <WhatsAppWebView
93:        onReady={handleWebViewReady}
94:        onError={handleWebViewError}

## Shared transport symbols
1:import { socketService, MessagePayload, MessageResponse } from './socket-service';
5:import { databaseService } from './database-service';
28:      await databaseService.init();
36:      // Resume processing pending messages
45:   * Handle incoming message from Socket (Outbound)
48:    console.log('📨 Received message:', payload);
53:        throw new Error(`Invalid message type: ${payload.type}`);
69:      // 3. Save to database (Persistent Queue)
70:      await databaseService.addMessage(payload, 'outbound');
75:      console.error('❌ Failed to queue message:', error);
80:        error: error instanceof Error ? error.message : 'Failed to save message to queue',
98:        message: sms.body,
102:      await databaseService.addMessage(payload, 'inbound');
108:      socketService.emit('sms_received', payload);
118:  public async handleIncomingWhatsApp(message: any): Promise<void> {
124:        id: message.id || `wa_${Date.now()}`,
126:        phoneNumber: message.phoneNumber,
127:        message: message.message,
128:        timestamp: message.timestamp || Date.now()
132:        await databaseService.addMessage(payload, 'inbound');
133:        // socketService.emit('whatsapp_message_received', payload); // Already emitted in WhatsAppService?
134:        // Let's check WhatsAppService. It emits 'whatsapp_message_received'.
142:   * Process message queue
150:      // Get pending messages from DB
151:      const messages = await databaseService.getPendingMessages(1); // Process one by one
153:      if (messages.length > 0) {
154:        const message = messages[0];
156:        // Ensure we only process outbound messages here (status='pending')
160:        await this.processMessage(message);
162:        // Process next message after delay
163:        if (messages.length > 0) {
179:      console.error('Error processing queue:', error);
186:   * Process single message
188:  public async processMessage(message: MessagePayload): Promise<void> {
190:      console.log(`🔄 Processing message ${message.id} (${message.type})`);
193:      await databaseService.updateMessageStatus(message.id, 'processing');
195:      if (message.type === 'whatsapp') {
196:        await this.sendViaWhatsApp(message);
197:      } else if (message.type === 'sms') {
198:        await this.sendViaSMS(message);
200:        throw new Error(`Unknown message type: ${message.type}`);
204:      await databaseService.updateMessageStatus(message.id, 'sent');
206:        id: message.id,
207:        payload: message,
213:      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
214:      console.error(`❌ Failed to process message ${message.id}:`, errorMessage);
217:      await databaseService.updateMessageStatus(message.id, 'failed', errorMessage);
219:        id: message.id,
220:        payload: message,
229:   * Handle manual retry of a failed message
231:  public async retryMessage(messageId: string): Promise<void> {
233:      // Set status back to pending in DB so it gets picked up by queue
234:      await databaseService.updateMessageStatus(messageId, 'pending');
235:      console.log(`🔄 Message ${messageId} queued for retry`);
240:      console.error(`❌ Failed to retry message ${messageId}:`, error);
256:          payload.message,
281:    await smsService.sendSms(payload.phoneNumber, payload.message);
289:      messageId: processedMessage.id,
295:    socketService.sendMessageResponse(response);
302:    return await databaseService.getStats();
306:   * Get pending message count
309:    const stats = await databaseService.getStats();
314:   * Clear message history
317:    await databaseService.clearHistory();
321:   * Get message history
328:export const messageHandlerService = new MessageHandlerService();
6:  message: string;
27:  private retryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
35:  private onRetryCallback: ((message: FailedMessage) => void) | null = null;
36:  private onMaxAttemptsReachedCallback: ((message: FailedMessage) => void) | null = null;
49:  onRetry(callback: (message: FailedMessage) => void) {
56:  onMaxAttemptsReached(callback: (message: FailedMessage) => void) {
84:    message: string,
107:          message: `فشل إرسال الرسالة ${id} بعد ${existing.attempts} محاولات: ${error || 'خطأ غير معروف'}`,
123:      message,
142:      message: `تم إضافة الرسالة ${id} إلى قائمة إعادة المحاولة: ${error || 'خطأ غير معروف'}`,
155:  private scheduleRetry(message: FailedMessage) {
157:    if (this.retryTimers.has(message.id)) {
158:      clearTimeout(this.retryTimers.get(message.id)!);
161:    const delay = message.nextRetryTime - Date.now();
164:      this.executeRetry(message);
168:        this.executeRetry(message);
171:      this.retryTimers.set(message.id, timer);
174:        `⏱️ جدولة إعادة محاولة للرسالة ${message.id} بعد ${Math.floor(delay / 1000)} ثانية (محاولة ${message.attempts + 1}/${message.maxAttempts})`
181:        message: `جدولة إعادة محاولة للرسالة ${message.id} بعد ${Math.floor(delay / 1000)} ثانية`,
190:  private executeRetry(message: FailedMessage) {
191:    message.lastAttemptTime = Date.now();
192:    message.updatedAt = Date.now();
195:    if (message.attempts < message.maxAttempts) {
196:      message.nextRetryTime = Date.now() + this.calculateDelay(message.attempts);
200:      `🔄 إعادة محاولة إرسال الرسالة ${message.id} (محاولة ${message.attempts + 1}/${message.maxAttempts})`
207:      message: `إعادة محاولة إرسال الرسالة ${message.id} (محاولة ${message.attempts + 1}/${message.maxAttempts})`,
212:    this.onRetryCallback?.(message);
215:    this.retryTimers.delete(message.id);
221:  cancelRetry(messageId: string) {
222:    if (this.retryTimers.has(messageId)) {
223:      clearTimeout(this.retryTimers.get(messageId)!);
224:      this.retryTimers.delete(messageId);
227:    console.log(`⛔ تم إلغاء إعادة محاولة الرسالة ${messageId}`);
233:  removeFailedMessage(messageId: string) {
234:    this.cancelRetry(messageId);
235:    this.failedMessages.delete(messageId);
237:    console.log(`✓ تم إزالة الرسالة ${messageId} من قائمة إعادة المحاولة`);
243:      message: `تم إزالة الرسالة ${messageId} من قائمة إعادة المحاولة (نجحت)`,
258:  getFailedMessage(messageId: string): FailedMessage | undefined {
259:    return this.failedMessages.get(messageId);
273:    const messages = Array.from(this.failedMessages.values());
274:    const totalAttempts = messages.reduce((sum, msg) => sum + msg.attempts, 0);
275:    const pendingRetries = messages.filter(msg => msg.attempts < msg.maxAttempts).length;
276:    const failedFinal = messages.filter(msg => msg.attempts >= msg.maxAttempts).length;
279:      totalFailed: messages.length,
283:      averageAttempts: messages.length > 0 ? totalAttempts / messages.length : 0,
292:    for (const timer of this.retryTimers.values()) {
297:    this.retryTimers.clear();
314:export const retryService = new RetryService();
1:import io, { Socket } from 'socket.io-client';
23:  message: string;
28:  messageId: string;
34:import { messageHandlerService } from './message-handler-service';
37:  private socket: Socket | null = null;
38:  private socketUrl: string = '';
58:        this.socketUrl = url;
61:        this.socket = io(url, {
62:          transports: ['websocket', 'polling'],
79:        this.socket.on('connect', () => {
81:          this.clientId = this.socket?.id || '';
92:        this.socket.on('connect_error', (error: any) => {
94:          this.connectionStats.lastError = error?.message || 'خطأ في الاتصال';
99:        this.socket.on('disconnect', (reason: any) => {
106:        this.socket.on('send_message', (payload: MessagePayload) => {
112:        this.socket.on('error', (error: any) => {
126:    if (this.socket) {
129:      this.socket.disconnect();
130:      this.socket = null;
160:    return this.socket?.connected ?? false;
167:    if (!this.socket?.connected) {
172:    this.socket.emit('device_status', {
183:    if (!this.socket?.connected) {
188:    this.socket.emit('message_response', response);
214:    await messageHandlerService.handleIncomingMessage(payload);
221:    return this.socket;
228:    if (!this.clientId && this.socket) {
229:      this.clientId = this.socket.id || 'unknown';
245:    if (this.socket) {
246:      this.socket.on(event, callback);
254:    if (this.socket?.connected) {
255:      this.socket.emit(event, data);
261:export const socketService = new SocketService();
2:import { MessagePayload } from './socket-service';
12:  retryCount: number;
25:   * Initialize database
46:      CREATE TABLE IF NOT EXISTS messages (
50:        message TEXT NOT NULL,
54:        retryCount INTEGER DEFAULT 0,
70:      const result = await this.db.getAllAsync("PRAGMA table_info(messages)");
74:        console.log('🔄 Adding direction column to messages table...');
75:        await this.db.execAsync("ALTER TABLE messages ADD COLUMN direction TEXT NOT NULL DEFAULT 'outbound'");
84:   * Add message to queue
93:      `INSERT OR REPLACE INTO messages (id, type, phoneNumber, message, status, direction, timestamp, createdAt, updatedAt)
99:        payload.message,
110:   * Get pending messages
116:      `SELECT * FROM messages WHERE status = 'pending' ORDER BY createdAt ASC LIMIT ?`,
124:   * Update message status
135:      `UPDATE messages 
139:           retryCount = CASE WHEN ? = 'failed' THEN retryCount + 1 ELSE retryCount END
146:   * Remove message
151:    await this.db.runAsync('DELETE FROM messages WHERE id = ?', [id]);
155:   * Clear all messages
160:    await this.db.runAsync('DELETE FROM messages');
174:      FROM messages
181:   * Get sent messages counts within a period
191:      FROM messages
206:   * Get received messages counts within a period
216:      FROM messages
231:   * Get recent messages
237:      `SELECT * FROM messages ORDER BY createdAt DESC LIMIT ?`,
251:export const databaseService = new DatabaseService();
5:import { socketService } from './socket-service';
7:import { messageHandlerService } from './message-handler-service';
86:      const messages = await smsService.getLastMessages(50);

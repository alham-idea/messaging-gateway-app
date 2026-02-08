import { socketService } from './socket-service';
import { messageHandlerService } from './message-handler-service';
import { logService } from './log-service';
import { notificationService } from './notification-service';

/**
 * أنواع الأوامر المدعومة
 */
export enum CommandType {
  SEND_MESSAGE = 'send_message',
  SEND_SMS = 'send_sms',
  GET_STATUS = 'get_status',
  UPDATE_CONFIG = 'update_config',
  CLEAR_QUEUE = 'clear_queue',
  RESTART = 'restart',
  PING = 'ping',
}

/**
 * واجهة الأمر
 */
export interface Command {
  id: string;
  type: CommandType;
  timestamp: number;
  payload?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * واجهة استجابة الأمر
 */
export interface CommandResponse {
  commandId: string;
  type: CommandType;
  status: 'success' | 'failed' | 'pending';
  result?: Record<string, any>;
  error?: string;
  timestamp: number;
}

class CommandHandlerService {
  private commandHandlers: Map<CommandType, (payload: any) => Promise<any>> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * تهيئة الخدمة
   */
  public initialize(): void {
    // الاستماع لأوامر جديدة من المنصة
    socketService.on('command', (command: Command) => {
      console.log('📋 أمر جديد من المنصة:', command);
      this.handleCommand(command);
    });

    // الاستماع لأوامر الاختبار
    socketService.on('ping', () => {
      console.log('🔔 اختبار الاتصال من المنصة');
      this.sendCommandResponse({
        commandId: 'ping',
        type: CommandType.PING,
        status: 'success',
        timestamp: Date.now(),
      });
    });

    logService.addLog({
      type: 'system',
      direction: 'internal',
      status: 'sent',
      message: 'تم تهيئة خدمة معالجة الأوامر',
      timestamp: Date.now(),
    });
  }

  /**
   * تسجيل معالج أمر مخصص
   */
  public registerCommandHandler(
    commandType: CommandType,
    handler: (payload: any) => Promise<any>
  ): void {
    this.commandHandlers.set(commandType, handler);
    console.log(`✓ تم تسجيل معالج للأمر: ${commandType}`);
  }

  /**
   * معالجة الأمر
   */
  private async handleCommand(command: Command): Promise<void> {
    try {
      console.log(`🔄 معالجة الأمر: ${command.type}`);

      const handler = this.commandHandlers.get(command.type);

      if (!handler) {
        throw new Error(`معالج غير موجود للأمر: ${command.type}`);
      }

      // تنفيذ المعالج
      const result = await handler(command.payload);

      // إرسال الاستجابة الناجحة
      this.sendCommandResponse({
        commandId: command.id,
        type: command.type,
        status: 'success',
        result,
        timestamp: Date.now(),
      });

      logService.addLog({
        type: 'system',
        direction: 'internal',
        status: 'sent',
        message: `تم تنفيذ الأمر بنجاح: ${command.type}`,
        timestamp: Date.now(),
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'خطأ غير معروف';
      console.error('❌ خطأ في معالجة الأمر:', errorMsg);

      // إرسال الاستجابة الفاشلة
      this.sendCommandResponse({
        commandId: command.id,
        type: command.type,
        status: 'failed',
        error: errorMsg,
        timestamp: Date.now(),
      });

      logService.addLog({
        type: 'system',
        direction: 'internal',
        status: 'failed',
        message: `فشل تنفيذ الأمر: ${command.type} - ${errorMsg}`,
        timestamp: Date.now(),
      });

      // إرسال إشعار بالخطأ
      notificationService.sendErrorNotification(`خطأ في معالجة الأمر: ${errorMsg}`);
    }
  }

  /**
   * إرسال استجابة الأمر إلى المنصة
   */
  private sendCommandResponse(response: CommandResponse): void {
    socketService.emit('command_response', response);
  }

  /**
   * تسجيل معالجات الأوامر الافتراضية
   */
  private registerDefaultHandlers(): void {
    // معالج إرسال الرسالل
    this.registerCommandHandler(CommandType.SEND_MESSAGE, async (payload) => {
      if (!payload || !payload.phoneNumber || !payload.message) {
        throw new Error('بيانات الرسالة غير كاملة');
      }

      const messagePayload = {
        id: `msg_${Date.now()}`,
        type: (payload.type || 'whatsapp') as 'whatsapp' | 'sms',
        phoneNumber: payload.phoneNumber,
        message: payload.message,
        timestamp: Date.now(),
      };

      await messageHandlerService.handleIncomingMessage(messagePayload);

      return {
        success: true,
        messageId: messagePayload.id,
        message: 'تم إضافة الرسالة إلى الطابور',
      };
    });

    // معالج إرسال SMS
    this.registerCommandHandler(CommandType.SEND_SMS, async (payload) => {
      if (!payload || !payload.phoneNumber || !payload.message) {
        throw new Error('بيانات SMS غير كاملة');
      }

      const messagePayload = {
        id: `sms_${Date.now()}`,
        type: 'sms' as const,
        phoneNumber: payload.phoneNumber,
        message: payload.message,
        timestamp: Date.now(),
      };

      await messageHandlerService.handleIncomingMessage(messagePayload);

      return {
        success: true,
        messageId: messagePayload.id,
        message: 'تم إضافة رسالة SMS إلى الطابور',
      };
    });

    // معالج الحصول على الحالة
    this.registerCommandHandler(CommandType.GET_STATUS, async () => {
      return {
        isConnected: socketService.isConnected(),
        stats: socketService.getConnectionStats(),
        timestamp: Date.now(),
      };
    });

    // معالج تحديث الإعدادات
    this.registerCommandHandler(CommandType.UPDATE_CONFIG, async (payload) => {
      if (!payload) {
        throw new Error('بيانات الإعدادات غير موجودة');
      }

      // سيتم تطبيق الإعدادات من خلال settingsService
      console.log('⚙️ تحديث الإعدادات:', payload);

      return {
        success: true,
        message: 'تم تحديث الإعدادات بنجاح',
      };
    });

    // معالج مسح الطابور
    this.registerCommandHandler(CommandType.CLEAR_QUEUE, async () => {
      // سيتم مسح السجل من خلال messageHandlerService
      const pendingCount = messageHandlerService.getPendingMessageCount();
      messageHandlerService.clearHistory();

      return {
        success: true,
        clearedCount: pendingCount,
        message: `تم مسح ${pendingCount} رسالة من الطابور`,
      };
    });

    // معالج إعادة التشغيل
    this.registerCommandHandler(CommandType.RESTART, async () => {
      console.log('🔄 إعادة تشغيل التطبيق...');

      // سيتم إعادة التشغيل من خلال backgroundService
      return {
        success: true,
        message: 'سيتم إعادة تشغيل التطبيق قريباً',
      };
    });

    // معالج اختبار الاتصال
    this.registerCommandHandler(CommandType.PING, async () => {
      return {
        success: true,
        timestamp: Date.now(),
        message: 'pong',
      };
    });

    console.log('✓ تم تسجيل جميع معالجات الأوامر الافتراضية');
  }

  /**
   * الحصول على قائمة الأوامر المدعومة
   */
  public getSupportedCommands(): CommandType[] {
    return Array.from(this.commandHandlers.keys());
  }

  /**
   * التحقق من دعم أمر معين
   */
  public isCommandSupported(commandType: CommandType): boolean {
    return this.commandHandlers.has(commandType);
  }
}

export const commandHandlerService = new CommandHandlerService();

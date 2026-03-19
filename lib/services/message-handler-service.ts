import { socketService, MessagePayload, MessageResponse } from './socket-service';
import { whatsAppService } from './whatsapp-service';
import { smsService, SmsMessage } from './sms-service';
import { Platform } from 'react-native';
import { databaseService } from './database-service';
import { subscriptionClientService } from './subscription-client-service';
import { settingsService } from './settings-service';

export interface ProcessedMessage {
  id: string;
  payload: MessagePayload;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  error?: string;
  timestamp: number;
}

class MessageHandlerService {
  private isProcessing = false;
  private isInitialized = false;

  /**
   * Initialize service
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await databaseService.init();
      this.isInitialized = true;
      
      // Start SMS listener
      if (Platform.OS === 'android') {
        smsService.startListener(this.handleIncomingSms.bind(this));
      }

      // Resume processing pending messages
      this.processQueue();
    } catch (error) {
      console.error('Failed to initialize MessageHandlerService:', error);
    }
  }

  /**
   * Handle incoming message from Socket (Outbound)
   */
  public async handleIncomingMessage(payload: MessagePayload): Promise<void> {
    console.log('📨 Received message:', payload);

    try {
      // 1. Strict channel check - no fallback logic here
      if (payload.type !== 'whatsapp' && payload.type !== 'sms') {
        throw new Error(`Invalid message type: ${payload.type}`);
      }

      // 2. Check Quota
      const canSend = await subscriptionClientService.canSendMessage(payload.type);
      if (!canSend) {
        this.sendResponse({
          id: payload.id,
          payload,
          status: 'failed',
          error: 'quota_exceeded',
          timestamp: Date.now()
        });
        return;
      }

      // 3. Save to database (Persistent Queue)
      await databaseService.addMessage(payload, 'outbound');
      
      // 4. Trigger processing
      this.processQueue();
    } catch (error) {
      console.error('❌ Failed to queue message:', error);
      this.sendResponse({
        id: payload.id,
        payload,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to save message to queue',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle incoming SMS from Device (Inbound)
   */
  public async handleIncomingSms(sms: SmsMessage): Promise<void> {
    console.log('📨 Incoming SMS received:', sms);
    
    try {
      // 1. Save to DB as inbound
      const payload: MessagePayload = {
        id: sms.id,
        type: 'sms',
        phoneNumber: sms.address,
        message: sms.body,
        timestamp: sms.date
      };
      
      await databaseService.addMessage(payload, 'inbound');
      
      // 2. Emit to Socket (Sync with Client)
      // Note: We might want to check quota here too if "receiving" is limited
      // For now, we assume receiving is allowed but counted
      
      socketService.emit('sms_received', payload);
      
    } catch (error) {
      console.error('Failed to handle incoming SMS:', error);
    }
  }
  
  /**
   * Handle incoming WhatsApp from WebView (Inbound)
   */
  public async handleIncomingWhatsApp(message: any): Promise<void> {
     // This is called by useMessageHandler currently, but should be centralized here
     // or at least logic shared.
     // For now, let's expose a method to be called by the UI/Service listener
     
     const payload: MessagePayload = {
        id: message.id || `wa_${Date.now()}`,
        type: 'whatsapp',
        phoneNumber: message.phoneNumber,
        message: message.message,
        timestamp: message.timestamp || Date.now()
      };

      try {
        await databaseService.addMessage(payload, 'inbound');
        // socketService.emit('whatsapp_message_received', payload); // Already emitted in WhatsAppService?
        // Let's check WhatsAppService. It emits 'whatsapp_message_received'.
        // We just need to ensure DB tracking.
      } catch (error) {
        console.error('Failed to track incoming WhatsApp:', error);
      }
  }

  /**
   * Process message queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      // Get pending messages from DB
      const messages = await databaseService.getPendingMessages(1); // Process one by one

      if (messages.length > 0) {
        const message = messages[0];
        
        // Ensure we only process outbound messages here (status='pending')
        // DB query filters by status='pending', which is default for outbound.
        // Inbound are 'received'.
        
        await this.processMessage(message);
        
        // Process next message after delay
        if (messages.length > 0) {
          const enableRandom = settingsService.getSetting('enableRandomDelay');
          const minDelay = settingsService.getSetting('minRandomDelay'); // ثواني
          const maxDelay = settingsService.getSetting('maxRandomDelay'); // ثواني
          const delayMs = enableRandom
            ? Math.floor((Math.random() * (maxDelay - minDelay) + minDelay) * 1000)
            : 0;

          setTimeout(() => {
            this.isProcessing = false;
            this.processQueue();
          }, delayMs);
          return; // Exit here, let timeout handle next loop
        }
      }
    } catch (error) {
      console.error('Error processing queue:', error);
    }

    this.isProcessing = false;
  }

  /**
   * Process single message
   */
  public async processMessage(message: MessagePayload): Promise<void> {
    try {
      console.log(`🔄 Processing message ${message.id} (${message.type})`);
      
      // Update status to processing
      await databaseService.updateMessageStatus(message.id, 'processing');

      if (message.type === 'whatsapp') {
        await this.sendViaWhatsApp(message);
      } else if (message.type === 'sms') {
        await this.sendViaSMS(message);
      } else {
        throw new Error(`Unknown message type: ${message.type}`);
      }

      // Success
      await databaseService.updateMessageStatus(message.id, 'sent');
      this.sendResponse({
        id: message.id,
        payload: message,
        status: 'sent',
        timestamp: Date.now()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to process message ${message.id}:`, errorMessage);

      // Failed
      await databaseService.updateMessageStatus(message.id, 'failed', errorMessage);
      this.sendResponse({
        id: message.id,
        payload: message,
        status: 'failed',
        error: errorMessage,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle manual retry of a failed message
   */
  public async retryMessage(messageId: string): Promise<void> {
    try {
      // Set status back to pending in DB so it gets picked up by queue
      await databaseService.updateMessageStatus(messageId, 'pending');
      console.log(`🔄 Message ${messageId} queued for retry`);
      
      // Trigger processing
      this.processQueue();
    } catch (error) {
      console.error(`❌ Failed to retry message ${messageId}:`, error);
    }
  }

  /**
   * Send via WhatsApp
   */
  private async sendViaWhatsApp(payload: MessagePayload): Promise<void> {
    if (!whatsAppService.isWhatsAppReady()) {
      throw new Error('WhatsApp is not ready');
    }

    return new Promise((resolve, reject) => {
      try {
        whatsAppService.sendMessage(
          payload.phoneNumber,
          payload.message,
          payload.id
        );

        // Wait for confirmation (with timeout)
        const timeout = setTimeout(() => {
          reject(new Error('WhatsApp send timeout'));
        }, 30000);

        // TODO: Implement better callback mechanism from WhatsAppService
        // For now, we assume success if no error thrown immediately
        // In real impl, we should wait for DOM event from WebView
        resolve();
        clearTimeout(timeout);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send via SMS
   */
  private async sendViaSMS(payload: MessagePayload): Promise<void> {
    // Use the new SmsService
    await smsService.sendSms(payload.phoneNumber, payload.message);
  }

  /**
   * Send response to backend/client
   */
  private sendResponse(processedMessage: ProcessedMessage): void {
    const response: MessageResponse = {
      messageId: processedMessage.id,
      status: processedMessage.status === 'sent' ? 'sent' : 'failed',
      error: processedMessage.error,
      timestamp: Date.now(),
    };
    
    socketService.sendMessageResponse(response);
  }

  /**
   * Get statistics
   */
  public async getStats() {
    return await databaseService.getStats();
  }

  /**
   * Get pending message count
   */
  public async getPendingMessageCount(): Promise<number> {
    const stats = await databaseService.getStats();
    return stats.pending;
  }

  /**
   * Clear message history
   */
  public async clearHistory(): Promise<void> {
    await databaseService.clearHistory();
  }

  /**
   * Get message history
   */
  public getMessageHistory() {
    return [];
  }
}

export const messageHandlerService = new MessageHandlerService();

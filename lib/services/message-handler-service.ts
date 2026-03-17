import { socketService, MessagePayload, MessageResponse } from './socket-service';
import { whatsAppService } from './whatsapp-service';
import * as SMS from 'expo-sms';
import { Platform } from 'react-native';
import { databaseService } from './database-service';

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
      // Resume processing pending messages
      this.processQueue();
    } catch (error) {
      console.error('Failed to initialize MessageHandlerService:', error);
    }
  }

  /**
   * Handle incoming message from Socket
   */
  public async handleIncomingMessage(payload: MessagePayload): Promise<void> {
    console.log('📨 Received message:', payload);

    try {
      // Save to database (Persistent Queue)
      await databaseService.addMessage(payload);
      
      // Trigger processing
      this.processQueue();
    } catch (error) {
      console.error('❌ Failed to queue message:', error);
      this.sendResponse({
        id: payload.id,
        payload,
        status: 'failed',
        error: 'Failed to save message to queue',
        timestamp: Date.now()
      });
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
        await this.processMessage(message);
        
        // Process next message after delay
        if (messages.length > 0) {
            // Random delay 5-15 seconds to avoid spam detection
            const delay = Math.random() * 10000 + 5000;
            setTimeout(() => {
                this.isProcessing = false;
                this.processQueue();
            }, delay);
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
    if (Platform.OS === 'web') {
      throw new Error('SMS not supported on web');
    }

    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('SMS service not available on this device');
    }

    const { result } = await SMS.sendSMSAsync(
      [payload.phoneNumber],
      payload.message
    );

    if (result !== 'sent' && result !== 'unknown') {
      throw new Error(`SMS send failed: ${result}`);
    }
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
}

export const messageHandlerService = new MessageHandlerService();

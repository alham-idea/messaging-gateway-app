import * as SMS from 'expo-sms';
import { Platform, NativeModules, DeviceEventEmitter } from 'react-native';

export interface SmsMessage {
  id: string;
  address: string;
  body: string;
  date: number;
  read: boolean;
}

/**
 * Service for handling SMS operations (Sending, Reading, Listening)
 * Note: Reading and Listening require native modules not present in standard Expo Go.
 * This service expects a native module named 'DirectSms' or 'SmsReader' to be available
 * in the custom dev client.
 */
class SmsService {
  private isListening = false;
  private smsListener: any = null;
  
  /**
   * Send SMS
   * Uses expo-sms (opens composer) or native module if available for direct send
   */
  public async sendSms(phoneNumber: string, message: string): Promise<void> {
    if (Platform.OS === 'web') {
      throw new Error('SMS not supported on web');
    }

    // Try to use direct SMS if available (requires native module)
    // if (NativeModules.DirectSms) { ... }
    
    // Fallback to Expo SMS (opens composer)
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('SMS service not available on this device');
    }

    const { result } = await SMS.sendSMSAsync(
      [phoneNumber],
      message
    );

    if (result !== 'sent' && result !== 'unknown') {
      throw new Error(`SMS send failed: ${result}`);
    }
  }

  /**
   * Get last N messages
   * Requires 'react-native-get-sms-android' or similar native module
   */
  public async getLastMessages(count: number = 50): Promise<SmsMessage[]> {
    if (Platform.OS !== 'android') {
      console.warn('SMS reading only supported on Android');
      return [];
    }

    try {
      // Mock implementation / Interface for Native Module
      // In a real scenario with the native library installed:
      // import SmsAndroid from 'react-native-get-sms-android';
      // return new Promise((resolve, reject) => {
      //   SmsAndroid.list(JSON.stringify({ limit: count }), (fail) => reject(fail), (count, smsList) => resolve(JSON.parse(smsList)));
      // });

      // For now, we check if a native module is exposed, otherwise warn
      const SmsModule = NativeModules.SmsAndroid || NativeModules.SmsReader;
      
      if (!SmsModule) {
        console.warn('Native SMS module not found. Please install react-native-get-sms-android in your dev client.');
        return [];
      }

      // If module exists, we assume standard interface (adjust based on actual lib)
      return new Promise((resolve, reject) => {
        if (typeof SmsModule.list === 'function') {
           SmsModule.list(
             JSON.stringify({ limit: count }),
             (fail: string) => {
               console.error('Failed to list SMS:', fail);
               resolve([]); 
             },
             (count: number, smsList: string) => {
               try {
                 const parsed = JSON.parse(smsList);
                 const messages: SmsMessage[] = parsed.map((msg: any) => ({
                   id: msg._id,
                   address: msg.address,
                   body: msg.body,
                   date: parseInt(msg.date),
                   read: msg.read === 1
                 }));
                 resolve(messages);
               } catch (e) {
                 resolve([]);
               }
             }
           );
        } else {
          resolve([]);
        }
      });

    } catch (error) {
      console.error('Error reading SMS history:', error);
      return [];
    }
  }

  /**
   * Start listening for incoming SMS
   * Requires 'react-native-android-sms-listener' or similar
   */
  public startListener(onMessage: (message: SmsMessage) => void): void {
    if (Platform.OS !== 'android' || this.isListening) return;

    // Check for permissions first (should be handled by caller or app init)
    
    try {
      // Logic depends on the library used. 
      // Example with react-native-android-sms-listener:
      // import SmsListener from 'react-native-android-sms-listener';
      // this.smsListener = SmsListener.addListener(onMessage);
      
      const SmsListenerModule = NativeModules.SmsListener;
      if (!SmsListenerModule) {
        console.warn('Native SMS Listener module not found.');
        return;
      }

      this.isListening = true;
      // Assume Event Emitter pattern if module doesn't have explicit addListener method
      this.smsListener = DeviceEventEmitter.addListener('SmsReceived', (event: any) => {
         const message: SmsMessage = {
           id: `sms_${Date.now()}_${Math.random()}`,
           address: event.originatingAddress,
           body: event.body,
           date: Date.now(),
           read: false
         };
         onMessage(message);
      });
      
      console.log('Started SMS listener');

    } catch (error) {
      console.error('Failed to start SMS listener:', error);
    }
  }

  /**
   * Stop listener
   */
  public stopListener(): void {
    if (this.smsListener) {
      this.smsListener.remove();
      this.smsListener = null;
    }
    this.isListening = false;
  }
}

export const smsService = new SmsService();

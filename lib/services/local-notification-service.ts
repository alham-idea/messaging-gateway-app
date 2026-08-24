import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { buildSmsFailureNotification, type SmsFailureNotificationInput } from './sms-notification-utils';

class LocalNotificationService {
  private configured = false;
  private permissionDenied = false;

  private async configure(): Promise<boolean> {
    if (Platform.OS === 'web' || this.permissionDenied) return false;
    if (this.configured) return true;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('sms-failures', {
        name: 'فشل رسائل SMS',
        description: 'تنبيهات فشل إرسال الرسائل عبر شريحة الجهاز',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 200, 150, 200],
        lightColor: '#EF4444',
      });
    }

    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== Notifications.PermissionStatus.GRANTED) {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }

    if (status !== Notifications.PermissionStatus.GRANTED) {
      this.permissionDenied = true;
      return false;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    this.configured = true;
    return true;
  }

  public async notifySmsFailure(input: SmsFailureNotificationInput): Promise<void> {
    try {
      if (!(await this.configure())) return;
      const notification = buildSmsFailureNotification(input);
      await Notifications.scheduleNotificationAsync({
        content: { ...notification, sound: undefined },
        trigger: null,
      });
    } catch (error) {
      // Notification failure must never break SMS state persistence or the queue.
      console.warn('تعذر عرض إشعار فشل SMS:', error);
    }
  }
}

export const localNotificationService = new LocalNotificationService();

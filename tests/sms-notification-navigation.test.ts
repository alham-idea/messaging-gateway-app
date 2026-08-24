import { describe, expect, it } from 'vitest';
import { parseSmsFailureNotificationData } from '@/lib/services/sms-notification-navigation';

describe('SMS notification navigation', () => {
  it('accepts only the validated SMS failure route', () => {
    expect(parseSmsFailureNotificationData({
      kind: 'sms-failure',
      screen: '/sms-logs',
      messageId: 'sms-123',
    })).toEqual({ kind: 'sms-failure', screen: '/sms-logs', messageId: 'sms-123' });
  });

  it('rejects unrelated or malformed notification data', () => {
    expect(parseSmsFailureNotificationData({ screen: '/settings', messageId: 'x' })).toBeNull();
    expect(parseSmsFailureNotificationData({ kind: 'sms-failure', screen: '/sms-logs', messageId: '' })).toBeNull();
    expect(parseSmsFailureNotificationData(null)).toBeNull();
  });
});

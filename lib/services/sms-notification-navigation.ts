export interface SmsFailureNotificationData {
  kind: 'sms-failure';
  screen: '/sms-logs';
  messageId: string;
}

export function parseSmsFailureNotificationData(value: unknown): SmsFailureNotificationData | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (data.kind !== 'sms-failure' || data.screen !== '/sms-logs' || typeof data.messageId !== 'string' || data.messageId.trim() === '') {
    return null;
  }
  return {
    kind: 'sms-failure',
    screen: '/sms-logs',
    messageId: data.messageId,
  };
}

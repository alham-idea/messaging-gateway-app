export interface SmsFailureNotificationInput {
  messageId: string;
  phoneNumber: string;
  error?: string;
}

export function buildSmsFailureNotification(input: SmsFailureNotificationInput) {
  const masked = input.phoneNumber.length > 6
    ? `${input.phoneNumber.slice(0, 4)}••••${input.phoneNumber.slice(-3)}`
    : 'رقم غير معروف';

  return {
    title: 'فشل إرسال SMS',
    body: `تعذر إرسال الرسالة إلى ${masked}`,
    data: { kind: 'sms-failure', screen: '/sms-logs', messageId: input.messageId },
  };
}

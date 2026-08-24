import type { DBMessage } from './database-service';

export type SmsLogFilter = 'all' | DBMessage['status'];

export const SMS_STATUS_ORDER: Array<DBMessage['status']> = [
  'pending',
  'processing',
  'sent',
  'failed',
];

export function filterSmsLogs(messages: DBMessage[], filter: SmsLogFilter): DBMessage[] {
  return messages
    .filter((message) => message.type === 'sms' && message.direction === 'outbound')
    .filter((message) => filter === 'all' || message.status === filter)
    .sort((a, b) => (b.createdAt || b.timestamp) - (a.createdAt || a.timestamp));
}

export function maskPhoneNumber(phoneNumber: string): string {
  const normalized = phoneNumber.trim();
  if (normalized.length <= 6) return normalized.replace(/.(?=.{2})/g, '•');
  return `${normalized.slice(0, 4)}••••${normalized.slice(-3)}`;
}

export function smsStatusLabel(status: DBMessage['status']): string {
  switch (status) {
    case 'sent': return 'تم الإرسال';
    case 'failed': return 'فشل';
    case 'processing': return 'جارٍ المعالجة';
    case 'pending': return 'قيد الانتظار';
    default: return 'غير معروف';
  }
}

export function smsStatusIcon(status: DBMessage['status']): string {
  switch (status) {
    case 'sent': return '✓';
    case 'failed': return '!';
    case 'processing': return '…';
    case 'pending': return '◷';
    default: return '?';
  }
}

export function smsStatusColor(status: DBMessage['status']): 'success' | 'error' | 'warning' | 'muted' {
  switch (status) {
    case 'sent': return 'success';
    case 'failed': return 'error';
    case 'processing':
    case 'pending': return 'warning';
    default: return 'muted';
  }
}

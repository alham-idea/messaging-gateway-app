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

export interface SmsLogSearch {
  recipient: string;
  fromDate: string;
  toDate: string;
}

function normalizeSearch(value: string): string {
  return value.replace(/[\s()-]/g, '').toLowerCase();
}

function phoneSearchVariants(value: string): string[] {
  const normalized = normalizeSearch(value);
  const variants = [normalized];
  if (normalized.startsWith('+966')) variants.push(`0${normalized.slice(4)}`);
  if (normalized.startsWith('00966')) variants.push(`0${normalized.slice(5)}`);
  if (normalized.startsWith('0')) variants.push(`+966${normalized.slice(1)}`);
  return variants;
}

function parseDateBoundary(value: string, endOfDay = false): number | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

export function filterSmsLogsAdvanced(messages: DBMessage[], filter: SmsLogFilter, search: SmsLogSearch): DBMessage[] {
  const recipientQuery = phoneSearchVariants(search.recipient);
  const from = parseDateBoundary(search.fromDate);
  const to = parseDateBoundary(search.toDate, true);

  return filterSmsLogs(messages, filter).filter((message) => {
    const messagePhoneVariants = phoneSearchVariants(message.phoneNumber);
    const timestamp = message.createdAt || message.timestamp;
    const matchesRecipient = !search.recipient.trim() || recipientQuery.some((query) => messagePhoneVariants.some((phone) => phone.includes(query)));
    const matchesFrom = from === null || timestamp >= from;
    const matchesTo = to === null || timestamp <= to;
    return matchesRecipient && matchesFrom && matchesTo;
  });
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

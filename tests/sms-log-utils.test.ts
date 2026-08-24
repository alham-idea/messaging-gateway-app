import { describe, expect, it } from 'vitest';
import type { DBMessage } from '@/lib/services/database-service';
import {
  filterSmsLogs,
  maskPhoneNumber,
  smsStatusIcon,
  smsStatusLabel,
} from '@/lib/services/sms-log-utils';

const message = (overrides: Partial<DBMessage>): DBMessage => ({
  id: 'id',
  type: 'sms',
  phoneNumber: '+966501234567',
  message: 'رمز التحقق 1234',
  timestamp: 100,
  createdAt: 100,
  updatedAt: 100,
  retryCount: 0,
  direction: 'outbound',
  status: 'sent',
  ...overrides,
});

describe('sms-log-utils', () => {
  it('keeps outbound SMS only and sorts newest first', () => {
    const logs = filterSmsLogs([
      message({ id: 'old', createdAt: 10 }),
      message({ id: 'new', createdAt: 20, status: 'failed' }),
      message({ id: 'wa', type: 'whatsapp', createdAt: 30 }),
      message({ id: 'inbound', direction: 'inbound', createdAt: 40 }),
    ], 'all');

    expect(logs.map((item) => item.id)).toEqual(['new', 'old']);
  });

  it('filters by delivery status', () => {
    const logs = [message({ status: 'sent' }), message({ id: 'failed', status: 'failed' })];
    expect(filterSmsLogs(logs, 'failed').map((item) => item.id)).toEqual(['failed']);
  });

  it('masks recipient numbers and exposes readable status labels', () => {
    expect(maskPhoneNumber('+966501234567')).toBe('+966••••567');
    expect(smsStatusLabel('processing')).toBe('جارٍ المعالجة');
    expect(smsStatusIcon('failed')).toBe('!');
  });
});

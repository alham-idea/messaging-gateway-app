import { describe, expect, it } from 'vitest';
import type { DBMessage } from '@/lib/services/database-service';
import { filterSmsLogsAdvanced } from '@/lib/services/sms-log-utils';
import { buildSmsFailureNotification } from '@/lib/services/sms-notification-utils';

const message = (overrides: Partial<DBMessage>): DBMessage => ({
  id: 'sms-1',
  type: 'sms',
  phoneNumber: '+966501234567',
  message: 'النص لا يظهر في الإشعار',
  timestamp: Date.UTC(2026, 7, 10, 10),
  createdAt: Date.UTC(2026, 7, 10, 10),
  updatedAt: Date.UTC(2026, 7, 10, 10),
  retryCount: 0,
  direction: 'outbound',
  status: 'failed',
  ...overrides,
});

describe('SMS search and failure notification', () => {
  it('filters by normalized recipient and inclusive date range', () => {
    const logs = [
      message({ id: 'inside', phoneNumber: '+966 50 123 4567', createdAt: Date.UTC(2026, 7, 12, 12) }),
      message({ id: 'outside', phoneNumber: '+966501234567', createdAt: Date.UTC(2026, 7, 20, 12) }),
    ];

    expect(filterSmsLogsAdvanced(logs, 'all', {
      recipient: '050-123',
      fromDate: '2026-08-10',
      toDate: '2026-08-15',
    }).map((item) => item.id)).toEqual(['inside']);
  });

  it('builds a failure notification without the full message body', () => {
    const request = buildSmsFailureNotification({
      messageId: 'sms-1',
      phoneNumber: '+966501234567',
      error: 'SIM unavailable',
    });

    expect(request.title).toBe('فشل إرسال SMS');
    expect(request.body).toContain('+966••••567');
    expect(request.body).not.toContain('النص لا يظهر');
    expect(request.data).toEqual({ kind: 'sms-failure', screen: '/sms-logs', messageId: 'sms-1' });
  });
});

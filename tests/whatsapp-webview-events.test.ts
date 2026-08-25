import { describe, expect, it } from 'vitest';

import { parseWhatsAppWebViewEvent } from '@/lib/services/whatsapp-webview-events';

describe('WhatsApp WebView event adapter', () => {
  it('parses readiness without depending on a native WebView', () => {
    expect(parseWhatsAppWebViewEvent(JSON.stringify({ type: 'WHATSAPP_READY' }), 100)).toEqual({
      kind: 'ready',
      timestamp: 100,
    });
  });

  it('parses sent and delivered events with the original messageId', () => {
    expect(
      parseWhatsAppWebViewEvent(
        JSON.stringify({ type: 'MESSAGE_SENT', messageId: ' wa-1 ', timestamp: 200 }),
        100,
      ),
    ).toEqual({ kind: 'sent', messageId: 'wa-1', timestamp: 200 });

    expect(
      parseWhatsAppWebViewEvent(
        JSON.stringify({ type: 'MESSAGE_DELIVERED', messageId: 'wa-1', timestamp: 300 }),
        100,
      ),
    ).toEqual({ kind: 'delivered', messageId: 'wa-1', timestamp: 300 });
  });

  it('parses received messages and preserves their messageId', () => {
    expect(
      parseWhatsAppWebViewEvent(
        JSON.stringify({
          type: 'MESSAGE_RECEIVED',
          messageId: 'incoming-1',
          phoneNumber: '+966500000000',
          message: 'تم الاستلام',
          timestamp: 400,
        }),
        100,
      ),
    ).toEqual({
      kind: 'received',
      messageId: 'incoming-1',
      phoneNumber: '+966500000000',
      message: 'تم الاستلام',
      timestamp: 400,
    });
  });

  it('rejects malformed, incomplete, and SMS-shaped events', () => {
    expect(parseWhatsAppWebViewEvent('not-json', 100)).toBeNull();
    expect(parseWhatsAppWebViewEvent(JSON.stringify({ type: 'MESSAGE_SENT' }), 100)).toBeNull();
    expect(
      parseWhatsAppWebViewEvent(JSON.stringify({ type: 'SMS_SENT', messageId: 'sms-1' }), 100),
    ).toBeNull();
  });
});

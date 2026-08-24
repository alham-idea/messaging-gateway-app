import { describe, expect, it } from 'vitest';

import {
  isIsolatedChannelPair,
  isSmsPayload,
  isWhatsAppPayload,
  shouldDeferWhatsApp,
} from '@/lib/services/whatsapp-channel-utils';

describe('WhatsApp channel isolation', () => {
  it('recognizes only explicit WhatsApp payloads', () => {
    expect(isWhatsAppPayload({ type: 'whatsapp' })).toBe(true);
    expect(isWhatsAppPayload({ type: 'sms' })).toBe(false);
  });

  it('keeps SMS and WhatsApp as distinct channels', () => {
    expect(isSmsPayload({ type: 'sms' })).toBe(true);
    expect(isIsolatedChannelPair({ type: 'whatsapp' }, { type: 'sms' })).toBe(true);
    expect(isIsolatedChannelPair({ type: 'whatsapp' }, { type: 'whatsapp' })).toBe(false);
  });

  it('defers WhatsApp only while the WebView is not ready', () => {
    expect(shouldDeferWhatsApp({ type: 'whatsapp' }, false)).toBe(true);
    expect(shouldDeferWhatsApp({ type: 'whatsapp' }, true)).toBe(false);
    expect(shouldDeferWhatsApp({ type: 'sms' }, false)).toBe(false);
  });
});

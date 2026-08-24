import type { MessagePayload } from './socket-service';

export function isWhatsAppPayload(payload: Pick<MessagePayload, 'type'>): boolean {
  return payload.type === 'whatsapp';
}

export function isSmsPayload(payload: Pick<MessagePayload, 'type'>): boolean {
  return payload.type === 'sms';
}

export function shouldDeferWhatsApp(
  payload: Pick<MessagePayload, 'type'>,
  isReady: boolean,
): boolean {
  return isWhatsAppPayload(payload) && !isReady;
}

export function isIsolatedChannelPair(
  first: Pick<MessagePayload, 'type'>,
  second: Pick<MessagePayload, 'type'>,
): boolean {
  return first.type !== second.type &&
    ((isWhatsAppPayload(first) && isSmsPayload(second)) ||
      (isSmsPayload(first) && isWhatsAppPayload(second)));
}

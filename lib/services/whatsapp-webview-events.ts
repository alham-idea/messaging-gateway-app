export type WhatsAppWebViewEvent =
  | { kind: 'ready'; timestamp?: number }
  | { kind: 'sent'; messageId: string; timestamp: number }
  | { kind: 'delivered'; messageId: string; timestamp: number }
  | {
      kind: 'received';
      messageId: string;
      phoneNumber: string;
      message: string;
      timestamp: number;
    }
  | { kind: 'error'; messageId?: string; error: string; timestamp: number };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function timestampOrNow(value: unknown, now: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : now;
}

export function parseWhatsAppWebViewEvent(
  raw: string,
  now = Date.now(),
): WhatsAppWebViewEvent | null {
  let data: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    data = parsed as Record<string, unknown>;
  } catch {
    return null;
  }

  const type = data.type;
  const timestamp = timestampOrNow(data.timestamp, now);

  if (type === 'WHATSAPP_READY') return { kind: 'ready', timestamp };

  if (type === 'MESSAGE_SENT' && isNonEmptyString(data.messageId)) {
    return { kind: 'sent', messageId: data.messageId.trim(), timestamp };
  }

  if (type === 'MESSAGE_DELIVERED' && isNonEmptyString(data.messageId)) {
    return { kind: 'delivered', messageId: data.messageId.trim(), timestamp };
  }

  if (
    type === 'MESSAGE_RECEIVED' &&
    isNonEmptyString(data.messageId) &&
    isNonEmptyString(data.phoneNumber) &&
    typeof data.message === 'string'
  ) {
    return {
      kind: 'received',
      messageId: data.messageId.trim(),
      phoneNumber: data.phoneNumber.trim(),
      message: data.message,
      timestamp,
    };
  }

  if (type === 'ERROR' && isNonEmptyString(data.error)) {
    return {
      kind: 'error',
      messageId: isNonEmptyString(data.messageId) ? data.messageId.trim() : undefined,
      error: data.error.trim(),
      timestamp,
    };
  }

  return null;
}

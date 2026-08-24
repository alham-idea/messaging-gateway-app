export function normalizeSmsPhoneNumber(phoneNumber: string): string | null {
  const compact = phoneNumber.trim().replace(/[\s().-]/g, "");
  if (!/^\+?[1-9]\d{7,14}$/.test(compact)) return null;
  return compact;
}

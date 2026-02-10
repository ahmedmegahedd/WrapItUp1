/** E.164: + followed by 6–15 digits */
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export function normalizePhoneToE164(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('01')) {
    return '+20' + digits.slice(1);
  }
  if (digits.length === 11 && digits.startsWith('20')) {
    return '+' + digits;
  }
  if (digits.length === 10 && !digits.startsWith('0')) {
    return '+20' + digits;
  }
  if (input.trim().startsWith('+')) {
    return input.trim();
  }
  return input.trim() ? '+' + digits : '';
}

export function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone.trim());
}

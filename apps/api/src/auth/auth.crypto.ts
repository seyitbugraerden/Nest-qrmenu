import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import * as OTPAuth from 'otpauth';

export const SESSION_SECONDS = 8 * 60 * 60;
export const IDLE_SECONDS = 30 * 60;
export const PASSWORD_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
};

export function encryptionKey() {
  const key = process.env.AUTH_ENCRYPTION_KEY;
  if (!key || !/^[a-f0-9]{64}$/i.test(key))
    throw new Error(
      'AUTH_ENCRYPTION_KEY geçerli bir 32 bayt hex anahtar olmalıdır. npm run auth:prepare çalıştırın.',
    );
  return Buffer.from(key, 'hex');
}
export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}
export function encryptSecret(secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((part) => part.toString('base64url'))
    .join('.');
}
export function decryptSecret(value: string) {
  const parts = value.split('.');
  if (parts.length !== 3) throw new Error('Geçersiz MFA kaydı.');
  const [iv, tag, encrypted] = parts.map((part) =>
    Buffer.from(part, 'base64url'),
  );
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8',
  );
}
export function totp(secret: string, email = 'admin') {
  return new OTPAuth.TOTP({
    issuer: 'Nest QR Menu',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}
export function recoveryHash(code: string) {
  return hashToken(code.replace(/-/g, '').toLowerCase());
}

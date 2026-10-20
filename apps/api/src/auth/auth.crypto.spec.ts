import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as argon2 from 'argon2';
import {
  decryptSecret,
  encryptSecret,
  hashToken,
  PASSWORD_OPTIONS,
  recoveryHash,
  totp,
} from './auth.crypto.js';

const oldKey = process.env.AUTH_ENCRYPTION_KEY;
beforeEach(() => {
  process.env.AUTH_ENCRYPTION_KEY = 'ab'.repeat(32);
});
afterEach(() => {
  if (oldKey === undefined) delete process.env.AUTH_ENCRYPTION_KEY;
  else process.env.AUTH_ENCRYPTION_KEY = oldKey;
});

describe('admin cryptography', () => {
  it('encrypts MFA with a random authenticated nonce', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const first = encryptSecret(secret);
    expect(first).not.toContain(secret);
    expect(first).not.toBe(encryptSecret(secret));
    expect(decryptSecret(first)).toBe(secret);
    const parts = first.split('.');
    const bytes = Buffer.from(parts[2], 'base64url');
    bytes[0] ^= 1;
    parts[2] = bytes.toString('base64url');
    expect(() => decryptSecret(parts.join('.'))).toThrow();
    process.env.AUTH_ENCRYPTION_KEY = 'cd'.repeat(32);
    expect(() => decryptSecret(first)).toThrow();
  });
  it('refuses an absent encryption key', () => {
    delete process.env.AUTH_ENCRYPTION_KEY;
    expect(() => encryptSecret('secret')).toThrow('AUTH_ENCRYPTION_KEY');
  });
  it('validates TOTP only inside its time window', () => {
    const verifier = totp('JBSWY3DPEHPK3PXP');
    const timestamp = 1_800_000_000_000;
    const token = verifier.generate({ timestamp });
    expect(verifier.validate({ token, timestamp, window: 1 })).toBe(0);
    expect(
      verifier.validate({ token, timestamp: timestamp + 120_000, window: 1 }),
    ).toBeNull();
  });
  it('hashes session and normalized recovery tokens', () => {
    expect(hashToken('token')).toHaveLength(64);
    expect(recoveryHash('ABCD-EF01')).toBe(recoveryHash('abcdef01'));
    expect(hashToken('token')).not.toContain('token');
  });
  it('stores an Argon2id hash and rejects an incorrect password', async () => {
    const password = 'a-long-unique-test-password-123';
    const hash = await argon2.hash(password, {
      ...PASSWORD_OPTIONS,
      type: argon2.argon2id,
    });
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(await argon2.verify(hash, password)).toBe(true);
    expect(await argon2.verify(hash, 'incorrect')).toBe(false);
  });
});

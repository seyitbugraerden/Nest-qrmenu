import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service.js';
import { admins, adminSessions, authRateLimits } from './auth.schema.js';
import {
  encryptSecret,
  hashToken,
  PASSWORD_OPTIONS,
  totp,
} from './auth.crypto.js';
import type { Database } from '../database/database.module.js';

const secret = 'JBSWY3DPEHPK3PXP';
const password = 'long-unique-password-for-test-123';
let passwordHash: string;
beforeAll(async () => {
  passwordHash = await argon2.hash(password, {
    ...PASSWORD_OPTIONS,
    type: argon2.argon2id,
  });
});

function fakeDatabase() {
  const state = {
    exists: true,
    active: true,
    rate: 1,
    acceptMfa: true,
    sessionValid: true,
    sessionWrites: 0,
    sessionVersion: 0,
    updates: 0,
  };
  const admin = () => ({
    id: 'test-admin',
    authVersion: 3,
    email: 'admin@example.test',
    passwordHash,
    totpSecret: encryptSecret(secret),
    isActive: state.active,
  });
  const db = {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (state.exists ? [admin()] : []),
          then: (resolve: (data: unknown) => void) =>
            Promise.resolve(resolve([admin()])),
        }),
      }),
    }),
    insert: (table: unknown) => ({
      values: (values: Record<string, unknown>) =>
        table === authRateLimits
          ? {
              onConflictDoUpdate: () => ({
                returning: async () => [{ count: state.rate }],
              }),
            }
          : Promise.resolve().then(() => {
              state.sessionWrites++;
              state.sessionVersion = Number(values.authVersion);
            }),
    }),
    delete: () => ({ where: async () => [] }),
    update: (table: unknown) => ({
      set: () => ({
        where: () => ({
          returning: async () => {
            state.updates++;
            if (table === admins)
              return state.acceptMfa ? [{ id: 'test-admin' }] : [];
            if (table === adminSessions)
              return state.sessionValid
                ? [
                    {
                      adminId: 'test-admin',
                      expiresAt: new Date(Date.now() + 100_000),
                    },
                  ]
                : [];
            return [];
          },
        }),
      }),
    }),
  };
  return { state, db: db as unknown as Database };
}

beforeEach(() => {
  process.env.AUTH_ENCRYPTION_KEY = 'ab'.repeat(32);
});
describe('admin authentication', () => {
  it('requires correct password AND TOTP before creating a session', async () => {
    const { db, state } = fakeDatabase();
    const auth = new AuthService(db);
    await expect(
      auth.login(
        {
          email: 'admin@example.test',
          password: 'bad',
          code: totp(secret).generate(),
        },
        'test',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(state.sessionWrites).toBe(0);
    const result = await auth.login(
      { email: 'admin@example.test', password, code: totp(secret).generate() },
      'test',
    );
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(state.sessionWrites).toBe(1);
    expect(state.sessionVersion).toBe(3);
    expect(result).not.toHaveProperty('passwordHash');
  });
  it('does not create a session when MFA replay protection rejects the atomic update', async () => {
    const { db, state } = fakeDatabase();
    state.acceptMfa = false;
    await expect(
      new AuthService(db).login(
        {
          email: 'admin@example.test',
          password,
          code: totp(secret).generate(),
        },
        'test',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(state.sessionWrites).toBe(0);
  });
  it('treats recovery codes as single use through the same atomic consumption gate', async () => {
    const { db, state } = fakeDatabase();
    const auth = new AuthService(db);
    const body = {
      email: 'admin@example.test',
      password,
      code: 'abcd1234-abcd1234-abcd1234-abcd1234',
    };
    await auth.login(body, 'test');
    state.acceptMfa = false;
    await expect(auth.login(body, 'test')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(state.sessionWrites).toBe(1);
  });
  it('rejects disabled accounts and persistent rate-limit overflow', async () => {
    const { db, state } = fakeDatabase();
    const auth = new AuthService(db);
    state.active = false;
    await expect(
      auth.login(
        {
          email: 'admin@example.test',
          password,
          code: totp(secret).generate(),
        },
        'test',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    state.rate = 100;
    await expect(auth.login({}, 'test')).rejects.toMatchObject({ status: 429 });
    expect(state.sessionWrites).toBe(0);
  });
  it('rejects malformed, expired or revoked sessions', async () => {
    const { db, state } = fakeDatabase();
    const auth = new AuthService(db);
    await expect(auth.authenticate(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(state.updates).toBe(0);
    state.sessionValid = false;
    await expect(auth.authenticate('a'.repeat(43))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(state.updates).toBe(1);
    expect(hashToken('a'.repeat(43))).toHaveLength(64);
  });
});

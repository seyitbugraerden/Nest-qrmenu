import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { DATABASE, type Database } from '../database/database.module.js';
import { admins, adminSessions, authRateLimits } from './auth.schema.js';
import {
  decryptSecret,
  encryptionKey,
  hashToken,
  IDLE_SECONDS,
  PASSWORD_OPTIONS,
  recoveryHash,
  SESSION_SECONDS,
  totp,
} from './auth.crypto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AdminAuth');
  private readonly dummyHash: Promise<string>;
  constructor(@Inject(DATABASE) private readonly db: Database) {
    encryptionKey();
    this.dummyHash = argon2.hash(randomBytes(32), {
      ...PASSWORD_OPTIONS,
      type: argon2.argon2id,
    });
  }

  private async takeLimit(key: string, max: number) {
    const now = new Date();
    const expiry = new Date(now.getTime() + 15 * 60_000);
    const [limit] = await this.db
      .insert(authRateLimits)
      .values({ key, count: 1, expiresAt: expiry })
      .onConflictDoUpdate({
        target: authRateLimits.key,
        set: {
          count: sql`case when ${authRateLimits.expiresAt} <= ${now} then 1 else ${authRateLimits.count} + 1 end`,
          expiresAt: sql`case when ${authRateLimits.expiresAt} <= ${now} then ${expiry} else ${authRateLimits.expiresAt} end`,
        },
      })
      .returning();
    if (limit.count > max) {
      this.logger.warn('admin_login_rate_limited');
      throw new HttpException(
        'Çok fazla deneme. 15 dakika sonra tekrar deneyin.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async login(input: unknown, source: string) {
    const body =
      input && typeof input === 'object'
        ? (input as Record<string, unknown>)
        : {};
    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase().slice(0, 255)
        : '';
    // req.ip gerçek bağlantı adresidir. İstemciden gelen X-Forwarded-For'a güvenmeyin.
    await this.takeLimit(`ip:${hashToken(source)}`, 30);
    await this.takeLimit(`account:${hashToken(email)}`, 8);
    await this.db
      .delete(authRateLimits)
      .where(lt(authRateLimits.expiresAt, new Date(Date.now() - 86_400_000)));
    const reject = () => {
      this.logger.warn('admin_login_failed');
      throw new UnauthorizedException(
        'Giriş bilgileri veya doğrulama kodu geçersiz.',
      );
    };
    if (
      !email ||
      typeof body.password !== 'string' ||
      body.password.length > 256 ||
      typeof body.code !== 'string' ||
      body.code.length > 80
    )
      return reject();
    const [admin] = await this.db
      .select()
      .from(admins)
      .where(eq(admins.email, email))
      .limit(1);
    const correctPassword = await argon2
      .verify(admin?.passwordHash ?? (await this.dummyHash), body.password)
      .catch(() => false);
    if (!admin || !admin.isActive || !correctPassword) return reject();
    const code = body.code.trim();
    let verified = false;
    if (/^\d{6}$/.test(code)) {
      const verifier = totp(decryptSecret(admin.totpSecret));
      const timestamp = Date.now();
      const delta = verifier.validate({ token: code, timestamp, window: 1 });
      if (delta !== null) {
        const step = Math.floor(timestamp / 30_000) + delta;
        const used = await this.db
          .update(admins)
          .set({ lastTotpStep: step })
          .where(
            and(
              eq(admins.id, admin.id),
              eq(admins.isActive, true),
              eq(admins.authVersion, admin.authVersion),
              lt(admins.lastTotpStep, step),
            ),
          )
          .returning({ id: admins.id });
        verified = used.length === 1;
      }
    } else if (/^[a-f0-9-]{32,40}$/i.test(code)) {
      const hashed = recoveryHash(code);
      const used = await this.db
        .update(admins)
        .set({
          recoveryCodeHashes: sql`array_remove(${admins.recoveryCodeHashes}, ${hashed})`,
        })
        .where(
          and(
            eq(admins.id, admin.id),
            eq(admins.isActive, true),
            eq(admins.authVersion, admin.authVersion),
            sql`${hashed} = ANY(${admins.recoveryCodeHashes})`,
          ),
        )
        .returning({ id: admins.id });
      verified = used.length === 1;
    }
    if (!verified) return reject();
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
    await this.db
      .insert(adminSessions)
      .values({
        tokenHash: hashToken(token),
        adminId: admin.id,
        authVersion: admin.authVersion,
        expiresAt,
      });
    await this.db
      .delete(adminSessions)
      .where(lt(adminSessions.expiresAt, new Date()));
    this.logger.log('admin_login_succeeded');
    return {
      token,
      expiresAt: expiresAt.toISOString(),
      admin: { id: admin.id, email: admin.email },
    };
  }

  async authenticate(token: string | undefined) {
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token))
      throw new UnauthorizedException('Oturum gerekli.');
    const now = new Date();
    // Kontrol ve idle zamanını güncelleme atomiktir; iptal edilmiş oturum tekrar canlanmaz.
    const [session] = await this.db
      .update(adminSessions)
      .set({ lastSeenAt: now })
      .where(
        and(
          eq(adminSessions.tokenHash, hashToken(token)),
          gt(adminSessions.expiresAt, now),
          gt(
            adminSessions.lastSeenAt,
            new Date(now.getTime() - IDLE_SECONDS * 1000),
          ),
          sql`exists (select 1 from ${admins} where ${admins.id} = ${adminSessions.adminId} and ${admins.isActive} = true and ${admins.authVersion} = ${adminSessions.authVersion})`,
        ),
      )
      .returning({
        adminId: adminSessions.adminId,
        expiresAt: adminSessions.expiresAt,
      });
    if (!session)
      throw new UnauthorizedException(
        'Oturum süresi dolmuş veya oturum iptal edilmiş.',
      );
    const [admin] = await this.db
      .select({ id: admins.id, email: admins.email })
      .from(admins)
      .where(eq(admins.id, session.adminId));
    if (!admin) throw new UnauthorizedException();
    return { admin, expiresAt: session.expiresAt.toISOString() };
  }

  async logout(token: string, all: boolean) {
    const session = await this.authenticate(token);
    if (all) {
      await this.db.batch([
        this.db
          .update(admins)
          .set({ authVersion: sql`${admins.authVersion} + 1` })
          .where(eq(admins.id, session.admin.id)),
        this.db
          .delete(adminSessions)
          .where(eq(adminSessions.adminId, session.admin.id)),
      ]);
    } else {
      await this.db
        .delete(adminSessions)
        .where(eq(adminSessions.tokenHash, hashToken(token)));
    }
    this.logger.log(all ? 'admin_all_sessions_revoked' : 'admin_logout');
    return { success: true };
  }
}

import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { randomBytes } from 'node:crypto';
import * as argon2 from 'argon2';
import { neon } from '@neondatabase/serverless';
import QRCode from 'qrcode';
import * as OTPAuth from 'otpauth';
import {
  encryptSecret,
  encryptionKey,
  PASSWORD_OPTIONS,
  recoveryHash,
  totp,
} from '../dist/auth/auth.crypto.js';

const mode = process.argv[2] ?? 'create';
if (!['create', 'reset', 'revoke'].includes(mode))
  throw new Error('Geçersiz yönetici komutu.');
if (!process.stdin.isTTY || !process.stdout.isTTY)
  throw new Error('Bu komut güvenli etkileşimli terminalde çalıştırılmalıdır.');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tanımlı değil.');
encryptionKey();
let muted = false;
const output = new Writable({
  write(chunk, _encoding, next) {
    if (!muted) process.stdout.write(chunk);
    next();
  },
});
const rl = createInterface({ input: process.stdin, output, terminal: true });
const ask = async (label, hidden = false) => {
  muted = hidden;
  // readline boş prompt ile satırı yenilerse dışarıdan yazılan etiket silinir.
  // Normal sorularda etiketi readline'a ver; şifre sorularında yalnızca etiketi göster.
  if (hidden) process.stdout.write(label);
  try {
    return await rl.question(hidden ? '' : label);
  } finally {
    muted = false;
    if (hidden) process.stdout.write('\n');
  }
};

try {
  const sql = neon(process.env.DATABASE_URL);
  const email = (await ask('Yönetici e-posta adresi: ')).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    throw new Error('Geçerli e-posta gerekli.');
  const existing = await sql`SELECT id FROM admins WHERE email = ${email}`;
  if (mode === 'create') {
    const all = await sql`SELECT id FROM admins LIMIT 1`;
    if (all.length)
      throw new Error('Yönetici zaten mevcut. Gerekirse admin:reset kullanın.');
  } else if (!existing.length) throw new Error('Yönetici bulunamadı.');
  if (mode === 'revoke') {
    await sql.transaction([
      sql`UPDATE admins SET auth_version = auth_version + 1 WHERE id = ${existing[0].id}`,
      sql`DELETE FROM admin_sessions WHERE admin_id = ${existing[0].id}`,
    ]);
    console.log('Yöneticinin bütün oturumları iptal edildi.');
  } else {
    if (
      mode === 'reset' &&
      (await ask(
        'Şifre/MFA yenilenecek ve bütün oturumlar kapanacak. Devam için EVET yazın: ',
      )) !== 'EVET'
    )
      throw new Error('İşlem iptal edildi.');
    const password = await ask(
      'Yeni şifre (en az 4 karakter; yazarken görünmez): ',
      true,
    );
    if (
      password.length < 4 ||
      password.length > 256 ||
      /[\x00-\x1f]/.test(password)
    )
      throw new Error('Şifre 4–256 karakter olmalı.');
    if (password !== (await ask('Şifreyi tekrar girin: ', true)))
      throw new Error('Şifreler eşleşmiyor.');
    const secret = new OTPAuth.Secret({ size: 20 }).base32;
    const authenticator = totp(secret, email);
    console.log(
      '\nDoğrulama uygulamanızla bu QR kodunu tarayın. Bu ekrandaki bilgileri paylaşmayın.',
    );
    console.log(
      await QRCode.toString(authenticator.toString(), {
        type: 'terminal',
        small: true,
      }),
    );
    console.log('Elle kurulum anahtarı:', secret);
    const code = (await ask('Uygulamadaki 6 haneli kod: ')).trim();
    if (
      !/^\d{6}$/.test(code) ||
      authenticator.validate({ token: code, window: 1 }) === null
    )
      throw new Error('Doğrulama başarısız. Hesap değiştirilmedi.');
    const passwordHash = await argon2.hash(password, {
      ...PASSWORD_OPTIONS,
      type: argon2.argon2id,
    });
    const encrypted = encryptSecret(secret);
    const codes = Array.from({ length: 10 }, () =>
      randomBytes(16).toString('hex').match(/.{8}/g).join('-'),
    );
    const hashes = codes.map(recoveryHash);
    if (mode === 'create') {
      await sql`INSERT INTO admins (email, password_hash, totp_secret, recovery_code_hashes) VALUES (${email}, ${passwordHash}, ${encrypted}, ${hashes})`;
    } else {
      await sql.transaction([
        sql`UPDATE admins SET password_hash=${passwordHash}, totp_secret=${encrypted}, recovery_code_hashes=${hashes}, last_totp_step=-1, is_active=true, auth_version=auth_version+1 WHERE id=${existing[0].id}`,
        sql`DELETE FROM admin_sessions WHERE admin_id=${existing[0].id}`,
      ]);
    }
    console.log(
      '\nHesap hazır. Aşağıdaki tek kullanımlık kurtarma kodlarını güvenli bir yerde saklayın:',
    );
    codes.forEach((code) => console.log(code));
    console.log(
      '\nŞifreler veya bu kodlar kaynak koda yazılmadı. /admin/login üzerinden giriş yapabilirsiniz.',
    );
  }
} catch (error) {
  console.error(
    error instanceof Error && !('code' in error) && !('cause' in error)
      ? error.message
      : 'İşlem başarısız. Veritabanı bağlantısını kontrol edin.',
  );
  process.exitCode = 1;
} finally {
  rl.close();
}

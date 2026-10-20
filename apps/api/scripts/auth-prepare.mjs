import { readFile, appendFile, chmod } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
const path = new URL('../.env', import.meta.url);
const text = await readFile(path, 'utf8').catch((error) => {
  if (error.code === 'ENOENT') return '';
  throw error;
});
if (!/^AUTH_ENCRYPTION_KEY\s*=/m.test(text)) {
  await appendFile(
    path,
    `\n# Admin MFA encryption key. Back up securely; never commit.\nAUTH_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}\n`,
    { mode: 0o600 },
  );
  await chmod(path, 0o600);
  console.log('MFA şifreleme anahtarı yerel .env dosyasına güvenle eklendi.');
} else {
  console.log('Mevcut MFA şifreleme anahtarı korundu.');
}

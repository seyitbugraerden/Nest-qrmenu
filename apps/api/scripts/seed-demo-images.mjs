import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const runFile = promisify(execFile);

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tanımlı değil.');
  const manifest = JSON.parse(
    await readFile(new URL('./demo-images.json', import.meta.url), 'utf8'),
  );
  const prepare = (entries) =>
    entries.map((entry) => ({
      ...entry,
      url: `https://images.unsplash.com/photo-${entry.photo}?auto=format&fit=crop&w=1000&q=80`,
    }));
  const categories = prepare(manifest.categories);
  const products = prepare(manifest.products);
  const images = [...categories, ...products];

  // Her adresin erişilebilir gerçek bir görsel olduğunu DB'ye yazmadan doğrula.
  for (let offset = 0; offset < images.length; offset += 4) {
    await Promise.all(
      images.slice(offset, offset + 4).map(async (entry) => {
        try {
          const { stdout } = await runFile('curl', [
            '--head', '--fail', '--location', '--silent', '--show-error',
            '--max-time', '20', entry.url,
          ]);
          if (!/content-type:\s*image\//i.test(stdout)) throw new Error('Not an image');
        } catch {
          throw new Error(`Görsel doğrulanamadı: ${entry.id}`);
        }
      }),
    );
  }
  console.log(`${images.length} görsel bağlantısı doğrulandı.`);

  const sql = neon(process.env.DATABASE_URL);
  const [updatedCategories, updatedProducts, verified] = await sql.transaction([
    sql`UPDATE categories c SET category_image = x.url
        FROM json_to_recordset(${JSON.stringify(categories)}::json) AS x(id text, url text)
        WHERE c.category_id = x.id AND (c.category_image IS NULL OR c.category_image = '')
        RETURNING c.category_id`,
    sql`UPDATE products p SET product_image = x.url
        FROM json_to_recordset(${JSON.stringify(products)}::json) AS x(id text, url text)
        WHERE p.product_id = x.id AND (p.product_image IS NULL OR p.product_image = '')
        RETURNING p.product_id`,
    sql`SELECT c.category_name, c.category_image IS NOT NULL AND c.category_image <> '' AS category_has_image,
           COUNT(p.id)::int AS product_count,
           COUNT(NULLIF(p.product_image, ''))::int AS products_with_images
        FROM categories c LEFT JOIN products p ON p.category_id = c.category_id
        WHERE c.category_id = ANY(${categories.map((entry) => entry.id)})
        GROUP BY c.id ORDER BY c.category_name`,
  ]);
  console.log(
    JSON.stringify(
      {
        updatedCategories: updatedCategories.length,
        updatedProducts: updatedProducts.length,
        categories: verified,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  // DB hata nesnesi bağlantı ayrıntıları içerebilir; tamamını loglamayın.
  console.error(
    error instanceof Error && error.message.startsWith('Görsel doğrulanamadı:')
      ? error.message
      : 'Görsel güncellemesi tamamlanamadı. Bağlantı ve şemayı kontrol edin.',
  );
  process.exitCode = 1;
});

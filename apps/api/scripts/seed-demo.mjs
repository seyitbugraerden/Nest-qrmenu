import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

// apps/api klasöründen çalıştırın: node scripts/seed-demo.mjs
const categories = [
  { categoryId: 'DEMO-CAT-001', slug: 'kahveler', categoryName: 'Kahveler' },
  { categoryId: 'DEMO-CAT-002', slug: 'soguk-icecekler', categoryName: 'Soğuk İçecekler' },
  { categoryId: 'DEMO-CAT-003', slug: 'tatlilar', categoryName: 'Tatlılar' },
  { categoryId: 'DEMO-CAT-004', slug: 'atistirmaliklar', categoryName: 'Atıştırmalıklar' },
];
const products = [
  ['DEMO-PRD-001', 'Espresso', 'kahveler', '100.00', '0.00'],
  ['DEMO-PRD-002', 'Flat White', 'kahveler', '145.00', '10.00'],
  ['DEMO-PRD-003', 'Filtre Kahve', 'kahveler', '120.00', '0.00'],
  ['DEMO-PRD-004', 'Iced Latte', 'soguk-icecekler', '165.00', '0.00'],
  ['DEMO-PRD-005', 'Ev Yapımı Limonata', 'soguk-icecekler', '135.00', '5.00'],
  ['DEMO-PRD-006', 'Cold Brew', 'soguk-icecekler', '155.00', '0.00'],
  ['DEMO-PRD-007', 'San Sebastian', 'tatlilar', '240.00', '10.00'],
  ['DEMO-PRD-008', 'Brownie', 'tatlilar', '185.00', '0.00'],
  ['DEMO-PRD-009', 'Havuçlu Kek', 'tatlilar', '175.00', '0.00'],
  ['DEMO-PRD-010', 'Mozzarella Sandviç', 'atistirmaliklar', '275.00', '0.00'],
  ['DEMO-PRD-011', 'Peynirli Kruvasan', 'atistirmaliklar', '195.00', '15.00'],
  ['DEMO-PRD-012', 'Avokadolu Tost', 'atistirmaliklar', '260.00', '0.00'],
  ['DEMO-PRD-013', 'Cappuccino', 'kahveler', '150.00', '0.00'],
  ['DEMO-PRD-014', 'Iced Americano', 'soguk-icecekler', '140.00', '0.00'],
  ['DEMO-PRD-015', 'Tiramisu', 'tatlilar', '220.00', '5.00'],
  ['DEMO-PRD-016', 'Hindi Fümeli Sandviç', 'atistirmaliklar', '285.00', '0.00'],
].map(([productId, productName, slug, productPrice, productDiscount]) => ({
  productId, productName, slug, productPrice, productDiscount,
}));

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL tanımlı değil.');
  const sql = neon(process.env.DATABASE_URL);
  // Tek transaction: kategori ve ürün eklemeleri birlikte tamamlanır.
  // Mevcut kayıtları güncellemez; aynı kodlarla yeniden çalıştırmak kopya üretmez.
  const [addedCategories, addedProducts, verified] = await sql.transaction([
    sql`INSERT INTO categories (category_id, slug, category_name)
        SELECT x."categoryId", x.slug, x."categoryName"
        FROM json_to_recordset(${JSON.stringify(categories)}::json)
          AS x("categoryId" text, slug text, "categoryName" text)
        ON CONFLICT DO NOTHING
        RETURNING category_id`,
    sql`INSERT INTO products (product_id, product_name, category_id, product_price, product_discount)
        SELECT x."productId", x."productName", c.category_id,
               x."productPrice"::numeric, x."productDiscount"::numeric
        FROM json_to_recordset(${JSON.stringify(products)}::json)
          AS x("productId" text, "productName" text, slug text, "productPrice" text, "productDiscount" text)
        JOIN categories c ON c.slug = x.slug
        ON CONFLICT DO NOTHING
        RETURNING product_id`,
    sql`SELECT c.category_name, c.category_id, COUNT(p.id)::int AS demo_product_count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.category_id
          AND p.product_id = ANY(${products.map((p) => p.productId)})
        WHERE c.slug = ANY(${categories.map((c) => c.slug)})
        GROUP BY c.category_name, c.category_id ORDER BY c.category_name`,
  ]);
  console.log(JSON.stringify({
    addedCategories: addedCategories.length,
    addedProducts: addedProducts.length,
    categories: verified,
  }, null, 2));
}

main().catch(() => {
  // Bağlantı adresini veya şifreleri hata çıktısına yazmayın.
  console.error('Örnek veri eklenemedi. Veritabanı bağlantısını ve tablo şemasını kontrol edin.');
  process.exitCode = 1;
});

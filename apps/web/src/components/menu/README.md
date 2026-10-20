# Menü component'leri

`MenuView` yalnızca props alır; HTTP isteği yapmaz. Servisleri sayfada veya ayrı bir veri katmanında bağlayın.

```tsx
<MenuView
  categories={categories}
  products={products}
  isLoading={isLoading}
  error={error}
  onRetry={reload}
/>
```

- `categories`: `types.db.ts` içindeki `Category[]`. Backend'in kategori alan adlarıyla aynıdır.
- `products`: `src/types/menu.ts` içindeki `MenuProduct[]`. Temel alanlar ürün şemasıyla aynıdır.
- `isLoading`: ürün kartlarının yerinde animasyonlu skeleton gösterir.
- `error`: hata metni; varsa liste yerine hata ekranı gösterir.
- `onRetry`: hata ekranındaki tekrar deneme butonunun callback'i. Opsiyoneldir; client component'ten verilmelidir.

Verileri beklerken boş diziler geçilebilir. Kategoriler ve ürünler ayrı yükleniyorsa ilgili durumları veri katmanında birleştirin.

`productPrice` ve `productDiscount`, PostgreSQL numeric yanıtlarıyla uyumlu şekilde string kabul eder. İndirim yüzde olarak yorumlanır. Fiyatlar TRY olarak biçimlendirilir.

Kategori eşleşmesi `categoryId` ile yapılır. `categoryName` ürün yanıtında zorunlu değildir; kategori listesinden bulunur. UUID'ler ekranda sıra numarası olarak kullanılmaz.

`description`, `tag` ve `illustration` yalnızca opsiyonel sunum alanlarıdır. Mevcut API bunları göndermek zorunda değildir. Görsel URL'si yoksa veya yüklenemezse yer tutucu gösterilir. Çevrimiçi görseller doğrudan URL'lerinden yüklenir (`unoptimized`).

## Yapı

- `menu-view.tsx`: sayfa görünümü ve açılış animasyonu.
- `menu-section.tsx`: arama, kategori seçimi ve menü durumları.
- `category-list.tsx` / `category-card.tsx`: kategori listesi ve seçim kartları.
- `product-list.tsx` / `product-card.tsx`: ürün listesi ve kartları.
- `product-dialog.tsx`: ürün detay penceresi.
- `product-price.tsx`: fiyat ve yüzde indirim sunumu.
- `menu-image.tsx`: görsel, illüstrasyon ve hata yer tutucusu.

## Sunucu tarafında veri bağlantısı

`src/app/page.tsx`, kategorileri ve ürünleri sunucuda paralel çeker. `src/lib/categories.ts` ve `src/lib/products.ts` yalnızca sunucuda çalışır (`server-only`); bütün istekler `cache: 'no-store'` kullanır. Sayfadaki `connection()` istek zamanında render edilmesini sağlar.

- `/`: backend `GET /categories` + `GET /products`.
- `/?category=kahveler`: backend `GET /categories` + `GET /products/kahveler`.
- Kategori seçimi URL'ye yazılır; doğrudan bağlantı, sayfa yenileme ve tarayıcı geri/ileri navigasyonu desteklenir.
- Kategori geçişi `useTransition` ile skeleton gösterir; kaydırma konumu korunur.
- Hata durumunda tekrar deneme butonu `router.refresh()` ile sunucu verisini yeniler.
- Boş yanıt, veri yok durumunu gösterir. Örnek ürünler artık sayfaya dahil edilmez.

Varsayılan API adresi `http://localhost:3001`. Farklı bir backend için `apps/web/.env.local` içinde `API_URL` tanımlayıp Next.js'i yeniden başlatın. Değişken tarayıcıya aktarılmaz. Otomatik polling yapılmaz.

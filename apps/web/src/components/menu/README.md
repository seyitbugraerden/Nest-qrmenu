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

Kategoriler sunucu tarafında API'den, ürünler ise şimdilik `src/data/demo-menu.ts` içindeki ön izleme verilerinden gelir. Kart component'leri HTTP isteği yapmaz.

## Sunucu tarafında kategori bağlantısı

`src/lib/categories.ts`, NestJS `GET /categories` endpoint’ini `cache: 'no-store'` ile çağırır. `server-only` sayesinde bu modül istemci component’lerine aktarılamaz. Sayfadaki `connection()` verinin build sırasında değil, gerçek istek geldiğinde çekilmesini sağlar. `Suspense`, beklerken loading ekranını gösterir.

Varsayılan backend adresi `http://localhost:3001`. Farklı bir adres için `apps/web/.env.local` içine `API_URL=https://backend-adresi` ekleyip Next.js’i yeniden başlatın. Bu değişken `NEXT_PUBLIC_` içermez; tarayıcıya aktarılmaz.

API hatası gerçek hata ekranını, boş kategori dizisi boş menüyü gösterir. Ürünler henüz API’ye bağlı değildir; yalnızca mevcut kategori kodlarıyla eşleşen örnek ürünler gösterilir. Her yeni sayfa isteği veya yenilemede güncel kategoriler çekilir; otomatik polling yapılmaz.

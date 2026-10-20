# Nest QR Menu Web

Next.js App Router ve React ile hazırlanmış müşteri menüsü ve admin CMS. Menü verileri NestJS API'den sunucuda `cache: "no-store"` ile alınır. Kategori ve ürün düzenlemeleri oturum kontrolü yapan Server Actions üzerinden yürütülür.

[Proje ana sayfası](../../README.md) · [Backend API](../api/README.md) · [Menü bileşenleri](src/components/menu/README.md)

![Masaüstü müşteri menüsü](../../docs/images/menu-desktop.png)

## Kurulum

Önce [backend'i](../api/README.md) başlatın. Bu dizinde:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

| Değişken | Yerel değer | Kullanım |
| --- | --- | --- |
| `API_URL` | `http://localhost:3001` | Next.js sunucusunun backend adresi |
| `APP_ORIGIN` | `http://localhost:3000` | Admin işlemlerinde beklenen tarayıcı origin'i |

Bu değerler sunucu tarafındadır; `NEXT_PUBLIC_` öneki eklemeyin. Ortam değişikliği sonrası geliştirme sunucusunu yeniden başlatın.

## Sayfalar ve davranışlar

| Yol | İçerik |
| --- | --- |
| `/` | Kategoriler, ürünler, arama ve ürün detay penceresi |
| `/?category=kahveler` | Slug'a göre filtrelenmiş menü |
| `/admin/login` | E-posta, şifre ve TOTP/kurtarma koduyla giriş |
| `/admin` | Oturum gerektiren kategori ve ürün yönetimi |

Kategori seçimi URL'ye yansır; yenileme ve geri/ileri navigasyonu desteklenir. Arama, yüklenen ürünler içinde çalışır. Geçişlerde skeleton, API hatasında tekrar deneme, veri yoksa boş durum gösterilir. Menü açılış ve kaydırma animasyonları içerir; azaltılmış hareket tercihi açılışta dikkate alınır.

Admin panelinde kategori ve ürün ekleme, düzenleme, silme ve ürünün kategorisini seçme alanları bulunur. Oturum token'ı HttpOnly cookie içinde tutulur ve API'ye yalnızca sunucudan gönderilir. [Admin kurulumu ve kurtarma](../../docs/ADMIN-SECURITY.md).

<img src="../../docs/images/admin-login.png" alt="Yönetici giriş ekranı" width="900">

## Bileşen yapısı

- `src/app/page.tsx`: sunucuda menü verilerini alır.
- `src/components/menu/`: kategori, ürün, fiyat, görsel ve detay bileşenleri.
- `src/lib/categories.ts`, `src/lib/products.ts`: yalnızca sunucuda çalışan API istemcileri.
- `src/app/admin/`: yönetim sayfaları, giriş ve CRUD Server Actions.
- `src/lib/admin-auth.ts`: oturum, cookie ve Origin kontrolleri.
- `types.d.ts`: API verileri ve sunum tipleri.

Görseller URL üzerinden yüklenir; dosya yükleme servisi yoktur. Unsplash görselleri kart, kategori ve detay boyutlarına göre optimize edilir. Yeni görsel kaynağı eklerken izin verilen host ve loader ayarlarını kontrol edin. Ayrıntılar: [menü bileşenleri](src/components/menu/README.md).

## Kontroller ve üretim

```bash
npm run test:security
npm run lint
npm run build
npm start
```

`npm start` öncesinde build gerekir. Üretimde `API_URL` backend'in erişilebilir adresi, `APP_ORIGIN` gerçek HTTPS origin olmalıdır. Üretim cookie'si `Secure` olduğu için HTTPS gerekir.

Girişte “servise ulaşılamıyor” mesajı alırsanız backend'in çalıştığını ve `API_URL` değerini kontrol edin. “Giriş bilgileri veya doğrulama kodu geçersiz” mesajında hesap bilgilerini ve doğrulama uygulamasındaki güncel kodu kontrol edin; aynı kod tekrar kullanılamaz.

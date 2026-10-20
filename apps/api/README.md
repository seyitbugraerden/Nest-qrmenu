# Nest QR Menu API

NestJS tabanlı REST API. Menü verileri Drizzle ORM ile Neon PostgreSQL'de tutulur. Müşteri menüsünün okuma uçları herkese açıktır; kategori ve ürün değişiklikleri yönetici oturumu gerektirir.

[Proje ana sayfası](../../README.md) · [Frontend](../web/README.md) · [Yönetici erişimi](../../docs/ADMIN-SECURITY.md)

## Kurulum

Bu dizinde çalıştırın:

```bash
npm ci
cp .env.example .env
```

`.env` içindeki `DATABASE_URL` değerini Neon bağlantı adresinizle doldurun. `PORT` varsayılan olarak `3001` kullanılır.

```bash
npm run auth:prepare
npm run db:migrate
npm run admin:create
npm run start:dev
```

`admin:create` yalnızca ilk yönetici hesabını oluşturur ve TOTP kurulumu ister. Mevcut hesap için `npm run admin:reset`, bütün oturumları iptal etmek için `npm run admin:revoke` kullanın. Bu komutlar e-posta ve gereken bilgileri terminalde sorar; şifre komut satırı argümanı değildir.

## Veri modeli

- `categories`: UUID `id`, benzersiz `slug` ve `categoryId`, `categoryName`, isteğe bağlı görsel URL'si `categoryImage`.
- `products`: UUID `id`, benzersiz `productId`, `productName`, `categoryId`, görsel URL'si, fiyat ve indirim yüzdesi.
- `products.categoryId`, `categories.categoryId` alanına foreign key ile bağlıdır. Ürün içeren kategori silinemez; önce ürünleri taşıyın veya silin.
- `admins`, `admin_sessions`, `auth_rate_limits`: yönetici hesabı, oturum ve giriş sınırları.

Şema: [`src/database/schema.ts`](src/database/schema.ts). Auth tabloları: [`src/auth/auth.schema.ts`](src/auth/auth.schema.ts). PostgreSQL `numeric` fiyat ve indirim alanları API'de string olarak dönebilir. Görsel alanları dosya yüklemez; URL saklar. Mevcut şemada dolu görsel URL'leri de benzersizdir.

Şemayı değiştirdikten sonra migration üretip inceleyin ve uygulayın:

```bash
npm run db:generate
npm run db:migrate
```

## REST endpoint'leri

Yerel temel adres: `http://localhost:3001`. `:slug`, kategori slug'ıdır; `:id`, ürünün UUID `id` alanıdır.

| Metot | Yol | Erişim | İşlem |
| --- | --- | --- | --- |
| GET | `/categories` | Açık | Tüm kategoriler |
| GET | `/categories/:slug` | Açık | Tek kategori objesi |
| POST | `/categories` | Oturum | Kategori oluştur |
| PATCH | `/categories/:slug` | Oturum | Kategoriyi güncelle |
| DELETE | `/categories/:slug` | Oturum | Kategoriyi sil |
| GET | `/products` | Açık | Tüm ürünler |
| GET | `/products/:slug` | Açık | Kategori slug'ına ait ürünler |
| GET | `/products/detail/:id` | Açık | Tek ürün |
| POST | `/products` | Oturum | Ürün oluştur |
| PATCH | `/products/detail/:id` | Oturum | Ürünü güncelle |
| DELETE | `/products/detail/:id` | Oturum | Ürünü sil |
| POST | `/auth/login` | Açık, deneme sınırı var | E-posta, şifre ve TOTP/kurtarma koduyla giriş |
| GET | `/auth/session` | Oturum | Oturumu doğrula |
| POST | `/auth/logout` | Oturum | Mevcut oturumu kapat |
| POST | `/auth/logout-all` | Oturum | Bütün cihazlardan çık |

Korumalı uçlar `Authorization: Bearer <oturum-tokenı>` ister. Next.js CMS bu başlığı sunucu tarafında gönderir. Backend cookie ile kimlik doğrulamaz. JWT kullanılmaz; rastgele oturum token'ının hash'i veritabanında saklanır.

```bash
curl http://localhost:3001/categories
curl http://localhost:3001/products/kahveler
```

İkinci örnek, `kahveler` slug'ına sahip kategori varsa ürünlerini döndürür; eşleşme yoksa boş liste döner.

## Çalıştırma ve kontroller

```bash
npm run start:dev   # Geliştirme, dosya izleme
npm test           # Birim testleri
npm run test:e2e    # Mock servislerle HTTP/guard testleri
npm run lint
npm run build
npm run start:prod  # Önce build gerekir
```

Üretimde `DATABASE_URL` ve `AUTH_ENCRYPTION_KEY` ortamdan sağlanmalıdır. Anahtarı değiştirmek mevcut MFA kayıtlarının çözülmesini engeller. [Güvenlik ve kurtarma yönergeleri](../../docs/ADMIN-SECURITY.md).

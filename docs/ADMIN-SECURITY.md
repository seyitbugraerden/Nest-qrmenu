# Yönetici erişimi

Müşteri menüsünün GET endpoint'leri açıktır. Diğer NestJS endpoint'leri varsayılan olarak oturum ister; açık endpoint'ler `@Public()` ile işaretlenir. Admin sayfası ve bütün CMS Server Action'ları oturumu backend'den doğrular. Açık kayıt veya şifre sıfırlama endpoint'i yoktur.

## İlk kurulum

Bu çalışma sırasında güvenlik tabloları Neon'a eklendi ve yerel `apps/api/.env` dosyasına rastgele MFA şifreleme anahtarı yazıldı. Ürün ve kategoriler değiştirilmedi. Henüz yönetici hesabı oluşturulmadı.

İlk hesabı **kendi etkileşimli terminalinizde**, `apps/api` klasöründe oluşturun:

```sh
npm run admin:create
```

Komut e-posta, en az 4 karakterlik şifre ve şifre onayı ister. Şifre yazılırken görünmez. Benzersiz, şifre yöneticisiyle üretilmiş rastgele şifre kullanın. Ardından QR kodunu bir TOTP doğrulama uygulamasına ekleyin ve 6 haneli kodu doğrulayın. Hesap yalnızca bu doğrulama başarılı olursa kaydedilir. QR ve elle kurulum anahtarı yalnızca terminalde gösterilir; paylaşmayın. Gösterilen 10 tek kullanımlık kurtarma kodunu şifre yöneticisinde saklayın. Kurtarma kodları sonradan görüntülenemez.

Sonra her iki geliştirme sunucusunu yeniden başlatın:

```sh
# apps/api
npm run start:dev
# apps/web (ayrı terminal)
npm run dev
```

Giriş: `http://localhost:3000/admin/login`. Şifre ve TOTP kodu (veya kurtarma kodu) birlikte gereklidir. Aynı TOTP zaman adımı ikinci kez kullanılamaz; hemen tekrar giriş yapacaksanız uygulamada sonraki kodu bekleyin.

## Yeni ortam / dağıtım

```sh
# apps/api
npm install
npm run auth:prepare
npm run db:migrate
npm run admin:create
npm run build
npm run start:prod
```

Mevcut admin veritabanını başka ortama taşıyorsanız **aynı `AUTH_ENCRYPTION_KEY`** güvenli secret yönetiminden sağlanmalıdır. Yeni anahtar üretmek mevcut MFA secret'larını çözülemez hâle getirir; bu durumda yetkili terminalden `admin:reset` gerekir. `.env` dosyasını veya anahtarı Git'e eklemeyin, kaybetmeyin. Anahtar 64 hex karakterdir; şifrenin kendisi değildir.

Next.js için `API_URL` backend'in server-side adresidir. `APP_ORIGIN` kullanıcının gördüğü tam origin olmalıdır (örnek `https://menu.example.com`, path veya son slash olmadan). Üretimde HTTPS kullanın; üretim oturum cookie'si `Secure` olduğundan HTTP dağıtımlar için uygun değildir. Uygulamayı reverse proxy arkasında çalıştırırken Host/Origin yönlendirmesini doğru yapılandırın; geniş jokerli `allowedOrigins` eklemeyin. API tarafı istemcinin `X-Forwarded-For` değerine güvenmez. CMS girişleri Next.js üzerinden geldiğinde IP sınırı Next.js bağlantı adresi üzerinden uygulanır; hesap sınırı da ayrıca uygulanır.

## Oturum ve erişim

- Şifre hash'i: Argon2id, 64 MiB bellek, 3 iterasyon, parallelism 1.
- MFA secret'ı: AES-256-GCM ile şifreli; anahtar veritabanında bulunmaz.
- Kurtarma kodları: 128 bit rastgele, SHA-256 hash; atomik olarak tek kullanımlık tüketilir.
- Oturum token'ı: 256 bit rastgele; DB'de yalnızca SHA-256 hash saklanır.
- Cookie: HttpOnly, SameSite=Strict, üretimde Secure ve `__Host-` öneki; localStorage kullanılmaz.
- Oturum: mutlak 8 saat, 30 dakika hareketsizlikte sona erer. Hesap devre dışıysa erişim reddedilir.
- Bütün yönetim API istekleri Bearer oturum token'ını ister; API cookie kabul etmez. CMS token'ı yalnızca sunucudan gönderir.
- CSRF: Next.js Server Actions'ın Origin kontrolüne ilave olarak uygulama Origin/Host kontrolü yapar. Kayıt değiştiren GET yoktur.
- Giriş sınırları: PostgreSQL'de kalıcı, atomik sayaçlar; 15 dakikada hesap başına 8, bağlantı IP'si başına 30 deneme. Sunucu restart ile sıfırlanmaz. Gizli bilgiler loglanmaz.
- Çıkış yap / tüm cihazlardan çıkış, ilgili DB oturumlarını siler. API kesintisinde sunucu iptali doğrulanmadan başarılı çıkış iddiasında bulunulmaz.

## Kurtarma ve oturum iptali

Yalnızca sunucu terminaline ve veritabanı yetkisine sahip kişi çalıştırabilir:

```sh
# apps/api
npm run admin:revoke  # e-posta sorar, bütün oturumları kapatır
npm run admin:reset   # yeni şifre ve yeni MFA kurulumu, yeni kurtarma kodları, tüm oturumlar iptal
```

Mevcut şifre veya kurtarma kodları ekranda tekrar gösterilmez. Herhangi bir varsayılan yönetici/şifre yoktur. CLI komutları süreç argümanından şifre almaz. Terminal geçmişine şifre yazmayın.

## Kontroller

```sh
# apps/api
npm test
npm run test:e2e
# apps/web
npm run test:security
npm run build
```

Testler gerçek kullanıcı şifresi kullanmaz, iş verilerini silmez. Yetkisiz bütün kategori/ürün mutasyonları, cookie/Bearer ayrımı, MFA/recovery tüketimi, geçersiz/iptal oturumlar, Origin kontrolü ve her Server Action giriş noktası kontrol edilir. Otomatik testler tek başına bağımsız güvenlik denetimi yerine geçmez.

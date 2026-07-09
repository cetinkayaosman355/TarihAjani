# Tarih Ajanı — Üyelik/Kota Sistemi Kurulum Rehberi

Bu rehber, üyelik/seviye/kredi sistemini tarayıcıdan (localStorage) Supabase'e
taşımanın **sizin yapacağınız** iki adımını anlatır. Kod tarafı hazırdır:

- `supabase/migrations/20260709_uyelik_sistemi.sql` → veritabanı şeması
- `supabase/functions/credits/index.ts` → kredi/seviye sunucu fonksiyonu

Sayfa bağlantıları (Studio, Üyelik, Admin) yeni tasarım export'u yüklendikten
sonra Claude tarafından yapılacaktır.

---

## ADIM A — SQL şemasını çalıştırın (~2 dk)

1. https://supabase.com/dashboard → **Tarih Ajanı projenize** girin.
2. Sol menü → **SQL Editor** → **New query**.
3. Bu repodaki `supabase/migrations/20260709_uyelik_sistemi.sql` dosyasının
   TÜM içeriğini kopyalayıp yapıştırın → **Run**.
4. "Success" görmelisiniz. (Tekrar çalıştırmak güvenlidir.)

Bu adım şunları kurar:
- `profiles` tablosuna: `tier`, `monthly_quota`, `credits`, `credits_reset_at`,
  `billing`, `expires_at` kolonları
- `tier_defs` tablosu (gozlemci 599₺/1000 · ajan 1299₺/5000 · basmufettis 1999₺/15000)
- `credit_log` tablosu (her kredi hareketi kayıt altında)
- Atomik harcama / kota yenileme / kredi tanımlama fonksiyonları (hile önleme
  sunucuda; istemciler bu fonksiyonları doğrudan çağıramaz)

## ADIM B — "credits" fonksiyonunu yayınlayın (~3 dk)

1. Dashboard → sol menü → **Edge Functions** → **Deploy a new function**
   (tarayıcı içi editör: "via Editor" / "New function").
2. Fonksiyon adı: **credits** (birebir bu ad — sayfalar bu adla çağıracak).
3. Editöre bu repodaki `supabase/functions/credits/index.ts` içeriğini
   yapıştırın → **Deploy**.
4. **Secret ekleyin:** Edge Functions → **Manage secrets** (veya Settings →
   Edge Functions → Secrets):
   - Ad: `ADMIN_PASSWORD`
   - Değer: admin panelinde (tarihajani.com/admin) kullandığınız şifrenin AYNISI
5. Kaydedin. (`SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` otomatik gelir,
   eklemeniz gerekmez. SERVICE_ROLE anahtarını asla bir sayfaya koymayın.)

## ADIM C — Bana haber verin

"SQL ve fonksiyon tamam" demeniz yeterli. Sonrasında sırayla:

1. Yeni export yüklendiyse taşıma + kontrol (her zamanki akış)
2. `Uyelik.dc.html` → gerçek kayıt/giriş/çıkış (Supabase Auth)
3. `Studio.dc.html` → üretim öncesi sunucudan kredi düşme (100/5),
   sayaç sunucudan; localStorage yalnız önbellek
4. `Admin.dc.html` → SEVİYE/KOTA sütunları ve Paketler bölümü gerçek veriye
5. Ödeme onayı → otomatik seviye/kredi tanımlama + hoş geldin maili

## Test listesi (bağlantılar bittikten sonra birlikte koşacağız)

1. Yeni kayıt → `profiles` satırı oluşuyor mu, `tier=gozlemci` mi?
2. Üretim → kredi sunucuda 100 düşüyor mu, yetersizken modal açılıyor mu?
3. Admin'de seviye değiştir → üyelik sayfası yeni seviyeyi gösteriyor mu?
4. localStorage'ı elle silince kredi kaybolmuyor mu (sunucudan geri geliyor mu)?

## Dokunulmayanlar (görev listenizdeki 6. madde — güvence)

- `google9122dee364ae85d0.html`, `robots.txt`, `sitemap.xml`, `_redirects`,
  Netlify ayarları: değişmedi, değişmeyecek (check-export.sh de koruyor)
- `studio-generate` fonksiyonu ve model fallback listesi: dokunulmadı
- Sayfa tasarımları: yalnızca belirtilen fonksiyon çağrıları değişecek

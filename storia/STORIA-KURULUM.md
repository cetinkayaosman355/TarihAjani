# STORIA — Kurulum Rehberi

STORIA, Tarih Ajanı'ndan **tamamen bağımsız** bir yapay zekâ içerik stüdyosudur.
Kendi Supabase projesi, kendi kredi/üyelik sistemi ve kendi `storia-generate`
fonksiyonu ile çalışır. Bu rehber, canlıya almanın adımlarını anlatır.

> **Demo modu:** `storia/assets/config.js` boş olduğu sürece uygulama DEMO
> modunda çalışır — arayüzün tamamı denenebilir, üretimler örnek verilerle
> gösterilir, gerçek AI çağrısı yapılmaz ve kredi düşmez. Aşağıdaki adımları
> tamamlayınca gerçek üretim devreye girer.

---

## ADIM 1 — Yeni bir Supabase projesi aç (~2 dk)

1. https://supabase.com/dashboard → **New project**.
2. İsim: `storia` (Tarih Ajanı projesiyle **KARIŞTIRMA** — ayrı proje olsun).
3. Bir veritabanı şifresi belirle ve bölgeyi seç → **Create**.

## ADIM 2 — Veritabanı şemasını kur (~2 dk)

1. Sol menü → **SQL Editor** → **New query**.
2. Repodaki `supabase/migrations/20260717_storia_setup.sql` dosyasının
   **tamamını** kopyalayıp yapıştır → **Run**.
3. "Success" görmelisin. (Tekrar çalıştırmak güvenlidir.)

Bu adım şunları kurar: `profiles` (tier/kredi kolonlarıyla), `tier_defs`
(kesif/yaratici/profesyonel/studio), `credit_log`, `studio_state`,
`uretim_log`, `storia-media` Storage bucket'ı, atomik `spend_credits` /
`refresh_profile_credits` / `grant_credits` fonksiyonları ve yeni üyeye
**150 hoş geldin kredisi** veren tetikleyici.

## ADIM 3 — `storia-generate` fonksiyonunu yayınla (~3 dk)

1. Dashboard → **Edge Functions** → **Deploy a new function** (via Editor).
2. Fonksiyon adı: **storia-generate** (birebir bu ad — arayüz bu adla çağırır).
3. Repodaki `supabase/functions/storia-generate/index.ts` içeriğini yapıştır → **Deploy**.
4. **Secret ekle** (Edge Functions → Manage secrets):
   - `OPENAI_API_KEY` — metin + görsel + seslendirme için (gerekli)
   - `ANTHROPIC_API_KEY` — araştırma (web arama) + metin için (önerilir)
   - `ELEVENLABS_API_KEY` — (opsiyonel) premium sesler için
   - `STORIA_VOICE_IDS` — (opsiyonel) izinli ElevenLabs ses kimlikleri, virgülle
   - `STORIA_ORIGINS` — (opsiyonel) prod alan adların, virgülle (örn:
     `https://storia.app,https://www.storia.app`). Boşsa gelen origin'e izin verir.

   > `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` otomatik gelir; **ekleme**.
   > SERVICE_ROLE anahtarını **asla** bir sayfaya koyma.

## ADIM 4 — Uygulamayı projene bağla (~1 dk)

`storia/assets/config.js` dosyasını aç ve iki değeri doldur:

```js
window.STORIA_CONFIG = {
  supabaseUrl: "https://XXXX.supabase.co",   // Project Settings → API → Project URL
  supabaseAnonKey: "eyJhbGciOi...",          // aynı sayfada "anon public" anahtarı
  functionName: "storia-generate",
  brand: "Storia"
};
```

Kaydettiğin an DEMO modu kapanır, gerçek üretim başlar.

## ADIM 5 — Yayınla

- Site statik dosyalardan oluşur; `/storia/` klasörü olduğu gibi yayınlanır.
- Aynı Netlify sitesinde: `tarihajani.com/storia/` adresinden erişilir.
- Ayrı alan adı/subdomain istersen (önerilir), Netlify'da yeni bir site aç,
  **publish directory** olarak `storia` klasörünü göster ya da bir subdomain'i
  `/storia/`'ya yönlendir. Alan adını `STORIA_ORIGINS` secret'ına da ekle.

---

## Test listesi

1. `config.js` doldur → sayfada "DEMO MODU" rozeti kaybolmalı.
2. Studio → **Giriş** → e-posta/parola ile kayıt ol → `profiles` satırı oluşur,
   kredi **150** görünür (hoş geldin).
3. Bir fikir yaz → **Dosyayı üret** → gerçek senaryo gelir, kredi düşer.
4. Görsel promptları sekmesi → **Görsel üret** → gerçek görsel (12 kredi).
5. Seslendirme sekmesi → **Seslendir** → indirilebilir mp3.

## Notlar

- Kredi bedelleri **sunucuda** hesaplanır; istemci değiştiremez (hile önleme).
- Kredi yalnızca üretim **başarılı** olduğunda düşer.
- `storia-generate` promptları konu-bağımsızdır (tarih temalı değildir).
- Fiyat/kota değiştirmek için `tier_defs` tablosunu güncelle; landing sayfasındaki
  fiyatları da `storia/index.html` içinden elle eşitle.

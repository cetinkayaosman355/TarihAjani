# Tarih Ajanı — Google Play & App Store Yayın Rehberi

Site zaten tam bir PWA (manifest + service worker + uygulama kabuğu + kurulum davetleri).
Mağaza uygulamaları bu PWA'nın paketlenmiş hâlidir: **kod ikiye ayrılmaz**, site her
güncellendiğinde uygulama da otomatik güncellenir (içerik web'den gelir).

---

## 1) Google Play (önerilen ilk adım — kolay ve ucuz)

Yöntem: **TWA (Trusted Web Activity)** — Chrome'un resmî "PWA'yı Play'e koy" yolu.
En kolay araç: [pwabuilder.com](https://www.pwabuilder.com)

Adımlar:
1. **Play Console hesabı aç:** https://play.google.com/console — tek seferlik **25 $**.
2. **pwabuilder.com** → adres olarak `https://tarihajani.com` gir → *Package for Stores* → **Android**.
   - Package ID: `com.tarihajani.app`
   - Signing key: *Create new* seç → PWABuilder `.keystore` dosyası ve **SHA-256 parmak izini** verir. **Bu dosyayı sakla** (kaybolursa güncelleme yayınlayamazsın).
3. **assetlinks.json ekle** (adres çubuğu görünmesin diye şart):
   Repoya `.well-known/assetlinks.json` dosyası ekle — içerik PWABuilder'ın verdiği
   şablondur; `sha256_cert_fingerprints` alanına 2. adımdaki parmak izini yapıştır:
   ```json
   [{
     "relation": ["delegate_permission/common.handle_all_urls"],
     "target": {
       "namespace": "android_app",
       "package_name": "com.tarihajani.app",
       "sha256_cert_fingerprints": ["BURAYA:PARMAK:İZİ"]
     }
   }]
   ```
   Merge → Netlify yayınlar → `https://tarihajani.com/.well-known/assetlinks.json` açılıyor olmalı.
4. **Play Console'da uygulama oluştur** → PWABuilder'ın verdiği `.aab` dosyasını yükle →
   mağaza metni/görselleri (manifest'teki ekran görüntüleri kullanılabilir) → incelemeye gönder.
   İlk inceleme genelde 1–3 gün.

Ölçüler hazır: `pwa-icon-512.png` (mağaza simgesi), `ekran-1..3` (telefon ekran görüntüleri).
Ek gerekenler: 1024×500 tanıtım bandı (feature graphic) — istersen ben üretirim.

---

## 2) App Store (iOS)

Gerçek durum: Apple, "yalnız web sarmalayıcı" uygulamalara karşı katıdır ve
**99 $/yıl Apple Developer** üyeliği + **Mac/Xcode** gerektirir. İki yol:

**Yol A — hemen, mağazasız (bugün çalışıyor):** iPhone'da Safari → Paylaş →
**Ana Ekrana Ekle**. Sitemiz bunu ziyaretçiye kendisi öneriyor (pwa.js iOS ipucu),
tam ekran uygulama kabuğuyla açılıyor. Kullanıcı için App Store'dan farkı yok.

**Yol B — App Store'a girmek:**
1. Apple Developer hesabı: https://developer.apple.com (99 $/yıl).
2. pwabuilder.com → **iOS** paketi indir (Xcode projesi üretir) — veya Capacitor ile sar.
3. Mac'te Xcode ile aç → imzala → App Store Connect'e yükle → incelemeye gönder.
4. Red riskini düşürmek için pakete "yerli" dokunuşlar ekleriz: push bildirimi
   (Sprint 3'teki bildirim altyapısıyla birleşir), paylaşım hedefi, çevrimdışı arşiv.

Öneri: **Önce Google Play** (ucuz, hızlı, kabul oranı yüksek) + iOS'ta Ana Ekrana Ekle;
Sprint 3 bildirim altyapısı bittiğinde App Store paketini hazırlarız.

---

## 3) Sürüm akışı

- Site güncellenince uygulamalar **kendiliğinden** güncellenir (içerik web'den).
- Yalnız kabuk değişirse (simge, ad, izinler) yeni `.aab`/Xcode sürümü gerekir.

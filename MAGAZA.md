# Tarih Ajanı — Mağaza Yayın Rehberi (Google Play + App Store)

Site tam bir PWA: manifest (ikonlar + ekran görüntüleri), service worker,
çevrimdışı sayfa, uygulama içi alt sekme çubuğu ve `/gizlilik` sayfası hazır.
Bu dosya, PWA'yı mağazalara taşırken izlenecek adımları ve hazır mağaza
metinlerini içerir.

---

## 1) GOOGLE PLAY — önce bunu yap (kolay, düşük riskli)

**Yöntem:** TWA (Trusted Web Activity) — Google'ın resmî PWA→Play yolu.
Uygulama, siteyi tarayıcı arayüzü olmadan native pencerede açar.

**Maliyet:** 25 $ (tek seferlik geliştirici hesabı). İnceleme: genelde 1-3 gün.

### Adımlar
1. https://play.google.com/console → geliştirici hesabı aç (25 $).
2. https://www.pwabuilder.com → `https://tarihajani.com` yaz → **Package for Stores → Android**.
   - Package ID: `com.tarihajani.app`
   - App name: `Tarih Ajanı` · Version: `1.0.0`
   - Signing: **"Create new"** seç → PWABuilder imza anahtarını üretir.
3. İnen zip'ten çıkanlar:
   - `*.aab` → Play Console'a yüklenecek paket
   - `assetlinks.json` → **siteye deploy edilecek** (aşağıya bak)
   - `signing.keystore` + şifreler → **ASLA KAYBETME, güvenle sakla** (güncellemeler bu anahtarla imzalanır)
4. `assetlinks.json` dosyasını repoda `.well-known/assetlinks.json` olarak ekle,
   deploy et. Doğrula: `https://tarihajani.com/.well-known/assetlinks.json` açılmalı.
   (Bu dosya olmadan uygulama üstte tarayıcı çubuğuyla açılır.)
5. Play Console → Create app → `*.aab`'ı Internal testing'e yükle → sorun yoksa Production'a terfi ettir.
6. Mağaza fişini doldur (metinler aşağıda), gizlilik politikası URL'si:
   `https://tarihajani.com/gizlilik`
7. Grafikler: uygulama ikonu 512×512 (`assets/pwa-icon-512.png`),
   feature graphic 1024×500 (istenirse üretilir),
   telefon ekran görüntüleri (`assets/ekran-1..3.png` birebir kullanılabilir).

---

## 2) APP STORE — ikinci adım (Mac gerektirir, ret riski var)

**Yöntem:** PWABuilder iOS paketi veya Capacitor kabuğu → **Xcode ile Mac'te**
derlenir (bulut Mac hizmetleri de olur). Maliyet: 99 $/yıl.

**Dürüst uyarı:** Apple, "sadece web sitesi sarmalayan" uygulamaları
4.2 (minimum işlevsellik) gerekçesiyle reddedebilir. Elimizdeki artılar:
uygulama içi native sekme çubuğu, çevrimdışı mod, Studio/oyunlar gibi
etkileşimli bölümler. Riski azaltmak için Play sürümü yayındayken ve mümkünse
push bildirimi eklendikten sonra başvurmak mantıklı.

### Adımlar (özet)
1. https://developer.apple.com → hesap (99 $/yıl).
2. PWABuilder → aynı URL → **iOS** paketi indir.
3. Mac'te Xcode ile aç → Bundle ID `com.tarihajani.app` → Archive → App Store Connect'e yükle.
4. Fiş + gizlilik URL'si aynı; App Privacy bölümünde "veri toplama" beyanı
   (analytics kullanılıyorsa "Product Interaction" işaretle).

---

## 3) MAĞAZA FİŞİ METİNLERİ (hazır, kopyala-yapıştır)

**Uygulama adı:** Tarih Ajanı

**Kısa açıklama (80 karakter sınırı):**
> Tarihin gizli dosyaları: vaka arşivi, canlı tarih haberleri ve üretim stüdyosu.

**Uzun açıklama:**
> Tarih Ajanı, tarihe bir dedektif gözüyle bakan içerik stüdyosudur.
>
> 🗂 GİZLİ ARŞİV — Asur'dan Roma'ya, Mısır'dan Bizans'a 42 vaka dosyası:
> çözülmemiş sırlar, künyeleri ve kaynaklarıyla.
>
> 📰 TARİH AJANI HABER — Tarihi olayları "bugün oluyormuş" gibi veren canlı
> haber servisi: manşetler, son dakika akışı ve Tarih Borsası.
>
> ✦ STUDIO — Bir konu yaz; senaryo, seslendirme, sinematik sahne promptları
> ve yayın paketi dakikalar içinde tek dosyada.
>
> 🎓 AJAN AKADEMİSİ — 9 derslik içerik üreticiliği programı: kaynak doğrulama,
> anlatı kurgusu, stüdyo ve yayın. Kendi tarih kanalını kur, üret, kazan.
>
> Çevrimdışı erişim, karanlık dedektif estetiği ve sürekli açılan yeni
> dosyalarla — arşiv seni bekliyor.

**Kategori:** Eğitim (ikincil: Haber & Dergiler)
**Gizlilik politikası:** https://tarihajani.com/gizlilik
**İletişim:** iletisim@tarihajani.com

---

## 4) DURUM ÖZETİ

| Gereksinim | Durum |
|---|---|
| HTTPS + PWA (manifest, SW, offline) | ✅ Yayında |
| İkonlar (192/512/maskable) | ✅ `assets/pwa-icon-*` |
| Manifest ekran görüntüleri | ✅ `assets/ekran-1..3.png` |
| Gizlilik politikası URL | ✅ `/gizlilik` (+ `/kvkk`) |
| Uygulama hissi (alt sekme çubuğu) | ✅ Sadece kurulu uygulamada |
| `.well-known/assetlinks.json` | ⬜ PWABuilder anahtar üretince eklenecek |
| Google Play hesabı (25 $) | ⬜ Kullanıcı |
| Apple Developer hesabı (99 $/yıl) + Mac | ⬜ Kullanıcı (2. faz) |

# Tarih Ajanı — Native Mobil Uygulama (iOS + Android)

**WebView / web'den devşirme DEĞİL.** Flutter ile tek kod tabanından **native derlenen**
gerçek uygulama. Web ile **aynı Supabase backend'ini** (hesap, kredi, üretim, arşiv)
kullanır — webde ürettiğin dosya uygulamada, uygulamada ürettiğin webde görünür.

## Tasarım sistemi (simetri)

- **4pt ızgara:** tüm boşluklar `Bosluk` sabitlerinden (4/8/12/16/24/32); kenar payı her ekranda 16.
- **Tek köşe ailesi:** kart 12 · giriş alanı 16 · çip 999 (hap).
- **Tek buton yüksekliği:** tüm birincil/ikincil butonlar 52pt.
- **Marka:** fildişi kâğıt + altın + mürekkep (aydınlık), lacivert + altın (gece) — web ile birebir.
- Yazı: Playfair Display (başlık, serif) + Inter (gövde) — `google_fonts` ile.

## Ekranlar

| Sekme | İçerik |
|---|---|
| Üret | Konu + tarz çipleri (Klasik/POV/Soru-cevap/Liste/Ne olurdu/Reels) → dosya üretimi |
| Ajan | Sohbet — konsept çipleri, konuşarak fikir bulma (webdeki Ajan Masası'nın kardeşi) |
| Dosyalar | Hesaba bağlı üretimler (`video_list` — web ile ortak arşiv) |
| Profil | Hesap, kredi bilgisi, çıkış |

## Yerelde çalıştırma

```bash
cd app
flutter create . --org com.tarihajani --project-name tarih_ajani   # ios/ + android/ klasörlerini üretir (bir kez)
flutter pub get
flutter run          # bağlı cihaz/emülatörde açar
```

Google girişi için: Supabase Auth → URL Configuration'a
`com.tarihajani.studio://giris` redirect'ini ekle; iOS `Info.plist` ve Android
`AndroidManifest.xml`'e aynı URL şemasını tanıt (supabase_flutter dökümanındaki
"Deep Links" adımları).

## Mağaza yayını (özet yol haritası)

1. **Hesaplar:** Apple Developer (99$/yıl) + Google Play Console (25$ tek sefer).
2. **Kimlik:** bundle id `com.tarihajani.studio` (iOS) / application id aynı (Android).
3. **İkon + açılış:** `flutter_launcher_icons` ile `assets/studio-mark` amblemi.
4. **Android:** `flutter build appbundle` → Play Console'a yükle (imzalama anahtarı üret, sakla).
5. **iOS:** Xcode ile arşivle → App Store Connect → TestFlight → inceleme.
6. **Gizlilik:** veri toplama beyanı (e-posta + üretim içerikleri, Supabase).
7. Apple, salt-webview uygulamaları reddeder — bu uygulama native olduğu için bu risk yok.

## Sonraki geliştirme adımları

- [ ] Üretimde webdeki TAM `buildPrompt` paketini ortaklaştır (süre kilidi, süreklilik, tarz blokları)
- [ ] Kredi bakiyesi ucu + Profil'de canlı bakiye
- [ ] Görsel üretimi + sahne rafı (image aksiyonu) ve Görsellerim
- [ ] Sohbete [[DO:...]] üretim direktifleri (webdeki akışın aynısı)
- [ ] Seslendirme oynatıcı + indirme; bildirimler (üretim bitti)

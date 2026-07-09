#!/usr/bin/env bash
# Tarih Ajanı — export sonrası kontrol scripti
# Kullanım: bash check-export.sh
# Tasarım aracından yeni bir "publish X" export'u repoya alındıktan sonra çalıştırın.
# Önceki oturumlarda tekrar tekrar gerileyen düzeltmeleri denetler.

cd "$(dirname "$0")"
FAIL=0
hata() { echo "❌ $1"; FAIL=1; }
tamam() { echo "✅ $1"; }

echo "── Tarih Ajanı export kontrolü ──"

# 1) lang="tr"
for f in *.dc.html zaman-tuneli/index.html; do
  grep -qE '<html[^>]*lang="tr"' "$f" || hata "$f: <html lang=\"tr\"> eksik"
done
tamam "lang kontrolü bitti"

# 2) favicon
for f in *.dc.html index.html zaman-tuneli/index.html 404.html; do
  [ -f "$f" ] && { grep -q 'rel="icon"' "$f" || hata "$f: favicon (<link rel=\"icon\">) eksik"; }
done
tamam "favicon kontrolü bitti"

# 3) meta description (Admin hariç — o noindex olmalı)
for f in *.dc.html; do
  case "$f" in Admin.dc.html) continue;; esac
  grep -q 'name="description"' "$f" || hata "$f: meta description eksik"
done
grep -q 'noindex' Admin.dc.html 2>/dev/null || hata "Admin.dc.html: noindex etiketi eksik"
tamam "meta kontrolü bitti"

# 4) _redirects SEO kuralları
grep -qE '^/ +/Tarih%20Ajani\.dc\.html +200!' _redirects || hata "_redirects: kök URL 200! kuralı eksik"
grep -q '301!' _redirects || hata "_redirects: eski .dc.html -> temiz URL 301 kuralları eksik"
for route in /egitim /ekitap /urunler /studio /vaka-dosyalari /zaman-tuneli /admin /satis /bulten; do
  grep -q "^$route " _redirects || hata "_redirects: $route rotası eksik"
done
tamam "_redirects kontrolü bitti"

# 5) Zaman Tüneli yolları (temiz URL altında göreli yollar 404 verir)
if grep -q 'url("\./assets/hero' zaman-tuneli/index.html; then hata "zaman-tuneli: CSS hero yolu göreli (mutlak /zaman-tuneli/assets/... olmalı)"; fi
if grep -q "load('\./assets/hero" zaman-tuneli/index.html; then hata "zaman-tuneli: WebGL hero yolu göreli (mutlak olmalı)"; fi
if grep -q 'href="\.\./.*\.dc\.html' zaman-tuneli/index.html; then hata "zaman-tuneli: ../*.dc.html bağlantısı var (temiz URL olmalı)"; fi
tamam "Zaman Tüneli kontrolü bitti"

# 6) Referans edilen asset dosyaları mevcut mu
for a in $(grep -ohE '(assets|zaman-tuneli)/[A-Za-z0-9._/-]+\.(png|jpg|webp|mp4|js|css)' *.html *.js zaman-tuneli/index.html 2>/dev/null | sed 's|^/||' | sort -u); do
  [ -f "$a" ] || hata "eksik dosya referansı: $a"
done
tamam "asset kontrolü bitti"

# 7) Taşınmamış publish klasörü kalmış mı
for d in publish*; do
  [ -d "$d" ] && hata "repo kökünde taşınmamış klasör: $d"
done

# 8) Google Search Console doğrulama dosyası duruyor mu (SİLİNMEMELİ)
if [ ! -f "google9122dee364ae85d0.html" ]; then
  hata "google9122dee364ae85d0.html silinmiş! Google site sahipliği düşer — geri eklenmeli."
fi

# 9) Bülten, 404 ve başlık dosyaları duruyor mu
for f in bulten.html bulten-tesekkurler.html 404.html _headers; do
  [ -f "$f" ] || hata "$f silinmiş — geri eklenmeli"
done

echo "─────────────────────────────"
if [ $FAIL -eq 0 ]; then
  echo "🎉 Tüm kontroller geçti."
else
  echo "⚠️  Yukarıdaki sorunları düzeltin (veya Claude'a 'kontrol et ve düzelt' deyin)."
  exit 1
fi

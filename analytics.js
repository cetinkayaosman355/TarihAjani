/* Tarih Ajanı — Google Analytics 4 + dönüşüm olayları
   ───────────────────────────────────────────────────
   KURULUM: analytics.google.com → "tarihajani.com" mülkü aç →
   Yönetici > Veri akışları > Web → "Ölçüm Kimliği" (G-XXXXXXXXXX) kopyala →
   aşağıdaki MEASUREMENT_ID'yi onunla değiştir. Tek yer, tüm sayfalar. */
(function () {
  var MEASUREMENT_ID = 'G-XXXXXXXXXX'; // ← buraya kendi G-ID'ni yaz

  if (!MEASUREMENT_ID || /X{4,}/.test(MEASUREMENT_ID)) {
    // ID henüz girilmedi — sessizce bekle (site çalışmaya devam eder)
    window.taTrack = function () {};
    return;
  }

  // gtag.js yükle
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + MEASUREMENT_ID;
  (document.head || document.documentElement).appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, { anonymize_ip: true });

  // dışarıdan çağrılabilir olay yardımcısı
  window.taTrack = function (name, params) {
    try { gtag('event', name, params || {}); } catch (e) {}
  };

  // ── Dönüşüm olaylarını otomatik yakala ──
  function label(el) {
    return ((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '')).replace(/\s+/g, ' ').trim();
  }
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a,button') : null;
    if (!el) return;
    var t = label(el).toLocaleUpperCase('tr');
    var href = el.getAttribute('href') || '';

    if (/SATIN AL|HEMEN AL|SATIŞA GİT/.test(t) || /\/satis/.test(href)) {
      window.taTrack('begin_checkout', { item_name: label(el).slice(0, 80), page: location.pathname });
    } else if (/SEPETE EKLE|SEPETE AT/.test(t)) {
      window.taTrack('add_to_cart', { item_name: label(el).slice(0, 80), page: location.pathname });
    } else if (/SİPARİŞİ GÖNDER|SİPARİŞ VER|ÖDEMEYE GEÇ/.test(t)) {
      window.taTrack('purchase_intent', { page: location.pathname });
    } else if (/GİRİŞ YAP|ÜYE OL|KAYIT OL/.test(t)) {
      window.taTrack('login_click', { label: label(el).slice(0, 40) });
    } else if (/DEMO|DEMO TALEBİ/.test(t)) {
      window.taTrack('demo_request', { page: location.pathname });
    }
  }, true);
})();

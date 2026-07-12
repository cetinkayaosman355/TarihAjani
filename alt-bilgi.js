/* alt-bilgi.js — kurumsal footer bilgisi (rapor 2.10) + mobil sabit "Satın Al" çubuğu (rapor 6)
   Site geneline eklenir. Masaüstü görünümüne dokunmaz: sabit çubuk yalnız <=768px'te çıkar.
   dc framework hydrate sonrası DOM'u yeniden kurabildiği için MutationObserver ile yeniden enjekte edilir. */
(function () {
  'use strict';

  var MAIL = 'destek@tarihajani.com';

  /* ---------- Kurumsal footer ---------- */
  function buildCorpFooter() {
    var wrap = document.createElement('div');
    wrap.id = 'ta-corp-footer';
    wrap.style.cssText = 'margin:0 auto;max-width:1180px;padding:26px clamp(18px,4vw,40px) 40px;' +
      'display:flex;flex-wrap:wrap;gap:18px 40px;justify-content:space-between;' +
      'border-top:1px solid rgba(193,154,82,.14);font-size:12.5px;line-height:1.7;';

    var col1 = document.createElement('div');
    col1.style.cssText = 'max-width:360px;';
    col1.innerHTML =
      '<p style="margin:0 0 6px;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.18em;color:#c19a52;">TARİH AJANI</p>' +
      '<p style="margin:0;color:#818797;">Yapay zekâ destekli tarih içerik ve eğitim platformu. Senaryo, seslendirme ve görseli tek yerde üret; hazır arşiv ve eğitimle kendi kanalını kur.</p>';

    var col2 = document.createElement('div');
    col2.innerHTML =
      '<p style="margin:0 0 6px;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.16em;color:#676d7c;">YASAL</p>' +
      link('/gizlilik', 'Gizlilik Politikası') +
      link('/mesafeli-satis', 'Mesafeli Satış Sözleşmesi') +
      link('/iade', 'İade & İptal Koşulları');

    var col3 = document.createElement('div');
    col3.innerHTML =
      '<p style="margin:0 0 6px;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.16em;color:#676d7c;">İLETİŞİM</p>' +
      link('mailto:' + MAIL, MAIL) +
      link('/uyelik', 'Üyelik & Planlar') +
      link('/urunler', 'Tüm Ürünler');

    wrap.appendChild(col1);
    wrap.appendChild(col2);
    wrap.appendChild(col3);
    return wrap;
  }

  function link(href, label) {
    return '<a href="' + href + '" style="display:block;color:#a4a9b5;text-decoration:none;margin:3px 0;">' + label + '</a>';
  }

  // Uygulama tipi sayfalarda (Studio, Admin, oyun) kurumsal footer gösterme —
  // bu sayfaların kendi tam-ekran düzeni var, footer içeriğin üstüne biniyor.
  var NO_FOOTER = ['/studio', '/admin', '/zaman-tuneli'];
  function corpAllowed() {
    var p = location.pathname.toLowerCase();
    for (var i = 0; i < NO_FOOTER.length; i++) {
      if (p === NO_FOOTER[i] || p.indexOf(NO_FOOTER[i]) === 0) return false;
    }
    return true;
  }

  function injectCorpFooter() {
    if (!corpAllowed()) return;
    if (document.getElementById('ta-corp-footer')) return;
    var footer = document.querySelector('footer');
    if (footer) {
      footer.appendChild(buildCorpFooter());
    } else {
      document.body.appendChild(buildCorpFooter());
    }
  }

  /* ---------- Mobil sabit "Satın Al" çubuğu ---------- */
  var BUY_PAGES = ['/satis', '/urunler', '/urun/', '/uyelik', '/egitim', '/ekitap'];
  function onBuyPage() {
    var p = location.pathname.toLowerCase();
    if (p.indexOf('/admin') !== -1) return false;
    for (var i = 0; i < BUY_PAGES.length; i++) {
      if (p === BUY_PAGES[i] || p.indexOf(BUY_PAGES[i]) === 0) return true;
    }
    return false;
  }

  // Sayfadaki birincil satın-alma hedefini bul (varsa onu kullan, yoksa mantıklı bir varsayılan)
  function buyTarget() {
    var els = document.querySelectorAll('a[href]');
    for (var i = 0; i < els.length; i++) {
      var h = (els[i].getAttribute('href') || '').toLowerCase();
      if (h.indexOf('/satis') === 0) return { href: els[i].getAttribute('href') };
    }
    var p = location.pathname.toLowerCase();
    if (p.indexOf('/uyelik') === 0) return { href: '/uyelik#seviyeler' };
    if (p.indexOf('/satis') === 0) return { scrollTop: true };
    return { href: '/urunler' };
  }

  function ctaLabel() {
    var p = location.pathname.toLowerCase();
    if (p.indexOf('/uyelik') === 0) return { small: 'Aylık iptal edilebilir · kart ile', big: 'ÜYELİĞE BAŞLA →' };
    if (p.indexOf('/satis') === 0) return { small: 'Shopier ile güvenli ödeme', big: 'SİPARİŞİ TAMAMLA →' };
    return { small: 'Shopier ile güvenli ödeme', big: 'SATIN AL →' };
  }

  function injectStickyBar() {
    if (!onBuyPage()) return;
    if (document.getElementById('ta-buy-bar')) return;

    var lbl = ctaLabel();
    var bar = document.createElement('div');
    bar.id = 'ta-buy-bar';
    bar.setAttribute('role', 'region');
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:997;display:none;' +
      'align-items:center;gap:12px;padding:10px 14px calc(10px + env(safe-area-inset-bottom,0px));' +
      'background:rgba(6,7,13,.96);backdrop-filter:blur(8px);border-top:1px solid rgba(193,154,82,.3);';

    var txt = document.createElement('div');
    txt.style.cssText = 'flex:1;min-width:0;';
    txt.innerHTML =
      '<div style="font-family:\'Special Elite\',monospace;font-size:9.5px;letter-spacing:.1em;color:#818797;">' + lbl.small + '</div>' +
      '<div style="font-family:\'Playfair Display\',serif;font-weight:700;font-size:14px;color:#f2ead9;">Tarih Ajanı</div>';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = lbl.big;
    btn.style.cssText = 'flex:0 0 auto;border:0;cursor:pointer;padding:13px 18px;white-space:nowrap;' +
      'font-family:\'Special Elite\',monospace;font-weight:700;font-size:12px;letter-spacing:.1em;color:#171207;' +
      'background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);';
    btn.addEventListener('click', function () {
      var t = buyTarget();
      if (t.scrollTop) { window.scrollTo({ top: 0, behavior: 'smooth' }); }
      else { window.location.href = t.href; }
    });

    bar.appendChild(txt);
    bar.appendChild(btn);
    document.body.appendChild(bar);
    ensureCss();
  }

  // Mobilde: çubuğu göster, alt boşluk ekle, mevcut yüzen butonları çubuğun üstüne kaldır (masaüstü etkilenmez)
  function ensureCss() {
    if (document.getElementById('ta-buy-css')) return;
    var s = document.createElement('style');
    s.id = 'ta-buy-css';
    s.textContent =
      '@media (max-width:768px){' +
      '#ta-buy-bar{display:flex !important;}' +
      'body{padding-bottom:74px !important;}' +
      '#ta-chat-btn{bottom:84px !important;}' +
      '#ta-chat-panel{bottom:150px !important;}' +
      '#ta-tema-btn{bottom:82px !important;}' +
      '}';
    document.head.appendChild(s);
  }

  /* ---------- Kurulum + dayanıklılık ---------- */
  function run() {
    injectCorpFooter();
    injectStickyBar();
  }

  function start() {
    run();
    // dc yeniden render ederse yeniden enjekte et
    var mo = new MutationObserver(function () {
      if ((corpAllowed() && !document.getElementById('ta-corp-footer')) ||
          (onBuyPage() && !document.getElementById('ta-buy-bar'))) {
        run();
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

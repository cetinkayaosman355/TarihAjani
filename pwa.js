/* Tarih Ajanı — PWA kayıt + "Uygulamayı Yükle" akışı.
   - Service worker'ı kaydeder.
   - Android/Chrome: beforeinstallprompt yakalanır, zarif bir "Uygulamayı Yükle"
     çubuğu gösterilir (kullanıcı bir kez kapatırsa 30 gün tekrar çıkmaz).
   - iOS Safari: kurulum promptu yok; ilk ziyarette "Paylaş → Ana Ekrana Ekle"
     ipucu gösterilir. */
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  // uygulama olarak açıldıysa (veya ?app=1 önizlemedeyse) hiç ipucu/çubuk gösterme
  var pv = /[?&]app=1/.test(location.search);
  try { pv = pv || sessionStorage.getItem('ta_app_preview') === '1'; } catch (e) {}
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true || pv;
  if (standalone) return;

  var DAY = 86400000;
  function snoozed(key, days) {
    try { var t = +localStorage.getItem(key) || 0; return Date.now() - t < days * DAY; } catch (e) { return false; }
  }
  function snooze(key) { try { localStorage.setItem(key, Date.now()); } catch (e) {} }

  function bar(html) {
    var el = document.createElement('div');
    el.setAttribute('role', 'dialog');
    el.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483000;display:flex;align-items:center;gap:12px;padding:12px 14px;background:linear-gradient(180deg,#0b0d16,#080a12);border:1px solid rgba(193,154,82,.4);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.6);color:#e9dfc8;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;animation:tapwa .35s ease both';
    el.innerHTML = html;
    if (!document.getElementById('tapwa-kf')) {
      var s = document.createElement('style'); s.id = 'tapwa-kf';
      s.textContent = '@keyframes tapwa{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}';
      document.head.appendChild(s);
    }
    document.body.appendChild(el);
    return el;
  }
  var ICON = '<img src="/assets/pwa-icon-192.png" alt="" style="width:42px;height:42px;border-radius:10px;flex-shrink:0">';
  var TXT = '<div style="flex:1;min-width:0;line-height:1.35"><b style="display:block;font-size:14px">Tarih Ajanı uygulaması</b><span style="font-size:12px;color:#a4a9b5">Ana ekranına ekle — tam ekran, hızlı, çevrimdışı erişim.</span></div>';

  // ── Android / Chrome ──
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e;
    if (snoozed('ta_pwa_install', 30)) return;
    var el = bar(ICON + TXT +
      '<button id="tapwa-no" style="cursor:pointer;background:none;border:0;color:#7c8393;font-size:20px;padding:4px 6px">×</button>' +
      '<button id="tapwa-yes" style="cursor:pointer;border:0;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-weight:800;font-size:13px;letter-spacing:.04em;padding:12px 18px;border-radius:10px;white-space:nowrap">Yükle</button>');
    el.querySelector('#tapwa-yes').addEventListener('click', function () {
      el.remove(); if (!deferred) return; deferred.prompt();
      deferred.userChoice.finally(function () { deferred = null; snooze('ta_pwa_install'); });
    });
    el.querySelector('#tapwa-no').addEventListener('click', function () { el.remove(); snooze('ta_pwa_install'); });
  });

  // ── iOS Safari ──
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);
  if (isIOS && isSafari && !snoozed('ta_pwa_ios', 30)) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        var el = bar(ICON +
          '<div style="flex:1;min-width:0;line-height:1.4;font-size:12.5px;color:#cdd2dc">Uygulama gibi ekle: <b style="color:#e6c478">Paylaş</b> <span style="font-size:15px">&#x2191;</span> → <b style="color:#e6c478">Ana Ekrana Ekle</b></div>' +
          '<button id="tapwa-ios-no" style="cursor:pointer;background:none;border:0;color:#7c8393;font-size:20px;padding:4px 6px">×</button>');
        el.querySelector('#tapwa-ios-no').addEventListener('click', function () { el.remove(); snooze('ta_pwa_ios'); });
      }, 2600);
    });
  }
})();

/* ── UYGULAMA KABUĞU — sadece kurulu uygulamada (standalone) native alt sekme çubuğu ──
   Tarayıcıda site aynen kalır; uygulama modunda altta Ana Sayfa/Haber/Studio/Arşiv/Üyelik.
   ÖNİZLEME: ?app=1 ile kurulum yapmadan tarayıcıda app hali görülebilir (?app=0 kapatır);
   aynı sekme oturumu boyunca sayfalar arasında da kalıcıdır. */
(function () {
  var preview = false;
  try {
    if (/[?&]app=0/.test(location.search)) sessionStorage.removeItem('ta_app_preview');
    else if (/[?&]app=1/.test(location.search)) sessionStorage.setItem('ta_app_preview', '1');
    preview = sessionStorage.getItem('ta_app_preview') === '1';
  } catch (e) {}
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true || preview;
  if (!standalone) return;
  document.documentElement.classList.add('ta-standalone');

  var TABS = [
    { k: 'home',   href: '/',        label: 'Ana Sayfa', d: 'M3 10.5 12 3l9 7.5M5 9.5V21h5v-6h4v6h5V9.5' },
    { k: 'haber',  href: '/haber/',  label: 'Haber',     d: 'M4 4h13v16H5a2 2 0 0 1-2-2V6m14 2h3v10a2 2 0 0 1-2 2M7 8h7M7 12h7M7 16h4' },
    { k: 'studio', href: '/studio',  label: 'Studio',    d: 'M12 3v3m0 12v3M3 12h3m12 0h3M6.3 6.3l2.1 2.1m7.2 7.2 2.1 2.1m0-11.4-2.1 2.1M8.4 15.6l-2.1 2.1M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z' },
    { k: 'arsiv',  href: '/arsiv',   label: 'Arşiv',     d: 'M3 7l2-3h14l2 3M3 7h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Zm7 4h4' },
    { k: 'uyelik', href: '/uyelik',  label: 'Üyelik',    d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0' }
  ];

  var CSS =
    ':root.ta-standalone body{padding-bottom:calc(64px + env(safe-area-inset-bottom,0px))!important}'
    + '#ta-tabbar{position:fixed;left:0;right:0;bottom:0;z-index:2147483001;display:flex;'
      + 'background:rgba(9,11,18,.94);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);'
      + 'border-top:1px solid rgba(193,154,82,.32);padding-bottom:env(safe-area-inset-bottom,0px);'
      + 'box-shadow:0 -8px 30px rgba(0,0,0,.5)}'
    + '#ta-tabbar a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;'
      + 'padding:9px 2px 8px;text-decoration:none;color:#8a8f9c;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;'
      + 'font-size:10px;letter-spacing:.02em;-webkit-tap-highlight-color:transparent;transition:color .15s}'
    + '#ta-tabbar a svg{width:23px;height:23px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;transition:transform .15s}'
    + '#ta-tabbar a:active svg{transform:scale(.88)}'
    + '#ta-tabbar a.on{color:#e6c478}'
    + '#ta-tabbar a.on::before{content:"";position:absolute;top:0;width:26px;height:2.5px;border-radius:0 0 3px 3px;background:linear-gradient(90deg,#a77d35,#e6c478)}'
    + '#ta-tabbar a{position:relative}'
    // yüzen butonları sekme çubuğunun üstüne kaldır
    + ':root.ta-standalone #ta-chat-btn{bottom:calc(78px + env(safe-area-inset-bottom,0px))!important}'
    + ':root.ta-standalone #ta-tema-btn{bottom:calc(78px + env(safe-area-inset-bottom,0px))!important}'
    + ':root.ta-standalone #ta-chat-panel{bottom:calc(148px + env(safe-area-inset-bottom,0px))!important}';

  function activeKey() {
    var p = decodeURIComponent(location.pathname).toLowerCase();
    if (p.indexOf('/haber') === 0) return 'haber';
    if (p.indexOf('/studio') === 0) return 'studio';
    if (p.indexOf('/arsiv') === 0) return 'arsiv';
    if (p.indexOf('/uyelik') === 0) return 'uyelik';
    if (p === '/' || p.indexOf('/tarih ajani') === 0 || p === '/index.html') return 'home';
    return '';
  }

  function build() {
    if (document.getElementById('ta-tabbar')) return;
    if (!document.getElementById('ta-tabbar-css')) {
      var st = document.createElement('style'); st.id = 'ta-tabbar-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    var act = activeKey();
    var nav = document.createElement('nav');
    nav.id = 'ta-tabbar';
    nav.setAttribute('aria-label', 'Uygulama menüsü');
    nav.innerHTML = TABS.map(function (t) {
      return '<a href="' + t.href + '"' + (t.k === act ? ' class="on" aria-current="page"' : '') + '>'
        + '<svg viewBox="0 0 24 24"><path d="' + t.d + '"/></svg>'
        + '<span>' + t.label + '</span></a>';
    }).join('');
    document.body.appendChild(nav);
  }

  /* ── UYGULAMA ANA EKRANI ──
     Uygulamada ana sayfa, web'deki uzun tanıtım akışı DEĞİL; net bir panel:
     Studio / Arşiv / Haber / Akademi / Zaman Tüneli / Teçhizat kartları.
     Site DOM'una dokunmaz — üzerine tam ekran katman koyar (dc'ye güvenli). */
  var HOME_CARDS = [
    { t: 'Studio',        s: 'Konu yaz; senaryo, ses, görsel — tek dosyada', href: '/studio',       img: '/assets/real-studio.jpg',            b: 'ÜRET' },
    { t: 'Gizli Arşiv',   s: '42 vaka dosyası · oku, videoya dönüştür',     href: '/arsiv',        img: '/assets/real-wall.jpg',              b: '42 DOSYA' },
    { t: 'Haber',         s: 'Tarihin canlı yayını · Tarih Borsası',        href: '/haber/',       img: '/assets/haber/istanbul-fethi.jpg',   b: 'CANLI' },
    { t: 'Ajan Akademisi',s: '9 derslik içerik üreticiliği programı',       href: '/egitim',       img: '/assets/real-classroom.jpg',         b: '9 DERS' },
    { t: 'Zaman Tüneli',  s: 'Zaman çizgisinde dolaş, videosuna git',       href: '/zaman-tuneli', img: '/assets/hero-desk.jpg',              b: '' },
    { t: 'Ajan Teçhizatı',s: 'E-kitaplar, hazır içerik, Studio kredileri',  href: '/urunler',      img: '/assets/haber/tutankamun-hancer.jpg',b: '' }
  ];

  var HOME_CSS =
    '#ta-app-home{position:fixed;inset:0;z-index:2147483000;background:#06070d;overflow-y:auto;-webkit-overflow-scrolling:touch;'
      + 'padding:calc(18px + env(safe-area-inset-top,0px)) 16px calc(88px + env(safe-area-inset-bottom,0px));'
      + 'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}'
    + '#ta-app-home .hd{display:flex;align-items:center;gap:12px;margin:2px 2px 18px}'
    + '#ta-app-home .hd img{width:44px;height:44px;border-radius:12px}'
    + '#ta-app-home .hd .tt b{display:block;font-family:"Playfair Display",Georgia,serif;font-size:21px;font-weight:800;color:#f4ecd8;line-height:1.1}'
    + '#ta-app-home .hd .tt span{font-size:10px;letter-spacing:.24em;color:#c19a52}'
    + '#ta-app-home .card{position:relative;display:block;height:116px;border-radius:16px;overflow:hidden;margin-bottom:12px;'
      + 'border:1px solid rgba(193,154,82,.26);text-decoration:none;background:#0a0c14;-webkit-tap-highlight-color:transparent}'
    + '#ta-app-home .card img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.52) saturate(.85)}'
    + '#ta-app-home .card::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,6,10,.86) 18%,rgba(5,6,10,.28) 70%,rgba(5,6,10,.55))}'
    + '#ta-app-home .card .in{position:absolute;left:16px;right:44px;top:50%;transform:translateY(-50%);z-index:2}'
    + '#ta-app-home .card b{display:block;font-family:"Playfair Display",Georgia,serif;font-size:21px;font-weight:800;color:#f6efe0;line-height:1.15}'
    + '#ta-app-home .card span{display:block;margin-top:4px;font-size:12.5px;color:#c3c8d3;line-height:1.4}'
    + '#ta-app-home .card .bd{position:absolute;top:12px;right:12px;z-index:2;font-size:9px;letter-spacing:.16em;color:#e6c478;'
      + 'border:1px solid rgba(193,154,82,.5);background:rgba(8,9,14,.55);padding:4px 8px;border-radius:7px}'
    + '#ta-app-home .card .ar{position:absolute;right:15px;top:50%;transform:translateY(-50%);z-index:2;color:#e6c478;font-size:19px}'
    + '#ta-app-home .card:active{transform:scale(.985)}'
    + '#ta-app-home .uye{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:4px;padding:16px;border-radius:14px;'
      + 'text-decoration:none;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-weight:800;font-size:14px;letter-spacing:.04em}'
    + ':root.ta-apphome #ta-chat-btn,:root.ta-apphome #ta-tema-btn{display:none!important}'
    + ':root.ta-apphome body{overflow:hidden!important}';

  function esc2(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function buildHome() {
    if (activeKey() !== 'home') return;
    if (document.getElementById('ta-app-home')) return;
    if (!document.getElementById('ta-app-home-css')) {
      var st = document.createElement('style'); st.id = 'ta-app-home-css'; st.textContent = HOME_CSS; document.head.appendChild(st);
    }
    document.documentElement.classList.add('ta-apphome');
    var el = document.createElement('div');
    el.id = 'ta-app-home';
    var gun = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'][new Date().getDay()];
    el.innerHTML =
      '<div class="hd"><img src="/assets/pwa-icon-192.png" alt=""><div class="tt"><b>Tarih Ajanı</b><span>AJAN PANELİ · ' + gun.toUpperCase() + '</span></div></div>'
      + HOME_CARDS.map(function (c) {
          return '<a class="card" href="' + c.href + '"><img src="' + c.img + '" alt="" loading="lazy">'
            + (c.b ? '<span class="bd">' + esc2(c.b) + '</span>' : '')
            + '<span class="in"><b>' + esc2(c.t) + '</b><span>' + esc2(c.s) + '</span></span>'
            + '<span class="ar">›</span></a>';
        }).join('')
      + '<a class="uye" href="/uyelik">Ajan Ol — Seviyeni Seç →</a>';
    document.body.appendChild(el);
  }

  function ensure() { if (document.body) { build(); buildHome(); } }
  // Not: dc'nin render döngüsüne karışmamak için MutationObserver YOK.
  // Yüzen sohbet/tema butonlarıyla aynı güvenli desen: DOMContentLoaded + periyodik yoklama.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensure);
  else ensure();
  setInterval(ensure, 4000);
})();

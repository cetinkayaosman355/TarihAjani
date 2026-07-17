/* Tarih Ajanı — PWA kayıt + "Uygulamayı Yükle" akışı + K1 "Dosya Masası" uygulama kabuğu.
   1) Service worker kaydı.
   2) Kurulum davetleri (Android beforeinstallprompt / iOS ipucu).
   3) Uygulama kabuğu (yalnız standalone veya ?app=1 önizleme):
      - K1 alt menü: Masa · Arşiv · [◉ ÜRET] · Haber · Profil
      - K1 ana ekran: Günün Dosyası + Gizli Arşiv rafı + Son Dakika rafı.
   Web sitesi tarayıcıda birebir aynı kalır. */
(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
    // GÜNCELLEME AKIŞI: yeni sürüm devraldığında altın "YENİLE" pili göster —
    // kullanıcı tek dokunuşla en yeni uygulamayı alır ("değişmedi" derdi biter).
    var reloaded = false;
    var hadController = !!navigator.serviceWorker.controller;   // ilk kurulumda pil GÖSTERME
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloaded || !hadController || !navigator.serviceWorker.controller) return;
      reloaded = true;
      if (document.getElementById('ta-upd')) return;
      var p = document.createElement('button');
      p.id = 'ta-upd';
      p.textContent = '✦ Uygulama güncellendi — YENİLE';
      p.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:2147483002;' +
        'border:0;cursor:pointer;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-weight:800;font-size:12.5px;' +
        'letter-spacing:.04em;padding:13px 20px;border-radius:24px;box-shadow:0 14px 40px rgba(0,0,0,.55),0 0 22px rgba(230,196,120,.35);' +
        'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif';
      p.addEventListener('click', function () { location.reload(); });
      (document.body || document.documentElement).appendChild(p);
      setTimeout(function () { if (p.parentElement) p.remove(); }, 30000);
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

/* ── K1 · DOSYA MASASI — uygulama kabuğu ──
   Sadece standalone (kurulu uygulama) veya ?app=1 önizlemede çalışır.
   Site DOM'una dokunmaz; ana ekran tam ekran katman olarak çizilir. */
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

  /* ── içerik verisi ── */
  // Günün Dosyası — ARŞİVDEN gelir (uygulama içi detay açılır; habere değil).
  // di = arsiv-slugs.js sırası.
  var HEROES = [
    { di: 16, img: '/assets/haber/sezar-suikasti.jpg',   t: "Sezar'ın Sonu — Tarihin En Ünlü İhaneti", s: 'MÖ 44 · ROMA' },
    { di: 0,  img: '/assets/haber/vezuv-pompeii.jpg',    t: 'Pompeii — Son Saat',                      s: 'MS 79 · VEZÜV' },
    { di: 13, img: '/assets/haber/grek-atesi.jpg',       t: 'Grek Ateşi — Suda Sönmeyen Sır Silah',    s: '672 · BİZANS' },
    { di: 19, img: '/assets/haber/otzi.jpg',             t: 'Ötzi — Tarihin En Eski Cinayeti',         s: 'MÖ 3300 · ALPLER' },
    { di: 14, img: '/assets/haber/tutankamun-hancer.jpg',t: 'Tutankhamun — Uzaydan Gelen Bıçak',       s: 'MÖ 1323 · MISIR' }
  ];
  // di: arşivdeki dosya sırası (arsiv-slugs.js ile eşleştirildi) — poster
  // doğrudan o dosyanın uygulama içi detayını açar (/arsiv#dosya-N).
  var POSTERS = [
    { img: '/assets/haber/sezar-suikasti.jpg',   t: "Sezar'ın Sonu",          s: 'MÖ 44 · ROMA',     di: 16 },
    { img: '/assets/haber/vezuv-pompeii.jpg',    t: "Pompeii'nin Son Saati",  s: 'MS 79',            di: 0 },
    { img: '/assets/haber/grek-atesi.jpg',       t: 'Grek Ateşi',             s: '672 · BİZANS',     di: 13 },
    { img: '/assets/haber/otzi.jpg',             t: 'Buz Adam',               s: 'MÖ 3300',          di: 19 },
    { img: '/assets/haber/tutankamun-hancer.jpg',t: "Tutankhamun'un Bıçağı",  s: 'MÖ 1323 · MISIR',  di: 14 },
    { img: '/assets/haber/bagdat-1258.jpg',      t: 'Bağdat Yıkıldı',         s: '1258',             di: null }
  ];
  var NEWS = [
    { y: '1453',   t: 'Konstantinopolis düştü: Bin yıllık Bizans sona erdi',    href: '/haber/istanbul-fethi/' },
    { y: '1402',   t: "Yıldırım esir düştü: İki cihangir Çubuk Ovası'nda",      href: '/haber/ankara-savasi/' },
    { y: 'MÖ 44',  t: 'Sezar senatoda öldürüldü: Tam 23 hançer darbesi',        href: '/haber/sezar-suikasti/' },
    { y: '1071',   t: "İmparator esir: Anadolu'nun kapısı ardına dek açıldı",   href: '/haber/malazgirt/' }
  ];

  var CSS =
    /* alt menü */
    ':root.ta-standalone body{padding-bottom:calc(66px + env(safe-area-inset-bottom,0px))!important}'
    + '#ta-tabbar{position:fixed;left:0;right:0;bottom:0;z-index:2147483001;display:flex;align-items:stretch;'
      + 'background:rgba(8,10,16,.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);'
      + 'border-top:1px solid rgba(193,154,82,.28);padding:6px 4px calc(14px + env(safe-area-inset-bottom,0px));'
      + 'box-shadow:0 -10px 34px rgba(0,0,0,.55);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}'
    + '#ta-tabbar a{flex:1;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;'
      + 'padding-top:8px;text-decoration:none;color:#828795;font-size:10px;-webkit-tap-highlight-color:transparent}'
    + '#ta-tabbar a svg{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}'
    + '#ta-tabbar a.on{color:#e6c478}'
    + '#ta-tabbar a:active svg{transform:scale(.9)}'
    + '#ta-tabbar a.fab{overflow:visible}'
    + '#ta-tabbar a.fab i{position:absolute;left:50%;top:-26px;transform:translateX(-50%);width:56px;height:56px;border-radius:50%;'
      + 'background:linear-gradient(135deg,#a87f37,#e9c87e 55%,#c19a52);display:flex;flex-direction:column;align-items:center;justify-content:center;'
      + 'color:#171207;font-style:normal;font-weight:800;font-size:9px;letter-spacing:.06em;'
      + 'box-shadow:0 12px 30px -8px rgba(233,200,126,.6),0 0 0 5px rgba(8,10,16,.96)}'
    + '#ta-tabbar a.fab i svg{width:19px;height:19px;stroke:#171207;stroke-width:2.2;margin-bottom:1px}'
    + '#ta-tabbar a.fab span{visibility:hidden}'
    /* ana ekran — dosya masası */
    + '#ta-app-home{position:fixed;inset:0;z-index:2147483000;background:#07080d;overflow-y:auto;-webkit-overflow-scrolling:touch;'
      + 'padding:calc(14px + env(safe-area-inset-top,0px)) 0 calc(96px + env(safe-area-inset-bottom,0px));'
      + 'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}'
    + '#ta-app-home .hel{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:8px 18px 14px}'
    + '#ta-app-home .hel b{display:block;font-family:"Playfair Display",Georgia,serif;font-size:23px;font-weight:700;color:#f4ecd8;line-height:1.1}'
    + '#ta-app-home .hel span{display:block;margin-top:4px;font-size:10px;letter-spacing:.22em;color:#77705c}'
    /* kredi çipi — uygulama hissi: bakiye hep görünür */
    + '.ta-kredi{flex:none;display:inline-flex;align-items:center;gap:6px;text-decoration:none;margin-top:3px;'
      + 'border:1px solid rgba(193,154,82,.45);background:rgba(193,154,82,.1);border-radius:20px;padding:7px 13px;'
      + 'color:#e6c478;font-weight:800;font-size:12px;font-variant-numeric:tabular-nums;-webkit-tap-highlight-color:transparent}'
    + '.ta-kredi:active{transform:scale(.95)}'
    /* oyun tüneli kartı */
    + '#ta-app-home .oyunkart{display:block;margin:14px 14px 0;border-radius:15px;overflow:hidden;position:relative;'
      + 'border:1px solid rgba(193,154,82,.3);background:linear-gradient(120deg,#101426,#090c16);text-decoration:none;-webkit-tap-highlight-color:transparent}'
    + '#ta-app-home .oyunkart:active{transform:scale(.985)}'
    + '#ta-app-home .oyunkart .ust2{display:flex;align-items:center;gap:13px;padding:13px 15px 10px}'
    + '#ta-app-home .oyunkart .rz{flex:none;width:36px;height:36px;border-radius:50%;border:1px solid rgba(193,154,82,.5);display:grid;place-items:center;color:#e6c478;font-size:17px}'
    + '#ta-app-home .oyunkart b{display:block;color:#ede4cf;font-size:14px;font-weight:700}'
    + '#ta-app-home .oyunkart .m span{display:block;margin-top:2px;color:#8a8f9c;font-size:11px}'
    + '#ta-app-home .oyunkart .git{margin-left:auto;color:#c19a52;font-size:18px}'
    + '#ta-app-home .oyunkart .minis{display:flex;gap:7px;padding:0 15px 13px}'
    + '#ta-app-home .oyunkart .minis span{flex:1;text-align:center;font-size:10px;letter-spacing:.06em;color:#c9c2ae;'
      + 'border:1px solid rgba(129,135,151,.25);border-radius:9px;padding:8px 4px;background:rgba(255,255,255,.02)}'
    + '#ta-app-home .hero{position:relative;display:block;margin:0 14px;border-radius:20px;overflow:hidden;height:min(52vw,236px);'
      + 'border:1px solid rgba(193,154,82,.3);text-decoration:none;-webkit-tap-highlight-color:transparent;background:#0c0e16}'
    + '#ta-app-home .hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}'
    + '#ta-app-home .hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,6,10,.12) 28%,rgba(5,6,10,.93))}'
    + '#ta-app-home .hero .bd{position:absolute;top:12px;left:12px;z-index:2;font-size:9px;letter-spacing:.18em;font-weight:800;'
      + 'color:#171207;background:linear-gradient(110deg,#d8b26a,#e9c87e);padding:5px 10px;border-radius:7px}'
    + '#ta-app-home .hero .tt{position:absolute;left:16px;right:16px;bottom:14px;z-index:2}'
    + '#ta-app-home .hero .tt b{display:block;font-family:"Playfair Display",Georgia,serif;font-size:20px;line-height:1.18;font-weight:700;color:#f6efe0}'
    + '#ta-app-home .hero .tt span{display:block;margin-top:5px;font-size:11px;letter-spacing:.08em;color:#e6c478}'
    + '#ta-app-home .hero:active{transform:scale(.985)}'
    + '#ta-app-home .sh{display:flex;justify-content:space-between;align-items:baseline;padding:22px 18px 10px}'
    + '#ta-app-home .sh b{font-size:11px;letter-spacing:.22em;color:#c19a52}'
    + '#ta-app-home .sh a{font-size:11px;color:#8a8f9c;text-decoration:none}'
    + '#ta-app-home .posters{display:flex;gap:11px;padding:0 14px 4px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}'
    + '#ta-app-home .posters::-webkit-scrollbar{display:none}'
    + '#ta-app-home .po{flex:none;width:118px;border-radius:14px;overflow:hidden;background:#10121b;border:1px solid rgba(193,154,82,.2);text-decoration:none;-webkit-tap-highlight-color:transparent}'
    + '#ta-app-home .po img{width:100%;height:88px;object-fit:cover;display:block}'
    + '#ta-app-home .po b{display:block;font-size:12px;font-weight:600;color:#e9e2d0;padding:8px 10px 3px;line-height:1.28}'
    + '#ta-app-home .po span{display:block;font-size:9.5px;color:#6b7080;padding:0 10px 10px}'
    + '#ta-app-home .po:active{transform:scale(.97)}'
    + '#ta-app-home .nrow{display:flex;gap:12px;align-items:center;padding:12px 18px;border-top:1px solid rgba(230,220,196,.06);text-decoration:none;-webkit-tap-highlight-color:transparent}'
    + '#ta-app-home .nrow .yil{flex:none;font-family:"Playfair Display",Georgia,serif;font-size:15px;font-weight:700;color:#e6c478;min-width:52px}'
    + '#ta-app-home .nrow p{margin:0;flex:1;font-size:13px;line-height:1.4;color:#d5d9e2}'
    + '#ta-app-home .nrow .ok{color:#c19a52;font-size:16px}'
    + '#ta-app-home .nrow:active{background:rgba(193,154,82,.06)}'
    /* studio hızlı bant + akademi kartı */
    + '#ta-app-home .stub,#ta-app-home .akkart{display:flex;align-items:center;gap:13px;margin:14px 14px 0;padding:13px 15px;border-radius:15px;'
      + 'text-decoration:none;-webkit-tap-highlight-color:transparent}'
    + '#ta-app-home .stub{background:linear-gradient(110deg,#a87f37,#e9c87e 55%,#c19a52)}'
    + '#ta-app-home .stub .ico{flex:none;width:36px;height:36px;border-radius:50%;background:rgba(23,18,7,.16);display:grid;place-items:center;color:#171207;font-size:16px;font-weight:800}'
    + '#ta-app-home .stub b{display:block;color:#171207;font-size:14.5px;font-weight:800}'
    + '#ta-app-home .stub .m span{display:block;margin-top:2px;color:rgba(23,18,7,.72);font-size:11px}'
    + '#ta-app-home .stub .git{margin-left:auto;color:#171207;font-size:18px}'
    + '#ta-app-home .stub:active,#ta-app-home .akkart:active{transform:scale(.985)}'
    + '#ta-app-home .akkart{border:1px solid rgba(193,154,82,.26);background:#0d0f17}'
    + '#ta-app-home .akkart .rz{flex:none;width:36px;height:36px;border-radius:50%;border:1px solid rgba(193,154,82,.5);display:grid;place-items:center;'
      + 'color:#e6c478;font-family:"Playfair Display",Georgia,serif;font-size:13px;font-weight:800}'
    + '#ta-app-home .akkart b{display:block;color:#ede4cf;font-size:14px;font-weight:700}'
    + '#ta-app-home .akkart .m span{display:block;margin-top:2px;color:#8a8f9c;font-size:11px}'
    + '#ta-app-home .akkart .m{min-width:0}'
    + '#ta-app-home .akkart .m span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '#ta-app-home .akkart .git{margin-left:auto;color:#c19a52;font-size:18px}'
    + ':root.ta-apphome #ta-chat-btn,:root.ta-apphome #ta-tema-btn{display:none!important}'
    + ':root.ta-apphome body{overflow:hidden!important}'
    /* arşiv ekranı — K1 native liste */
    + '#ta-app-arsiv{position:fixed;inset:0;z-index:2147483000;background:#07080d;display:flex;flex-direction:column;'
      + 'padding-top:calc(14px + env(safe-area-inset-top,0px));font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}'
    + '#ta-app-arsiv .top{padding:8px 18px 0}'
    + '#ta-app-arsiv .top .bas{display:flex;justify-content:space-between;align-items:baseline}'
    + '#ta-app-arsiv .top b{font-family:"Playfair Display",Georgia,serif;font-size:23px;font-weight:700;color:#f4ecd8}'
    + '#ta-app-arsiv .top .say{font-size:10px;letter-spacing:.18em;color:#77705c;font-variant-numeric:tabular-nums}'
    + '#ta-app-arsiv .ara{margin:12px 14px 10px;display:flex;align-items:center;gap:9px;background:#10121b;'
      + 'border:1px solid rgba(193,154,82,.24);border-radius:13px;padding:11px 13px}'
    + '#ta-app-arsiv .ara svg{width:16px;height:16px;stroke:#77705c;fill:none;stroke-width:2;flex:none}'
    + '#ta-app-arsiv .ara input{flex:1;background:none;border:0;outline:0;color:#e9e2d0;font-size:14px;min-width:0}'
    + '#ta-app-arsiv .ara input::placeholder{color:#5d6370}'
    + '#ta-app-arsiv .cips{display:flex;gap:7px;padding:0 14px 10px;overflow-x:auto;scrollbar-width:none}'
    + '#ta-app-arsiv .cips::-webkit-scrollbar{display:none}'
    + '#ta-app-arsiv .cip{flex:none;font-size:10px;letter-spacing:.12em;padding:8px 13px;border-radius:20px;border:1px solid rgba(193,154,82,.26);'
      + 'color:#8a8f9c;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent;font-variant-numeric:tabular-nums}'
    + '#ta-app-arsiv .cip.on{background:linear-gradient(110deg,#a87f37,#e9c87e 60%,#c19a52);border-color:transparent;color:#171207;font-weight:800}'
    + '#ta-app-arsiv .liste{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:calc(92px + env(safe-area-inset-bottom,0px))}'
    + '#ta-app-arsiv .drow{cursor:pointer;display:flex;gap:13px;align-items:center;padding:11px 18px;border-top:1px solid rgba(230,220,196,.06);'
      + 'text-decoration:none;-webkit-tap-highlight-color:transparent}'
    + '#ta-app-arsiv .drow:active{background:rgba(193,154,82,.06)}'
    + '#ta-app-arsiv .drow .no{flex:none;width:46px;height:46px;border-radius:12px;background:#10121b;border:1px solid rgba(193,154,82,.26);'
      + 'display:grid;place-items:center;font-family:"Playfair Display",Georgia,serif;font-size:16px;font-weight:700;color:#e6c478;font-variant-numeric:tabular-nums}'
    + '#ta-app-arsiv .drow .m{flex:1;min-width:0}'
    + '#ta-app-arsiv .drow b{display:block;font-family:"Playfair Display",Georgia,serif;font-size:14px;font-weight:700;color:#ede4cf;line-height:1.25;'
      + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    + '#ta-app-arsiv .drow span{display:block;margin-top:3px;font-size:10px;letter-spacing:.1em;color:#6b7080}'
    + '#ta-app-arsiv .drow .git{flex:none;color:#c19a52;font-size:17px}'
    + '#ta-app-arsiv .bos{padding:36px 20px;text-align:center;color:#6b7080;font-size:13px}'
    /* profil ekranı — K1 */
    + '#ta-app-profil{position:fixed;inset:0;z-index:2147483000;background:#07080d;overflow-y:auto;-webkit-overflow-scrolling:touch;'
      + 'padding:calc(14px + env(safe-area-inset-top,0px)) 16px calc(96px + env(safe-area-inset-bottom,0px));'
      + 'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}'
    + '#ta-app-profil .bas{font-family:"Playfair Display",Georgia,serif;font-size:23px;font-weight:700;color:#f4ecd8;padding:8px 2px 16px}'
    + '#ta-app-profil .kim{display:flex;align-items:center;gap:14px;border:1px solid rgba(193,154,82,.28);background:#10121b;'
      + 'border-radius:18px;padding:16px}'
    + '#ta-app-profil .kim .av{flex:none;width:54px;height:54px;border-radius:50%;display:grid;place-items:center;'
      + 'background:linear-gradient(135deg,#a87f37,#e9c87e 60%,#c19a52);color:#171207;font-family:"Playfair Display",Georgia,serif;font-size:23px;font-weight:800}'
    + '#ta-app-profil .kim b{display:block;font-size:16px;color:#ede4cf}'
    + '#ta-app-profil .kim span{display:block;margin-top:3px;font-size:11.5px;color:#8a8f9c;word-break:break-all}'
    + '#ta-app-profil .seviye{display:flex;align-items:center;justify-content:center;gap:9px;margin-top:14px;padding:16px;border-radius:14px;'
      + 'background:linear-gradient(110deg,#a87f37,#e9c87e 55%,#c19a52);color:#171207;font-weight:800;font-size:13.5px;letter-spacing:.04em;'
      + 'border:0;width:100%;cursor:pointer;-webkit-tap-highlight-color:transparent}'
    + '#ta-app-profil .grup{margin-top:18px;border:1px solid rgba(193,154,82,.2);border-radius:16px;overflow:hidden;background:#0d0f17}'
    + '#ta-app-profil .mrow{display:flex;align-items:center;gap:12px;padding:14px 15px;text-decoration:none;-webkit-tap-highlight-color:transparent}'
    + '#ta-app-profil .mrow + .mrow{border-top:1px solid rgba(230,220,196,.06)}'
    + '#ta-app-profil .mrow svg{flex:none;width:19px;height:19px;stroke:#c19a52;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}'
    + '#ta-app-profil .mrow span{flex:1;font-size:14px;color:#d5d9e2}'
    + '#ta-app-profil .mrow i{font-style:normal;color:#77705c;font-size:15px}'
    + '#ta-app-profil .mrow:active{background:rgba(193,154,82,.06)}'
    + '#ta-app-profil .alt{margin-top:20px;text-align:center;font-size:10px;letter-spacing:.14em;color:#4c515e}'
    /* uygulamada site kabuğu gizli + app üst çubuğu (haber sayfaları hariç) */
    + ':root.ta-hidechrome header{display:none!important}'
    + ':root.ta-hidechrome footer{display:none!important}'
    + ':root.ta-topbar body{padding-top:calc(52px + env(safe-area-inset-top,0px))!important}'
    + '#ta-topbar{position:fixed;top:0;left:0;right:0;z-index:2147483001;display:flex;align-items:center;gap:4px;'
      + 'height:calc(52px + env(safe-area-inset-top,0px));padding:env(safe-area-inset-top,0px) 10px 0;'
      + 'background:rgba(8,10,16,.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);'
      + 'border-bottom:1px solid rgba(193,154,82,.22);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}'
    + '#ta-topbar .geri{flex:none;width:40px;height:40px;display:grid;place-items:center;color:#e6c478;font-size:24px;background:none;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent}'
    + '#ta-topbar .bl{display:flex;align-items:center;gap:9px;min-width:0}'
    + '#ta-topbar img{width:27px;height:27px;border-radius:8px}'
    + '#ta-topbar b{font-family:"Playfair Display",Georgia,serif;font-size:16.5px;font-weight:700;color:#f4ecd8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
    /* dosya detayı — uygulama içi native ekran */
    + '#ta-app-dosya{position:fixed;inset:0;z-index:2147483002;background:#07080d;overflow-y:auto;-webkit-overflow-scrolling:touch;'
      + 'padding:calc(10px + env(safe-area-inset-top,0px)) 0 calc(96px + env(safe-area-inset-bottom,0px));'
      + 'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}'
    + '#ta-app-dosya .ust{display:flex;align-items:center;gap:6px;padding:4px 10px 8px}'
    + '#ta-app-dosya .ust .geri{flex:none;width:40px;height:40px;display:grid;place-items:center;color:#e6c478;font-size:24px;background:none;border:0;cursor:pointer;-webkit-tap-highlight-color:transparent}'
    + '#ta-app-dosya .ust span{font-size:10px;letter-spacing:.2em;color:#77705c}'
    + '#ta-app-dosya .kafa{padding:2px 20px 14px}'
    + '#ta-app-dosya .kafa .era{display:inline-block;font-size:9.5px;letter-spacing:.18em;color:#e6c478;border:1px solid rgba(193,154,82,.4);'
      + 'border-radius:8px;padding:4px 9px;margin-bottom:10px}'
    + '#ta-app-dosya h2{margin:0;font-family:"Playfair Display",Georgia,serif;font-size:22px;line-height:1.2;font-weight:800;color:#f4ecd8}'
    + '#ta-app-dosya .ozet{margin:10px 0 0;font-size:14px;line-height:1.65;color:#b9bec9}'
    + '#ta-app-dosya .sec{margin:10px 14px 0;border:1px solid rgba(193,154,82,.22);border-radius:15px;background:#0d0f17;overflow:hidden}'
    + '#ta-app-dosya .sec .sh{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 15px;cursor:pointer;'
      + '-webkit-tap-highlight-color:transparent;user-select:none}'
    + '#ta-app-dosya .sec .sh b{font-size:11px;letter-spacing:.18em;color:#c19a52}'
    + '#ta-app-dosya .sec .sh i{font-style:normal;color:#77705c;font-size:13px;transition:transform .2s}'
    + '#ta-app-dosya .sec .icgv{display:none;padding:0 15px 14px}'
    + '#ta-app-dosya .sec.ac .icgv{display:block}'
    + '#ta-app-dosya .sec.ac .sh i{transform:rotate(90deg)}'
    + '#ta-app-dosya .blk + .blk{margin-top:12px}'
    + '#ta-app-dosya .blk .k{font-size:9.5px;letter-spacing:.16em;color:#8a8f9c;margin-bottom:5px}'
    + '#ta-app-dosya .blk .t{font-size:13px;line-height:1.65;color:#d5d9e2;white-space:pre-wrap;word-break:break-word}'
    + '#ta-app-dosya .cta{display:flex;align-items:center;justify-content:center;gap:9px;margin:18px 14px 0;padding:16px;border-radius:14px;'
      + 'background:linear-gradient(110deg,#a87f37,#e9c87e 55%,#c19a52);color:#171207;font-weight:800;font-size:13.5px;letter-spacing:.04em;text-decoration:none}'
    /* ekran geçişleri — native his */
    + '@keyframes ta-scr-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}'
    + '@keyframes ta-scr-push{from{opacity:.35;transform:translateX(26%)}to{opacity:1;transform:none}}'
    + '#ta-app-home,#ta-app-arsiv,#ta-app-profil{animation:ta-scr-in .26s ease both}'
    + '#ta-app-dosya{animation:ta-scr-push .3s cubic-bezier(.3,.85,.35,1) both}'
    /* ── SAYFALAR ARASI GEÇİŞ — koyu kadife perde + altın spinner ── */
    + '@view-transition{navigation:auto}'
    + '::view-transition-old(root){animation:ta-vt-out .2s ease both}'
    + '::view-transition-new(root){animation:ta-vt-in .26s ease both}'
    + '@keyframes ta-vt-out{to{opacity:0;transform:translateX(-4%)}}'
    + '@keyframes ta-vt-in{from{opacity:0;transform:translateX(5%)}to{opacity:1;transform:none}}'
    + '#ta-nav-veil{position:fixed;inset:0;z-index:2147483004;background:#07080d;opacity:0;pointer-events:none;'
      + 'display:grid;place-items:center;transition:opacity .18s ease}'
    + '#ta-nav-veil.on{opacity:1;pointer-events:auto}'
    + '#ta-nav-veil i{width:30px;height:30px;border-radius:50%;border:2px solid rgba(230,196,120,.2);border-top-color:#e6c478;'
      + 'animation:ta-nv-spin .8s linear infinite;opacity:0;transition:opacity .2s .25s}'
    + '#ta-nav-veil.on i{opacity:1}'
    + '@keyframes ta-nv-spin{to{transform:rotate(360deg)}}'
    /* ── TUŞLAR — uygulama genelinde dokunma tepkisi ── */
    + ':root.ta-standalone a,:root.ta-standalone button{-webkit-tap-highlight-color:transparent}'
    + ':root.ta-standalone a:active,:root.ta-standalone button:active{opacity:.82;transition:opacity .06s}'
    /* ── TAŞMA KORUMASI — hiçbir sayfa yana kaymaz ── */
    + ':root.ta-standalone body{overflow-x:hidden!important;-webkit-text-size-adjust:100%}'
    + ':root.ta-standalone img,:root.ta-standalone video,:root.ta-standalone iframe,:root.ta-standalone svg{max-width:100%}'
    + ':root.ta-standalone pre,:root.ta-standalone table{max-width:100%;overflow-x:auto}'
    /* üst çubuk: kaydırınca zarif gölge */
    + '#ta-topbar.sc{box-shadow:0 10px 30px rgba(0,0,0,.5)}'
    + '@media(prefers-reduced-motion:reduce){#ta-app-home,#ta-app-arsiv,#ta-app-profil,#ta-app-dosya{animation:none}'
      + '::view-transition-old(root),::view-transition-new(root){animation:none}}';

  var TABS = [
    { k: 'home',   href: '/',        label: 'Masa',   d: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5' },
    { k: 'arsiv',  href: '/arsiv',   label: 'Arşiv',  d: 'M3 7l2-3h14l2 3M3 7h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Zm7 4h4' },
    { k: 'uret',   href: '/studio',  label: 'ÜRET',   d: 'M12 5v14M5 12h14', fab: true },
    { k: 'haber',  href: '/haber/',  label: 'Haber',  d: 'M4 4h13v16H5a2 2 0 0 1-2-2V6m14 2h3v10a2 2 0 0 1-2 2M7 8h7M7 12h7M7 16h4' },
    { k: 'profil', href: '/uyelik',  label: 'Profil', d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0' }
  ];

  function activeKey() {
    var p = decodeURIComponent(location.pathname).toLowerCase();
    if (p.indexOf('/haber') === 0) return 'haber';
    if (p.indexOf('/studio') === 0) return 'uret';
    if (p.indexOf('/arsiv') === 0) return 'arsiv';
    if (p.indexOf('/uyelik') === 0) return 'profil';
    if (p === '/' || p.indexOf('/tarih ajani') === 0 || p === '/index.html') return 'home';
    return '';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function injectCss() {
    if (document.getElementById('ta-k1-css')) return;
    var st = document.createElement('style'); st.id = 'ta-k1-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  function buildTabbar() {
    if (document.getElementById('ta-tabbar')) return;
    var act = activeKey();
    var nav = document.createElement('nav');
    nav.id = 'ta-tabbar';
    nav.setAttribute('aria-label', 'Uygulama menüsü');
    nav.innerHTML = TABS.map(function (t) {
      var ic = '<svg viewBox="0 0 24 24"><path d="' + t.d + '"/></svg>';
      if (t.fab) return '<a class="fab" href="' + t.href + '"><i>' + ic + t.label + '</i><span>' + t.label + '</span></a>';
      return '<a href="' + t.href + '"' + (t.k === act ? ' class="on" aria-current="page"' : '') + '>' + ic + '<span>' + t.label + '</span></a>';
    }).join('');
    document.body.appendChild(nav);
  }

  function buildHome() {
    if (activeKey() !== 'home') return;
    if (document.getElementById('ta-app-home')) return;
    document.documentElement.classList.add('ta-apphome');

    var now = new Date();
    var saat = now.getHours();
    var selam = saat < 6 ? 'İyi geceler, Ajan' : saat < 12 ? 'Günaydın, Ajan' : saat < 18 ? 'İyi günler, Ajan' : 'İyi akşamlar, Ajan';
    var gun = ['PAZAR', 'PAZARTESİ', 'SALI', 'ÇARŞAMBA', 'PERŞEMBE', 'CUMA', 'CUMARTESİ'][now.getDay()];
    var ay = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'][now.getMonth()];
    var doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / DAYMS);
    var hero = HEROES[doy % HEROES.length];

    var el = document.createElement('div');
    el.id = 'ta-app-home';
    el.innerHTML =
      '<div class="hel"><div><b>' + selam + '</b><span>' + gun + ' · ' + now.getDate() + ' ' + ay + ' · İSTANBUL</span></div>'
      + '<a class="ta-kredi" href="/uyelik" data-ta-kredi>🪙 <span class="kv">—</span></a></div>'
      // günün dosyası: arşivden, uygulama içi detaya
      + '<a class="hero" href="/arsiv#dosya-' + (hero.di + 1) + '"><img src="' + hero.img + '" alt="">'
      + '<span class="bd">GÜNÜN DOSYASI</span>'
      + '<span class="tt"><b>' + esc(hero.t) + '</b><span>' + esc(hero.s) + ' — Dosyayı aç →</span></span></a>'
      // studio hızlı üretim bandı
      + '<a class="stub" href="/studio"><span class="ico">◉</span>'
      + '<span class="m"><b>Yeni Dosya Üret</b><span>Konu yaz; senaryo, ses, görsel — Studio</span></span>'
      + '<span class="git">›</span></a>'
      + '<div class="sh"><b>GİZLİ ARŞİV</b><a href="/arsiv">42 dosya →</a></div>'
      + '<div class="posters">'
      + POSTERS.map(function (p) {
          var href = p.di == null ? '/arsiv' : '/arsiv#dosya-' + (p.di + 1);
          return '<a class="po" href="' + href + '"><img src="' + p.img + '" alt="" loading="lazy"><b>' + esc(p.t) + '</b><span>' + esc(p.s) + '</span></a>';
        }).join('')
      + '</div>'
      // akademi kartı
      + '<a class="akkart" href="/egitim"><span class="rz">IX</span>'
      + '<span class="m"><b>Ajan Akademisi</b><span>Ders 1 · Söylenti ile kaydı ayırmak — 9 derslik program</span></span>'
      + '<span class="git">›</span></a>'
      // oyun tüneli kartı — 3 saha oyunu
      + '<a class="oyunkart" href="/zaman-tuneli"><span class="ust2"><span class="rz">♞</span>'
      + '<span class="m"><b>Oyun Tüneli</b><span>3 saha oyunu · rütbeni kanıtla</span></span>'
      + '<span class="git">›</span></span>'
      + '<span class="minis"><span>◈ Zaman Görevi</span><span>♞ Satranç 1402</span><span>🏺 Mangala</span></span></a>'
      + '<div class="sh"><b>SON DAKİKA</b><a href="/haber/">tümü →</a></div>'
      + NEWS.slice(0, 3).map(function (n) {
          return '<a class="nrow" href="' + n.href + '"><span class="yil">' + esc(n.y) + '</span><p>' + esc(n.t) + '</p><span class="ok">›</span></a>';
        }).join('');
    document.body.appendChild(el);
  }

  var DAYMS = 86400000;

  /* rota yardımcıları */
  function normPath() {
    var p = decodeURIComponent(location.pathname).toLowerCase();
    p = p.replace(/\.dc\.html$/, '').replace(/\/index\.html$/, '');
    p = p.replace('/tarih ajani', '');
    p = p.replace(/\/+$/, '');
    return p; // '' | '/arsiv' | '/studio' | '/arsiv/<slug>' ...
  }
  function isHaber() { return normPath().indexOf('/haber') === 0; }
  function isArsivList() { return normPath() === '/arsiv'; }
  function trLow(s) { return String(s).replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase(); }

  /* ── uygulamada site kabuğunu gizle + app üst çubuğu (haber hariç) ── */
  var ROOTS = { '': 1, '/arsiv': 1, '/studio': 1, '/haber': 1, '/uyelik': 1 };
  var TITLES = [
    ['/studio', 'Studio'], ['/egitim', 'Ajan Akademisi'], ['/urunler', 'Ajan Teçhizatı'],
    ['/ekitap', 'E-Kitap'], ['/vaka-dosyalari', 'Vaka Dosyaları'], ['/zaman-tuneli', 'Zaman Tüneli'],
    ['/uyelik', 'Üyelik'], ['/gizlilik', 'Gizlilik'], ['/kvkk', 'KVKK'], ['/mesafeli-satis', 'Mesafeli Satış'],
    ['/arsiv/', 'Dosya'], ['/urun/', 'Ürün'], ['/ornek', 'Örnek Dosya']
  ];
  function routeTitle(p) {
    for (var i = 0; i < TITLES.length; i++) if (p.indexOf(TITLES[i][0]) === 0) return TITLES[i][1];
    return 'Tarih Ajanı';
  }
  function overlayVar() {
    return document.getElementById('ta-app-home') || document.getElementById('ta-app-arsiv')
      || document.getElementById('ta-app-profil') || document.getElementById('ta-app-dosya');
  }
  function buildChrome() {
    if (isHaber()) return; // gazete kendi kabuğunu korur
    document.documentElement.classList.add('ta-hidechrome');
    var bar = document.getElementById('ta-topbar');
    if (overlayVar()) { // tam ekran native ekran varken üst çubuk gereksiz
      if (bar) { bar.remove(); document.documentElement.classList.remove('ta-topbar'); }
      return;
    }
    if (bar) return;
    var p = normPath();
    bar = document.createElement('div');
    bar.id = 'ta-topbar';
    bar.innerHTML =
      (ROOTS[p] || p === '' ? '' : '<button class="geri" aria-label="Geri">‹</button>')
      + '<div class="bl"><img src="/assets/pwa-icon-192.png" alt=""><b>' + esc(routeTitle(p)) + '</b></div>';
    document.body.appendChild(bar);
    document.documentElement.classList.add('ta-topbar');
    var g = bar.querySelector('.geri');
    if (g) g.addEventListener('click', function () {
      if (history.length > 1) history.back(); else location.href = '/';
    });
  }

  function buildArsiv() {
    if (!isArsivList()) return;
    if (document.getElementById('ta-app-arsiv')) return;
    var DATA = window.__ARSIV__, SLUGS = window.__ARSIV_SLUGS__;
    if (!DATA || !SLUGS || !DATA.length) return; // veri gelene dek bekle (periyodik yoklama dener)
    document.documentElement.classList.add('ta-apphome');

    // dönem kategorisi — era alanından türetilir
    function katOf(era) {
      var e = (era || '').toUpperCase();
      if (e.indexOf('DOSYA') !== -1 || !e) return 'GENEL';
      if (e.indexOf('MÖ') !== -1) return 'ANTİK';
      var m = e.match(/(\d{3,4})/);
      if (m) { var y = +m[1]; return y < 1000 ? 'ANTİK' : y < 1700 ? 'ORTA ÇAĞ' : 'YAKIN ÇAĞ'; }
      return 'GENEL';
    }
    var KATLAR = ['TÜMÜ', 'ANTİK', 'ORTA ÇAĞ', 'YAKIN ÇAĞ', 'GENEL'];
    var aktifKat = 'TÜMÜ';

    var el = document.createElement('div');
    el.id = 'ta-app-arsiv';
    el.innerHTML =
      '<div class="top"><div class="bas"><b>Gizli Arşiv</b><span class="say" id="ta-ar-say"></span></div></div>'
      + '<div class="ara"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/></svg>'
      + '<input id="ta-ar-q" type="search" placeholder="dosyalarda ara — Pompeii, Sezar, lejyon…" autocomplete="off"></div>'
      + '<div class="cips" id="ta-ar-cips">'
      + KATLAR.map(function (k) { return '<button class="cip' + (k === 'TÜMÜ' ? ' on' : '') + '" data-k="' + k + '">' + k + '</button>'; }).join('')
      + '</div>'
      + '<div class="liste" id="ta-ar-liste"></div>';
    document.body.appendChild(el);

    var liste = el.querySelector('#ta-ar-liste'), say = el.querySelector('#ta-ar-say'), q = el.querySelector('#ta-ar-q');
    function draw(filtre) {
      var f = trLow(filtre || '').trim();
      var html = '', n = 0;
      for (var i = 0; i < DATA.length; i++) {
        var d = DATA[i];
        if (aktifKat !== 'TÜMÜ' && katOf(d.era) !== aktifKat) continue;
        if (f && trLow(d.baslik + ' ' + (d.era || '') + ' ' + (d.ozet || '')).indexOf(f) === -1) continue;
        n++;
        // bilinçli olarak <a> DEĞİL: page-transition.js anchor'ları yakalayıp
        // sayfaya götürüyor; dosya uygulama içinde açılmalı.
        html += '<div class="drow" role="link" tabindex="0" data-i="' + i + '">'
          + '<span class="no">' + String(i + 1).padStart(2, '0') + '</span>'
          + '<span class="m"><b>' + esc(d.baslik) + '</b><span>' + esc(d.era || 'TARİH DOSYASI') + ' · ' + esc(d.fileNo || '') + '</span></span>'
          + '<span class="git">›</span></div>';
      }
      liste.innerHTML = n ? html : '<div class="bos">Dosya bulunamadı — başka bir iz sür.</div>';
      say.textContent = n + ' / ' + DATA.length + ' DOSYA';
    }
    // satıra dokununca sayfaya GİTME — dosya uygulama içinde açılır
    liste.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('.drow') : null;
      if (!a) return;
      openDosya(+a.getAttribute('data-i'), true);
    });
    liste.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var a = e.target.closest ? e.target.closest('.drow') : null;
      if (a) openDosya(+a.getAttribute('data-i'), true);
    });
    q.addEventListener('input', function () { draw(q.value); });
    el.querySelector('#ta-ar-cips').addEventListener('click', function (e) {
      var c = e.target.closest ? e.target.closest('.cip') : null;
      if (!c) return;
      aktifKat = c.getAttribute('data-k');
      el.querySelectorAll('.cip').forEach(function (x) { x.classList.toggle('on', x === c); });
      draw(q.value);
    });
    draw('');
    // derin bağlantı: /arsiv#dosya-7
    var m = (location.hash || '').match(/#dosya-(\d+)/);
    if (m) { var di = +m[1] - 1; if (di >= 0 && di < DATA.length) openDosya(di, false); }
  }

  /* ── dosya detayı: uygulama içi native ekran (sayfa değişmez) ── */
  function closeDosya() {
    var d = document.getElementById('ta-app-dosya');
    if (d) d.remove();
  }
  window.addEventListener('popstate', closeDosya);
  function openDosya(i, push) {
    var DATA = window.__ARSIV__;
    if (!DATA || !DATA[i]) return;
    closeDosya();
    var d = DATA[i];
    var el = document.createElement('div');
    el.id = 'ta-app-dosya';
    var secHtml = (d.sections || []).map(function (s, si) {
      var bloklar = (s.bloklar || []).map(function (b) {
        return '<div class="blk"><div class="k">' + esc(b.k || '') + '</div><div class="t">' + esc(b.t || '') + '</div></div>';
      }).join('');
      return '<div class="sec' + (si === 0 ? ' ac' : '') + '"><div class="sh"><b>' + esc(s.ad) + '</b><i>›</i></div>'
        + '<div class="icgv">' + bloklar + '</div></div>';
    }).join('');
    el.innerHTML =
      '<div class="ust"><button class="geri" aria-label="Geri">‹</button><span>' + esc(d.fileNo || d.no || '') + '</span></div>'
      + '<div class="kafa"><span class="era">' + esc(d.era || 'TARİH DOSYASI') + '</span>'
      + '<h2>' + esc(d.baslik) + '</h2>'
      + (d.ozet ? '<p class="ozet">' + esc(d.ozet) + '</p>' : '')
      + '</div>'
      + secHtml
      // fileNo ile derin bağlantı: Studio ?uret parametresini tanır — paralı
      // üyede bu dosyanın üretimini otomatik başlatır.
      + '<a class="cta" href="/studio' + (d.fileNo ? '?uret=' + encodeURIComponent(d.fileNo) : '') + '">◉ &nbsp;Studio’da videoya dönüştür</a>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      var sh = e.target.closest ? e.target.closest('.sh') : null;
      if (sh) sh.parentElement.classList.toggle('ac');
    });
    el.querySelector('.geri').addEventListener('click', function () {
      if (push) history.back(); else { closeDosya(); if (location.hash) history.replaceState(null, '', location.pathname); }
    });
    if (push) history.pushState({ taDosya: i }, '', '#dosya-' + (i + 1));
  }

  /* K1 Profil ekranı — /uyelik rotasında; "Seviyeleri Gör" overlay'i kapatıp
     gerçek üyelik sayfasını (satın alma) gösterir. */
  var profilKapali = false;
  function okuKullanici() {
    var u = null;
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (u) return;
        if (k.indexOf('sb-') === 0 && k.indexOf('auth-token') !== -1) {
          var v = JSON.parse(localStorage.getItem(k) || 'null');
          var usr = v && (v.user || (v.currentSession && v.currentSession.user));
          if (usr && usr.email) u = { ad: (usr.user_metadata && usr.user_metadata.full_name) || usr.email.split('@')[0], email: usr.email };
        }
      });
    } catch (e) {}
    return u;
  }
  function mIco(d) { return '<svg viewBox="0 0 24 24"><path d="' + d + '"/></svg>'; }

  /* ── kredi bakiyesi: önce cihazdaki son değer ANINDA, sonra sunucudan taze ── */
  function okuToken() {
    var t = null;
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (t) return;
        if (k.indexOf('sb-') === 0 && k.indexOf('auth-token') !== -1) {
          var v = JSON.parse(localStorage.getItem(k) || 'null');
          t = v && (v.access_token || (v.currentSession && v.currentSession.access_token)) || null;
        }
      });
    } catch (e) {}
    return t;
  }
  var krediBusy = false, krediSon = 0;
  function doldurKredi() {
    var yerler = document.querySelectorAll('[data-ta-kredi] .kv');
    if (!yerler.length) return;
    var cached = '';
    try { cached = localStorage.getItem('ta_kredi_v1') || ''; } catch (e) {}
    if (cached !== '') yerler.forEach(function (y) { y.textContent = cached + ' KR'; });
    if (krediBusy || Date.now() - krediSon < 90000) return;   // sunucuyu en çok 90 sn'de bir yokla
    var tok = okuToken();
    if (!tok) { if (cached === '') yerler.forEach(function (y) { y.textContent = 'GİRİŞ'; }); return; }
    krediBusy = true; krediSon = Date.now();
    fetch('https://ddyuopqcvpzaysnfavqc.supabase.co/functions/v1/credits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + tok },
      body: JSON.stringify({ action: 'balance' })
    }).then(function (r) { return r.json(); }).then(function (d) {
      krediBusy = false;
      if (!d || typeof d.credits !== 'number') return;
      try { localStorage.setItem('ta_kredi_v1', String(d.credits)); } catch (e) {}
      document.querySelectorAll('[data-ta-kredi] .kv').forEach(function (y) { y.textContent = d.credits + ' KR'; });
    }).catch(function () { krediBusy = false; });
  }
  function buildProfil() {
    if (activeKey() !== 'profil' || profilKapali) return;
    if (document.getElementById('ta-app-profil')) return;
    document.documentElement.classList.add('ta-apphome');
    var u = okuKullanici();
    var el = document.createElement('div');
    el.id = 'ta-app-profil';
    el.innerHTML =
      '<div class="bas">Profil</div>'
      + '<div class="kim"><span class="av">' + esc((u ? u.ad : 'A').charAt(0).toUpperCase()) + '</span>'
      + '<div><b>' + esc(u ? u.ad : 'Ajan') + '</b>'
      + '<span>' + (u ? esc(u.email) : 'Giriş yapılmadı — üyelik sayfasından giriş yap') + '</span></div></div>'
      + '<button class="seviye" id="ta-pr-seviye">Üyelik &amp; Seviyeleri Gör →</button>'
      + '<div class="grup">'
      + '<a class="mrow" href="/uyelik" data-ta-kredi>' + mIco('M12 2 2 7l10 5 10-5-10-5Zm0 10v10') + '<span style="flex:1">Kredi Bakiyem</span><b style="color:#e6c478;font-variant-numeric:tabular-nums"><span class="kv">—</span></b><i>›</i></a>'
      + '</div>'
      + '<div class="grup">'
      + '<a class="mrow" href="/urunler">' + mIco('M3 7l2-3h14l2 3M3 7h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Zm7 4h4') + '<span>Ajan Teçhizatı — ürünler</span><i>›</i></a>'
      + '<a class="mrow" href="/ekitap">' + mIco('M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0a2 2 0 0 0 2 2h13') + '<span>E-Kitaplarım</span><i>›</i></a>'
      + '<a class="mrow" href="/egitim">' + mIco('M12 3 2 8l10 5 10-5-10-5Zm-6 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4') + '<span>Ajan Akademisi</span><i>›</i></a>'
      + '<a class="mrow" href="/zaman-tuneli">' + mIco('M12 8v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z') + '<span>Oyun Tüneli — 3 saha oyunu</span><i>›</i></a>'
      + '<a class="mrow" href="/kitaplik">' + mIco('M4 20V4h4v16H4Zm6 0V4h4v16h-4Zm7.5-.3-3-15 3.9-.8 3 15-3.9.8Z') + '<span>Dijital Kitaplık</span><i>›</i></a>'
      + '</div>'
      + '<div class="grup">'
      + '<a class="mrow" href="/neden">' + mIco('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-.2-6.2c0-2.4 2.7-2.5 2.7-4.3 0-1.2-1-2-2.4-2-1.2 0-2.1.6-2.6 1.5M12 17.8v.1') + '<span>Neden Tarih Ajanı?</span><i>›</i></a>'
      + '<a class="mrow" href="mailto:iletisim@tarihajani.com">' + mIco('M4 6h16v12H4zM4 7l8 6 8-6') + '<span>İletişim</span><i>›</i></a>'
      + '<a class="mrow" href="/gizlilik">' + mIco('M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3Z') + '<span>Gizlilik &amp; KVKK</span><i>›</i></a>'
      + '</div>'
      + '<div class="alt">TARİH AJANI UYGULAMASI · 1.1</div>';
    document.body.appendChild(el);
    el.querySelector('#ta-pr-seviye').addEventListener('click', function () {
      profilKapali = true;
      el.remove();
      document.documentElement.classList.remove('ta-apphome');
      window.scrollTo(0, 0);
    });
  }

  /* ── SAYFALAR ARASI GEÇİŞ YÖNETİCİSİ ──
     Uygulama içi her bağlantı: koyu perde kapanır → sayfa değişir → yeni
     sayfada perde açılır. Modern tarayıcıda @view-transition ek yumuşaklık
     katar; perde her tarayıcıda çalışan garantili temeldir. */
  function navVeil() {
    var v = document.getElementById('ta-nav-veil');
    if (!v) {
      v = document.createElement('div');
      v.id = 'ta-nav-veil';
      v.innerHTML = '<i></i>';
      document.body.appendChild(v);
    }
    return v;
  }
  var navBusy = false;
  // WINDOW capture: page-transition.js'in document dinleyicisinden ÖNCE koşar —
  // uygulama içinde geçişin sahibi biziz (o script defaultPrevented'ı sayar).
  window.addEventListener('click', function (e) {
    if (e.defaultPrevented || navBusy) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e.button && e.button !== 0)) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#') return;
    if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
    if (a.host && a.host !== location.host) return;                       // dış bağlantı
    // aynı sayfada yalnız hash değişiyorsa perde yok
    if (a.pathname === location.pathname && a.hash) return;
    e.preventDefault();
    navBusy = true;
    try { sessionStorage.setItem('ta_nav', '1'); } catch (_e) {}
    var v = navVeil();
    requestAnimationFrame(function () { v.classList.add('on'); });
    setTimeout(function () { location.href = a.href; }, 180);
    setTimeout(function () { navBusy = false; v.classList.remove('on'); }, 4000);  // emniyet: nav gerçekleşmezse aç
  }, true);
  // yeni sayfa: perde kapalı başlar, içerik hazır olunca zarifçe açılır
  (function () {
    var geldi = false;
    try { geldi = sessionStorage.getItem('ta_nav') === '1'; sessionStorage.removeItem('ta_nav'); } catch (_e) {}
    if (!geldi) return;
    function acil() {
      var v = navVeil();
      v.classList.add('on');
      requestAnimationFrame(function () { requestAnimationFrame(function () { v.classList.remove('on'); }); });
    }
    if (document.body) acil(); else document.addEventListener('DOMContentLoaded', acil);
  })();
  // bfcache'ten dönüşte perde asla asılı kalmasın
  window.addEventListener('pageshow', function () {
    navBusy = false;
    var v = document.getElementById('ta-nav-veil');
    if (v) v.classList.remove('on');
  });
  // üst çubuk kaydırma gölgesi
  window.addEventListener('scroll', function () {
    var b = document.getElementById('ta-topbar');
    if (b) b.classList.toggle('sc', window.scrollY > 8);
  }, { passive: true });

  function ensure() {
    if (!document.body) return;
    injectCss();
    buildTabbar();
    buildHome();
    buildArsiv();
    buildProfil();
    buildChrome();
    doldurKredi();
  }
  // dc'nin render döngüsüne karışmamak için MutationObserver YOK —
  // yüzen butonlarla aynı güvenli desen: DOMContentLoaded + periyodik yoklama.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensure);
  else ensure();
  setInterval(ensure, 4000);
})();

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

  // uygulama olarak açıldıysa hiç ipucu/çubuk gösterme
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
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

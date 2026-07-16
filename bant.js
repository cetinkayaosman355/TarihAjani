/* Tarih Ajanı — bant davranışları (ana sayfa)
   1) Son Dakika bandı: durdur/sürdür (❚❚) + kapat (×, sessionStorage'da kalıcı)
      + fixed konumu header'ın gerçek yüksekliğine oturt (mobilde header sarar)
      + uygulama kabuğunda (ta-hidechrome / ta-apphome) gizle
   2) Yayın Arşivi rayı (#ya-ray): yavaş otomatik kaydırma; kullanıcı dokununca
      5 sn durur; sona yaklaşınca başa sarar; reduced-motion'da hiç başlamaz.
   dc gövdeyi yeniden render edebildiği için: MutationObserver YOK, elemanlara
   __ok işareti + setInterval ile yeniden bağlanma var. */
(function () {
  'use strict';
  var KAPALI_KEY = 'ta_sd_kapali';
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ── 1. SON DAKİKA BANDI ── */
  function bandEnsure() {
    var band = document.getElementById('son-dakika');
    if (!band) return;

    // uygulama kabuğu veya kullanıcı kapatmışsa gizle
    var hidden = false;
    try { hidden = sessionStorage.getItem(KAPALI_KEY) === '1'; } catch (e) {}
    var rc = document.documentElement.classList;
    if (hidden || rc.contains('ta-hidechrome') || rc.contains('ta-apphome')) {
      band.style.display = 'none';
      return;
    }
    band.style.display = 'flex';

    // fixed konum: header'ın gerçek alt kenarı (mobilde header sarıp uzayabilir)
    var h = document.querySelector('header');
    if (h) {
      var hb = Math.round(h.getBoundingClientRect().height);
      if (hb > 0 && band.style.top !== hb + 'px') band.style.top = hb + 'px';
    }

    if (band.__ok) return;
    band.__ok = true;

    var ray = band.querySelector('#sd-ray');
    var durdur = band.querySelector('#sd-durdur');
    var kapat = band.querySelector('#sd-kapat');

    if (durdur && ray) {
      durdur.addEventListener('click', function () {
        var dur = ray.style.animationPlayState !== 'paused';
        ray.style.animationPlayState = dur ? 'paused' : 'running';
        durdur.textContent = dur ? '▶' : '❚❚';
        durdur.setAttribute('aria-label', dur ? 'Bandı sürdür' : 'Bandı durdur');
      });
    }
    if (kapat) {
      kapat.addEventListener('click', function () {
        try { sessionStorage.setItem(KAPALI_KEY, '1'); } catch (e) {}
        band.style.display = 'none';
      });
    }
  }

  /* ── 2. YAYIN ARŞİVİ OTOMATİK KAYDIRMA ── */
  function rayEnsure() {
    var ray = document.getElementById('ya-ray');
    if (!ray || ray.__ok || reduced) return;
    ray.__ok = true;

    var beklet = 0; // etkileşim sonrası bekleme bitiş zamanı
    function dokunuldu() { beklet = Date.now() + 5000; }
    ['pointerdown', 'wheel', 'touchstart', 'mouseenter', 'focusin'].forEach(function (ev) {
      ray.addEventListener(ev, dokunuldu, { passive: true });
    });

    function adim() {
      if (document.getElementById('ya-ray') !== ray) return; // dc yeniden render etti; interval yeni elemana bağlar
      if (Date.now() > beklet && document.visibilityState === 'visible') {
        var max = ray.scrollWidth - ray.clientWidth;
        if (max > 4) {
          if (ray.scrollLeft >= max - 2) ray.scrollLeft = 0; // sona geldi → başa sar
          else ray.scrollLeft += 0.5;
        }
      }
      requestAnimationFrame(adim);
    }
    requestAnimationFrame(adim);
  }

  function ensure() { bandEnsure(); rayEnsure(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensure);
  else ensure();
  window.addEventListener('resize', bandEnsure);
  // dc gövdeyi geç render eder: ilk saniyelerde sık, sonra seyrek yeniden bağlan
  [300, 800, 1500, 2200].forEach(function (t) { setTimeout(ensure, t); });
  setInterval(ensure, 3000);
})();

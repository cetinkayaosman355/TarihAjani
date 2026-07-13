/* kaydir-belir.js — sayfa akışı için "kaydırınca beliren" bölümler.
   Bölümler ekrana girdikçe yumuşakça yükselerek belirir; böylece art arda
   koyu bloklar tek nefeste geçmek yerine ritimli bir akışa dönüşür.
   dc hidrasyonundan sonra da çalışsın diye periyodik + MutationObserver ile
   yeni gelen bölümleri de yakalar. Hareket azaltma tercihi açıksa hiçbir şeyi
   gizlemez (erişilebilirlik). Observer yoksa da içerik normal görünür. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;   // güvenli çıkış: içerik normal görünür

  var st = document.createElement('style');
  st.textContent =
    '.ta-rv{opacity:0;transform:translateY(28px);will-change:opacity,transform;' +
    'transition:opacity .75s cubic-bezier(.2,.7,.2,1),transform .75s cubic-bezier(.2,.7,.2,1);}' +
    '.ta-rv.ta-rv-in{opacity:1;transform:none;}';
  document.head.appendChild(st);

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('ta-rv-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

  function reveal(el, delay) {
    if (!el || el.__rv) return;
    el.__rv = 1;
    if (delay) el.style.transitionDelay = delay + 'ms';
    el.classList.add('ta-rv');
    io.observe(el);
  }

  // Güvenlik ağı: bir öğe 5 sn içinde hâlâ görünür olmadıysa (ör. observer
  // tetiklenmediyse) zorla göster — asla gizli kalmasın.
  function safety() {
    document.querySelectorAll('.ta-rv:not(.ta-rv-in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || 0) + 40) el.classList.add('ta-rv-in');
    });
  }

  function scan() {
    var secs = document.querySelectorAll('section[data-screen-label]');
    secs.forEach(function (sec) {
      if (sec.getAttribute('data-screen-label') === 'Hero') return;  // hero'nun kendi açılışı var
      reveal(sec, 0);   // bölüm bir bütün olarak yükselerek belirir
    });
  }

  var ticks = 0;
  var iv = setInterval(function () { scan(); if (++ticks > 12) clearInterval(iv); }, 400);
  scan();
  setTimeout(safety, 5000);
  window.addEventListener('load', function () { scan(); setTimeout(safety, 1500); });

  var mo = new MutationObserver(function () { scan(); });
  mo.observe(document.body, { childList: true, subtree: true });
})();

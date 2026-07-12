// Tarih Ajanı — BÖLÜM GEÇİŞLERİ (scroll-reveal)
// Yalnız ana sayfada: bölümler görünüme girdikçe yumuşakça belirir
// (fade + yukarı kayma). "Hep aynı, geçiş yok" hissini kırar; sayfaya
// sinematik bir akış verir. Hareket tercihi kapalıysa devre dışı.
(function () {
  var p = (location.pathname || '/').replace(/\/+$/, '') || '/';
  if (!(p === '/' || /Tarih.?Ajani/i.test(p))) return;

  var css = document.createElement('style');
  css.id = 'ta-gecis-css';
  css.textContent =
    '[data-ta-reveal]{opacity:0;transform:translateY(30px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1);will-change:opacity,transform;}' +
    '[data-ta-reveal].ta-in{opacity:1;transform:none;}' +
    // bölüm üstü ince ışık çizgisi (girişte parlar)
    '[data-ta-edge]{position:relative;}' +
    '[data-ta-edge]:before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:0;height:1px;background:linear-gradient(90deg,transparent,rgba(230,196,120,.7),transparent);transition:width 1.1s ease .1s;}' +
    '[data-ta-edge].ta-in:before{width:min(680px,86%);}' +
    '@media(prefers-reduced-motion:reduce){[data-ta-reveal]{opacity:1 !important;transform:none !important;}[data-ta-edge]:before{width:min(680px,86%) !important;}}';
  document.head.appendChild(css);

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('ta-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });

  function tag() {
    var secs = document.querySelectorAll('section[data-screen-label]');
    Array.prototype.forEach.call(secs, function (s) {
      if (s.getAttribute('data-screen-label') === 'Hero') return;   // hero kendi animasyonlu
      if (s.getAttribute('data-ta-reveal') != null) return;
      s.setAttribute('data-ta-reveal', '1');
      s.setAttribute('data-ta-edge', '1');
      // görünürse hemen aç (üstte olan bölümler)
      var r = s.getBoundingClientRect();
      if (r.top < (window.innerHeight || 800) * 0.92) s.classList.add('ta-in');
      else io.observe(s);
    });
  }

  function init() { tag(); setInterval(tag, 1500); }   // dc gövdeyi geç kurabilir
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

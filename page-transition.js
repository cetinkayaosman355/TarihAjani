/* Tarih Ajanı — sayfa geçişi (açılışta yanılsamayı önler + çıkışta yumuşak geçiş) */
(function () {
  var BG = window.__taFadeBg || '#03050b';
  function init() {
    if (document.getElementById('ta-xfade')) return;
    var style = document.createElement('style');
    style.textContent =
      '#ta-xfade{position:fixed;inset:0;z-index:99999;background:' + BG + ';' +
      'pointer-events:none;opacity:1;transition:opacity .5s ease}' +
      '#ta-xfade.ta-hide{opacity:0}';
    (document.head || document.documentElement).appendChild(style);

    var f = document.createElement('div');
    f.id = 'ta-xfade';
    document.body.appendChild(f);

    // açılış: perde iner — ama sayfanın kendi giriş sahnesi varsa atlanır
    if (window.__taNoIntroFade) {
      f.classList.add('ta-hide');
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { f.classList.add('ta-hide'); });
      });
    }

    // iç sayfalara geçişte: önce perde, sonra git
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      var raw = a.getAttribute('href') || '';
      if (!raw || raw.charAt(0) === '#') return;
      if (/^(mailto:|tel:|javascript:)/i.test(raw)) return;
      if (/^https?:\/\//i.test(raw) && a.origin !== location.origin) return;
      e.preventDefault();
      var go = a.href;
      f.classList.remove('ta-hide');
      setTimeout(function () { window.location.href = go; }, 420);
    }, true);

    // geri/ileri (bfcache) dönüşünde perdeyi kaldır
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) f.classList.add('ta-hide');
    });
  }
  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();

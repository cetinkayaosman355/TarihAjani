/* studio-tur.js — Studio ilk kullanım turu (madde 7.1)
   /studio'da, uygulama yüklendiğinde bir kez gösterilir; 3 adımda akışı anlatır.
   localStorage 'ta_studio_tur_v1' ile tekrar gösterilmez. Kendi kendine yeter,
   dc bileşenine dokunmaz — sabit overlay olarak <body>'ye eklenir. */
(function () {
  'use strict';
  if (location.pathname.toLowerCase().indexOf('/studio') !== 0) return;

  var KEY = 'ta_studio_tur_v1';
  try { if (localStorage.getItem(KEY)) return; } catch (e) { return; }

  var STEPS = [
    { n: '1', t: 'Fikrini yaz', d: 'Bir tarih konusu gir (ör. “Grek Ateşi”). Aklına gelmezse <b>Sen Öner</b>’e bas, ajan sana konu bulsun.' },
    { n: '2', t: 'Tarzını seç', d: 'Süre, kadraj (9:16 · 16:9 · 1:1) ve tonu ayarla — ya da <b>Hazır Mod</b>’dan (⚡ Viral Reels / Uzun Video / Belgesel) tek tıkla uygula.' },
    { n: '3', t: 'Dosyanı al', d: 'Senaryo, seslendirme, görsel & video promptları ve yayın paketi <b>tek dosyada</b> hazır. Seslendir, görsel üret, indir ve düzenle.' }
  ];

  function show() {
    if (document.getElementById('ta-tur')) return;
    var ov = document.createElement('div');
    ov.id = 'ta-tur';
    ov.style.cssText = 'position:fixed;inset:0;z-index:1400;display:grid;place-items:center;padding:22px;' +
      'background:rgba(2,3,8,.82);backdrop-filter:blur(6px);';

    var card = document.createElement('div');
    card.style.cssText = 'width:min(560px,94vw);max-height:92vh;overflow:auto;background:#080b12;' +
      'border:1px solid rgba(193,154,82,.4);box-shadow:0 30px 90px rgba(0,0,0,.6);padding:30px 30px 26px;';

    var steps = STEPS.map(function (s) {
      return '<div style="display:flex;gap:14px;align-items:flex-start;margin:14px 0;">' +
        '<span style="flex:0 0 auto;width:30px;height:30px;display:grid;place-items:center;border:1px solid rgba(193,154,82,.5);color:#e6c478;font-family:\'Special Elite\',monospace;font-size:14px;">' + s.n + '</span>' +
        '<div><div style="color:#f2ecd9;font-family:\'Playfair Display\',serif;font-weight:700;font-size:16px;margin-bottom:3px;">' + s.t + '</div>' +
        '<div style="color:#a9adba;font-size:13.5px;line-height:1.6;">' + s.d + '</div></div>' +
      '</div>';
    }).join('');

    card.innerHTML =
      '<p style="margin:0 0 4px;color:#c19a52;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.2em;">AJAN STUDIO · KISA TUR</p>' +
      '<h2 style="margin:0 0 6px;font-family:\'Playfair Display\',serif;font-weight:800;font-size:26px;color:#f2ecd9;">Konu yaz → dosyan hazır</h2>' +
      '<p style="margin:0 0 8px;color:#818797;font-size:13px;line-height:1.6;">Studio; bir fikirden kısa video senaryonu, seslendirmeni, görsellerini ve yayın paketini dakikalar içinde üretir.</p>' +
      steps +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:22px;flex-wrap:wrap;">' +
        '<button id="ta-tur-skip" style="background:transparent;border:0;cursor:pointer;color:#818797;font-size:12.5px;">Turu geç</button>' +
        '<button id="ta-tur-go" style="border:0;cursor:pointer;padding:13px 24px;font-family:\'Special Elite\',monospace;font-weight:700;font-size:12px;letter-spacing:.12em;color:#171207;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);">BAŞLAYALIM →</button>' +
      '</div>';

    ov.appendChild(card);
    document.body.appendChild(ov);

    function close() {
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
      if (ov.parentNode) ov.parentNode.removeChild(ov);
    }
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    card.querySelector('#ta-tur-skip').addEventListener('click', close);
    card.querySelector('#ta-tur-go').addEventListener('click', close);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
  }

  // Uygulama gerçekten yüklendiyse göster (giriş kapısında değil): idea alanı / sihirbaz beklenir
  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    var appReady = !!document.querySelector('textarea') &&
      /SEN ÖNER|SEÇENEKLERE GEÇ|SİHİRBAZ/i.test(document.body.innerText || '');
    if (appReady) { clearInterval(iv); setTimeout(show, 600); }
    else if (tries > 40) { clearInterval(iv); }   // ~10 sn sonra vazgeç
  }, 250);
})();

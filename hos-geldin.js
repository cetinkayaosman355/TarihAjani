// Tarih Ajanı — İLK GİRİŞ KARŞILAMA (tek seferlik pop-up)
// Siteye ilk gelen ziyaretçiye bir kez gösterilir: indirim kodu + üye ol CTA.
// Kapanınca (kapat / kod kopyala / üye ol) localStorage'a işaretlenir, bir daha açılmaz.
// Girişli kullanıcıya hiç gösterilmez.
(function () {
  var LS = 'ta_welcome_v2';
  var KOD = 'ILKAJAN10';       // %10 hoş geldin indirimi (Shopier'de tanımlanır)
  var FONT = "'Special Elite', 'Courier New', monospace";

  function seen() { try { return localStorage.getItem(LS) === '1'; } catch (e) { return false; } }
  function mark() { try { localStorage.setItem(LS, '1'); } catch (e) {} }
  function loggedIn() {
    try {
      if (localStorage.getItem('ta_account_v1') || localStorage.getItem('ta_uye')) return true;
      var st = JSON.parse(localStorage.getItem('ta_studio_v5') || '{}');
      if (st && (st.agent || st.email)) return true;
    } catch (e) {}
    return false;
  }

  var el = null;
  function close() {
    mark();
    if (el && el.parentElement) el.parentElement.removeChild(el);
    el = null;
    document.documentElement.style.overflow = '';
  }

  function build() {
    el = document.createElement('div');
    el.setAttribute('data-ta-welcome', '1');
    el.style.cssText = 'position:fixed;inset:0;z-index:1300;display:grid;place-items:center;padding:20px;' +
      'background:rgba(2,3,8,.82);backdrop-filter:blur(6px);animation:ta-w-fade .4s ease;';

    var card = document.createElement('div');
    card.style.cssText = 'position:relative;width:min(430px,100%);border:1px solid rgba(193,154,82,.5);' +
      'background:linear-gradient(180deg,#0c0f18,#080a12);box-shadow:0 40px 120px rgba(0,0,0,.7);' +
      'padding:34px 30px 30px;text-align:center;font-family:' + FONT + ';animation:ta-w-rise .5s ease;';

    card.innerHTML =
      '<div style="width:56px;height:56px;margin:0 auto 14px;border-radius:50%;display:grid;place-items:center;' +
        'background:radial-gradient(circle at 35% 30%,#2a2f3d,#0b0e18);border:1px solid rgba(193,154,82,.55);font-size:27px;">🕵️</div>' +
      '<div style="font-size:10.5px;letter-spacing:.26em;color:#c19a52;">GİZLİ DOSYA · YENİ AJAN</div>' +
      '<h2 style="margin:10px 0 8px;font-family:\'Playfair Display\',serif;font-size:25px;font-weight:800;color:#f2ecd9;letter-spacing:0;line-height:1.2;">Aramıza hoş geldin, ajan.</h2>' +
      '<p style="margin:0 0 18px;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-size:14px;line-height:1.6;color:#c3c8d3;letter-spacing:0;">' +
        'İlk üyeliğine özel <strong style="color:#e6c478;">%10 indirim</strong>. Kodu kopyala, üye ol ve arşivin kapılarını arala — Studio, hazır dosyalar ve oyunlar seni bekliyor.</p>';

    // indirim kodu kutusu
    var kodBox = document.createElement('button');
    kodBox.style.cssText = 'width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;' +
      'border:1px dashed rgba(193,154,82,.6);background:rgba(193,154,82,.07);padding:14px 16px;margin-bottom:14px;';
    kodBox.innerHTML =
      '<span style="font-size:18px;letter-spacing:.16em;color:#e6c478;font-weight:800;">' + KOD + '</span>' +
      '<span class="ta-kod-durum" style="font-size:10.5px;letter-spacing:.12em;color:#a4a9b5;">KOPYALA →</span>';
    kodBox.onclick = function () {
      var st = kodBox.querySelector('.ta-kod-durum');
      function ok() { if (st) { st.textContent = '✓ KOPYALANDI'; st.style.color = '#9ed3a8'; } }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(KOD).then(ok, ok);
        else { var ta = document.createElement('textarea'); ta.value = KOD; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); ok(); }
      } catch (e) { ok(); }
    };
    card.appendChild(kodBox);

    var cta = document.createElement('a');
    cta.href = '/uyelik';
    cta.textContent = 'ÜCRETSİZ ÜYE OL · KODU KULLAN →';
    cta.style.cssText = 'display:block;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;' +
      'font-weight:800;font-size:12.5px;letter-spacing:.1em;text-decoration:none;padding:15px;';
    cta.onclick = function () { mark(); };
    card.appendChild(cta);

    var skip = document.createElement('button');
    skip.textContent = 'Şimdilik gezineyim';
    skip.style.cssText = 'margin-top:12px;border:0;background:transparent;color:#676d7c;font-size:11.5px;letter-spacing:.06em;cursor:pointer;';
    skip.onclick = close;
    card.appendChild(skip);

    var x = document.createElement('button');
    x.textContent = '✕';
    x.setAttribute('aria-label', 'Kapat');
    x.style.cssText = 'position:absolute;top:10px;right:12px;border:0;background:transparent;color:#565b69;font-size:17px;cursor:pointer;line-height:1;';
    x.onclick = close;
    card.appendChild(x);

    el.appendChild(card);
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    document.body.appendChild(el);
    document.documentElement.style.overflow = 'hidden';
  }

  function maybeShow() {
    if (seen() || loggedIn() || document.querySelector('[data-ta-welcome]')) return;
    build();
  }

  function init() {
    // dc hidrasyonu ve ilk izlenim için kısa gecikme (agresif değil)
    setTimeout(maybeShow, 1400);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // animasyon stilleri
  var s = document.createElement('style');
  s.textContent = '@keyframes ta-w-fade{from{opacity:0}to{opacity:1}}@keyframes ta-w-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}';
  document.head.appendChild(s);
})();

// Tarih Ajanı — AYDINLIK / KARANLIK TEMA
// Sol altta bir düğme; tercih localStorage'da (ta_tema). Karanlık varsayılan.
// Aydınlık mod, site geneli koyu satır-içi renkleri kırık-beyaz/siyah'a
// eşleyen bir CSS ile kurulur (html[data-theme="light"] öneki). Görselli
// hero bölümleri :has() ile korunur (metin açık kalır, zemin şeffaf).
(function () {
  var KEY = 'ta_tema';
  function get() { try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  // ── aydınlık tema kuralları (yalnız data-theme="light" altında) ──
  var L = 'html[data-theme="light"] ';
  // koyu zemin hex'leri → kırık beyaz panel
  var BG = ['#03050b', '#02040a', '#04060c', '#05070d', '#06070d', '#060910', '#070a12', '#08090d', '#080a12', '#0a0d15', '#0a0d16', '#0b0e18', '#0c0a12', '#0c0f18', '#0d0a16'];
  // parlak metin → neredeyse siyah
  var TXT_LIGHT = ['#f2ecd9', '#e9dfc8', '#eadfc6', '#cfc8b4', '#d6d0c2', '#cfd3e0', '#e6e0d0', '#f4e4c1'];
  // gri/ikincil metin → koyu gri
  var TXT_MUTE = ['#a4a9b5', '#818797', '#676d7c', '#8b91a8', '#9aa0ad', '#7c8393', '#b6bcc9', '#a9adba', '#565b69', '#5a6070', '#8f8a7d', '#c3c8d3', '#b9c2d8'];
  // açık altın metin → koyu altın (beyaz üstünde okunur)
  var GOLD_TXT = ['#e6c478', '#d8b26a', '#c19a52', '#e6c478'];

  // dc/React satır-içi stilleri hex'i rgb()'ye çevirir → hem hex hem rgb hedeflenir
  function hexToRgb(h) {
    var n = parseInt(h.slice(1), 16);
    return 'rgb(' + ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ')';
  }
  function sel(colors, prop) {
    var out = [];
    colors.forEach(function (c) {
      var rgb = hexToRgb(c), rgb2 = rgb.replace(/, /g, ',');
      out.push(L + '[style*="' + prop + ': ' + c + '"]');
      out.push(L + '[style*="' + prop + ':' + c + '"]');
      out.push(L + '[style*="' + prop + ': ' + rgb + '"]');
      out.push(L + '[style*="' + prop + ':' + rgb2 + '"]');
    });
    return out.join(',');
  }

  // rgba ile yazılmış yaygın koyu panel/zemin kalıpları (background bağlamı)
  var RGBA_BG = ['4,6,12', '4, 6, 12', '3,5,11', '3, 5, 11', '5,7,13', '5, 7, 13', '6,8,15', '6, 8, 15', '7,10,18', '7, 10, 18', '7,9,15', '7, 9, 15', '9,12,20', '9, 12, 20', '2,4,10', '2, 4, 10'];
  function rgbaBgSel() {
    return RGBA_BG.map(function (c) { return L + '[style*="background: rgba(' + c + '"]'; }).join(',') + ',' +
           RGBA_BG.map(function (c) { return L + '[style*="background:rgba(' + c + '"]'; }).join(',');
  }

  // koyu linear-gradient'li kartlar (ör. background:linear-gradient(135deg,#0a0d16,#070a12))
  var GRAD_DARK = ['#0a0d16', '#070a12', '#0c0f18', '#080a12', '#0b0e18', '#05070d', '#0a0d15', '#0c0a12', '#0d0a16', '#08090d', '#06070d'];
  function gradSel() {
    var out = [];
    GRAD_DARK.forEach(function (c) {
      var rgb = hexToRgb(c), rgb2 = rgb.replace(/, /g, ',');
      out.push(L + '[style*="linear-gradient"][style*="' + c + '"]');
      out.push(L + '[style*="linear-gradient"][style*="' + rgb + '"]');
      out.push(L + '[style*="linear-gradient"][style*="' + rgb2 + '"]');
    });
    return out.join(',');
  }

  var CSS =
    // genel zemin + metin
    'html[data-theme="light"],html[data-theme="light"] body{background:#efe9db !important;color:#211d15 !important;}' +
    // koyu gradient kartlar → açık kart
    gradSel() + '{background:#f6f1e6 !important;}' +
    // sticky header açık zemin (rgba ile yazılı olduğundan doğrudan hedef)
    L + 'header{background:#f3ece0 !important;border-bottom-color:rgba(90,74,40,.18) !important;}' +
    // rgba koyu paneller/kartlar → açık kart
    rgbaBgSel() + '{background-color:#f6f1e6 !important;}' +
    // panel/kart zeminleri
    sel(BG, 'background') + '{background-color:#f8f3e9 !important;}' +
    sel(BG, 'background-color') + '{background-color:#f8f3e9 !important;}' +
    // metinler
    sel(TXT_LIGHT, 'color') + '{color:#221e15 !important;}' +
    sel(TXT_MUTE, 'color') + '{color:#5c5748 !important;}' +
    sel(GOLD_TXT, 'color') + '{color:#8a6417 !important;}' +
    // form alanları
    L + 'input,' + L + 'textarea,' + L + 'select{background:#fff !important;color:#211d15 !important;border-color:rgba(90,70,30,.35) !important;}' +
    L + 'input::placeholder,' + L + 'textarea::placeholder{color:#9a927e !important;}' +
    // gri kenarlıklar biraz koyulaşsın (yaygın kalıplar)
    L + '[style*="rgba(129,135,151"]{border-color:rgba(90,74,40,.22) !important;}' +
    // altın çizgiler light'ta da görünür
    L + 'a:hover{color:#6f4f12 !important;}' +
    // gradient (background-clip:text) başlıklar açık zeminde soluk kalır → düz koyu altın
    L + '[style*="-webkit-background-clip: text"],' + L + '[style*="background-clip: text"]' +
      '{-webkit-text-fill-color:#8a6417 !important;color:#8a6417 !important;background:none !important;}' +
    // GÖRSELLİ HERO KORUMASI: içinde kaplayan görsel olan section şeffaf kalır,
    // metni açık bırakılır (koyu görsel üstünde okunur) — :has() modern tarayıcı
    L + 'section:has(> img[style*="object-fit: cover"]),' +
    L + 'div:has(> img[style*="object-fit: cover"]) > [style*="position: relative"]{background-color:transparent !important;}' +
    L + 'section:has(img[style*="object-fit: cover"]) [style*="color:"]{color:inherit;}' +
    L + 'section:has(img[style*="object-fit: cover"]) h1,' +
    L + 'section:has(img[style*="object-fit: cover"]) h2{color:#f6efdd !important;}';

  function ensureCss() {
    if (document.getElementById('ta-tema-css')) return;
    var s = document.createElement('style');
    s.id = 'ta-tema-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    var b = document.getElementById('ta-tema-btn');
    if (b) { b.textContent = t === 'light' ? '🌙' : '☀'; b.title = t === 'light' ? 'Karanlık moda geç' : 'Aydınlık moda geç'; }
  }

  function ensureButton() {
    ensureCss();
    if (document.getElementById('ta-tema-btn')) return;
    var b = document.createElement('button');
    b.id = 'ta-tema-btn';
    b.setAttribute('aria-label', 'Tema değiştir');
    b.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:998;width:44px;height:44px;border-radius:50%;' +
      'border:1px solid rgba(193,154,82,.5);cursor:pointer;font-size:18px;line-height:1;' +
      'background:rgba(5,7,13,.9);color:#e6c478;box-shadow:0 8px 24px rgba(0,0,0,.4);' +
      'display:grid;place-items:center;';
    b.onclick = function () {
      var next = get() === 'light' ? 'dark' : 'light';
      save(next); apply(next);
    };
    document.body.appendChild(b);
    apply(get());
  }

  // erken uygula (yanıp sönmeyi azalt) — buton sonra gelebilir
  ensureCss();
  document.documentElement.setAttribute('data-theme', get());

  function init() { ensureButton(); setInterval(ensureButton, 4000); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

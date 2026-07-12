// Tarih Ajanı — ARAMA OVERLAY
// Herhangi bir "ARA" bağlantısına/butonuna tıklayınca tam ekran arama
// kutusu açılır ve ODAKLANIR — kullanıcı hemen yazmaya başlar. Enter:
// Ürünler'de arar (/urunler?ara=...). Boş bırakıp Arşiv'i seçebilir.
(function () {
  var FONT = "'Special Elite', 'Courier New', monospace";
  var el = null, input = null;

  function close() {
    if (el && el.parentElement) el.parentElement.removeChild(el);
    el = null; input = null;
    document.documentElement.style.overflow = '';
  }
  function go(base) {
    var q = (input && input.value || '').trim();
    close();
    window.location.href = base + (q ? (base.indexOf('?') >= 0 ? '&' : '?') + 'ara=' + encodeURIComponent(q) : '');
  }
  function open(preset) {
    if (el) { if (input) input.focus(); return; }
    el = document.createElement('div');
    el.setAttribute('data-ta-ara', '1');
    el.style.cssText = 'position:fixed;inset:0;z-index:1250;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;' +
      'padding:14vh 20px 20px;background:rgba(3,4,9,.93);backdrop-filter:blur(8px);font-family:' + FONT + ';';
    el.innerHTML =
      '<div style="font-size:11px;letter-spacing:.26em;color:#c19a52;margin-bottom:16px;">TARİH AJANI · ARŞİVDE ARA</div>';

    var box = document.createElement('div');
    box.style.cssText = 'width:min(620px,100%);display:flex;align-items:center;gap:10px;border-bottom:2px solid rgba(193,154,82,.6);padding-bottom:10px;';
    box.innerHTML = '<span style="font-size:20px;color:#e6c478;">🔍</span>';
    input = document.createElement('input');
    input.type = 'text';
    input.value = preset || '';
    input.placeholder = 'Sezar, Mısır, çelik, üyelik…';
    input.style.cssText = 'flex:1;background:transparent;border:0;outline:0;color:#f2ecd9;font-size:22px;font-family:\'Playfair Display\',serif;min-width:0;';
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') go('/urunler');
      if (e.key === 'Escape') close();
    });
    box.appendChild(input);
    el.appendChild(box);

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;margin-top:22px;';
    function chip(label, base) {
      var b = document.createElement('button');
      b.textContent = label;
      b.style.cssText = 'cursor:pointer;border:1px solid rgba(193,154,82,.45);background:rgba(193,154,82,.07);color:#e6c478;font-family:' + FONT + ';font-size:11px;letter-spacing:.1em;padding:11px 16px;';
      b.onclick = function () { go(base); };
      row.appendChild(b);
    }
    chip('ÜRÜNLERDE ARA →', '/urunler');
    chip('ARŞİVDE ARA →', '/arsiv');
    el.appendChild(row);

    var hint = document.createElement('div');
    hint.style.cssText = 'margin-top:18px;font-size:10.5px;letter-spacing:.1em;color:#676d7c;';
    hint.textContent = 'Enter ile ürünlerde ara · Esc ile kapat';
    el.appendChild(hint);

    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    document.body.appendChild(el);
    document.documentElement.style.overflow = 'hidden';
    setTimeout(function () { input.focus(); }, 50);
  }

  // "ARA" metni içeren linkleri/butonları yakala (delege, capture)
  function isAra(t) {
    var el2 = t && t.nodeType === 1 ? t : (t && t.parentElement);
    if (!el2 || !el2.closest) return null;
    var a = el2.closest('a,button');
    if (!a) return null;
    var href = (a.getAttribute && a.getAttribute('href')) || '';
    var txt = (a.textContent || '').trim().toLocaleLowerCase('tr');
    // /urunler?q veya ?ara ile biten ARA linkleri, ya da metni tam "ara"
    if (/[?&](q|ara)(=|$)/.test(href) && /urunler|arsiv/.test(href)) return a;
    if (txt === 'ara' || txt === '🔍 ara' || /^ara$/.test(txt.replace(/[^\wçğışöü ]/gi, '').trim())) return a;
    return null;
  }
  document.addEventListener('click', function (e) {
    var a = isAra(e.target);
    if (a) { e.preventDefault(); e.stopPropagation(); open(); }
  }, true);
})();

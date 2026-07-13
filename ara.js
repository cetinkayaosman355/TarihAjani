// Tarih Ajanı — ARAMA OVERLAY (gerçek, yerinde arama)
// "ARA" bağlantısına/butonuna tıklayınca tam ekran arama açılır. Yazdıkça
// site içindeki sayfalar, ürünler ve arşiv dosyaları CANLI süzülür; sonuç
// satırına (ya da Enter'a) tıklayınca doğrudan o sayfaya gidilir. Sonuç yoksa
// hiçbir yere yönlendirmez — "saçma yere" gitmez.
(function () {
  var FONT = "'Special Elite', 'Courier New', monospace";
  var el = null, input = null, resBox = null;

  // ── site içi arama dizini (statik hedefler) ──
  var INDEX = [
    { t: 'Studio — Kendi vaka dosyanı üret', u: '/studio', k: 'studio üret senaryo seslendirme görsel video prompt yapay zeka ai' },
    { t: 'Hazır Arşiv — 42 vaka dosyası', u: '/arsiv', k: 'arşiv hazır dosya vaka senaryo prompt tarih' },
    { t: 'Vaka Günlüğü — Tarih blogu', u: '/vaka-gunlugu', k: 'blog günlük vaka hikaye oku makale tarih' },
    { t: 'Vaka Dosyaları — Okuma odası', u: '/vaka-dosyalari', k: 'vakalar hikaye oku e-kitap etrüsk sümer' },
    { t: 'E-Kitaplar', u: '/ekitap', k: 'ekitap kitap pdf set cilt okuma' },
    { t: 'Akademi — İçerik üretim eğitimi', u: '/egitim', k: 'eğitim akademi kurs ders üretim yöntem' },
    { t: 'Üyelik & Seviyeler', u: '/uyelik', k: 'üyelik abonelik seviye gözlemci ajan başmüfettiş kredi fiyat' },
    { t: 'Tüm Ürünler', u: '/urunler', k: 'ürün mağaza satın al fiyat paket' },
    { t: 'Studio Kredi Paketleri', u: '/satis#studio', k: 'kredi paket satın al studio üretim fiyat' },
    { t: 'Oyun Tüneli', u: '/zaman-tuneli', k: 'oyun satranç zaman tüneli eğlence' },
    { t: 'Ücretsiz Örnek Dosya', u: '/ornek', k: 'örnek ücretsiz deneme grek ateşi' },
    { t: 'İletişim', u: '/iletisim', k: 'iletişim mail destek kurumsal' },
    { t: 'Bülten — Yeni dosyalardan haberdar ol', u: '/bulten', k: 'bülten e-posta abone haber' }
  ];

  function low(s) { return String(s || '').toLocaleLowerCase('tr'); }

  // Arşiv başlıklarını dizine ekle (yüklüyse)
  function arsivResults() {
    var A = (typeof window !== 'undefined' && window.__ARSIV__) || [];
    var out = [];
    for (var i = 0; i < A.length; i++) {
      var a = A[i];
      if (!a || !a.baslik) continue;
      out.push({ t: a.baslik, u: '/arsiv', k: low(a.baslik + ' ' + (a.teaser || '') + ' ' + (a.era || '')), tag: 'ARŞİV' });
    }
    return out;
  }

  function search(q) {
    q = low(q).trim();
    var pool = INDEX.map(function (x) { return { t: x.t, u: x.u, k: low(x.t + ' ' + (x.k || '')), tag: 'SAYFA' }; }).concat(arsivResults());
    if (!q) return INDEX.slice(0, 6).map(function (x) { return { t: x.t, u: x.u, tag: 'SAYFA' }; });
    var terms = q.split(/\s+/).filter(Boolean);
    var scored = [];
    for (var i = 0; i < pool.length; i++) {
      var hay = pool[i].k, ok = true, score = 0;
      for (var j = 0; j < terms.length; j++) {
        var idx = hay.indexOf(terms[j]);
        if (idx < 0) { ok = false; break; }
        score += (idx < 30 ? 3 : 1);
      }
      if (ok) scored.push({ r: pool[i], s: score });
    }
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.slice(0, 12).map(function (x) { return x.r; });
  }

  function render() {
    var q = input ? input.value : '';
    var results = search(q);
    resBox.innerHTML = '';
    if (!results.length) {
      var none = document.createElement('div');
      none.style.cssText = 'color:#818797;font-size:13px;letter-spacing:.04em;padding:18px 4px;';
      none.textContent = '“' + q + '” için sonuç yok. Farklı bir kelime dene.';
      resBox.appendChild(none);
      return;
    }
    results.forEach(function (r, i) {
      var a = document.createElement('a');
      a.href = r.u;
      a.setAttribute('data-ta-ara-res', '1');
      a.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;text-decoration:none;' +
        'padding:13px 14px;border:1px solid ' + (i === 0 ? 'rgba(193,154,82,.45)' : 'rgba(129,135,151,.16)') + ';' +
        'background:' + (i === 0 ? 'rgba(193,154,82,.08)' : 'rgba(8,11,19,.6)') + ';margin-bottom:8px;';
      a.innerHTML =
        '<span style="color:#e9dfc8;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-size:14.5px;font-weight:600;line-height:1.35;">' +
        r.t.replace(/[<>]/g, '') + '</span>' +
        '<span style="flex-shrink:0;color:#8a7a4e;font-family:' + FONT + ';font-size:9px;letter-spacing:.16em;">' + (r.tag || '') + ' →</span>';
      a.addEventListener('mouseenter', function () { a.style.borderColor = 'rgba(193,154,82,.55)'; });
      a.addEventListener('click', function () { close(); });
      resBox.appendChild(a);
    });
  }

  function close() {
    if (el && el.parentElement) el.parentElement.removeChild(el);
    el = null; input = null; resBox = null;
    document.documentElement.style.overflow = '';
  }
  function goFirst() {
    var results = search(input ? input.value : '');
    if (results.length) { var u = results[0].u; close(); window.location.href = u; }
  }

  function open(preset) {
    if (el) { if (input) input.focus(); return; }
    el = document.createElement('div');
    el.setAttribute('data-ta-ara', '1');
    el.style.cssText = 'position:fixed;inset:0;z-index:1250;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;' +
      'padding:12vh 20px 20px;background:rgba(3,4,9,.94);backdrop-filter:blur(8px);font-family:' + FONT + ';';
    el.innerHTML = '<div style="font-size:11px;letter-spacing:.26em;color:#c19a52;margin-bottom:16px;">TARİH AJANI · SİTEDE ARA</div>';

    var box = document.createElement('div');
    box.style.cssText = 'width:min(640px,100%);display:flex;align-items:center;gap:10px;border-bottom:2px solid rgba(193,154,82,.6);padding-bottom:10px;';
    box.innerHTML = '<span style="font-size:20px;color:#e6c478;">🔍</span>';
    input = document.createElement('input');
    input.type = 'text';
    input.value = preset || '';
    input.placeholder = 'Sezar, Mısır, çelik, üyelik, studio…';
    input.style.cssText = 'flex:1;background:transparent;border:0;outline:0;color:#f2ecd9;font-size:22px;font-family:\'Playfair Display\',serif;min-width:0;';
    input.addEventListener('input', render);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); goFirst(); }
      if (e.key === 'Escape') close();
    });
    box.appendChild(input);
    el.appendChild(box);

    resBox = document.createElement('div');
    resBox.style.cssText = 'width:min(640px,100%);margin-top:20px;max-height:58vh;overflow-y:auto;';
    el.appendChild(resBox);

    var hint = document.createElement('div');
    hint.style.cssText = 'margin-top:14px;font-size:10.5px;letter-spacing:.1em;color:#676d7c;';
    hint.textContent = 'Enter ile ilk sonuca git · Esc ile kapat';
    el.appendChild(hint);

    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    document.body.appendChild(el);
    document.documentElement.style.overflow = 'hidden';
    render();
    setTimeout(function () { input.focus(); }, 50);
  }

  // "ARA" metni içeren linkleri/butonları yakala (delege, capture)
  function isAra(t) {
    var el2 = t && t.nodeType === 1 ? t : (t && t.parentElement);
    if (!el2 || !el2.closest) return null;
    if (el2.closest('[data-ta-ara-res]')) return null;   // sonuç linkine tıklama geçsin
    var a = el2.closest('a,button');
    if (!a) return null;
    var href = (a.getAttribute && a.getAttribute('href')) || '';
    var txt = (a.textContent || '').trim().toLocaleLowerCase('tr');
    if (/[?&](q|ara)(=|$)/.test(href) && /urunler|arsiv/.test(href)) return a;
    if (txt === 'ara' || txt === '🔍 ara' || /^ara$/.test(txt.replace(/[^\wçğışöü ]/gi, '').trim())) return a;
    return null;
  }
  function handle(e) {
    var a = isAra(e.target);
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    open();
  }
  window.addEventListener('click', handle, true);
  document.addEventListener('click', handle, true);
})();

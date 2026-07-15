/* sosyal-kanit.js — gerçek sosyal kanıt widget'ı (rapor 2.6)
   #ta-sosyal-kanit yer tutucusuna monte olur. Canlı sayaçlar (gerçek DB verisi:
   üye + Studio üretimi) + onaylı kullanıcı yorumları + yorum bırakma formu.
   Uydurma yorum YOK: yorumlar gerçek ziyaretçilerden gelir, admin onaylar.
   dc yeniden render ederse önbellekten yeniden çizer (tekrar veri çekmez). */
(function () {
  'use strict';

  var FN = 'https://ddyuopqcvpzaysnfavqc.supabase.co/functions/v1/sosyal-kanit';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXVvcHFjdnB6YXlzbmZhdnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzAxMjAsImV4cCI6MjA5ODkwNjEyMH0.0nTnXFFrPNlxWC_MIeRwqBCqgdYX_tG7WVUbsj0B6Cc';

  var state = { loading: false, loaded: false, stats: null, reviews: [], rating: 0, sending: false, done: false, err: '', showForm: false };

  function api(payload) {
    return fetch(FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + ANON },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).catch(function () { return { ok: false }; });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function fmt(n) { return (Number(n) || 0).toLocaleString('tr-TR'); }
  function stars(n) {
    n = Math.round(Number(n) || 0);
    var out = '';
    for (var i = 1; i <= 5; i++) out += (i <= n ? '★' : '☆');
    return out;
  }

  var CSS = ''
    + '#ta-sosyal-kanit .sk-grid{display:grid;grid-template-columns:.82fr 1.18fr;gap:clamp(28px,3.4vw,56px);align-items:start;max-width:1240px;margin:0 auto}'
    + '#ta-sosyal-kanit .sk-left{min-width:0}'
    + '#ta-sosyal-kanit .sk-right{display:grid;gap:12px}'
    + '#ta-sosyal-kanit .sk-card{position:relative;border:1px solid rgba(193,154,82,.22);background:linear-gradient(160deg,#0b0e16,#070a11);padding:15px 18px;overflow:hidden}'
    + '#ta-sosyal-kanit .sk-card .qm{position:absolute;top:-4px;right:14px;font-family:\'Playfair Display\',serif;font-size:54px;line-height:1;color:rgba(193,154,82,.13);pointer-events:none}'
    + '#ta-sosyal-kanit .sk-stars{color:#e6c478;font-size:11px;letter-spacing:2px;margin-bottom:8px}'
    + '#ta-sosyal-kanit .sk-quote{font-family:\'Playfair Display\',serif;font-style:italic;font-size:14.5px;line-height:1.55;color:#e6e1d3;margin:0 0 12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}'
    + '#ta-sosyal-kanit .sk-who{display:flex;align-items:center;gap:10px}'
    + '#ta-sosyal-kanit .sk-av{flex:0 0 auto;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-family:\'Playfair Display\',serif;font-weight:700;font-size:13px;color:#e6c478;border:1px solid rgba(193,154,82,.5);background:rgba(193,154,82,.08)}'
    + '#ta-sosyal-kanit .sk-name{color:#f2ecd9;font-size:12.5px;font-weight:600;line-height:1.25}'
    + '#ta-sosyal-kanit .sk-badge{color:#8f96a4;font-family:\'Special Elite\',monospace;font-size:8.5px;letter-spacing:.04em}'
    + '#ta-sosyal-kanit .sk-badge .v{color:#7ba05a}'
    // placeholder — ileride dolacak
    + '#ta-sosyal-kanit .sk-ph{border-style:dashed;border-color:rgba(193,154,82,.18);background:linear-gradient(160deg,#090c13,#06080d)}'
    + '#ta-sosyal-kanit .sk-ph .bar{height:9px;border-radius:3px;background:linear-gradient(90deg,rgba(230,220,196,.04),rgba(230,220,196,.11),rgba(230,220,196,.04));background-size:200% 100%;animation:sk-sh 1.7s linear infinite;margin-bottom:9px}'
    + '#ta-sosyal-kanit .sk-ph .bar.w1{width:90%}#ta-sosyal-kanit .sk-ph .bar.w2{width:74%}#ta-sosyal-kanit .sk-ph .bar.w3{width:52%}'
    + '#ta-sosyal-kanit .sk-ph .sk-who{margin-top:12px;opacity:.7}'
    + '#ta-sosyal-kanit .sk-ph .sk-av{color:#5a5f6c;border-color:rgba(129,135,151,.3);background:rgba(129,135,151,.06)}'
    + '#ta-sosyal-kanit .sk-ph .sk-soon{font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:.14em;color:#6f7686}'
    + '@keyframes sk-sh{0%{background-position:200% 0}100%{background-position:-200% 0}}'
    + '@media(max-width:820px){#ta-sosyal-kanit .sk-grid{grid-template-columns:1fr;gap:26px}#ta-sosyal-kanit .sk-left{text-align:center}}'
    + '@media(prefers-reduced-motion:reduce){#ta-sosyal-kanit .sk-ph .bar{animation:none}}';

  function injectStyle(){ if(document.getElementById('ta-sk-style'))return; var s=document.createElement('style'); s.id='ta-sk-style'; s.textContent=CSS; document.head.appendChild(s); }

  function mount(force) {
    var host = document.getElementById('ta-sosyal-kanit');
    if (!host) return;
    if (!force && host.querySelector('#ta-sk-root')) return; // zaten çizili
    injectStyle();
    host.innerHTML = render();
    wire(host);
    animateCounters(host);
  }

  function realCard(r) {
    var name = esc(r.name || 'Ajan');
    var initial = ((r.name || 'A').trim().charAt(0) || 'A').toUpperCase();
    var tier = r.tier ? esc(r.tier) + ' · ' : '';
    return '<figure class="sk-card" style="margin:0;">' +
      '<span class="qm" aria-hidden="true">”</span>' +
      '<div class="sk-stars">' + stars(r.rating) + '</div>' +
      '<blockquote class="sk-quote">“' + esc(r.body) + '”</blockquote>' +
      '<figcaption class="sk-who">' +
        '<span class="sk-av">' + initial + '</span>' +
        '<span style="min-width:0;">' +
          '<span class="sk-name">' + name + '</span>' +
          '<span class="sk-badge" style="display:block;">' + tier + '<span class="v">✓</span> doğrulanmış</span>' +
        '</span>' +
      '</figcaption>' +
    '</figure>';
  }
  function phCard() {
    return '<div class="sk-card sk-ph" aria-hidden="true">' +
      '<span class="qm">”</span>' +
      '<div class="bar w1"></div><div class="bar w2"></div><div class="bar w3"></div>' +
      '<div class="sk-who"><span class="sk-av">·</span><span style="min-width:0;">' +
        '<span class="sk-name" style="color:#7f8593;">Onaylı yorum</span>' +
        '<span class="sk-soon" style="display:block;">yakında burada</span>' +
      '</span></div>' +
    '</div>';
  }

  function render() {
    var st = state.stats || {};
    var members = st.members || 0;
    var productions = st.productions || 0;

    // Güven satırı: yorum olsun olmasın GERÇEK sayılar hep görünsün (uydurma yok).
    var trustBits = [];
    if (members) trustBits.push(fmt(members) + ' kayıtlı ajan');
    if (productions) trustBits.push(fmt(productions) + ' üretilen bölüm');
    var ratingLine;
    if (st.reviews > 0) {
      ratingLine = '<span style="color:#e6c478;font-size:15px;letter-spacing:2px;vertical-align:middle;">' + stars(st.avgRating) + '</span>' +
        '<span style="color:#b7bcc7;font-size:12.5px;margin-left:8px;">' + st.avgRating + ' / 5 · ' + fmt(st.reviews) + ' değerlendirme' +
        (trustBits.length ? ' · ' + trustBits.join(' · ') : '') + '</span>';
    } else if (trustBits.length) {
      ratingLine = '<span style="color:#b7bcc7;font-size:12.5px;">' + trustBits.join(' · ') +
        '</span><span style="color:#9aa0ad;font-size:12.5px;margin-left:8px;">&middot; ilk değerlendirmeyi sen bırak</span>';
    } else {
      ratingLine = '<span style="color:#9aa0ad;font-size:12.5px;">İlk değerlendirmeyi sen bırak — deneyimini paylaş.</span>';
    }

    // Sağ sütun: HER ZAMAN 3 kart. Gerçek onaylı yorumlar öne dolar; kalan yerler
    // "ileride dolacak" placeholder olarak durur (uydurma yorum YOK).
    var cardsHtml = '';
    for (var i = 0; i < 3; i++) {
      cardsHtml += state.reviews[i] ? realCard(state.reviews[i]) : phCard();
    }
    var reviewsHtml = '<div class="sk-right">' + cardsHtml + '</div>';

    var formHtml;
    if (state.done) {
      formHtml = '<div style="margin-top:18px;border:1px solid rgba(122,168,116,.4);background:rgba(122,168,116,.08);color:#a8c8a2;padding:14px 16px;font-size:13px;line-height:1.6;text-align:center;">' +
        'Teşekkürler! Değerlendirmen alındı. Onaylandıktan sonra burada yayınlanacak.</div>';
    } else if (!state.showForm) {
      // varsayılan görünüm sade kalsın — form talep üzerine açılır
      formHtml = '<div style="text-align:center;margin-top:18px;">' +
        '<button id="ta-sk-open" type="button" style="cursor:pointer;background:none;border:0;color:#c19a52;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-size:12.5px;font-weight:600;letter-spacing:.02em;text-decoration:underline;text-underline-offset:3px;padding:6px;">Sen de deneyimini paylaş →</button>' +
      '</div>';
    } else {
      var starPick = '';
      for (var i = 1; i <= 5; i++) {
        starPick += '<button type="button" class="ta-sk-star" data-v="' + i + '" style="background:transparent;border:0;cursor:pointer;font-size:26px;line-height:1;padding:0 2px;color:' + (i <= state.rating ? '#e6c478' : '#4a4f5c') + ';">' + (i <= state.rating ? '★' : '☆') + '</button>';
      }
      formHtml = '<div id="ta-sk-form" style="margin-top:22px;border-top:1px solid rgba(193,154,82,.16);padding-top:20px;max-width:560px;">' +
        '<p style="margin:0 0 4px;color:#c19a52;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.18em;">DENEYİMİNİ PAYLAŞ</p>' +
        '<div style="display:flex;align-items:center;gap:6px;margin:8px 0 12px;">' + starPick + '</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">' +
          '<input id="ta-sk-name" placeholder="Adın (opsiyonel)" style="flex:1;min-width:160px;border:1px solid rgba(129,135,151,.3);background:#060910;color:#f2ecd9;padding:11px 13px;font-size:13.5px;font-family:inherit;">' +
          '<input id="ta-sk-tier" placeholder="Seviyen (opsiyonel)" style="flex:1;min-width:160px;border:1px solid rgba(129,135,151,.3);background:#060910;color:#f2ecd9;padding:11px 13px;font-size:13.5px;font-family:inherit;">' +
        '</div>' +
        '<textarea id="ta-sk-text" rows="3" placeholder="Tarih Ajanı deneyimini birkaç cümleyle anlat…" style="width:100%;resize:vertical;border:1px solid rgba(129,135,151,.3);background:#060910;color:#f2ecd9;padding:12px 13px;font-size:13.5px;font-family:inherit;line-height:1.6;"></textarea>' +
        (state.err ? '<p style="margin:8px 0 0;color:#e8a9a9;font-size:12px;">' + esc(state.err) + '</p>' : '') +
        '<div style="margin-top:12px;">' +
          '<button id="ta-sk-send" style="border:0;cursor:pointer;padding:12px 22px;font-family:\'Special Elite\',monospace;font-weight:700;font-size:11.5px;letter-spacing:.12em;color:#171207;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);">' + (state.sending ? 'GÖNDERİLİYOR…' : 'DEĞERLENDİRMEYİ GÖNDER') + '</button>' +
        '</div>' +
      '</div>';
    }

    return '<div id="ta-sk-root" class="sk-grid">' +
      '<div class="sk-left">' +
        '<p style="margin:0 0 6px;color:#c19a52;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.24em;">AJAN DEFTERİ · GERÇEK GÖRÜŞLER</p>' +
        '<h2 style="margin:0;font-family:\'Playfair Display\',serif;font-size:clamp(30px,3.8vw,48px);font-weight:800;line-height:1.05;color:#f2ecd9;">Ajanlar ne <span style="color:#e6c478;">diyor?</span></h2>' +
        '<div style="width:58px;height:2px;margin:14px 0 0;background:linear-gradient(90deg,#c19a52,transparent);"></div>' +
        '<p style="margin:16px 0 0;color:#aeb4c1;font-size:14.5px;line-height:1.62;max-width:40ch;">Gerçek ziyaretçilerden gelen, admin onaylı görüşler burada birikiyor. Sen de deneyimini bırak; onaylandığında yanda yayınlanır.</p>' +
        '<div style="margin-top:14px;">' + ratingLine + '</div>' +
        formHtml +
      '</div>' +
      reviewsHtml +
    '</div>';
  }

  function wire(host) {
    var stars = host.querySelectorAll('.ta-sk-star');
    stars.forEach(function (b) {
      b.addEventListener('click', function () {
        state.rating = Number(b.getAttribute('data-v')) || 0;
        state.err = '';
        redraw(host);
      });
    });
    var send = host.querySelector('#ta-sk-send');
    if (send) send.addEventListener('click', function () { submit(host); });
    var open = host.querySelector('#ta-sk-open');
    if (open) open.addEventListener('click', function () { state.showForm = true; redraw(host); });
  }

  function submit(host) {
    if (state.sending) return;
    var name = (host.querySelector('#ta-sk-name') || {}).value || '';
    var tier = (host.querySelector('#ta-sk-tier') || {}).value || '';
    var text = (host.querySelector('#ta-sk-text') || {}).value || '';
    if (!state.rating) { state.err = 'Lütfen 1-5 yıldız seç.'; redraw(host); return; }
    if (text.trim().length < 8) { state.err = 'Yorumun biraz daha uzun olsun.'; redraw(host); return; }
    state.sending = true; state.err = ''; redraw(host);
    api({ action: 'submit', name: name, tier: tier, rating: state.rating, text: text }).then(function (d) {
      state.sending = false;
      if (d && d.ok) { state.done = true; }
      else { state.err = (d && d.error) || 'Gönderilemedi, tekrar dene.'; }
      redraw(host);
    });
  }

  // Yıldız seçimi/hata gibi anlık durumlarda formu yeniden çiz (sayaç animasyonu tekrar oynamasın)
  function redraw(host) {
    host.innerHTML = render();
    wire(host);
    var nums = host.querySelectorAll('.ta-sk-num');
    nums.forEach(function (el) { el.textContent = fmt(el.getAttribute('data-to')); });
  }

  function animateCounters(host) {
    var nums = host.querySelectorAll('.ta-sk-num');
    nums.forEach(function (el) {
      var to = Number(el.getAttribute('data-to')) || 0;
      if (to <= 0) { el.textContent = '0'; return; }
      var start = performance.now(), dur = 1100;
      function step(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(Math.round(to * eased));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function load(attempt) {
    if (state.loading) return;
    state.loading = true;
    Promise.all([api({ action: 'stats' }), api({ action: 'list', limit: 6 })]).then(function (res) {
      var statsOk = res[0] && res[0].ok;
      var listOk = res[1] && res[1].ok && res[1].reviews;
      // Edge fonksiyonu cold-start'ta ilk isteği düşürebilir: ikisi de başarısızsa
      // bir kez daha dene ki yorumlar geçici bir hatadan ötürü kaybolmasın.
      if (!statsOk && !listOk && (attempt || 0) < 2) {
        state.loading = false;
        setTimeout(function () { load((attempt || 0) + 1); }, 1200);
        return;
      }
      state.stats = statsOk ? res[0] : { members: 0, productions: 0, reviews: 0, avgRating: 0 };
      state.reviews = listOk ? res[1].reviews : [];
      state.loaded = true;
      ensure();
    });
  }

  /* TEK SEFERLİK çizim kuralı: dc'nin React'ı açılışta gövdeyi birkaç geçişte
     işler ve bu sırada yabancı düğümlerin referansını tutabilir. Aynı kutuya
     iki kez innerHTML basmak (önce yer tutucu, sonra veriyle) React'ın elindeki
     eski kökü koparıp "removeChild ... not a child" çökmesine yol açıyordu.
     Bu yüzden: veri hazır olana dek HİÇ çizme; hazır olunca bir kez çiz; ancak
     dc kutuyu boşaltırsa (kök kaybolursa) yeniden çiz. */
  function ensure() {
    var host = document.getElementById('ta-sosyal-kanit');
    if (!host) return;                       // yalnız yer tutucu olan sayfada
    if (!state.loading) load();              // ilk görüşte veriyi çekmeye başla
    if (!state.loaded) return;               // veri gelmeden asla innerHTML basma
    if (host.querySelector('#ta-sk-root')) return; // zaten çizili
    mount(true);
  }

  function start() {
    ensure();
    // dc gövdeyi bizden sonra render edebilir ya da yeniden çizebilir:
    // sınırlı aralıklarla yeniden dene (senkron MutationObserver dc'yi kırar)
    var ticks = 0;
    var iv = setInterval(function () {
      ensure();
      if (++ticks > 40) { clearInterval(iv); setInterval(ensure, 4000); } // sonrasında seyrek bekçi
    }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

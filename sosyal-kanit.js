/* sosyal-kanit.js — gerçek sosyal kanıt widget'ı (rapor 2.6)
   #ta-sosyal-kanit yer tutucusuna monte olur. Canlı sayaçlar (gerçek DB verisi:
   üye + Studio üretimi) + onaylı kullanıcı yorumları + yorum bırakma formu.
   Uydurma yorum YOK: yorumlar gerçek ziyaretçilerden gelir, admin onaylar.
   dc yeniden render ederse önbellekten yeniden çizer (tekrar veri çekmez). */
(function () {
  'use strict';

  var FN = 'https://ddyuopqcvpzaysnfavqc.supabase.co/functions/v1/sosyal-kanit';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXVvcHFjdnB6YXlzbmZhdnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzAxMjAsImV4cCI6MjA5ODkwNjEyMH0.0nTnXFFrPNlxWC_MIeRwqBCqgdYX_tG7WVUbsj0B6Cc';

  var state = { loading: false, loaded: false, stats: null, reviews: [], rating: 0, sending: false, done: false, err: '' };

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

  function mount(force) {
    var host = document.getElementById('ta-sosyal-kanit');
    if (!host) return;
    if (!force && host.querySelector('#ta-sk-root')) return; // zaten çizili
    host.innerHTML = render();
    wire(host);
    animateCounters(host);
  }

  function render() {
    var st = state.stats || {};
    // Canlı sayaçlar + doğrulanabilir ürün gerçekleri (hepsi gerçek)
    var stats = [
      { val: st.members || 0, label: 'KAYITLI AJAN', live: true },
      { val: st.productions || 0, label: 'STUDIO ÜRETİMİ', live: true },
      { val: 42, label: 'HAZIR VAKA DOSYASI', live: false },
      { val: 9, label: 'DERSLİK AKADEMİ', live: false }
    ];
    var statHtml = stats.map(function (s) {
      return '<div style="text-align:center;padding:6px 10px;">' +
        '<div class="ta-sk-num" data-to="' + s.val + '" style="font-family:\'Playfair Display\',serif;font-weight:800;font-size:34px;color:#e6c478;line-height:1;">0</div>' +
        '<div style="margin-top:7px;font-family:\'Special Elite\',monospace;font-size:9.5px;letter-spacing:.14em;color:#818797;">' + s.label + '</div>' +
      '</div>';
    }).join('');

    var ratingLine = (st.reviews > 0)
      ? '<span style="color:#e6c478;font-size:15px;letter-spacing:2px;">' + stars(st.avgRating) + '</span>' +
        '<span style="color:#a4a9b5;font-size:12.5px;margin-left:8px;">' + st.avgRating + ' / 5 · ' + fmt(st.reviews) + ' değerlendirme</span>'
      : '<span style="color:#818797;font-size:12.5px;">İlk değerlendirmeyi sen bırak — deneyimini paylaş.</span>';

    // minimal vitrin: en fazla 3 yorum, kısa kesilmiş metin (premium sade görünüm)
    var reviewsHtml = '';
    if (state.reviews.length) {
      reviewsHtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-top:20px;">' +
        state.reviews.slice(0, 3).map(function (r) {
          var who = esc(r.name || 'Ajan') + (r.tier ? ' · ' + esc(r.tier) : '');
          return '<div style="border:1px solid rgba(193,154,82,.22);background:#070a12;padding:12px 14px;">' +
            '<div style="color:#e6c478;font-size:11px;letter-spacing:2px;">' + stars(r.rating) + '</div>' +
            '<p style="margin:7px 0 8px;color:#cfd3e0;font-size:13px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">' + esc(r.body) + '</p>' +
            '<div style="font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.08em;color:#818797;">— ' + who + '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    }

    var formHtml;
    if (state.done) {
      formHtml = '<div style="margin-top:20px;border:1px solid rgba(122,168,116,.4);background:rgba(122,168,116,.08);color:#a8c8a2;padding:16px 18px;font-size:13.5px;line-height:1.6;">' +
        'Teşekkürler! Değerlendirmen alındı. Onaylandıktan sonra burada yayınlanacak.</div>';
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

    return '<div id="ta-sk-root">' +
      '<div style="text-align:center;margin-bottom:6px;">' +
        '<p style="margin:0 0 6px;color:#c19a52;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.24em;">SAHADAN · GERÇEK AJANLAR</p>' +
        '<h2 style="margin:0;font-family:\'Playfair Display\',serif;font-size:clamp(26px,3vw,33px);font-weight:800;color:#f2ecd9;">Ajanlar ne <span style="color:#e6c478;">diyor?</span></h2>' +
        '<div style="width:58px;height:2px;margin:13px auto 0;background:linear-gradient(90deg,transparent,#c19a52,transparent);"></div>' +
        '<div style="margin-top:12px;">' + ratingLine + '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-top:22px;border:1px solid rgba(193,154,82,.18);background:#05070d;padding:20px 10px;">' + statHtml + '</div>' +
      reviewsHtml +
      formHtml +
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

  function load() {
    if (state.loading) return;
    state.loading = true;
    Promise.all([api({ action: 'stats' }), api({ action: 'list', limit: 6 })]).then(function (res) {
      state.stats = (res[0] && res[0].ok) ? res[0] : { members: 0, productions: 0, reviews: 0, avgRating: 0 };
      state.reviews = (res[1] && res[1].ok && res[1].reviews) ? res[1].reviews : [];
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

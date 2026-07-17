/* ============================================================================
   STORIA — Studio (vanilla SPA)
   Wizard: fikir → tarz → üretim → dosya.
   Config'te Supabase dolu değilse DEMO MODU (kurulumsuz denenebilir).
   Doluysa GERÇEK MOD: storia-generate edge function + Supabase auth/kredi.
   ========================================================================= */
(function () {
  'use strict';
  var CFG = window.STORIA_CONFIG || {};
  var REAL = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  var FN = (CFG.functionName || 'storia-generate');
  var app = document.getElementById('app');
  var sb = null;

  // ── State ────────────────────────────────────────────────────────────
  var S = {
    step: 1,
    idea: '',
    tone: 'merak',
    voiceIdx: 0,
    style: 'sinematik',
    aspect: '16:9',
    durationSec: 270,
    provider: 'claude',
    custom: '',
    result: null,
    tab: 'senaryo',
    genJob: null,
    user: null,
    credits: REAL ? null : 500,
    images: {},   // idx -> url
    audio: null
  };

  // ── Data ─────────────────────────────────────────────────────────────
  var IDEAS = [
    'Okyanusun en derin noktasında ne var?',
    'Parayı kim, neden icat etti?',
    'Rüyalar neden bu kadar tuhaf?',
    'Evrenin sonu nasıl olacak?',
    'Kahve vücuduna tam olarak ne yapıyor?',
    'Yapay zekâ gerçekten düşünebilir mi?',
    'Uykusuzluk beynine neler yapar?',
    'Kayıp şehir Atlantis efsanesi',
    'Kediler bizi neden evcilleştirdi?',
    'Işık hızında gitseydik ne olurdu?',
    'Beynini kandıran 3 psikolojik tuzak',
    'Müzik beynini nasıl değiştirir?',
    'Everest’in zirvesinde bir gün',
    'Bir saniyede dünyada neler oluyor?',
    'Zaman gerçekten var mı?',
    'Milyarderlerin ortak 5 alışkanlığı'
  ];
  var TONES = [
    { id: 'merak', name: 'Merak uyandıran' },
    { id: 'dramatik', name: 'Dramatik' },
    { id: 'belgesel', name: 'Belgesel' },
    { id: 'destansi', name: 'Destansı' },
    { id: 'samimi', name: 'Samimi' },
    { id: 'enerjik', name: 'Enerjik' }
  ];
  var VOICES = [
    { name: 'Derin Erkek', desc: 'Sıcak, güven veren', ov: 'onyx' },
    { name: 'Anlatıcı', desc: 'Net, dengeli', ov: 'echo' },
    { name: 'Gizemli', desc: 'Alçak, merak uyandıran', ov: 'ash' },
    { name: 'Enerjik', desc: 'Genç, dinamik', ov: 'nova' },
    { name: 'Belgesel Kadın', desc: 'Olgun, akıcı', ov: 'sage' },
    { name: 'Sıcak Kadın', desc: 'Samimi, davetkâr', ov: 'shimmer' }
  ];
  var STYLES = [
    { id: 'sinematik', name: 'Sinematik', desc: 'Film karesi, dramatik ışık', en: 'cinematic film still, dramatic lighting, shallow depth of field, 35mm' },
    { id: 'fotogercek', name: 'Foto-gerçekçi', desc: 'Gerçek fotoğraf dokusu', en: 'photorealistic, natural light, high detail, DSLR photograph' },
    { id: 'render3d', name: '3D Render', desc: 'Hacimli, sinematik render', en: 'high-end 3D render, volumetric light, octane, subsurface detail' },
    { id: 'illus', name: 'İllüstrasyon', desc: 'Modern dijital çizim', en: 'modern digital illustration, clean shapes, editorial style' },
    { id: 'anime', name: 'Anime', desc: 'Japon animasyon estetiği', en: 'anime style, cel shading, vivid, studio-quality key visual' },
    { id: 'minimal', name: 'Minimal', desc: 'Sade, zarif, geometrik', en: 'minimalist, elegant, geometric, refined negative space' }
  ];
  var MODES = [
    { name: 'Kısa Video', desc: '60 sn · Dikey 9:16', sec: 60, aspect: '9:16', tone: 'enerjik' },
    { name: 'Uzun Video', desc: '8 dk · Yatay 16:9', sec: 480, aspect: '16:9', tone: 'merak' },
    { name: 'Belgesel', desc: '10 dk · Yatay 16:9', sec: 600, aspect: '16:9', tone: 'belgesel' }
  ];
  var GRADS = [
    'linear-gradient(135deg,#efe6d2,#c2a160)', 'linear-gradient(135deg,#e0c588,#9c7b3b)',
    'linear-gradient(135deg,#f3ecdc,#d9bc80)', 'linear-gradient(135deg,#d8b98a,#8b6c31)',
    'linear-gradient(135deg,#ead9b6,#b4914d)', 'linear-gradient(135deg,#f7efdb,#cba968)'
  ];

  // ── Helpers ──────────────────────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function fmtDur(sec) { if (sec < 60) return sec + ' sn'; var m = Math.round(sec / 60); return m + ' dk'; }
  function costGen(sec) { return Math.max(30, Math.round((20 + sec / 4) / 5) * 5); }
  function sceneFor(sec) { return Math.max(6, Math.round(120 * sec / (600 + sec))); }
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function copy(text) { try { navigator.clipboard.writeText(text); toast('Kopyalandı'); } catch (e) { toast('Kopyalanamadı'); } }
  function styleObj() { for (var i = 0; i < STYLES.length; i++) if (STYLES[i].id === S.style) return STYLES[i]; return STYLES[0]; }

  // ── Header ───────────────────────────────────────────────────────────
  function refreshHeader() {
    document.getElementById('creditNum').textContent = (S.credits == null ? '—' : S.credits);
    var badge = document.getElementById('modeBadge');
    if (badge) badge.hidden = REAL;
    var acct = document.getElementById('acctBtn');
    if (S.user) { acct.textContent = 'Çıkış'; }
    else { acct.textContent = REAL ? 'Giriş' : 'Demo'; }
  }

  // ── Render dispatcher ────────────────────────────────────────────────
  function render() {
    var html = stepper();
    if (S.step === 1) html += renderStep1();
    else if (S.step === 2) html += renderStep2();
    else if (S.step === 3) html += renderStep3();
    else if (S.step === 4) html += renderStep4();
    app.innerHTML = '<div class="st-main"><div class="step-panel">' + html + '</div></div>';
    bindDynamic();
    refreshHeader();
  }

  function stepper() {
    var steps = ['Fikir', 'Tarz', 'Üretim', 'Dosya'];
    var h = '<div class="stepper">';
    for (var i = 0; i < steps.length; i++) {
      var n = i + 1;
      var cls = n === S.step ? 'on' : (n < S.step ? 'done' : '');
      h += '<div class="s ' + cls + '"><span class="dot">' + (n < S.step ? '✓' : n) + '</span><span class="lbl">' + steps[i] + '</span></div>';
      if (i < steps.length - 1) h += '<span class="bar"></span>';
    }
    return h + '</div>';
  }

  // ── Step 1 — idea ────────────────────────────────────────────────────
  function renderStep1() {
    var chips = IDEAS.slice(0, 4).map(function (t) {
      return '<button class="chip" data-act="useIdea" data-v="' + esc(t) + '"><span class="dot"></span>' + esc(t) + '</button>';
    }).join('');
    return '<div class="idea-wrap">' +
      '<span class="eyebrow center" style="justify-content:center">Yeni dosya</span>' +
      '<h1 class="display" style="margin-top:14px">Ne anlatmak<br>istiyorsun?</h1>' +
      '<p class="sub">Bir cümle yeter. Gerisini Storia halleder.</p>' +
      '<div class="idea-box">' +
        '<textarea class="field" id="ideaInput" placeholder="Örn: Okyanusun en derin noktasında ne var?">' + esc(S.idea) + '</textarea>' +
        '<div class="idea-tools">' +
          '<button class="btn btn-quiet btn-sm" data-act="suggest">✦ Sen öner</button>' +
          '<span style="font-size:13px;color:var(--muted)" id="ideaCount"></span>' +
        '</div>' +
      '</div>' +
      '<div class="idea-suggest">' + chips + '</div>' +
      '<div class="idea-actions">' +
        '<button class="btn btn-gold btn-lg" data-act="toStep2">Devam et →</button>' +
      '</div>' +
    '</div>';
  }

  // ── Step 2 — style ───────────────────────────────────────────────────
  function renderStep2() {
    var sec = S.durationSec;
    var toneSeg = TONES.map(function (t) { return '<button class="' + (S.tone === t.id ? 'on' : '') + '" data-act="tone" data-v="' + t.id + '">' + esc(t.name) + '</button>'; }).join('');
    var voiceTiles = VOICES.map(function (v, i) {
      return '<div class="tile ' + (S.voiceIdx === i ? 'on' : '') + '" data-act="voice" data-v="' + i + '"><div class="t-name">' + esc(v.name) + '</div><div class="t-desc">' + esc(v.desc) + '</div></div>';
    }).join('');
    var styleTiles = STYLES.map(function (st) {
      return '<div class="tile ' + (S.style === st.id ? 'on' : '') + '" data-act="style" data-v="' + st.id + '"><div class="t-name">' + esc(st.name) + '</div><div class="t-desc">' + esc(st.desc) + '</div></div>';
    }).join('');
    var aspects = [
      { id: '16:9', w: 34, h: 20, lbl: 'Yatay 16:9' },
      { id: '9:16', w: 20, h: 34, lbl: 'Dikey 9:16' },
      { id: '1:1', w: 26, h: 26, lbl: 'Kare 1:1' }
    ].map(function (a) {
      return '<div class="aspect ' + (S.aspect === a.id ? 'on' : '') + '" data-act="aspect" data-v="' + a.id + '"><span class="frame" style="width:' + a.w + 'px;height:' + a.h + 'px"></span><span class="a-lbl">' + a.lbl + '</span></div>';
    }).join('');
    var modes = MODES.map(function (m, i) {
      return '<button class="mode" data-act="mode" data-v="' + i + '"><div class="m-name">' + esc(m.name) + '</div><div class="m-desc">' + esc(m.desc) + '</div></button>';
    }).join('');
    var fill = Math.round((sec - 30) / (600 - 30) * 100);
    var cost = costGen(sec);

    return '<div style="max-width:860px;margin:0 auto">' +
      '<div style="text-align:center;margin-top:10px"><span class="eyebrow center" style="justify-content:center">İkinci adım</span>' +
      '<h1 class="h1" style="margin-top:12px">Tarzını seç</h1>' +
      '<p class="sub" style="color:var(--muted);margin-top:10px">İstersen tek tıkla hazır bir mod seç.</p></div>' +

      '<div class="opt-row" style="margin-top:26px"><div class="opt-lbl">Hazır modlar</div><div class="modes">' + modes + '</div></div>' +

      '<div class="opts">' +
        '<div class="opt-row"><div class="opt-lbl">Anlatım tonu</div><div class="seg">' + toneSeg + '</div></div>' +
        '<div class="opt-row"><div class="opt-lbl">Anlatıcı sesi</div><div class="grid-opt">' + voiceTiles + '</div></div>' +
        '<div class="opt-row"><div class="opt-lbl">Görsel stil</div><div class="grid-opt">' + styleTiles + '</div></div>' +
        '<div class="opt-row"><div class="opt-lbl">Format</div><div class="aspect-row">' + aspects + '</div></div>' +
        '<div class="opt-row"><div class="opt-lbl">Süre</div>' +
          '<div class="slider-wrap"><div class="slider-head"><span class="val" id="durVal">' + fmtDur(sec) + '</span><span class="cost">yaklaşık ' + cost + ' kredi</span></div>' +
          '<input type="range" id="durRange" min="30" max="600" step="15" value="' + sec + '" style="--fill:' + fill + '%"></div>' +
        '</div>' +
        '<div class="opt-row"><div class="opt-lbl">Özel istek <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">(opsiyonel)</span></div>' +
          '<textarea class="field" id="customInput" placeholder="Örn: giriş çok çarpıcı olsun, sonunda soru sorarak bitir..." style="min-height:70px">' + esc(S.custom) + '</textarea>' +
        '</div>' +
      '</div>' +

      '<div class="gen-bar">' +
        '<button class="btn btn-ghost" data-act="back">← Geri</button>' +
        '<span class="summary"><b>' + fmtDur(sec) + '</b> · ' + esc(styleObj().name) + ' · ' + S.aspect + '</span>' +
        '<button class="btn btn-gold btn-lg" data-act="generate">Dosyayı üret · ' + cost + ' kredi</button>' +
      '</div>' +
    '</div>';
  }

  // ── Step 3 — generating ──────────────────────────────────────────────
  var GEN_STEPS = ['Konu araştırılıyor', 'Senaryo yazılıyor', 'Sahneler kuruluyor', 'Yayın paketi hazırlanıyor'];
  function renderStep3() {
    var gs = GEN_STEPS.map(function (t, i) {
      return '<div class="gs" id="gs' + i + '"><span class="ic">' + (i + 1) + '</span>' + esc(t) + '</div>';
    }).join('');
    return '<div class="gen-screen">' +
      '<div class="gen-orb"><span class="ring"></span><span class="ring r2"></span><span class="core"></span></div>' +
      '<h2>Dosyan hazırlanıyor</h2>' +
      '<div class="gen-status" id="genStatus">Başlıyor…</div>' +
      '<div class="gen-steps">' + gs + '</div>' +
    '</div>';
  }

  // ── Step 4 — result ──────────────────────────────────────────────────
  function renderStep4() {
    var r = S.result || {};
    var tabs = [
      ['senaryo', 'Senaryo'], ['seslendirme', 'Seslendirme'], ['gorsel', 'Görsel promptları'],
      ['youtube', 'YouTube'], ['instagram', 'Instagram'], ['kapak', 'Kapak & yayın']
    ];
    var tabBtns = tabs.map(function (t) { return '<button class="' + (S.tab === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    var meta = [fmtDur(S.durationSec), styleObj().name, S.aspect, VOICES[S.voiceIdx].name].map(function (m) { return '<span class="m">' + esc(m) + '</span>'; }).join('');

    var head = '<div class="res-head"><div>' +
      '<span class="eyebrow">Dosyan hazır</span>' +
      '<h1 class="res-title" style="margin-top:12px">' + esc(r.baslik || S.idea) + '</h1>' +
      (r.logline ? '<p class="res-logline">' + esc(r.logline) + '</p>' : '') +
      '<div class="res-meta">' + meta + '</div>' +
      '</div><div class="res-actions">' +
        '<button class="btn btn-quiet btn-sm" data-act="restart">＋ Yeni dosya</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="regen">↻ Yeniden üret</button>' +
      '</div></div>';

    return head + '<div class="tabs">' + tabBtns + '</div><div class="tab-body" id="tabBody">' + renderTab() + '</div>';
  }

  function renderTab() {
    var r = S.result || {};
    if (S.tab === 'senaryo') {
      var scenes = (r.senaryo || []).map(function (sc, i) {
        var img = S.images[i];
        var thumb = img ? '<img src="' + esc(img) + '" alt="">' : '<div class="ph" style="background:' + GRADS[i % GRADS.length] + '"></div>';
        return '<div class="scene"><div class="th">' + thumb + '</div><div><div class="s-no">Sahne ' + (i + 1) + '</div>' +
          '<h4>' + esc(sc.baslik || ('Sahne ' + (i + 1))) + '</h4>' +
          '<p>' + esc(sc.anlatim || sc.metin || '') + '</p>' +
          (sc.gorsel ? '<div class="s-vis">🎬 ' + esc(sc.gorsel) + '</div>' : '') +
          '</div></div>';
      }).join('');
      return '<button class="btn btn-quiet btn-sm copybtn" data-act="copyScript">Tümünü kopyala</button>' + (scenes || emptyMsg());
    }
    if (S.tab === 'seslendirme') {
      var vo = narrationText();
      return '<div class="panel voice-panel"><h3>Seslendirme metni</h3>' +
        '<p class="p-note">' + esc(r.seslendirme_notu || 'Doğal, akıcı bir anlatıma göre hazırlandı.') + '</p>' +
        '<div class="vp-controls">' +
          '<button class="btn btn-gold btn-sm" data-act="tts">▶ Seslendir (' + esc(VOICES[S.voiceIdx].name) + ')</button>' +
          '<button class="btn btn-quiet btn-sm" data-act="copyVo">Metni kopyala</button>' +
          '<span style="font-size:13px;color:var(--muted)">' + vo.length + ' karakter</span>' +
        '</div>' +
        '<div id="audioSlot">' + (S.audio ? audioEl(S.audio) : '') + '</div>' +
        '<div class="panel-txt" style="margin-top:18px">' + esc(vo) + '</div>' +
      '</div>';
    }
    if (S.tab === 'gorsel') {
      var prompts = (r.gorsel_promptlar || []);
      if (!prompts.length) return emptyMsg();
      var cards = prompts.map(function (p, i) {
        var img = S.images[i];
        var box = img ? '<img src="' + esc(img) + '" alt="">' : '<div class="ph" style="background:' + GRADS[i % GRADS.length] + '">' + (REAL ? 'Görsel üret' : 'Örnek görsel') + '</div>';
        return '<div class="prompt-card"><div class="pc-img">' + box + '</div><div class="pc-body">' +
          '<div class="pc-no">Görsel ' + (i + 1) + '</div>' +
          '<div class="pc-txt">' + esc(p) + '</div>' +
          '<div class="pc-actions">' +
            '<button class="btn btn-gold btn-sm" data-act="image" data-v="' + i + '">✦ Görsel üret · 12 kredi</button>' +
            '<button class="btn btn-quiet btn-sm" data-act="copyOne" data-v="' + esc(p) + '">Promptu kopyala</button>' +
          '</div></div></div>';
      }).join('');
      return '<p class="p-note" style="margin-bottom:16px">Her prompt seçtiğin <b>' + esc(styleObj().name) + '</b> stiline göre hazırlandı. "Görsel üret" ile gerçek görseli oluştur.</p>' + cards;
    }
    if (S.tab === 'youtube') {
      var yt = r.youtube || {};
      var tags = (yt.etiketler || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
      return '<div class="panel"><button class="btn btn-quiet btn-sm copybtn" data-act="copyYt">Kopyala</button><h3>Başlık</h3><div class="panel-txt">' + esc(yt.baslik || r.baslik || '') + '</div></div>' +
        '<div class="panel"><h3>Açıklama</h3><div class="panel-txt">' + esc(yt.aciklama || '') + '</div>' + (tags ? '<div class="taglist">' + tags + '</div>' : '') + '</div>';
    }
    if (S.tab === 'instagram') {
      var ig = r.instagram || {};
      var htags = (ig.hashtagler || []).map(function (t) { return '<span>' + esc(t.charAt(0) === '#' ? t : '#' + t) + '</span>'; }).join('');
      return '<div class="panel"><button class="btn btn-quiet btn-sm copybtn" data-act="copyIg">Kopyala</button><h3>Reels / Instagram metni</h3><div class="panel-txt">' + esc(ig.aciklama || '') + '</div>' + (htags ? '<div class="taglist">' + htags + '</div>' : '') + '</div>';
    }
    if (S.tab === 'kapak') {
      var kapak = (r.kapak || []).map(function (k, i) { return '<div class="scene" style="padding:16px 0"><div><div class="s-no">Kapak fikri ' + (i + 1) + '</div><p style="margin-top:6px">' + esc(k) + '</p></div></div>'; }).join('');
      return '<div class="panel"><h3>Kapak fikirleri</h3><p class="p-note">Tıklanmayı artıracak thumbnail önerileri.</p>' + (kapak || '<p class="panel-txt">—</p>') + '</div>' +
        (r.uretim_notu ? '<div class="panel"><h3>Yapım notu</h3><div class="panel-txt">' + esc(r.uretim_notu) + '</div></div>' : '');
    }
    return '';
  }
  function emptyMsg() { return '<div class="empty">İçerik bulunamadı.</div>'; }
  function audioEl(url) { return '<audio controls src="' + esc(url) + '"></audio>'; }
  function narrationText() {
    var r = S.result || {};
    if (r.seslendirme_metni) return r.seslendirme_metni;
    return (r.senaryo || []).map(function (s) { return s.anlatim || s.metin || ''; }).filter(Boolean).join('\n\n');
  }

  // ── Dynamic bindings (inputs that shouldn't trigger re-render) ────────
  function bindDynamic() {
    var idea = document.getElementById('ideaInput');
    if (idea) {
      var cnt = document.getElementById('ideaCount');
      var upd = function () { S.idea = idea.value; if (cnt) cnt.textContent = idea.value.trim().length ? idea.value.trim().length + ' karakter' : ''; };
      idea.addEventListener('input', upd); upd();
    }
    var custom = document.getElementById('customInput');
    if (custom) custom.addEventListener('input', function () { S.custom = custom.value; });
    var range = document.getElementById('durRange');
    if (range) {
      range.addEventListener('input', function () {
        S.durationSec = parseInt(range.value, 10);
        var fill = Math.round((S.durationSec - 30) / (600 - 30) * 100);
        range.style.setProperty('--fill', fill + '%');
        document.getElementById('durVal').textContent = fmtDur(S.durationSec);
        var cst = document.querySelector('.slider-head .cost'); if (cst) cst.textContent = 'yaklaşık ' + costGen(S.durationSec) + ' kredi';
        var sum = document.querySelector('.gen-bar .summary'); if (sum) sum.innerHTML = '<b>' + fmtDur(S.durationSec) + '</b> · ' + esc(styleObj().name) + ' · ' + S.aspect;
        var gb = document.querySelector('.gen-bar .btn-gold'); if (gb) gb.textContent = 'Dosyayı üret · ' + costGen(S.durationSec) + ' kredi';
      });
    }
  }

  // ── Event delegation ─────────────────────────────────────────────────
  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act');
    var v = el.getAttribute('data-v');
    switch (act) {
      case 'useIdea': S.idea = v; render(); break;
      case 'suggest': S.idea = IDEAS[Math.floor(Math.random() * IDEAS.length)]; render(); break;
      case 'toStep2':
        if (!S.idea.trim()) { toast('Önce bir fikir yaz'); break; }
        S.step = 2; render(); break;
      case 'back': S.step = 1; render(); break;
      case 'tone': S.tone = v; render(); break;
      case 'voice': S.voiceIdx = parseInt(v, 10); render(); break;
      case 'style': S.style = v; render(); break;
      case 'aspect': S.aspect = v; render(); break;
      case 'mode': applyMode(parseInt(v, 10)); break;
      case 'generate': startGenerate(false); break;
      case 'regen': startGenerate(true); break;
      case 'restart': S.result = null; S.images = {}; S.audio = null; S.step = 1; render(); break;
      case 'tab': S.tab = v; document.querySelectorAll('.tabs button').forEach(function (b) { b.classList.remove('on'); }); el.classList.add('on'); document.getElementById('tabBody').innerHTML = renderTab(); break;
      case 'copyScript': copy((S.result.senaryo || []).map(function (s, i) { return (i + 1) + '. ' + (s.baslik || '') + '\n' + (s.anlatim || ''); }).join('\n\n')); break;
      case 'copyVo': copy(narrationText()); break;
      case 'copyOne': copy(v); break;
      case 'copyYt': var yt = S.result.youtube || {}; copy((yt.baslik || '') + '\n\n' + (yt.aciklama || '') + '\n\n' + (yt.etiketler || []).join(', ')); break;
      case 'copyIg': var ig = S.result.instagram || {}; copy((ig.aciklama || '') + '\n\n' + (ig.hashtagler || []).map(function (t) { return t[0] === '#' ? t : '#' + t; }).join(' ')); break;
      case 'tts': doTts(); break;
      case 'image': doImage(parseInt(v, 10)); break;
    }
  });

  function applyMode(i) {
    var m = MODES[i]; if (!m) return;
    S.durationSec = m.sec; S.aspect = m.aspect; S.tone = m.tone;
    render(); toast(m.name + ' seçildi');
  }

  // ── Generation ───────────────────────────────────────────────────────
  function startGenerate(isRegen) {
    if (REAL && !S.user) { openAuth(); return; }
    S.step = 3; render();
    runGenAnimation();
    if (REAL) realGenerate(isRegen); else demoGenerate();
  }

  var _animTimers = [];
  function runGenAnimation() {
    _animTimers.forEach(clearTimeout); _animTimers = [];
    var statuses = ['Güvenilir kaynaklar taranıyor…', 'Anlatı omurgası kuruluyor…', 'Sahneler ve görseller planlanıyor…', 'Başlık ve yayın paketi yazılıyor…', 'Son rötuşlar…'];
    var st = document.getElementById('genStatus');
    statuses.forEach(function (s, i) { _animTimers.push(setTimeout(function () { if (st) st.textContent = s; }, i * 1400)); });
    GEN_STEPS.forEach(function (_, i) {
      _animTimers.push(setTimeout(function () {
        var g = document.getElementById('gs' + i); if (g) g.classList.add('on');
        if (i > 0) { var p = document.getElementById('gs' + (i - 1)); if (p) { p.classList.remove('on'); p.classList.add('done'); p.querySelector('.ic').textContent = '✓'; } }
      }, 700 + i * 1500));
    });
  }

  function finishGen(result, charged, credits) {
    _animTimers.forEach(clearTimeout);
    S.result = result; S.images = {}; S.audio = null; S.tab = 'senaryo';
    if (typeof credits === 'number') S.credits = credits;
    else if (!REAL && charged) S.credits = Math.max(0, (S.credits || 0) - costGen(S.durationSec));
    S.step = 4; render();
  }

  function demoGenerate() {
    var wait = 5200;
    setTimeout(function () { finishGen(synthDemo(), true); }, wait);
  }

  // Build strict-JSON instruction for the model (real mode)
  function buildPrompt() {
    var scenes = sceneFor(S.durationSec);
    var st = styleObj();
    var tone = (TONES.filter(function (t) { return t.id === S.tone; })[0] || TONES[0]).name;
    return 'Sen içerik üreticileri için çalışan uzman bir senarist ve yapım yönetmenisin. İzleyiciyi ilk saniyeden yakalayan, akıcı ve DOĞRU içerik üret.\n\n' +
      'KONU: ' + S.idea + '\n' +
      'ANLATIM TONU: ' + tone + '\n' +
      'GÖRSEL STİL: ' + st.name + ' (' + st.en + ')\n' +
      'FORMAT: ' + S.aspect + ' · SÜRE: ' + fmtDur(S.durationSec) + ' · SAHNE SAYISI: yaklaşık ' + scenes + '\n' +
      (S.custom ? 'ÖZEL İSTEK (en yüksek öncelik): ' + S.custom + '\n' : '') +
      '\nYalnızca aşağıdaki şemada, Türkçe ve GEÇERLİ JSON döndür (başka metin yok):\n' +
      '{\n' +
      '  "baslik": "çarpıcı video başlığı",\n' +
      '  "logline": "tek cümlelik özet",\n' +
      '  "karakterler": ["varsa anlatıdaki kişiler"],\n' +
      '  "senaryo": [ { "baslik": "sahne başlığı", "anlatim": "seslendirilecek akıcı anlatım metni (2-4 cümle)", "gorsel": "sahnenin kısa görsel tarifi" } ],\n' +
      '  "seslendirme_notu": "anlatıcıya kısa yönerge",\n' +
      '  "youtube": { "baslik": "SEO başlığı", "aciklama": "açıklama metni", "etiketler": ["etiket1","etiket2"] },\n' +
      '  "instagram": { "aciklama": "Reels metni", "hashtagler": ["hashtag1"] },\n' +
      '  "kapak": ["thumbnail fikri 1","thumbnail fikri 2"],\n' +
      '  "gorsel_promptlar": ["her ana sahne için İngilizce, ' + st.en + ' tarzında foto-gerçekçi görsel üretim promptu"],\n' +
      '  "video_promptlar": ["opsiyonel kısa video/hareket promptları"],\n' +
      '  "uretim_notu": "kısa yapım tavsiyesi"\n' +
      '}\n' +
      'senaryo ve gorsel_promptlar en az ' + Math.min(scenes, 8) + ' öğe içersin. Konu anlamsızsa {"gecersiz":true,"mesaj":"..."} döndür.';
  }

  function realGenerate(isRegen) {
    var job = 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var prevJob = S.genJob;
    S.genJob = job;
    var body = {
      action: 'generate', prompt: buildPrompt(), provider: S.provider,
      topic: S.idea, duration: 's' + S.durationSec, max_tokens: 12000, job: job
    };
    if (isRegen && prevJob) { body.regen = true; body.prevJob = prevJob; }
    callFn(body).then(function (d) {
      if (!d || !d.ok) { genError(d && d.error); return; }
      var obj = typeof d.result === 'string' ? safeParse(d.result) : d.result;
      if (!obj) { genError('Dosya çözümlenemedi.'); return; }
      finishGen(obj, d.charged, d.credits);
    }).catch(function () { genError('Bağlantı hatası.'); });
  }

  function genError(msg) {
    _animTimers.forEach(clearTimeout);
    S.step = 2; render();
    toast(msg || 'Üretim başarısız — tekrar dene');
  }

  function safeParse(t) { try { return JSON.parse(t); } catch (e) { return null; } }

  // ── Images ───────────────────────────────────────────────────────────
  function doImage(idx) {
    var r = S.result || {};
    var prompt = (r.gorsel_promptlar || [])[idx];
    if (!prompt) return;
    var full = prompt + ' — ' + styleObj().en;
    if (!REAL) {
      // demo: draw a gradient placeholder canvas
      S.images[idx] = demoImage(idx);
      refreshCurrentTab(); toast('Demo görsel eklendi');
      return;
    }
    if (!S.user) { openAuth(); return; }
    var btn = document.querySelector('[data-act="image"][data-v="' + idx + '"]');
    if (btn) { btn.textContent = 'Üretiliyor…'; btn.disabled = true; }
    callFn({ action: 'image', prompt: full, size: S.aspect, imgIndex: idx }).then(function (d) {
      if (d && d.ok && d.url) { S.images[idx] = d.url; if (typeof d.credits === 'number') S.credits = d.credits; refreshCurrentTab(); toast('Görsel üretildi'); }
      else { toast((d && d.error) || 'Görsel üretilemedi'); if (btn) { btn.textContent = '✦ Görsel üret · 12 kredi'; btn.disabled = false; } }
    }).catch(function () { toast('Bağlantı hatası'); if (btn) { btn.textContent = '✦ Görsel üret · 12 kredi'; btn.disabled = false; } });
  }

  function demoImage(idx) {
    var c = document.createElement('canvas'); c.width = 400; c.height = S.aspect === '9:16' ? 600 : S.aspect === '1:1' ? 400 : 250;
    var x = c.getContext('2d');
    var pal = [['#efe6d2', '#c2a160'], ['#e0c588', '#9c7b3b'], ['#f3ecdc', '#d9bc80'], ['#d8b98a', '#8b6c31'], ['#ead9b6', '#b4914d']][idx % 5];
    var g = x.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = 'rgba(255,255,255,.85)'; x.font = '600 15px Hanken Grotesk, sans-serif'; x.textAlign = 'center';
    x.fillText('STORIA · demo görsel', c.width / 2, c.height / 2 - 8);
    x.font = '400 12px Hanken Grotesk, sans-serif'; x.fillText('Sahne ' + (idx + 1), c.width / 2, c.height / 2 + 14);
    return c.toDataURL('image/jpeg', 0.8);
  }

  function refreshCurrentTab() { var tb = document.getElementById('tabBody'); if (tb) tb.innerHTML = renderTab(); }

  // ── TTS ──────────────────────────────────────────────────────────────
  function doTts() {
    var text = narrationText();
    if (!text) { toast('Seslendirilecek metin yok'); return; }
    if (!REAL) {
      // demo: browser speech synthesis
      if (!('speechSynthesis' in window)) { toast('Tarayıcı seslendirmeyi desteklemiyor'); return; }
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text.slice(0, 600));
      u.lang = 'tr-TR'; u.rate = 0.98;
      window.speechSynthesis.speak(u);
      toast('Demo seslendirme (gerçek modda indirilebilir mp3)');
      return;
    }
    if (!S.user) { openAuth(); return; }
    var slot = document.getElementById('audioSlot');
    if (slot) slot.innerHTML = '<p class="p-note" style="margin-top:14px">Ses üretiliyor…</p>';
    callFn({ action: 'tts', text: text, engine: 'openai', voice: VOICES[S.voiceIdx].ov }).then(function (d) {
      if (d && d.ok && d.url) { S.audio = d.url; if (typeof d.credits === 'number') S.credits = d.credits; if (slot) slot.innerHTML = audioEl(d.url); toast('Seslendirme hazır'); }
      else { if (slot) slot.innerHTML = ''; toast((d && d.error) || 'Ses üretilemedi'); }
    }).catch(function () { if (slot) slot.innerHTML = ''; toast('Bağlantı hatası'); });
  }

  // ── Demo synth ───────────────────────────────────────────────────────
  function synthDemo() {
    var topic = S.idea.trim() || 'Merak edilen bir konu';
    var n = Math.min(sceneFor(S.durationSec), 8);
    var beats = [
      ['Açılış kancası', 'Ekranda tek bir soru beliriyor: ' + topic + ' İzleyiciyi ilk saniyeden içine çeken çarpıcı bir girişle başlıyoruz.'],
      ['İlk ipucu', 'Konunun yüzeyini kazıyoruz. Görünenin ardındaki ilk şaşırtıcı detay ortaya çıkıyor ve merak katlanıyor.'],
      ['Derinleşme', 'Şimdi işin özüne iniyoruz. Somut örnekler ve sayılarla anlatı sağlam bir zemine oturuyor.'],
      ['Beklenmedik dönüş', 'Tam her şey netleşti derken beklenmedik bir gerçek sahneye giriyor. Tempo yükseliyor.'],
      ['Kanıtlar', 'Uzman görüşleri ve kaynaklar bir araya geliyor; tablo tamamlanmaya başlıyor.'],
      ['Doruk noktası', 'Anlatının en güçlü anı. Tüm parçalar yerine oturuyor, izleyici gözünü ekrandan alamıyor.'],
      ['Sonuç', 'Öğrendiklerimizi tek bir çarpıcı fikirde topluyoruz.'],
      ['Kapanış', 'İzleyiciye düşündürecek bir soruyla ve güçlü bir çağrıyla bitiriyoruz.']
    ].slice(0, n);
    var st = styleObj();
    var senaryo = beats.map(function (b, i) {
      return { baslik: b[0], anlatim: b[1], gorsel: 'Sahne ' + (i + 1) + ' için ' + st.name.toLowerCase() + ' bir kare' };
    });
    var prompts = beats.map(function (b, i) {
      return 'Scene ' + (i + 1) + ': ' + b[0].toLowerCase() + ' depicting "' + topic + '", ' + st.en + ', aspect ' + S.aspect + ', highly detailed, atmospheric';
    });
    return {
      baslik: topic.replace(/\?$/, '') + ' — Bilmediğin Gerçek',
      logline: topic + ' Bu videoda merakını gidereceğiz.',
      karakterler: [],
      senaryo: senaryo,
      seslendirme_notu: (TONES.filter(function (t) { return t.id === S.tone; })[0] || {}).name + ' bir tonda, doğal tempoda oku.',
      youtube: {
        baslik: topic.replace(/\?$/, '') + ' | Storia',
        aciklama: 'Bu videoda ' + topic.toLowerCase() + ' sorusunu adım adım cevaplıyoruz. Beğenmeyi ve abone olmayı unutma!\n\n00:00 Giriş\n00:30 İlk ipucu\n02:00 Derinleşme',
        etiketler: ['storia', 'belgesel', 'merak', topic.split(' ')[0].toLowerCase(), 'bilgi']
      },
      instagram: {
        aciklama: topic + ' 👀 Cevabı videoda. Kaydet, sonra izle!',
        hashtagler: ['storia', 'kesfet', 'bilgi', 'merak', 'reels']
      },
      kapak: ['Büyük soru işareti + çarpıcı görsel, sıcak ışık', 'Yakın plan detay + kalın başlık metni'],
      gorsel_promptlar: prompts,
      video_promptlar: prompts.map(function (p) { return p + ', slow cinematic camera move'; }),
      uretim_notu: 'İlk 5 saniyeye en güçlü görseli koy; geçişleri müzikle senkronla. (Bu bir DEMO çıktısıdır.)'
    };
  }

  // ── Backend call ─────────────────────────────────────────────────────
  function fnUrl() { return CFG.supabaseUrl.replace(/\/$/, '') + '/functions/v1/' + FN; }
  function callFn(body) {
    return getToken().then(function (token) {
      return fetch(fnUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(body)
      }).then(function (r) { return r.json(); });
    });
  }
  function getToken() {
    if (!sb) return Promise.resolve(CFG.supabaseAnonKey);
    return sb.auth.getSession().then(function (res) {
      var s = res && res.data && res.data.session;
      return (s && s.access_token) || CFG.supabaseAnonKey;
    });
  }

  // ── Auth (real mode) ─────────────────────────────────────────────────
  var authMode = 'in';
  function openAuth() {
    if (!REAL) { toast('Demo modu — kurulum sonrası giriş aktifleşir'); return; }
    document.getElementById('authModal').classList.add('show');
  }
  function closeAuth() { document.getElementById('authModal').classList.remove('show'); }
  function setupAuthUI() {
    var modal = document.getElementById('authModal');
    document.getElementById('acctBtn').addEventListener('click', function () {
      if (S.user) { if (sb) sb.auth.signOut(); S.user = null; S.credits = null; refreshHeader(); toast('Çıkış yapıldı'); }
      else openAuth();
    });
    document.getElementById('authClose').addEventListener('click', closeAuth);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeAuth(); });
    document.getElementById('authSwitch').addEventListener('click', function () {
      authMode = authMode === 'in' ? 'up' : 'in';
      document.getElementById('authTitle').textContent = authMode === 'in' ? 'Giriş yap' : 'Kayıt ol';
      document.getElementById('authSubmit').textContent = authMode === 'in' ? 'Giriş yap' : 'Hesap oluştur';
      document.getElementById('authAlt').innerHTML = authMode === 'in' ? 'Hesabın yok mu? <a id="authSwitch2">Kayıt ol</a>' : 'Zaten hesabın var mı? <a id="authSwitch2">Giriş yap</a>';
      var s2 = document.getElementById('authSwitch2'); if (s2) s2.addEventListener('click', function () { document.getElementById('authSwitch').click(); });
    });
    document.getElementById('authSubmit').addEventListener('click', doAuth);
  }
  function doAuth() {
    if (!sb) { toast('Supabase yüklenemedi'); return; }
    var email = document.getElementById('authEmail').value.trim();
    var pass = document.getElementById('authPass').value;
    if (!email || !pass) { toast('E-posta ve parola gir'); return; }
    var btn = document.getElementById('authSubmit'); btn.disabled = true; btn.textContent = 'Bekle…';
    var p = authMode === 'in'
      ? sb.auth.signInWithPassword({ email: email, password: pass })
      : sb.auth.signUp({ email: email, password: pass });
    p.then(function (res) {
      btn.disabled = false; btn.textContent = authMode === 'in' ? 'Giriş yap' : 'Hesap oluştur';
      if (res.error) { toast(res.error.message || 'Giriş başarısız'); return; }
      if (res.data && res.data.user) { S.user = res.data.user; closeAuth(); toast('Hoş geldin'); loadCredits(); }
      else { toast('E-postanı kontrol et'); }
    }).catch(function () { btn.disabled = false; toast('Bağlantı hatası'); });
  }
  function loadCredits() {
    // Balance is read via the function's refresh (server-authoritative). A no-op
    // generate isn't ideal; we lazily show credits after the first paid action.
    if (!S.user) return;
    // Optional: fetch profile row directly (RLS allows own read)
    if (sb) sb.from('profiles').select('credits,tier').eq('id', S.user.id).single().then(function (res) {
      if (res && res.data && typeof res.data.credits === 'number') { S.credits = res.data.credits; refreshHeader(); }
    }, function () {});
  }

  // ── Boot ─────────────────────────────────────────────────────────────
  function boot() {
    setupAuthUI();
    render();
    if (REAL) {
      loadSupabase().then(function () {
        sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
        return sb.auth.getSession();
      }).then(function (res) {
        var s = res && res.data && res.data.session;
        if (s && s.user) { S.user = s.user; loadCredits(); }
        refreshHeader();
      }).catch(function () { toast('Sunucuya bağlanılamadı'); });
    }
  }
  function loadSupabase() {
    return new Promise(function (resolve, reject) {
      if (window.supabase) return resolve();
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  boot();
})();

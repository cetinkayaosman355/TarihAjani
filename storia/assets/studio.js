/* ============================================================================
   STORIA — Studio app (vanilla SPA)
   Görünümler: new (sihirbaz) · images (görsel stüdyo) · library · history
   Sihirbaz: composer → kontrol odası (canlı önizleme) → üretim → dosya belgesi
   Config boşsa DEMO MODU (kurulumsuz denenebilir); doluysa gerçek backend.
   ========================================================================= */
(function () {
  'use strict';
  var CFG = window.STORIA_CONFIG || {};
  var REAL = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
  var FN = (CFG.functionName || 'storia-generate');
  var view = document.getElementById('view');
  var sb = null;

  var S = {
    view: 'new', step: 1,
    idea: '', tone: 'merak', voiceIdx: 0, style: 'sinematik', aspect: '16:9',
    durationSec: 270, provider: 'claude', custom: '', template: null,
    result: null, tab: 'senaryo', genJob: null,
    user: null, credits: REAL ? null : 500, creditMax: 500,
    images: {}, audio: null, history: [], ttsRate: 1,
    // image studio
    imgPrompt: '', imgStyle: 'sinematik', imgAspect: '1:1', imgOut: null
  };

  // ── Data ─────────────────────────────────────────────────────────────
  var IDEAS = [
    'Okyanusun en derin noktasında ne var?', 'Parayı kim, neden icat etti?',
    'Rüyalar neden bu kadar tuhaf?', 'Evrenin sonu nasıl olacak?',
    'Kahve vücuduna tam olarak ne yapıyor?', 'Yapay zekâ gerçekten düşünebilir mi?',
    'Uykusuzluk beynine neler yapar?', 'Kayıp şehir Atlantis efsanesi',
    'Kediler bizi neden evcilleştirdi?', 'Işık hızında gitseydik ne olurdu?',
    'Beynini kandıran 3 psikolojik tuzak', 'Müzik beynini nasıl değiştirir?',
    'Everest’in zirvesinde bir gün', 'Bir saniyede dünyada neler oluyor?',
    'Zaman gerçekten var mı?', 'Milyarderlerin ortak 5 alışkanlığı'
  ];
  var TONES = [
    { id: 'merak', name: 'Merak uyandıran' }, { id: 'dramatik', name: 'Dramatik' },
    { id: 'belgesel', name: 'Belgesel' }, { id: 'destansi', name: 'Destansı' },
    { id: 'samimi', name: 'Samimi' }, { id: 'enerjik', name: 'Enerjik' }
  ];
  var VOICES = [
    { name: 'Derin Erkek', desc: 'Sıcak, güven veren', ov: 'onyx' },
    { name: 'Anlatıcı', desc: 'Net, dengeli', ov: 'echo' },
    { name: 'Gizemli', desc: 'Alçak, merak uyandıran', ov: 'ash', premium: true },
    { name: 'Enerjik', desc: 'Genç, dinamik', ov: 'nova' },
    { name: 'Belgesel Kadın', desc: 'Olgun, akıcı', ov: 'sage', premium: true },
    { name: 'Sıcak Kadın', desc: 'Samimi, davetkâr', ov: 'shimmer' }
  ];
  var RATES = [{ v: 0.9, l: 'Yavaş' }, { v: 1, l: 'Normal' }, { v: 1.12, l: 'Hızlı' }];
  var STYLES = [
    { id: 'sinematik', name: 'Sinematik', desc: 'Film karesi, dramatik ışık', en: 'cinematic film still, dramatic lighting, shallow depth of field, 35mm' },
    { id: 'fotogercek', name: 'Foto-gerçekçi', desc: 'Gerçek fotoğraf dokusu', en: 'photorealistic, natural light, high detail, DSLR photograph' },
    { id: 'render3d', name: '3D Render', desc: 'Hacimli, sinematik render', en: 'high-end 3D render, volumetric light, octane render, subsurface detail' },
    { id: 'illus', name: 'İllüstrasyon', desc: 'Modern dijital çizim', en: 'modern digital illustration, clean shapes, editorial style' },
    { id: 'anime', name: 'Anime', desc: 'Japon animasyon estetiği', en: 'anime style, cel shading, vivid, studio-quality key visual' },
    { id: 'minimal', name: 'Minimal', desc: 'Sade, zarif, geometrik', en: 'minimalist, elegant, geometric, refined negative space' }
  ];
  var MODES = [
    { name: 'Kısa Video', desc: '60 sn · Dikey', sec: 60, aspect: '9:16', tone: 'enerjik' },
    { name: 'Uzun Video', desc: '8 dk · Yatay', sec: 480, aspect: '16:9', tone: 'merak' },
    { name: 'Belgesel', desc: '10 dk · Yatay', sec: 600, aspect: '16:9', tone: 'belgesel' }
  ];
  var TEMPLATES = [
    { name: 'Belgesel', tone: 'belgesel', style: 'sinematik', sec: 600, aspect: '16:9' },
    { name: 'Kısa / Shorts', tone: 'enerjik', style: 'fotogercek', sec: 60, aspect: '9:16' },
    { name: 'Motivasyon', tone: 'destansi', style: 'sinematik', sec: 90, aspect: '9:16' },
    { name: 'Nasıl yapılır', tone: 'samimi', style: 'illus', sec: 180, aspect: '16:9' },
    { name: 'Ürün tanıtımı', tone: 'enerjik', style: 'render3d', sec: 60, aspect: '1:1' },
    { name: 'Liste (5 şey)', tone: 'merak', style: 'fotogercek', sec: 240, aspect: '16:9' },
    { name: 'Haber özeti', tone: 'belgesel', style: 'fotogercek', sec: 120, aspect: '16:9' }
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
  function styleObj(id) { id = id || S.style; for (var i = 0; i < STYLES.length; i++) if (STYLES[i].id === id) return STYLES[i]; return STYLES[0]; }
  function toneName(id) { id = id || S.tone; for (var i = 0; i < TONES.length; i++) if (TONES[i].id === id) return TONES[i].name; return TONES[0].name; }

  // ── Chrome (rail + topbar) ───────────────────────────────────────────
  function chrome() {
    document.querySelectorAll('.rail-item').forEach(function (it) { it.classList.toggle('on', it.getAttribute('data-view') === S.view); });
    var mp = document.getElementById('modePill'); if (mp) mp.hidden = REAL;
    document.getElementById('crNum').textContent = (S.credits == null ? '—' : S.credits);
    // plan card
    var cr = (S.credits == null ? 0 : S.credits);
    document.getElementById('planCr').textContent = (S.credits == null ? '—' : S.credits);
    document.getElementById('planName').textContent = S.user ? 'Keşif planı' : 'Keşif planı';
    document.getElementById('planBar').style.width = Math.max(6, Math.min(100, cr / (S.creditMax || 500) * 100)) + '%';
    // account
    var av = document.getElementById('acctAv'), nm = document.getElementById('acctName'), sub = document.getElementById('acctSub');
    if (S.user) { av.textContent = (S.user.email || 'S').charAt(0).toUpperCase(); nm.textContent = (S.user.email || 'Hesap'); sub.textContent = 'Çıkış yap →'; }
    else { av.textContent = 'S'; nm.textContent = 'Misafir'; sub.textContent = REAL ? 'Giriş yap →' : 'Demo modu'; }
    // topbar context
    var tb = document.getElementById('tbContext');
    if (S.view === 'new') tb.innerHTML = miniSteps();
    else tb.innerHTML = '<span class="tb-title">' + esc(viewTitle()) + '</span>';
  }
  function viewTitle() { return S.view === 'images' ? 'Görsel stüdyo' : S.view === 'library' ? 'Kütüphane' : S.view === 'history' ? 'Geçmiş' : 'Yeni dosya'; }
  function miniSteps() {
    var labels = ['Fikir', 'Tarz', 'Üretim', 'Dosya'];
    var h = '<div class="mini-steps">';
    for (var i = 0; i < 4; i++) {
      var n = i + 1, cls = n === S.step ? 'on' : (n < S.step ? 'done' : '');
      h += '<div class="ms ' + cls + '"><span class="n">' + (n < S.step ? '✓' : n) + '</span><span class="lb">' + labels[i] + '</span></div>';
      if (i < 3) h += '<span class="sep"></span>';
    }
    return h + '</div>';
  }

  // ── Render dispatcher ────────────────────────────────────────────────
  function render() {
    var html;
    if (S.view === 'new') {
      html = S.step === 1 ? renderComposer() : S.step === 2 ? renderRoom() : S.step === 3 ? renderGen() : renderDoc();
    } else if (S.view === 'images') html = renderImages();
    else if (S.view === 'library') html = renderLibrary();
    else html = renderHistory();
    view.innerHTML = html;
    bindDynamic();
    chrome();
  }

  // ── Composer (step 1) ────────────────────────────────────────────────
  function renderComposer() {
    var chips = IDEAS.slice(0, 5).map(function (t) { return '<button class="chip" data-act="useIdea" data-v="' + esc(t) + '"><span class="dot"></span>' + esc(t) + '</button>'; }).join('');
    return '<div class="composer">' +
      '<span class="eyebrow">Yeni dosya</span>' +
      '<h1 class="display">Ne anlatmak<br>istiyorsun?</h1>' +
      '<p class="sub">Bir cümle yeter. Gerisini Storia stüdyosu kurar.</p>' +
      '<div class="compose-box">' +
        '<textarea id="ideaInput" placeholder="Örn: Okyanusun en derin noktasında ne var?" rows="2">' + esc(S.idea) + '</textarea>' +
        '<div class="compose-tools"><div class="left">' +
          '<button class="btn btn-quiet btn-sm" data-act="suggest">✦ Sen öner</button>' +
          '<span class="cnt" id="ideaCount"></span></div>' +
          '<button class="btn btn-gold" data-act="toStep2">Tarzını seç →</button>' +
        '</div>' +
      '</div>' +
      '<div class="suggest-row">' + chips + '</div>' +
      '<div class="tmpl-row"><span class="tmpl-lbl">Şablon</span>' +
        TEMPLATES.map(function (t, i) { return '<button class="tmpl' + (S.template === i ? ' on' : '') + '" data-act="template" data-v="' + i + '">' + esc(t.name) + '</button>'; }).join('') +
      '</div>' +
      '<div class="composer-hint"><kbd>Enter</kbd> ile devam et · <kbd>⇧ Enter</kbd> yeni satır</div>' +
    '</div>';
  }

  // ── Control room (step 2) ────────────────────────────────────────────
  function renderRoom() {
    var sec = S.durationSec;
    var toneSeg = TONES.map(function (t) { return '<button class="' + (S.tone === t.id ? 'on' : '') + '" data-act="tone" data-v="' + t.id + '">' + esc(t.name) + '</button>'; }).join('');
    var voiceTiles = VOICES.map(function (v, i) {
      var prem = v.premium ? '<span class="prem">Premium</span>' : '';
      return '<div class="tile voice-tile ' + (S.voiceIdx === i ? 'on' : '') + '" data-act="voice" data-v="' + i + '">' +
        '<button class="v-prev" data-act="voicePrev" data-v="' + i + '" aria-label="Sesi önizle" title="Önizle">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>' +
        '<div class="t-name">' + esc(v.name) + prem + '</div><div class="t-desc">' + esc(v.desc) + '</div></div>';
    }).join('');
    var styleTiles = STYLES.map(function (st) { return '<div class="tile ' + (S.style === st.id ? 'on' : '') + '" data-act="style" data-v="' + st.id + '"><div class="t-name">' + esc(st.name) + '</div><div class="t-desc">' + esc(st.desc) + '</div></div>'; }).join('');
    var aspects = [{ id: '16:9', w: 36, h: 21, l: 'Yatay' }, { id: '9:16', w: 21, h: 36, l: 'Dikey' }, { id: '1:1', w: 28, h: 28, l: 'Kare' }]
      .map(function (a) { return '<div class="asp ' + (S.aspect === a.id ? 'on' : '') + '" data-act="aspect" data-v="' + a.id + '"><span class="fr" style="width:' + a.w + 'px;height:' + a.h + 'px"></span><span class="l">' + a.l + ' ' + a.id + '</span></div>'; }).join('');
    var modes = MODES.map(function (m, i) { return '<button class="mode" data-act="mode" data-v="' + i + '"><div class="mn">' + esc(m.name) + '</div><div class="md">' + esc(m.desc) + '</div></button>'; }).join('');
    var fill = Math.round((sec - 30) / 570 * 100);

    var left = '<div class="room-head"><h1>Tarzını seç</h1><p>Her ayarı önizleme kartında anında gör.</p></div>' +
      '<div class="opt-group"><div class="opt-title">Hazır modlar</div><div class="modes">' + modes + '</div></div>' +
      '<div class="opt-group"><div class="opt-title">Anlatım tonu</div><div class="seg">' + toneSeg + '</div></div>' +
      '<div class="opt-group"><div class="opt-title">Anlatıcı sesi</div><div class="tiles">' + voiceTiles + '</div></div>' +
      '<div class="opt-group"><div class="opt-title">Görsel stil</div><div class="tiles">' + styleTiles + '</div></div>' +
      '<div class="opt-group"><div class="opt-title">Format</div><div class="aspects">' + aspects + '</div></div>' +
      '<div class="opt-group"><div class="opt-title">Süre</div><div class="slider-card"><div class="sh"><span class="sv" id="durVal">' + fmtDur(sec) + '</span><span class="pc-cr">yaklaşık ' + costGen(sec) + ' kredi</span></div>' +
        '<input type="range" id="durRange" min="30" max="600" step="15" value="' + sec + '" style="--fill:' + fill + '%"></div></div>' +
      '<div class="opt-group"><div class="opt-title">Özel istek <span class="opt-x">(opsiyonel)</span></div>' +
        '<textarea class="field" id="customInput" placeholder="Örn: giriş çok çarpıcı olsun; sonunda soru sorarak bitir…" style="min-height:64px">' + esc(S.custom) + '</textarea></div>';

    return '<div class="room"><div>' + left + '</div>' + renderPreview() + '</div>';
  }

  function renderPreview() {
    var sec = S.durationSec, scenes = sceneFor(sec), cost = costGen(sec);
    var dim = S.aspect === '9:16' ? [92, 164] : S.aspect === '1:1' ? [130, 130] : [176, 99];
    var title = S.idea.trim() ? esc(S.idea.trim().slice(0, 60)) : 'Dosya başlığın burada';
    return '<div class="preview"><div class="pv-card">' +
      '<div class="pv-canvas"><div class="pv-frame" style="width:' + dim[0] + 'px;height:' + dim[1] + 'px"><img class="pv-mark" src="/storia/assets/mark.svg" alt=""></div></div>' +
      '<div class="pv-body">' +
        '<div class="pv-eyebrow">Önizleme · ' + S.aspect + '</div>' +
        '<div class="pv-title">' + title + '</div>' +
        '<div class="pv-chips"><span>' + esc(toneName()) + '</span><span>' + esc(VOICES[S.voiceIdx].name) + '</span><span>' + esc(styleObj().name) + '</span></div>' +
        '<div class="pv-stats">' +
          '<div class="pv-stat"><div class="k">' + fmtDur(sec) + '</div><div class="l">Süre</div></div>' +
          '<div class="pv-stat"><div class="k">~' + scenes + '</div><div class="l">Sahne</div></div>' +
          '<div class="pv-stat"><div class="k">' + cost + '</div><div class="l">Kredi</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="pv-cta"><button class="btn btn-gold btn-lg" data-act="generate">Dosyayı üret →</button>' +
      '<span class="pv-back" data-act="back">← Fikri düzenle</span></div>' +
    '</div></div>';
  }

  // ── Generating (step 3) ──────────────────────────────────────────────
  var GEN_STEPS = ['Konu araştırılıyor', 'Senaryo yazılıyor', 'Sahneler kuruluyor', 'Yayın paketi hazırlanıyor'];
  function renderGen() {
    var rows = GEN_STEPS.map(function (t, i) { return '<div class="gen-row" id="gr' + i + '"><span class="gi">' + (i + 1) + '</span>' + esc(t) + '</div>'; }).join('');
    return '<div class="gen"><div class="orb"><span class="ring"></span><span class="ring r2"></span><span class="ring r3"></span><span class="core"></span></div>' +
      '<h2>Dosyan hazırlanıyor</h2><div class="gen-status" id="genStatus">Başlıyor…</div>' +
      '<div class="gen-list">' + rows + '</div></div>';
  }

  // ── Result document (step 4) ─────────────────────────────────────────
  function renderDoc() {
    var r = S.result || {};
    var tabs = [['senaryo', 'Senaryo'], ['seslendirme', 'Seslendirme'], ['gorsel', 'Görseller'], ['storyboard', 'Storyboard'], ['video', 'Video'], ['youtube', 'YouTube'], ['instagram', 'Instagram'], ['kapak', 'Kapak & yayın']];
    var tabBtns = tabs.map(function (t) { return '<button class="' + (S.tab === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    var meta = [fmtDur(S.durationSec), styleObj().name, S.aspect, VOICES[S.voiceIdx].name].map(function (m) { return '<span class="m">' + esc(m) + '</span>'; }).join('');
    var hero = '<div class="doc-hero"><div class="doc-eyebrow">✦ Dosyan hazır</div>' +
      '<h1 class="doc-title">' + esc(r.baslik || S.idea) + '</h1>' +
      (r.logline ? '<p class="doc-logline">' + esc(r.logline) + '</p>' : '') +
      '<div class="doc-meta">' + meta + '</div>' +
      '<div class="doc-acts"><button class="btn btn-gold btn-sm" data-act="restart">＋ Yeni dosya</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="regen" style="color:var(--on-ink);border-color:rgba(255,255,255,.25)">↻ Yeniden üret</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="exportPdf" style="color:var(--on-ink);border-color:rgba(255,255,255,.25)">↓ PDF</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="download" style="color:var(--on-ink);border-color:rgba(255,255,255,.25)">↓ Metin</button></div></div>';
    return '<div class="doc">' + hero + '<div class="tabs">' + tabBtns + '</div><div class="tab-body" id="tabBody">' + renderTab() + '</div></div>';
  }

  function renderTab() {
    var r = S.result || {};
    if (S.tab === 'senaryo') {
      var scenes = (r.senaryo || []).map(function (sc, i) {
        var img = S.images[i];
        var thumb = img ? '<img src="' + esc(img) + '" alt="">' : '<div class="ph" style="background:' + GRADS[i % GRADS.length] + '">Sahne ' + (i + 1) + '</div>';
        var over = '<div class="gbtn" data-act="image" data-v="' + i + '"><span>' + (img ? 'Yeniden üret' : '✦ Görsel üret') + '</span></div>';
        return '<div class="scene"><div class="th">' + thumb + over + '</div><div><div class="s-no">Sahne ' + (i + 1) + '</div>' +
          '<h4>' + esc(sc.baslik || ('Sahne ' + (i + 1))) + '</h4><p>' + esc(sc.anlatim || sc.metin || '') + '</p>' +
          (sc.gorsel ? '<div class="s-vis">🎬 <span>' + esc(sc.gorsel) + '</span></div>' : '') + '</div></div>';
      }).join('');
      return '<div class="tab-tools"><span class="tt-note">' + (r.senaryo || []).length + ' sahne · her sahnenin görselini üstüne gelip üret</span><button class="btn btn-quiet btn-sm" data-act="copyScript">Tümünü kopyala</button></div>' + (scenes || emptyInline());
    }
    if (S.tab === 'seslendirme') {
      var vo = narrationText();
      return '<div class="player"><div class="pl-top">' +
          '<button class="pl-play" data-act="tts" aria-label="Seslendir"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>' +
          '<div class="pl-meta"><div class="pl-name">' + esc(VOICES[S.voiceIdx].name) + '</div><div class="pl-sub">' + vo.length + ' karakter · ' + esc(toneName()) + ' ton</div></div></div>' +
          '<div class="pl-wave">' + waveBars() + '</div>' +
          '<div id="audioSlot">' + (S.audio ? '<audio controls src="' + esc(S.audio) + '"></audio>' : '') + '</div>' +
          '<div class="pl-controls"><button class="btn btn-gold btn-sm" data-act="tts">▶ Seslendir</button>' +
          '<div class="rate-seg">' + RATES.map(function (r) { return '<button class="' + (S.ttsRate === r.v ? 'on' : '') + '" data-act="ttsRate" data-v="' + r.v + '">' + r.l + '</button>'; }).join('') + '</div>' +
          '<button class="btn btn-quiet btn-sm" data-act="copyVo" style="color:var(--on-ink);border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.06)">Metni kopyala</button></div>' +
        '</div>' +
        '<div class="panel"><h3>Seslendirme metni</h3><p class="p-note">' + esc(r.seslendirme_notu || 'Doğal, akıcı bir anlatıma göre hazırlandı.') + '</p><div class="panel-txt">' + esc(vo) + '</div></div>';
    }
    if (S.tab === 'gorsel') {
      var prompts = (r.gorsel_promptlar || []);
      if (!prompts.length) return emptyInline();
      var cards = prompts.map(function (p, i) {
        var img = S.images[i];
        var box = img ? '<img src="' + esc(img) + '" alt="">' : '<div class="ph" style="background:' + GRADS[i % GRADS.length] + '">' + (REAL ? '✦ Üret' : 'Örnek görsel') + '</div>';
        var acts = img
          ? '<button class="btn btn-quiet btn-sm" data-act="image" data-v="' + i + '">↻ Yeniden</button><button class="btn btn-gold btn-sm" data-act="editImg" data-v="' + i + '">✏ Düzenle</button>'
          : '<button class="btn btn-gold btn-sm" data-act="image" data-v="' + i + '">✦ Üret · 12</button><button class="btn btn-quiet btn-sm" data-act="copyOne" data-v="' + esc(p) + '">Kopyala</button>';
        return '<div class="gcard"><div class="gimg">' + box + '</div><div class="gbody"><div class="gno">Görsel ' + (i + 1) + '</div>' +
          '<div class="gtxt">' + esc(p) + '</div><div class="gacts">' + acts + '</div></div></div>';
      }).join('');
      var doneCount = prompts.filter(function (_, i) { return S.images[i]; }).length;
      return '<div class="tab-tools"><span class="tt-note"><b>' + esc(styleObj().name) + '</b> stilinde ' + prompts.length + ' görsel · ' + doneCount + ' üretildi</span><button class="btn btn-gold btn-sm" data-act="genAll">✦ Tümünü üret</button></div><div class="gallery">' + cards + '</div>';
    }
    if (S.tab === 'storyboard') {
      var sc = r.senaryo || [];
      if (!sc.length) return emptyInline();
      var ratio = S.aspect === '9:16' ? '9/13' : S.aspect === '1:1' ? '1/1' : '16/9';
      var sbCards = sc.map(function (s, i) {
        var img = S.images[i];
        var box = img ? '<img src="' + esc(img) + '" alt="">' : '<div class="ph" style="aspect-ratio:' + ratio + ';background:' + GRADS[i % GRADS.length] + '">Sahne ' + (i + 1) + '</div>';
        var over = '<div class="sb-gen" data-act="image" data-v="' + i + '"><span>' + (img ? 'Yeniden üret' : '✦ Görsel üret') + '</span></div>';
        return '<div class="sb-card"><div class="sb-img" style="aspect-ratio:' + ratio + '">' + box + over + '</div><div class="sb-body"><div class="sb-no">Sahne ' + (i + 1) + '</div><h5>' + esc(s.baslik || ('Sahne ' + (i + 1))) + '</h5><p>' + esc(s.anlatim || s.metin || '') + '</p></div></div>';
      }).join('');
      var doneSb = sc.filter(function (_, i) { return S.images[i]; }).length;
      return '<div class="tab-tools"><span class="tt-note">Film şeridi · ' + sc.length + ' sahne · ' + doneSb + ' görsel hazır</span><button class="btn btn-gold btn-sm" data-act="genAll">✦ Tümünü üret</button></div><div class="storyboard">' + sbCards + '</div>';
    }
    if (S.tab === 'video') {
      var vids = (r.video_promptlar && r.video_promptlar.length) ? r.video_promptlar
        : (r.gorsel_promptlar || []).map(function (p) { return p + ', slow cinematic camera move'; });
      if (!vids.length) return emptyInline();
      var vcards = vids.map(function (p, i) {
        return '<div class="prompt-card"><div class="pc-body"><div class="pc-no">Hareket ' + (i + 1) + '</div>' +
          '<div class="pc-txt">' + esc(p) + '</div><div class="pc-actions">' +
          '<button class="btn btn-quiet btn-sm" data-act="copyOne" data-v="' + esc(p) + '">Kopyala</button></div></div></div>';
      }).join('');
      return '<div class="tab-tools"><span class="tt-note">Runway, Kling, Sora gibi video araçları için ' + vids.length + ' hareket/kamera promptu (İngilizce)</span><button class="btn btn-quiet btn-sm" data-act="copyVids">Tümünü kopyala</button></div>' + vcards;
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
      var kapak = (r.kapak || []).map(function (k, i) { return '<div class="scene" style="grid-template-columns:1fr;padding:14px 0"><div><div class="s-no">Kapak fikri ' + (i + 1) + '</div><p style="margin-top:6px">' + esc(k) + '</p></div></div>'; }).join('');
      return '<div class="panel"><h3>Kapak fikirleri</h3><p class="p-note">Tıklanmayı artıracak thumbnail önerileri.</p>' + (kapak || '<p class="panel-txt">—</p>') + '</div>' +
        (r.uretim_notu ? '<div class="panel"><h3>Yapım notu</h3><div class="panel-txt">' + esc(r.uretim_notu) + '</div></div>' : '');
    }
    return '';
  }
  function waveBars() { var h = ''; for (var i = 0; i < 48; i++) { var hh = 20 + Math.round(Math.abs(Math.sin(i * 0.7)) * 78); h += '<i style="height:' + hh + '%"></i>'; } return h; }
  function emptyInline() { return '<div class="empty"><h3>İçerik yok</h3><p>Bu sekme için çıktı bulunamadı.</p></div>'; }
  function narrationText() { var r = S.result || {}; if (r.seslendirme_metni) return r.seslendirme_metni; return (r.senaryo || []).map(function (s) { return s.anlatim || s.metin || ''; }).filter(Boolean).join('\n\n'); }

  // ── Image studio ─────────────────────────────────────────────────────
  function renderImages() {
    var styleTiles = STYLES.map(function (st) { return '<div class="tile ' + (S.imgStyle === st.id ? 'on' : '') + '" data-act="istyle" data-v="' + st.id + '"><div class="t-name">' + esc(st.name) + '</div></div>'; }).join('');
    var aspects = [{ id: '1:1', w: 28, h: 28, l: 'Kare' }, { id: '16:9', w: 36, h: 21, l: 'Yatay' }, { id: '9:16', w: 21, h: 36, l: 'Dikey' }]
      .map(function (a) { return '<div class="asp ' + (S.imgAspect === a.id ? 'on' : '') + '" data-act="iaspect" data-v="' + a.id + '"><span class="fr" style="width:' + a.w + 'px;height:' + a.h + 'px"></span><span class="l">' + a.l + '</span></div>'; }).join('');
    var out = S.imgOut ? '<img src="' + esc(S.imgOut) + '" alt="" style="width:100%;border-radius:var(--r-md);border:1px solid var(--line)">' :
      '<div class="ph" style="aspect-ratio:1;display:grid;place-items:center;border-radius:var(--r-md);border:1px solid var(--line);background:linear-gradient(135deg,var(--paper-2),var(--paper-3));color:var(--muted);font-size:14px">Görselin burada belirir</div>';
    return '<div class="imgstudio"><div class="room-head"><h1>Görsel stüdyo</h1><p>Tek bir prompt ile bağımsız görsel üret.</p></div>' +
      '<div class="is-grid"><div>' +
        '<div class="opt-group"><div class="opt-title">Ne görmek istiyorsun?</div>' +
          '<textarea class="field" id="imgPromptInput" placeholder="Örn: gün batımında sisli bir dağ manzarası, kartal süzülüyor" style="min-height:110px">' + esc(S.imgPrompt) + '</textarea></div>' +
        '<div class="opt-group"><div class="opt-title">Stil</div><div class="tiles">' + styleTiles + '</div></div>' +
        '<div class="opt-group"><div class="opt-title">Format</div><div class="aspects">' + aspects + '</div></div>' +
        '<button class="btn btn-gold btn-lg" data-act="genImage" style="width:100%">✦ Görseli üret · 12 kredi</button>' +
      '</div><div>' +
        '<div class="pv-card" style="padding:16px"><div id="imgOut">' + out + '</div></div>' +
      '</div></div></div>';
  }

  // ── Library / History ────────────────────────────────────────────────
  function renderLibrary() {
    if (!S.history.length) return '<div class="empty"><div class="e-ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M4 5h10v14H4zM14 7h6v12h-6"/></svg></div><h3>Kütüphanen boş</h3><p>Ürettiğin dosyalar burada toplanır. İlk dosyanı oluşturmaya ne dersin?</p><button class="btn btn-gold" data-act="goNew">＋ Yeni dosya</button></div>';
    return renderHistory();
  }
  function renderHistory() {
    if (!S.history.length) return '<div class="empty"><div class="e-ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg></div><h3>Henüz geçmiş yok</h3><p>Ürettiğin her dosya bu oturumda burada listelenir.</p><button class="btn btn-gold" data-act="goNew">＋ Yeni dosya</button></div>';
    var items = S.history.map(function (h, i) {
      return '<div class="hist-item" data-act="openHist" data-v="' + i + '"><div class="hi-th" style="background:' + GRADS[i % GRADS.length] + '"></div>' +
        '<div class="hi-body"><div class="hi-title">' + esc(h.result.baslik || h.idea) + '</div><div class="hi-meta">' + esc(h.meta) + '</div></div><div class="hi-go">→</div></div>';
    }).join('');
    return '<div class="room-head" style="max-width:760px"><h1>Geçmiş</h1><p>Bu oturumda ürettiğin dosyalar.</p></div><div class="hist">' + items + '</div>';
  }

  // ── Dynamic bindings ─────────────────────────────────────────────────
  function bindDynamic() {
    var idea = document.getElementById('ideaInput');
    if (idea) {
      var cnt = document.getElementById('ideaCount');
      var upd = function () { S.idea = idea.value; if (cnt) cnt.textContent = idea.value.trim().length ? idea.value.trim().length + ' karakter' : ''; };
      idea.addEventListener('input', upd); upd();
      idea.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (S.idea.trim()) { S.step = 2; render(); } else toast('Önce bir fikir yaz'); } });
      setTimeout(function () { idea.focus(); }, 60);
    }
    var custom = document.getElementById('customInput');
    if (custom) custom.addEventListener('input', function () { S.custom = custom.value; });
    var imgP = document.getElementById('imgPromptInput');
    if (imgP) imgP.addEventListener('input', function () { S.imgPrompt = imgP.value; });
    var range = document.getElementById('durRange');
    if (range) range.addEventListener('input', function () {
      S.durationSec = parseInt(range.value, 10);
      range.style.setProperty('--fill', Math.round((S.durationSec - 30) / 570 * 100) + '%');
      var dv = document.getElementById('durVal'); if (dv) dv.textContent = fmtDur(S.durationSec);
      var cc = range.closest('.slider-card').querySelector('.pc-cr'); if (cc) cc.textContent = 'yaklaşık ' + costGen(S.durationSec) + ' kredi';
      updatePreview();
    });
  }
  function updatePreview() {
    var pv = document.querySelector('.preview'); if (!pv) return;
    pv.outerHTML = renderPreview();
  }

  // ── Events (view delegation) ─────────────────────────────────────────
  view.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el) return;
    var act = el.getAttribute('data-act'), v = el.getAttribute('data-v');
    switch (act) {
      case 'useIdea': S.idea = v; render(); break;
      case 'suggest': S.idea = IDEAS[Math.floor(Math.random() * IDEAS.length)]; render(); break;
      case 'toStep2': if (!S.idea.trim()) { toast('Önce bir fikir yaz'); break; } S.step = 2; render(); break;
      case 'back': S.step = 1; render(); break;
      case 'tone': S.tone = v; render(); break;
      case 'voice': S.voiceIdx = parseInt(v, 10); render(); break;
      case 'style': S.style = v; render(); break;
      case 'aspect': S.aspect = v; render(); break;
      case 'mode': applyMode(parseInt(v, 10)); break;
      case 'template': applyTemplate(parseInt(v, 10)); break;
      case 'generate': startGenerate(false); break;
      case 'regen': startGenerate(true); break;
      case 'restart': case 'goNew': startNew(); break;
      case 'tab': S.tab = v; document.querySelectorAll('.tabs button').forEach(function (b) { b.classList.remove('on'); }); el.classList.add('on'); document.getElementById('tabBody').innerHTML = renderTab(); break;
      case 'copyScript': copy((S.result.senaryo || []).map(function (s, i) { return (i + 1) + '. ' + (s.baslik || '') + '\n' + (s.anlatim || ''); }).join('\n\n')); break;
      case 'copyVo': copy(narrationText()); break;
      case 'copyOne': copy(v); break;
      case 'copyVids': var vp = (S.result.video_promptlar && S.result.video_promptlar.length) ? S.result.video_promptlar : (S.result.gorsel_promptlar || []).map(function (x) { return x + ', slow cinematic camera move'; }); copy(vp.map(function (x, i) { return (i + 1) + '. ' + x; }).join('\n')); break;
      case 'copyYt': var yt = S.result.youtube || {}; copy((yt.baslik || '') + '\n\n' + (yt.aciklama || '') + '\n\n' + (yt.etiketler || []).join(', ')); break;
      case 'copyIg': var ig = S.result.instagram || {}; copy((ig.aciklama || '') + '\n\n' + (ig.hashtagler || []).map(function (t) { return t[0] === '#' ? t : '#' + t; }).join(' ')); break;
      case 'download': downloadFile(); break;
      case 'exportPdf': exportPDF(); break;
      case 'tts': doTts(); break;
      case 'voicePrev': previewVoice(parseInt(v, 10)); break;
      case 'ttsRate': S.ttsRate = parseFloat(v); document.querySelectorAll('.rate-seg button').forEach(function (x) { x.classList.remove('on'); }); el.classList.add('on'); break;
      case 'image': doImage(parseInt(v, 10)); break;
      case 'genAll': genAll(); break;
      case 'editImg': openEdit(parseInt(v, 10)); break;
      case 'openHist': openHist(parseInt(v, 10)); break;
      case 'istyle': S.imgStyle = v; render(); break;
      case 'iaspect': S.imgAspect = v; render(); break;
      case 'genImage': genStandaloneImage(); break;
      case 'upgrade': window.location.href = '/storia/#fiyat'; break;
    }
  });

  function applyMode(i) { var m = MODES[i]; if (!m) return; S.durationSec = m.sec; S.aspect = m.aspect; S.tone = m.tone; render(); toast(m.name + ' seçildi'); }
  function applyTemplate(i) { var t = TEMPLATES[i]; if (!t) return; S.template = i; S.tone = t.tone; S.style = t.style; S.durationSec = t.sec; S.aspect = t.aspect; render(); toast(t.name + ' şablonu · tarz ayarlandı'); }
  function startNew() { S.result = null; S.images = {}; S.audio = null; S.idea = ''; S.custom = ''; S.step = 1; S.view = 'new'; S.tab = 'senaryo'; render(); }

  // ── Generation ───────────────────────────────────────────────────────
  function startGenerate(isRegen) {
    if (REAL && !S.user) { openAuth(); return; }
    S.step = 3; render(); runGenAnim();
    if (REAL) realGenerate(isRegen); else demoGenerate();
  }
  var _timers = [];
  function runGenAnim() {
    _timers.forEach(clearTimeout); _timers = [];
    var statuses = ['Güvenilir kaynaklar taranıyor…', 'Anlatı omurgası kuruluyor…', 'Sahneler ve görseller planlanıyor…', 'Başlık ve yayın paketi yazılıyor…', 'Son rötuşlar…'];
    var st = document.getElementById('genStatus');
    statuses.forEach(function (s, i) { _timers.push(setTimeout(function () { if (st) st.textContent = s; }, i * 1400)); });
    GEN_STEPS.forEach(function (_, i) {
      _timers.push(setTimeout(function () {
        var g = document.getElementById('gr' + i); if (g) g.classList.add('on');
        if (i > 0) { var p = document.getElementById('gr' + (i - 1)); if (p) { p.classList.remove('on'); p.classList.add('done'); p.querySelector('.gi').textContent = '✓'; } }
      }, 700 + i * 1500));
    });
  }
  function finishGen(result, charged, credits) {
    _timers.forEach(clearTimeout);
    S.result = result; S.images = {}; S.audio = null; S.tab = 'senaryo';
    if (typeof credits === 'number') S.credits = credits;
    else if (!REAL && charged) S.credits = Math.max(0, (S.credits || 0) - costGen(S.durationSec));
    S.history.unshift({ result: result, idea: S.idea, meta: fmtDur(S.durationSec) + ' · ' + styleObj().name + ' · ' + S.aspect, ts: Date.now(), aspect: S.aspect, style: S.style, voiceIdx: S.voiceIdx, durationSec: S.durationSec });
    S.step = 4; render();
  }
  function demoGenerate() { setTimeout(function () { finishGen(synthDemo(), true); }, 5200); }

  function buildPrompt() {
    var scenes = sceneFor(S.durationSec), st = styleObj();
    return 'Sen içerik üreticileri için çalışan uzman bir senarist ve yapım yönetmenisin. İzleyiciyi ilk saniyeden yakalayan, akıcı ve DOĞRU içerik üret.\n\n' +
      'KONU: ' + S.idea + '\nANLATIM TONU: ' + toneName() + '\nGÖRSEL STİL: ' + st.name + ' (' + st.en + ')\n' +
      'FORMAT: ' + S.aspect + ' · SÜRE: ' + fmtDur(S.durationSec) + ' · SAHNE SAYISI: yaklaşık ' + scenes + '\n' +
      (S.custom ? 'ÖZEL İSTEK (en yüksek öncelik): ' + S.custom + '\n' : '') +
      '\nYalnızca aşağıdaki şemada, Türkçe ve GEÇERLİ JSON döndür (başka metin yok):\n' +
      '{ "baslik":"çarpıcı başlık", "logline":"tek cümle özet", "karakterler":[], ' +
      '"senaryo":[{"baslik":"sahne başlığı","anlatim":"seslendirilecek akıcı anlatım (2-4 cümle)","gorsel":"kısa görsel tarifi"}], ' +
      '"seslendirme_notu":"anlatıcı yönergesi", "youtube":{"baslik":"SEO başlığı","aciklama":"açıklama","etiketler":["e1"]}, ' +
      '"instagram":{"aciklama":"Reels metni","hashtagler":["h1"]}, "kapak":["fikir1"], ' +
      '"gorsel_promptlar":["her sahne için İngilizce ' + st.en + ' tarzında görsel üretim promptu"], "video_promptlar":[], "uretim_notu":"kısa tavsiye" }\n' +
      'senaryo ve gorsel_promptlar en az ' + Math.min(scenes, 8) + ' öğe içersin. Konu anlamsızsa {"gecersiz":true,"mesaj":"..."} döndür.';
  }
  function realGenerate(isRegen) {
    var job = 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    var prevJob = S.genJob; S.genJob = job;
    var body = { action: 'generate', prompt: buildPrompt(), provider: S.provider, topic: S.idea, duration: 's' + S.durationSec, max_tokens: 12000, job: job };
    if (isRegen && prevJob) { body.regen = true; body.prevJob = prevJob; }
    callFn(body).then(function (d) {
      if (!d || !d.ok) { genError(d && d.error); return; }
      var obj = typeof d.result === 'string' ? safeParse(d.result) : d.result;
      if (!obj) { genError('Dosya çözümlenemedi.'); return; }
      finishGen(obj, d.charged, d.credits);
    }).catch(function () { genError('Bağlantı hatası.'); });
  }
  function genError(msg) { _timers.forEach(clearTimeout); S.step = 2; render(); toast(msg || 'Üretim başarısız — tekrar dene'); }
  function safeParse(t) { try { return JSON.parse(t); } catch (e) { return null; } }

  function openHist(i) { var h = S.history[i]; if (!h) return; S.result = h.result; S.images = {}; S.audio = null; S.aspect = h.aspect; S.style = h.style; S.voiceIdx = h.voiceIdx; S.durationSec = h.durationSec; S.idea = h.idea; S.tab = 'senaryo'; S.view = 'new'; S.step = 4; render(); }

  function downloadFile() {
    var r = S.result || {}; var lines = [];
    lines.push(r.baslik || S.idea); lines.push('');
    if (r.logline) { lines.push(r.logline); lines.push(''); }
    lines.push('— SENARYO —');
    (r.senaryo || []).forEach(function (s, i) { lines.push((i + 1) + '. ' + (s.baslik || '')); lines.push(s.anlatim || ''); if (s.gorsel) lines.push('[Görsel] ' + s.gorsel); lines.push(''); });
    var yt = r.youtube || {}; lines.push('— YOUTUBE —'); lines.push(yt.baslik || ''); lines.push(yt.aciklama || ''); lines.push('Etiketler: ' + (yt.etiketler || []).join(', ')); lines.push('');
    var ig = r.instagram || {}; lines.push('— INSTAGRAM —'); lines.push(ig.aciklama || ''); lines.push((ig.hashtagler || []).map(function (t) { return '#' + t; }).join(' ')); lines.push('');
    lines.push('— GÖRSEL PROMPTLARI —'); (r.gorsel_promptlar || []).forEach(function (p, i) { lines.push((i + 1) + '. ' + p); });
    var blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = (r.baslik || 'storia-dosya').replace(/[^\wğüşiöçİĞÜŞÖÇ -]/g, '').slice(0, 60) + '.txt'; a.click();
    toast('Dosya indirildi');
  }

  function exportPDF() {
    var r = S.result || {};
    var w = window.open('', '_blank');
    if (!w) { toast('PDF için açılır pencereye izin ver'); return; }
    var meta = [fmtDur(S.durationSec), styleObj().name, S.aspect, VOICES[S.voiceIdx].name].join(' · ');
    var scenes = (r.senaryo || []).map(function (s, i) {
      var img = S.images[i] ? '<img class="sc-img" src="' + esc(S.images[i]) + '">' : '';
      return '<div class="sc"><div class="sc-n">Sahne ' + (i + 1) + '</div><h3>' + esc(s.baslik || '') + '</h3>' + img +
        '<p>' + esc(s.anlatim || s.metin || '') + '</p>' + (s.gorsel ? '<div class="sc-v">Görsel: ' + esc(s.gorsel) + '</div>' : '') + '</div>';
    }).join('');
    var yt = r.youtube || {}, ig = r.instagram || {};
    var tags = (yt.etiketler || []).join(', ');
    var htags = (ig.hashtagler || []).map(function (t) { return t[0] === '#' ? t : '#' + t; }).join(' ');
    var doc = '<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>' + esc(r.baslik || 'Storia') + '</title>' +
      '<style>' +
      '@page{margin:22mm 18mm}' +
      'body{font-family:Georgia,"Times New Roman",serif;color:#1B1712;line-height:1.6;max-width:760px;margin:0 auto;padding:20px}' +
      '.brand{font-family:Arial,sans-serif;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#8B6C31;font-weight:700}' +
      'h1{font-size:34px;line-height:1.12;margin:8px 0 6px}' +
      '.logline{font-style:italic;color:#4B4339;font-size:16px;margin:0 0 8px}' +
      '.meta{font-family:Arial,sans-serif;font-size:12px;color:#8A7F6E;border-bottom:2px solid #E4D7BC;padding-bottom:14px;margin-bottom:22px}' +
      'h2{font-family:Arial,sans-serif;font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#8B6C31;margin:28px 0 12px;border-top:1px solid #EAE2D3;padding-top:16px}' +
      '.sc{margin:0 0 20px;page-break-inside:avoid}' +
      '.sc-n{font-family:Arial,sans-serif;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#8B6C31;font-weight:700}' +
      '.sc h3{font-size:18px;margin:3px 0 8px}' +
      '.sc-img{width:100%;max-height:300px;object-fit:cover;border-radius:8px;margin:6px 0}' +
      '.sc p{margin:6px 0}' +
      '.sc-v{font-family:Arial,sans-serif;font-size:12px;color:#8A7F6E;margin-top:4px}' +
      '.pub{font-family:Arial,sans-serif;font-size:14px}.pub b{color:#8B6C31}' +
      '.tags{font-family:Arial,sans-serif;font-size:12px;color:#8B6C31;margin-top:6px}' +
      '.foot{margin-top:34px;font-family:Arial,sans-serif;font-size:11px;color:#B4A992;text-align:center}' +
      '</style></head><body>' +
      '<div class="brand">Storia · Yapay Zekâ İçerik Stüdyosu</div>' +
      '<h1>' + esc(r.baslik || S.idea) + '</h1>' +
      (r.logline ? '<p class="logline">' + esc(r.logline) + '</p>' : '') +
      '<div class="meta">' + esc(meta) + '</div>' +
      '<h2>Senaryo</h2>' + scenes +
      '<h2>Seslendirme metni</h2><p>' + esc(narrationText()).replace(/\n/g, '<br>') + '</p>' +
      '<h2>YouTube</h2><div class="pub"><b>Başlık:</b> ' + esc(yt.baslik || '') + '<br><br>' + esc(yt.aciklama || '').replace(/\n/g, '<br>') + '<div class="tags">' + esc(tags) + '</div></div>' +
      '<h2>Instagram</h2><div class="pub">' + esc(ig.aciklama || '').replace(/\n/g, '<br>') + '<div class="tags">' + esc(htags) + '</div></div>' +
      '<div class="foot">storia · ' + esc(meta) + '</div>' +
      '</body></html>';
    w.document.open(); w.document.write(doc); w.document.close();
    setTimeout(function () { try { w.focus(); w.print(); } catch (e) {} }, 500);
    toast('PDF hazırlanıyor — yazdır penceresinden "PDF olarak kaydet" seç');
  }

  // ── Images ───────────────────────────────────────────────────────────
  function doImage(idx) {
    var r = S.result || {}; var prompt = (r.gorsel_promptlar || [])[idx]; if (!prompt) return;
    var full = prompt + ' — ' + styleObj().en;
    if (!REAL) { S.images[idx] = demoImage(idx, S.aspect); refreshTab(); toast('Demo görsel eklendi'); return; }
    if (!S.user) { openAuth(); return; }
    toast('Görsel üretiliyor…');
    callFn({ action: 'image', prompt: full, size: S.aspect, imgIndex: idx }).then(function (d) {
      if (d && d.ok && d.url) { S.images[idx] = d.url; if (typeof d.credits === 'number') S.credits = d.credits; refreshTab(); chrome(); toast('Görsel üretildi'); }
      else toast((d && d.error) || 'Görsel üretilemedi');
    }).catch(function () { toast('Bağlantı hatası'); });
  }
  function refreshTab() { var tb = document.getElementById('tabBody'); if (tb) tb.innerHTML = renderTab(); }
  // ── Image editing ─────────────────────────────────────────────────────
  var _editIdx = null;
  function openEdit(idx) { if (S.images[idx] == null) return; _editIdx = idx; var t = document.getElementById('editText'); t.value = ''; document.getElementById('editModal').classList.add('show'); setTimeout(function () { t.focus(); }, 50); }
  function closeEdit() { document.getElementById('editModal').classList.remove('show'); }
  function toDataUri(url) {
    if (url.indexOf('data:') === 0) return Promise.resolve(url);
    return fetch(url).then(function (r) { return r.blob(); }).then(function (bl) { return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsDataURL(bl); }); });
  }
  function applyEdit() {
    var idx = _editIdx; var instr = document.getElementById('editText').value.trim();
    if (idx == null || !S.images[idx]) return;
    if (!instr) { toast('Ne değiştireyim yaz'); return; }
    closeEdit();
    if (!REAL) { S.images[idx] = demoImage(idx, S.aspect); refreshTab(); toast('Düzenlendi (demo): ' + instr.slice(0, 36)); return; }
    if (!S.user) { openAuth(); return; }
    toast('Görsel düzenleniyor…');
    toDataUri(S.images[idx]).then(function (du) {
      return callFn({ action: 'edit', image: du, prompt: instr, size: S.aspect });
    }).then(function (d) {
      if (d && d.ok && d.url) { S.images[idx] = d.url; if (typeof d.credits === 'number') S.credits = d.credits; refreshTab(); chrome(); toast('Görsel düzenlendi'); }
      else toast((d && d.error) || 'Görsel düzenlenemedi');
    }).catch(function () { toast('Bağlantı hatası'); });
  }
  function genAll() {
    var r = S.result || {}; var prompts = r.gorsel_promptlar || [];
    if (!prompts.length) return;
    var idxs = []; for (var k = 0; k < prompts.length; k++) if (!S.images[k]) idxs.push(k);
    if (!idxs.length) { toast('Zaten hepsi üretildi'); return; }
    if (!REAL) { idxs.forEach(function (i) { S.images[i] = demoImage(i, S.aspect); }); refreshTab(); toast(idxs.length + ' görsel üretildi (demo)'); return; }
    if (!S.user) { openAuth(); return; }
    toast(idxs.length + ' görsel sırayla üretiliyor…');
    var n = 0;
    (function next() {
      if (n >= idxs.length) { toast('Tüm görseller hazır'); return; }
      var idx = idxs[n++]; var full = prompts[idx] + ' — ' + styleObj().en;
      callFn({ action: 'image', prompt: full, size: S.aspect, imgIndex: idx }).then(function (d) {
        if (d && d.ok && d.url) { S.images[idx] = d.url; if (typeof d.credits === 'number') S.credits = d.credits; refreshTab(); chrome(); }
        next();
      }).catch(function () { next(); });
    })();
  }
  function demoImage(idx, aspect) {
    var c = document.createElement('canvas'); c.width = 500; c.height = aspect === '9:16' ? 780 : aspect === '16:9' ? 300 : 500;
    var x = c.getContext('2d');
    var pal = [['#efe6d2', '#c2a160'], ['#e0c588', '#9c7b3b'], ['#f3ecdc', '#d9bc80'], ['#d8b98a', '#8b6c31'], ['#ead9b6', '#b4914d']][idx % 5];
    var g = x.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = 'rgba(255,255,255,.9)'; x.textAlign = 'center';
    x.font = '600 17px Hanken Grotesk, sans-serif'; x.fillText('STORIA', c.width / 2, c.height / 2 - 6);
    x.font = '400 13px Hanken Grotesk, sans-serif'; x.fillText('demo görsel · sahne ' + (idx + 1), c.width / 2, c.height / 2 + 16);
    return c.toDataURL('image/jpeg', 0.82);
  }
  function genStandaloneImage() {
    if (!S.imgPrompt.trim()) { toast('Önce bir görsel tarifi yaz'); return; }
    var full = S.imgPrompt + ' — ' + styleObj(S.imgStyle).en;
    if (!REAL) { S.imgOut = demoImage(0, S.imgAspect); render(); toast('Demo görsel üretildi'); return; }
    if (!S.user) { openAuth(); return; }
    toast('Görsel üretiliyor…');
    var out = document.getElementById('imgOut'); if (out) out.innerHTML = '<div class="ph" style="aspect-ratio:1;display:grid;place-items:center;border-radius:var(--r-md);background:var(--paper-2);color:var(--muted)">Üretiliyor…</div>';
    callFn({ action: 'image', prompt: full, size: S.imgAspect, imgIndex: 0 }).then(function (d) {
      if (d && d.ok && d.url) { S.imgOut = d.url; if (typeof d.credits === 'number') S.credits = d.credits; render(); toast('Görsel üretildi'); }
      else { render(); toast((d && d.error) || 'Görsel üretilemedi'); }
    }).catch(function () { render(); toast('Bağlantı hatası'); });
  }

  // ── TTS ──────────────────────────────────────────────────────────────
  function speak(text, rate) {
    if (!('speechSynthesis' in window)) return false;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text); u.lang = 'tr-TR'; u.rate = rate || 1;
    var vs = window.speechSynthesis.getVoices() || [];
    for (var i = 0; i < vs.length; i++) { if (/tr(-|_)/i.test(vs[i].lang)) { u.voice = vs[i]; break; } }
    window.speechSynthesis.speak(u); return true;
  }
  function previewVoice(i) {
    var v = VOICES[i]; var sample = 'Storia ile hikâyen hayat buluyor. Bu ses senin anlatıcın olabilir.';
    if (!REAL) { if (!speak(sample, S.ttsRate)) toast('Tarayıcı seslendirmeyi desteklemiyor'); else toast('Önizleme · ' + v.name); return; }
    toast('Önizleme hazırlanıyor…');
    callFn({ action: 'tts', preview: true, engine: 'openai', voice: v.ov }).then(function (d) {
      if (d && d.ok && d.url) { try { new Audio(d.url).play(); } catch (e) {} } else toast('Önizleme alınamadı');
    }).catch(function () { toast('Bağlantı hatası'); });
  }
  function doTts() {
    var text = narrationText(); if (!text) { toast('Seslendirilecek metin yok'); return; }
    if (!REAL) {
      if (!speak(text.slice(0, 600), S.ttsRate)) { toast('Tarayıcı seslendirmeyi desteklemiyor'); return; }
      toast('Demo seslendirme (gerçek modda indirilebilir mp3)'); return;
    }
    if (!S.user) { openAuth(); return; }
    var slot = document.getElementById('audioSlot'); if (slot) slot.innerHTML = '<p style="color:var(--on-ink-muted);font-size:13px;margin-top:12px">Ses üretiliyor…</p>';
    callFn({ action: 'tts', text: text, engine: 'openai', voice: VOICES[S.voiceIdx].ov, speed: S.ttsRate }).then(function (d) {
      if (d && d.ok && d.url) { S.audio = d.url; if (typeof d.credits === 'number') S.credits = d.credits; if (slot) slot.innerHTML = '<audio controls src="' + esc(d.url) + '"></audio>'; chrome(); toast('Seslendirme hazır'); }
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
    var senaryo = beats.map(function (b, i) { return { baslik: b[0], anlatim: b[1], gorsel: 'Sahne ' + (i + 1) + ' için ' + st.name.toLowerCase() + ' bir kare' }; });
    var prompts = beats.map(function (b, i) { return 'Scene ' + (i + 1) + ': ' + b[0].toLowerCase() + ' depicting "' + topic + '", ' + st.en + ', aspect ' + S.aspect + ', highly detailed, atmospheric'; });
    return {
      baslik: topic.replace(/\?$/, '') + ' — Bilmediğin Gerçek',
      logline: topic + ' Bu videoda merakını gidereceğiz.', karakterler: [], senaryo: senaryo,
      seslendirme_notu: toneName() + ' bir tonda, doğal tempoda oku.',
      youtube: { baslik: topic.replace(/\?$/, '') + ' | Storia', aciklama: 'Bu videoda ' + topic.toLowerCase() + ' sorusunu adım adım cevaplıyoruz. Beğenmeyi ve abone olmayı unutma!\n\n00:00 Giriş\n00:30 İlk ipucu\n02:00 Derinleşme', etiketler: ['storia', 'belgesel', 'merak', topic.split(' ')[0].toLowerCase(), 'bilgi'] },
      instagram: { aciklama: topic + ' 👀 Cevabı videoda. Kaydet, sonra izle!', hashtagler: ['storia', 'kesfet', 'bilgi', 'merak', 'reels'] },
      kapak: ['Büyük soru işareti + çarpıcı görsel, sıcak ışık', 'Yakın plan detay + kalın başlık metni'],
      gorsel_promptlar: prompts, video_promptlar: prompts.map(function (p) { return p + ', slow cinematic camera move'; }),
      uretim_notu: 'İlk 5 saniyeye en güçlü görseli koy; geçişleri müzikle senkronla. (Bu bir DEMO çıktısıdır.)'
    };
  }

  // ── Backend ──────────────────────────────────────────────────────────
  function fnUrl() { return CFG.supabaseUrl.replace(/\/$/, '') + '/functions/v1/' + FN; }
  function callFn(body) {
    return getToken().then(function (token) {
      return fetch(fnUrl(), { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
    });
  }
  function getToken() { if (!sb) return Promise.resolve(CFG.supabaseAnonKey); return sb.auth.getSession().then(function (res) { var s = res && res.data && res.data.session; return (s && s.access_token) || CFG.supabaseAnonKey; }); }

  // ── Auth ─────────────────────────────────────────────────────────────
  var authMode = 'in';
  function openAuth() { if (!REAL) { toast('Demo modu — kurulum sonrası giriş aktifleşir'); return; } document.getElementById('authModal').classList.add('show'); }
  function closeAuth() { document.getElementById('authModal').classList.remove('show'); }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    try { localStorage.setItem('storia_theme', cur); } catch (e) {}
    toast(cur === 'dark' ? 'Karanlık mod' : 'Aydınlık mod');
  }
  function setupChrome() {
    var themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    setupCmd();
    // rail nav
    document.getElementById('railNav').addEventListener('click', function (e) {
      var it = e.target.closest('.rail-item'); if (!it) return;
      var v = it.getAttribute('data-view');
      if (v === 'new' && S.step === 4) startNew(); else { S.view = v; render(); }
      closeRail();
    });
    document.getElementById('acctRow').addEventListener('click', function () {
      if (S.user) { if (sb) sb.auth.signOut(); S.user = null; S.credits = REAL ? null : 500; chrome(); toast('Çıkış yapıldı'); }
      else openAuth();
    });
    // mobile rail
    var rail = document.getElementById('rail'), scrim = document.getElementById('railScrim');
    document.getElementById('burger').addEventListener('click', function () { rail.classList.add('open'); scrim.classList.add('show'); });
    document.getElementById('railClose').addEventListener('click', closeRail);
    scrim.addEventListener('click', closeRail);
    function _close() { rail.classList.remove('open'); scrim.classList.remove('show'); }
    window._closeRail = _close;
    // auth modal
    var modal = document.getElementById('authModal');
    document.getElementById('authClose').addEventListener('click', closeAuth);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeAuth(); });
    document.getElementById('authSwitch').addEventListener('click', switchAuth);
    document.getElementById('authSubmit').addEventListener('click', doAuth);
    // edit image modal
    var editModal = document.getElementById('editModal');
    document.getElementById('editApply').addEventListener('click', applyEdit);
    document.getElementById('editCancel').addEventListener('click', closeEdit);
    editModal.addEventListener('click', function (e) { if (e.target === editModal) closeEdit(); });
    document.getElementById('editText').addEventListener('keydown', function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) applyEdit(); });
    // global keyboard
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmd(); return; }
      if (e.key === 'Escape') { closeCmd(); closeAuth(); closeEdit(); return; }
      var typing = /input|textarea/i.test((e.target.tagName || ''));
      var anyModal = document.querySelector('.modal-back.show');
      if (!typing && !anyModal && e.key.toLowerCase() === 'n') { startNew(); }
    });
  }

  // ── Command palette (⌘K) ──────────────────────────────────────────────
  function commands() {
    var c = [
      { ic: '＋', label: 'Yeni dosya', k: 'N', run: startNew },
      { ic: '◱', label: 'Görsel stüdyo', run: function () { S.view = 'images'; render(); } },
      { ic: '▤', label: 'Kütüphane', run: function () { S.view = 'library'; render(); } },
      { ic: '◷', label: 'Geçmiş', run: function () { S.view = 'history'; render(); } },
      { ic: '◐', label: (document.documentElement.getAttribute('data-theme') === 'dark' ? 'Aydınlık mod' : 'Karanlık mod'), run: toggleTheme }
    ];
    if (S.result) {
      c.push({ ic: '↓', label: 'PDF olarak indir', run: exportPDF });
      c.push({ ic: '↓', label: 'Metin olarak indir', run: downloadFile });
    }
    if (REAL && !S.user) c.push({ ic: '→', label: 'Giriş yap', run: openAuth });
    return c;
  }
  var _cmdSel = 0, _cmdFiltered = [];
  function openCmd() { var m = document.getElementById('cmdModal'); m.classList.add('show'); var inp = document.getElementById('cmdInput'); inp.value = ''; renderCmd(''); setTimeout(function () { inp.focus(); }, 40); }
  function closeCmd() { document.getElementById('cmdModal').classList.remove('show'); }
  function renderCmd(q) {
    q = (q || '').toLowerCase().trim();
    _cmdFiltered = commands().filter(function (c) { return !q || c.label.toLowerCase().indexOf(q) >= 0; });
    _cmdSel = 0;
    var list = document.getElementById('cmdList');
    if (!_cmdFiltered.length) { list.innerHTML = '<div class="cmd-empty">Komut bulunamadı</div>'; return; }
    list.innerHTML = _cmdFiltered.map(function (c, i) {
      return '<div class="cmd-item' + (i === 0 ? ' sel' : '') + '" data-ci="' + i + '"><span class="ci-ic">' + c.ic + '</span>' + esc(c.label) + (c.k ? '<span class="ci-k">' + c.k + '</span>' : '') + '</div>';
    }).join('');
  }
  function runCmd(i) { var c = _cmdFiltered[i]; if (!c) return; closeCmd(); setTimeout(c.run, 60); }
  function setupCmd() {
    document.getElementById('cmdBtn').addEventListener('click', openCmd);
    var modal = document.getElementById('cmdModal');
    modal.addEventListener('click', function (e) { if (e.target === modal) closeCmd(); });
    modal.addEventListener('click', function (e) { var it = e.target.closest('[data-ci]'); if (it) runCmd(parseInt(it.getAttribute('data-ci'), 10)); });
    var inp = document.getElementById('cmdInput');
    inp.addEventListener('input', function () { renderCmd(inp.value); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); _cmdSel = Math.min(_cmdSel + 1, _cmdFiltered.length - 1); markSel(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); _cmdSel = Math.max(_cmdSel - 1, 0); markSel(); }
      else if (e.key === 'Enter') { e.preventDefault(); runCmd(_cmdSel); }
    });
  }
  function markSel() { var items = document.querySelectorAll('#cmdList .cmd-item'); items.forEach(function (x, i) { x.classList.toggle('sel', i === _cmdSel); if (i === _cmdSel) x.scrollIntoView({ block: 'nearest' }); }); }
  function closeRail() { if (window._closeRail) window._closeRail(); }
  function switchAuth() {
    authMode = authMode === 'in' ? 'up' : 'in';
    document.getElementById('authTitle').textContent = authMode === 'in' ? 'Giriş yap' : 'Kayıt ol';
    document.getElementById('authSubmit').textContent = authMode === 'in' ? 'Giriş yap' : 'Hesap oluştur';
    document.getElementById('authAlt').innerHTML = (authMode === 'in' ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? ') + '<a id="authSwitch">' + (authMode === 'in' ? 'Kayıt ol' : 'Giriş yap') + '</a>';
    document.getElementById('authSwitch').addEventListener('click', switchAuth);
  }
  function doAuth() {
    if (!sb) { toast('Supabase yüklenemedi'); return; }
    var email = document.getElementById('authEmail').value.trim(), pass = document.getElementById('authPass').value;
    if (!email || !pass) { toast('E-posta ve parola gir'); return; }
    var btn = document.getElementById('authSubmit'); btn.disabled = true; btn.textContent = 'Bekle…';
    var p = authMode === 'in' ? sb.auth.signInWithPassword({ email: email, password: pass }) : sb.auth.signUp({ email: email, password: pass });
    p.then(function (res) {
      btn.disabled = false; btn.textContent = authMode === 'in' ? 'Giriş yap' : 'Hesap oluştur';
      if (res.error) { toast(res.error.message || 'Giriş başarısız'); return; }
      if (res.data && res.data.user) { S.user = res.data.user; closeAuth(); toast('Hoş geldin'); loadCredits(); chrome(); }
      else toast('E-postanı kontrol et');
    }).catch(function () { btn.disabled = false; toast('Bağlantı hatası'); });
  }
  function loadCredits() { if (!S.user || !sb) return; sb.from('profiles').select('credits,tier,monthly_quota').eq('id', S.user.id).single().then(function (res) { if (res && res.data) { if (typeof res.data.credits === 'number') S.credits = res.data.credits; if (res.data.monthly_quota) S.creditMax = Math.max(res.data.monthly_quota, res.data.credits || 0) || 500; chrome(); } }, function () {}); }

  // ── Boot ─────────────────────────────────────────────────────────────
  function boot() {
    setupChrome(); render();
    try { if (!localStorage.getItem('storia_seen')) { localStorage.setItem('storia_seen', '1'); setTimeout(function () { toast('Hoş geldin ✦ Bir fikir yaz, gerisini Storia halletsin'); }, 900); } } catch (e) {}
    if (REAL) {
      loadSupabase().then(function () { sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey); return sb.auth.getSession(); })
        .then(function (res) { var s = res && res.data && res.data.session; if (s && s.user) { S.user = s.user; loadCredits(); } chrome(); })
        .catch(function () { toast('Sunucuya bağlanılamadı'); });
    }
  }
  function loadSupabase() { return new Promise(function (resolve, reject) { if (window.supabase) return resolve(); var s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; s.onload = resolve; s.onerror = reject; document.head.appendChild(s); }); }

  boot();
})();

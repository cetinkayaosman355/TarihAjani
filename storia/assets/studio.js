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
    durationSec: 270, provider: 'claude', custom: '', template: null, lang: 'tr',
    result: null, tab: 'senaryo', genJob: null,
    user: null, credits: REAL ? null : 500, creditMax: 500,
    images: {}, covers: {}, audio: null, history: [], ttsRate: 1,
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
    { name: 'Shorts / TikTok', desc: '15 sn · Dikey', sec: 15, aspect: '9:16', tone: 'enerjik' },
    { name: 'Kısa Video', desc: '60 sn · Dikey', sec: 60, aspect: '9:16', tone: 'enerjik' },
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
  function sceneFor(sec) { return Math.max(sec < 30 ? 2 : 6, Math.round(120 * sec / (600 + sec))); }
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function copy(text) { try { navigator.clipboard.writeText(text); toast('Kopyalandı'); } catch (e) { toast('Kopyalanamadı'); } }
  function styleObj(id) { id = id || S.style; for (var i = 0; i < STYLES.length; i++) if (STYLES[i].id === id) return STYLES[i]; return STYLES[0]; }
  function toneName(id) { id = id || S.tone; for (var i = 0; i < TONES.length; i++) if (TONES[i].id === id) return TONES[i].name; return TONES[0].name; }

  // ── Chrome (rail + topbar) ───────────────────────────────────────────
  function chrome() {
    document.querySelectorAll('.rail-item').forEach(function (it) { it.classList.toggle('on', it.getAttribute('data-view') === S.view); });
    document.querySelectorAll('.btm-nav button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-view') === S.view); });
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
    var fill = Math.round((sec - 10) / 590 * 100);

    var langSeg = [['tr', 'Türkçe'], ['en', 'English']].map(function (l) { return '<button class="' + (S.lang === l[0] ? 'on' : '') + '" data-act="lang" data-v="' + l[0] + '">' + l[1] + '</button>'; }).join('');
    var left = '<div class="room-head"><h1>Tarzını seç</h1><p>Her ayarı önizleme kartında anında gör.</p></div>' +
      '<div class="opt-group"><div class="opt-title">İçerik dili</div><div class="seg">' + langSeg + '</div></div>' +
      '<div class="opt-group"><div class="opt-title">Hazır modlar</div><div class="modes">' + modes + '</div></div>' +
      '<div class="opt-group"><div class="opt-title">Anlatım tonu</div><div class="seg">' + toneSeg + '</div></div>' +
      '<div class="opt-group"><div class="opt-title">Anlatıcı sesi</div><div class="tiles">' + voiceTiles + '</div></div>' +
      '<div class="opt-group"><div class="opt-title">Görsel stil</div><div class="tiles">' + styleTiles + '</div></div>' +
      '<div class="opt-group"><div class="opt-title">Format</div><div class="aspects">' + aspects + '</div></div>' +
      '<div class="opt-group"><div class="opt-title">Süre</div><div class="slider-card"><div class="sh"><span class="sv" id="durVal">' + fmtDur(sec) + '</span><span class="pc-cr">yaklaşık ' + costGen(sec) + ' kredi</span></div>' +
        '<input type="range" id="durRange" min="10" max="600" step="5" value="' + sec + '" style="--fill:' + fill + '%"></div></div>' +
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
        '<div class="pv-chips"><span>' + (S.lang === 'en' ? 'English' : 'Türkçe') + '</span><span>' + esc(toneName()) + '</span><span>' + esc(VOICES[S.voiceIdx].name) + '</span><span>' + esc(styleObj().name) + '</span></div>' +
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
        var img = S.images[i], thumb, acts;
        if (img) {
          thumb = '<div class="th"><img class="zoomable" src="' + esc(img) + '" data-act="zoom" data-v="' + esc(img) + '" alt=""></div>';
          acts = '<div class="th-acts"><button class="btn btn-quiet btn-sm" data-act="image" data-v="' + i + '">↻ Yeniden</button><button class="btn btn-quiet btn-sm" data-act="editImg" data-v="' + i + '">✏ Düzenle</button><button class="btn btn-quiet btn-sm" data-act="dl" data-v="' + esc(img) + '">↓ İndir</button></div>';
        } else {
          thumb = '<div class="th"><div class="ph" style="background:' + GRADS[i % GRADS.length] + '">Sahne ' + (i + 1) + '</div></div>';
          acts = '<div class="th-acts"><button class="btn btn-gold btn-sm" data-act="image" data-v="' + i + '">✦ Görsel üret</button></div>';
        }
        return '<div class="scene"><div class="th-col">' + thumb + acts + '</div><div><div class="s-no">Sahne ' + (i + 1) + '</div>' +
          '<h4>' + esc(sc.baslik || ('Sahne ' + (i + 1))) + '</h4><p>' + esc(sc.anlatim || sc.metin || '') + '</p>' +
          (sc.gorsel ? '<div class="s-vis">🎬 <span>' + esc(sc.gorsel) + '</span></div>' : '') + '</div></div>';
      }).join('');
      return '<div class="tab-tools"><span class="tt-note">' + (r.senaryo || []).length + ' sahne · görsele tıkla → büyüt, gez, indir</span><button class="btn btn-quiet btn-sm" data-act="copyScript">Tümünü kopyala</button></div>' + (scenes || emptyInline());
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
          (S.audio ? '<button class="btn btn-quiet btn-sm" data-act="dlAudio">↓ Sesi indir</button>' : '') +
          '<button class="btn btn-quiet btn-sm" data-act="copyVo">Metni kopyala</button></div>' +
        '</div>' +
        '<div class="panel"><h3>Seslendirme metni</h3><p class="p-note">' + esc(r.seslendirme_notu || 'Doğal, akıcı bir anlatıma göre hazırlandı.') + '</p><div class="panel-txt">' + esc(vo) + '</div></div>';
    }
    if (S.tab === 'gorsel') {
      var prompts = (r.gorsel_promptlar || []);
      if (!prompts.length) return emptyInline();
      var cards = prompts.map(function (p, i) {
        var img = S.images[i];
        var box = img ? '<img class="zoomable" src="' + esc(img) + '" data-act="zoom" data-v="' + esc(img) + '" alt="">' : '<div class="ph" style="background:' + GRADS[i % GRADS.length] + '">' + (REAL ? '✦ Üret' : 'Örnek görsel') + '</div>';
        var acts = img
          ? '<button class="btn btn-quiet btn-sm" data-act="image" data-v="' + i + '">↻ Yeniden</button><button class="btn btn-quiet btn-sm" data-act="editImg" data-v="' + i + '">✏ Düzenle</button><button class="btn btn-quiet btn-sm" data-act="dl" data-v="' + esc(img) + '">↓ İndir</button>'
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
        var box, sbActs;
        if (img) {
          box = '<img class="zoomable" src="' + esc(img) + '" data-act="zoom" data-v="' + esc(img) + '" alt="">';
          sbActs = '<div class="th-acts" style="margin-top:10px"><button class="btn btn-quiet btn-sm" data-act="image" data-v="' + i + '">↻ Yeniden</button><button class="btn btn-quiet btn-sm" data-act="dl" data-v="' + esc(img) + '">↓ İndir</button></div>';
        } else {
          box = '<div class="ph" style="aspect-ratio:' + ratio + ';background:' + GRADS[i % GRADS.length] + '">Sahne ' + (i + 1) + '</div>';
          sbActs = '<div class="th-acts" style="margin-top:10px"><button class="btn btn-gold btn-sm" data-act="image" data-v="' + i + '">✦ Görsel üret</button></div>';
        }
        return '<div class="sb-card"><div class="sb-img" style="aspect-ratio:' + ratio + '">' + box + '</div><div class="sb-body"><div class="sb-no">Sahne ' + (i + 1) + '</div><h5>' + esc(s.baslik || ('Sahne ' + (i + 1))) + '</h5><p>' + esc(s.anlatim || s.metin || '') + '</p>' + sbActs + '</div></div>';
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
      var kp = r.kapak || [];
      var kapak = kp.map(function (k, i) {
        var img = S.covers[i];
        var box = img ? '<img src="' + esc(img) + '" alt="">' : '<div class="ph" style="aspect-ratio:16/9;background:' + GRADS[i % GRADS.length] + '">' + (REAL ? '✦ Thumbnail üret' : 'Örnek kapak') + '</div>';
        var over = '<div class="sb-gen" data-act="cover" data-v="' + i + '"><span>' + (img ? 'Yeniden üret' : '✦ Thumbnail üret') + '</span></div>';
        return '<div class="sb-card"><div class="sb-img" style="aspect-ratio:16/9">' + box + over + '</div><div class="sb-body"><div class="sb-no">Kapak ' + (i + 1) + '</div><p style="max-height:none">' + esc(k) + '</p></div></div>';
      }).join('');
      return '<div class="tab-tools"><span class="tt-note">Tıklanmayı artıracak thumbnail fikirleri — üstüne gelip görselini üret (16:9)</span></div>' +
        (kapak ? '<div class="storyboard">' + kapak + '</div>' : emptyInline()) +
        (r.uretim_notu ? '<div class="panel" style="margin-top:18px"><h3>Yapım notu</h3><div class="panel-txt">' + esc(r.uretim_notu) + '</div></div>' : '');
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
    var out = S.imgOut
      ? '<img src="' + esc(S.imgOut) + '" alt="" style="width:100%;border-radius:var(--r-md);border:1px solid var(--line)">' +
        '<div class="is-acts"><button class="btn btn-gold btn-sm" data-act="editStudio">✏ Düzenle</button>' +
        '<button class="btn btn-quiet btn-sm" data-act="genImage">↻ Yeniden</button>' +
        '<a class="btn btn-quiet btn-sm" href="' + esc(S.imgOut) + '" download="storia-gorsel.jpg" target="_blank" rel="noopener">↓ İndir</a></div>'
      : '<div class="ph" style="aspect-ratio:1;display:grid;place-items:center;border-radius:var(--r-md);border:1px solid var(--line);background:linear-gradient(135deg,var(--paper-2),var(--paper-3));color:var(--muted);font-size:14px">Görselin burada belirir</div>';
    return '<div class="imgstudio"><div class="room-head"><h1>Görsel stüdyo</h1><p>Tek bir prompt ile bağımsız görsel üret, düzenle ve indir.</p></div>' +
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
      range.style.setProperty('--fill', Math.round((S.durationSec - 10) / 590 * 100) + '%');
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
      case 'lang': S.lang = v; render(); break;
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
      case 'zoom': openLightboxByUrl(v); break;
      case 'dl': downloadFileUrl(v, 'storia-gorsel-' + Date.now() + '.jpg'); break;
      case 'dlAudio': downloadFileUrl(S.audio, 'storia-seslendirme.mp3'); break;
      case 'genAll': genAll(); break;
      case 'cover': doCover(parseInt(v, 10)); break;
      case 'editImg': openEdit(parseInt(v, 10)); break;
      case 'openHist': openHist(parseInt(v, 10)); break;
      case 'istyle': S.imgStyle = v; render(); break;
      case 'iaspect': S.imgAspect = v; render(); break;
      case 'genImage': genStandaloneImage(); break;
      case 'editStudio': openEditStudio(); break;
      case 'upgrade': openPlanModal(); break;
    }
  });

  function applyMode(i) { var m = MODES[i]; if (!m) return; S.durationSec = m.sec; S.aspect = m.aspect; S.tone = m.tone; render(); toast(m.name + ' seçildi'); }
  function applyTemplate(i) { var t = TEMPLATES[i]; if (!t) return; S.template = i; S.tone = t.tone; S.style = t.style; S.durationSec = t.sec; S.aspect = t.aspect; render(); toast(t.name + ' şablonu · tarz ayarlandı'); }
  function startNew() { S.result = null; S.images = {}; S.covers = {}; S.audio = null; S.idea = ''; S.custom = ''; S.step = 1; S.view = 'new'; S.tab = 'senaryo'; render(); }

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
    S.result = result; S.images = {}; S.covers = {}; S.audio = null; S.tab = 'senaryo';
    if (typeof credits === 'number') S.credits = credits;
    else if (!REAL && charged) S.credits = Math.max(0, (S.credits || 0) - costGen(S.durationSec));
    S.history.unshift({ result: result, idea: S.idea, meta: fmtDur(S.durationSec) + ' · ' + styleObj().name + ' · ' + S.aspect, ts: Date.now(), aspect: S.aspect, style: S.style, voiceIdx: S.voiceIdx, durationSec: S.durationSec });
    S.step = 4; render();
  }
  function demoGenerate() { setTimeout(function () { finishGen(synthDemo(), true); }, 5200); }

  function buildPrompt() {
    var scenes = sceneFor(S.durationSec), st = styleObj(), min = Math.min(scenes, 8);
    var wps = S.lang === 'en' ? 2.5 : 2.2;                 // konuşma hızı (kelime/sn)
    var words = Math.max(14, Math.round(S.durationSec * wps));  // süreye sığacak toplam kelime
    if (S.lang === 'en') {
      return 'You are an expert scriptwriter and production director for content creators. Write fluent, ACCURATE content that hooks the viewer from the first second.\n\n' +
        'TOPIC: ' + S.idea + '\nTONE: ' + toneName() + '\nVISUAL STYLE: ' + st.name + ' (' + st.en + ')\n' +
        'FORMAT: ' + S.aspect + ' · DURATION: ' + fmtDur(S.durationSec) + ' · ~' + scenes + ' scenes\n' +
        'LENGTH BUDGET (CRITICAL): the video is ' + fmtDur(S.durationSec) + ' long and the narration will be read ALOUD. The TOTAL of all scenes\' "anlatim" text must be AT MOST ~' + words + ' words — do NOT exceed it. Keep each scene short (one sentence for short videos). Even with ' + scenes + ' scenes, keep it tight so the voiceover fits ' + fmtDur(S.durationSec) + '.\n' +
        (S.custom ? 'SPECIAL REQUEST (highest priority): ' + S.custom + '\n' : '') +
        '\nReturn ONLY valid JSON in this schema, in ENGLISH (keys stay exactly as below, no other text):\n' +
        '{ "baslik":"catchy title", "logline":"one-sentence summary", "karakterler":[], ' +
        '"senaryo":[{"baslik":"scene title","anlatim":"short narration that fits the duration (1 sentence for short videos)","gorsel":"short visual description"}], ' +
        '"seslendirme_notu":"note to the narrator", "youtube":{"baslik":"SEO title","aciklama":"description","etiketler":["tag1"]}, ' +
        '"instagram":{"aciklama":"Reels caption","hashtagler":["hashtag1"]}, "kapak":["thumbnail idea"], ' +
        '"gorsel_promptlar":["English ' + st.en + ' image-generation prompt for each scene"], "video_promptlar":[], "uretim_notu":"short production tip" }\n' +
        'senaryo and gorsel_promptlar must contain at least ' + min + ' items. If the topic is nonsense return {"gecersiz":true,"mesaj":"..."}.';
    }
    return 'Sen içerik üreticileri için çalışan uzman bir senarist ve yapım yönetmenisin. İzleyiciyi ilk saniyeden yakalayan, akıcı ve DOĞRU içerik üret.\n\n' +
      'KONU: ' + S.idea + '\nANLATIM TONU: ' + toneName() + '\nGÖRSEL STİL: ' + st.name + ' (' + st.en + ')\n' +
      'FORMAT: ' + S.aspect + ' · SÜRE: ' + fmtDur(S.durationSec) + ' · SAHNE SAYISI: yaklaşık ' + scenes + '\n' +
      'SÜRE-METİN DENGESİ (ÇOK ÖNEMLİ): Video ' + fmtDur(S.durationSec) + ' uzunluğunda ve seslendirme metni SESLİ okunacak. Tüm sahnelerin "anlatim" metinlerinin TOPLAMI EN FAZLA ~' + words + ' kelime olmalı — bu sınırı KESİNLİKLE AŞMA. Her sahnenin anlatımı kısa ve öz olsun (kısa videoda tek cümle). Sahne sayısı ' + scenes + ' olsa bile metni uzatma; seslendirme ' + fmtDur(S.durationSec) + ' süresine sığmalı.\n' +
      (S.custom ? 'ÖZEL İSTEK (en yüksek öncelik): ' + S.custom + '\n' : '') +
      '\nYalnızca aşağıdaki şemada, Türkçe ve GEÇERLİ JSON döndür (başka metin yok):\n' +
      '{ "baslik":"çarpıcı başlık", "logline":"tek cümle özet", "karakterler":[], ' +
      '"senaryo":[{"baslik":"sahne başlığı","anlatim":"süreye uygun KISA anlatım (kısa videoda tek cümle)","gorsel":"kısa görsel tarifi"}], ' +
      '"seslendirme_notu":"anlatıcı yönergesi", "youtube":{"baslik":"SEO başlığı","aciklama":"açıklama","etiketler":["e1"]}, ' +
      '"instagram":{"aciklama":"Reels metni","hashtagler":["h1"]}, "kapak":["fikir1"], ' +
      '"gorsel_promptlar":["her sahne için İngilizce ' + st.en + ' tarzında görsel üretim promptu"], "video_promptlar":[], "uretim_notu":"kısa tavsiye" }\n' +
      'senaryo ve gorsel_promptlar en az ' + min + ' öğe içersin. Konu anlamsızsa {"gecersiz":true,"mesaj":"..."} döndür.';
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

  function openHist(i) { var h = S.history[i]; if (!h) return; S.result = h.result; S.images = {}; S.covers = {}; S.audio = null; S.aspect = h.aspect; S.style = h.style; S.voiceIdx = h.voiceIdx; S.durationSec = h.durationSec; S.idea = h.idea; S.tab = 'senaryo'; S.view = 'new'; S.step = 4; render(); }

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
      '.cover{width:100%;max-height:340px;object-fit:cover;border-radius:10px;margin:10px 0 14px}' +
      '.foot{margin-top:34px;font-family:Arial,sans-serif;font-size:11px;color:#B4A992;text-align:center}' +
      '</style></head><body>' +
      '<div class="brand">Storia · Yapay Zekâ İçerik Stüdyosu</div>' +
      (function () { var cv = S.covers[0] || S.images[0]; return cv ? '<img class="cover" src="' + esc(cv) + '">' : ''; })() +
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

  // ── Lightbox + indirme ────────────────────────────────────────────────
  var _lb = { list: [], i: 0 };
  function collectImages() {
    var r = S.result || {}, out = [];
    var n = Math.max((r.senaryo || []).length, (r.gorsel_promptlar || []).length, 0);
    for (var i = 0; i < n; i++) if (S.images[i]) out.push({ url: S.images[i], cap: 'Sahne ' + (i + 1) });
    (r.kapak || []).forEach(function (k, i) { if (S.covers[i]) out.push({ url: S.covers[i], cap: 'Kapak ' + (i + 1) }); });
    if (S.imgOut) out.push({ url: S.imgOut, cap: 'Görsel stüdyo' });
    return out;
  }
  function openLightboxByUrl(url) {
    var list = collectImages(), idx = 0, found = false;
    for (var i = 0; i < list.length; i++) if (list[i].url === url) { idx = i; found = true; break; }
    if (!found) list = [{ url: url, cap: '' }];
    _lb = { list: list, i: idx }; showLb();
  }
  function showLb() { var it = _lb.list[_lb.i]; if (!it) return; document.getElementById('lbImg').src = it.url; document.getElementById('lbCap').textContent = (it.cap ? it.cap + ' · ' : '') + (_lb.i + 1) + ' / ' + _lb.list.length; document.getElementById('lightbox').classList.add('show'); }
  function lbNav(d) { if (!_lb.list.length) return; _lb.i = (_lb.i + d + _lb.list.length) % _lb.list.length; showLb(); }
  function closeLb() { document.getElementById('lightbox').classList.remove('show'); }
  function lbOpen() { return document.getElementById('lightbox').classList.contains('show'); }
  function downloadFileUrl(url, name) {
    if (!url) return;
    fetch(url).then(function (r) { return r.blob(); }).then(function (b) {
      var u = URL.createObjectURL(b), a = document.createElement('a');
      a.href = u; a.download = name || ('storia-' + Date.now()); document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 1500); toast('İndirildi');
    }).catch(function () {
      var a = document.createElement('a'); a.href = url; a.download = name || ('storia-' + Date.now()); a.target = '_blank'; document.body.appendChild(a); a.click(); a.remove();
    });
  }
  function doCover(idx) {
    var r = S.result || {}; var k = (r.kapak || [])[idx]; if (!k) return;
    var full = k + ' — YouTube thumbnail, bold composition, high contrast, dramatic lighting, eye-catching, ' + styleObj().en;
    if (!REAL) { S.covers[idx] = demoImage(idx, '16:9'); refreshTab(); toast('Demo kapak eklendi'); return; }
    if (!S.user) { openAuth(); return; }
    toast('Thumbnail üretiliyor…');
    callFn({ action: 'image', prompt: full, size: '16:9', imgIndex: idx }).then(function (d) {
      if (d && d.ok && d.url) { S.covers[idx] = d.url; if (typeof d.credits === 'number') S.credits = d.credits; refreshTab(); chrome(); toast('Thumbnail üretildi'); }
      else toast((d && d.error) || 'Üretilemedi');
    }).catch(function () { toast('Bağlantı hatası'); });
  }
  // ── Image editing ─────────────────────────────────────────────────────
  var _editIdx = null, _editStudio = false;
  function openEdit(idx) { if (S.images[idx] == null) return; _editStudio = false; _editIdx = idx; showEdit(); }
  function openEditStudio() { if (!S.imgOut) return; _editStudio = true; _editIdx = null; showEdit(); }
  function showEdit() { var t = document.getElementById('editText'); t.value = ''; document.getElementById('editModal').classList.add('show'); setTimeout(function () { t.focus(); }, 50); }
  function closeEdit() { document.getElementById('editModal').classList.remove('show'); }
  function toDataUri(url) {
    if (url.indexOf('data:') === 0) return Promise.resolve(url);
    return fetch(url).then(function (r) { return r.blob(); }).then(function (bl) { return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsDataURL(bl); }); });
  }
  function applyEdit() {
    var instr = document.getElementById('editText').value.trim();
    var studio = _editStudio;
    var src = studio ? S.imgOut : S.images[_editIdx];
    if (src == null) return;
    if (!instr) { toast('Ne değiştireyim yaz'); return; }
    closeEdit();
    var size = studio ? S.imgAspect : S.aspect;
    if (!REAL) { if (studio) S.imgOut = demoImage(0, size); else S.images[_editIdx] = demoImage(_editIdx, size); if (studio) render(); else refreshTab(); toast('Düzenlendi (demo): ' + instr.slice(0, 36)); return; }
    if (!S.user) { openAuth(); return; }
    toast('Görsel düzenleniyor…');
    toDataUri(src).then(function (du) {
      return callFn({ action: 'edit', image: du, prompt: instr, size: size });
    }).then(function (d) {
      if (d && d.ok && d.url) { if (studio) S.imgOut = d.url; else S.images[_editIdx] = d.url; if (typeof d.credits === 'number') S.credits = d.credits; if (studio) render(); else refreshTab(); chrome(); toast('Görsel düzenlendi'); }
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
    var lc = S.lang === 'en' ? 'en' : 'tr';
    var u = new SpeechSynthesisUtterance(text); u.lang = lc === 'en' ? 'en-US' : 'tr-TR'; u.rate = rate || 1;
    var vs = window.speechSynthesis.getVoices() || [];
    for (var i = 0; i < vs.length; i++) { if (new RegExp('^' + lc, 'i').test(vs[i].lang)) { u.voice = vs[i]; break; } }
    window.speechSynthesis.speak(u); return true;
  }
  function previewVoice(i) {
    var v = VOICES[i]; var sample = S.lang === 'en' ? 'Storia brings your story to life. This voice could be your narrator.' : 'Storia ile hikâyen hayat buluyor. Bu ses senin anlatıcın olabilir.';
    if (!REAL) { if (!speak(sample, S.ttsRate)) toast('Tarayıcı seslendirmeyi desteklemiyor'); else toast('Önizleme · ' + v.name); return; }
    toast('Önizleme hazırlanıyor…');
    callFn({ action: 'tts', preview: true, engine: 'openai', voice: v.ov }).then(function (d) {
      if (d && d.ok && d.url) { try { new Audio(d.url).play(); } catch (e) {} } else toast('Önizleme alınamadı');
    }).catch(function () { toast('Bağlantı hatası'); });
  }
  function doTts() {
    var text = narrationText(); if (!text) { toast('Seslendirilecek metin yok'); return; }
    // süre-bazlı güvenlik sınırı: AI metni aşırı uzatırsa seslendirme (ve ElevenLabs
    // maliyeti) süreyle orantılı kalsın. ~22 karakter/sn cömert bir tavan; sadece
    // ciddi taşmayı, mümkünse cümle sonunda budar.
    var capChars = Math.max(240, Math.round(S.durationSec * 22));
    if (text.length > capChars) { var cut = text.lastIndexOf('. ', capChars); text = (cut > capChars * 0.6) ? text.slice(0, cut + 1) : text.slice(0, capChars); }
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
    var en = S.lang === 'en';
    var topic = S.idea.trim() || (en ? 'An intriguing topic' : 'Merak edilen bir konu');
    var n = Math.min(sceneFor(S.durationSec), 8);
    var st = styleObj();
    var beatsTr = [
      ['Açılış kancası', 'Ekranda tek bir soru beliriyor: ' + topic + ' İzleyiciyi ilk saniyeden içine çeken çarpıcı bir girişle başlıyoruz.'],
      ['İlk ipucu', 'Konunun yüzeyini kazıyoruz. Görünenin ardındaki ilk şaşırtıcı detay ortaya çıkıyor ve merak katlanıyor.'],
      ['Derinleşme', 'Şimdi işin özüne iniyoruz. Somut örnekler ve sayılarla anlatı sağlam bir zemine oturuyor.'],
      ['Beklenmedik dönüş', 'Tam her şey netleşti derken beklenmedik bir gerçek sahneye giriyor. Tempo yükseliyor.'],
      ['Kanıtlar', 'Uzman görüşleri ve kaynaklar bir araya geliyor; tablo tamamlanmaya başlıyor.'],
      ['Doruk noktası', 'Anlatının en güçlü anı. Tüm parçalar yerine oturuyor, izleyici gözünü ekrandan alamıyor.'],
      ['Sonuç', 'Öğrendiklerimizi tek bir çarpıcı fikirde topluyoruz.'],
      ['Kapanış', 'İzleyiciye düşündürecek bir soruyla ve güçlü bir çağrıyla bitiriyoruz.']
    ];
    var beatsEn = [
      ['The hook', 'A single question appears on screen: ' + topic + ' We open with a striking moment that grabs the viewer in the first second.'],
      ['First clue', 'We scratch the surface. The first surprising detail behind the obvious emerges and curiosity builds.'],
      ['Going deeper', 'Now we get to the core. Concrete examples and numbers give the story a solid foundation.'],
      ['The twist', 'Just as everything seems clear, an unexpected truth enters the scene. The pace rises.'],
      ['The evidence', 'Expert views and sources come together; the picture starts to complete.'],
      ['The climax', 'The most powerful moment. Every piece falls into place and the viewer cannot look away.'],
      ['The takeaway', 'We distill everything into one striking idea.'],
      ['Closing', 'We end with a thought-provoking question and a strong call to action.']
    ];
    var beats = (en ? beatsEn : beatsTr).slice(0, n);
    var senaryo = beats.map(function (b, i) { return { baslik: b[0], anlatim: b[1], gorsel: (en ? 'A ' + st.name.toLowerCase() + ' frame for scene ' : 'Sahne ' + (i + 1) + ' için ' + st.name.toLowerCase() + ' bir kare') + (en ? (i + 1) : '') }; });
    var prompts = beats.map(function (b, i) { return 'Scene ' + (i + 1) + ': ' + b[0].toLowerCase() + ' depicting "' + topic + '", ' + st.en + ', aspect ' + S.aspect + ', highly detailed, atmospheric'; });
    if (en) return {
      baslik: topic.replace(/\?$/, '') + ' — The Truth You Didn’t Know', logline: topic + ' In this video we answer it step by step.', karakterler: [], senaryo: senaryo,
      seslendirme_notu: 'Read in a ' + toneName().toLowerCase() + ' tone at a natural pace.',
      youtube: { baslik: topic.replace(/\?$/, '') + ' | Storia', aciklama: 'In this video we answer "' + topic.toLowerCase() + '" step by step. Like and subscribe!\n\n00:00 Intro\n00:30 First clue\n02:00 Going deeper', etiketler: ['storia', 'documentary', 'curiosity', topic.split(' ')[0].toLowerCase(), 'facts'] },
      instagram: { aciklama: topic + ' 👀 Answer in the video. Save it for later!', hashtagler: ['storia', 'explore', 'facts', 'curiosity', 'reels'] },
      kapak: ['Big question mark + striking visual, warm light', 'Close-up detail + bold title text'],
      gorsel_promptlar: prompts, video_promptlar: prompts.map(function (p) { return p + ', slow cinematic camera move'; }),
      uretim_notu: 'Put the strongest visual in the first 5 seconds; sync transitions to the music. (This is a DEMO output.)'
    };
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
    document.getElementById('btmNav').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-view]'); if (!b) return;
      var v = b.getAttribute('data-view');
      if (v === 'new' && S.step === 4) startNew(); else { S.view = v; render(); }
    });
    document.getElementById('acctRow').addEventListener('click', openAcct);
    var acctModal = document.getElementById('acctModal');
    document.getElementById('acctClose').addEventListener('click', closeAcct);
    acctModal.addEventListener('click', function (e) { if (e.target === acctModal) closeAcct(); var r = e.target.closest('[data-am]'); if (r) acctAction(r.getAttribute('data-am')); });
    // lightbox
    var lb = document.getElementById('lightbox');
    lb.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lb]');
      if (b) { var a = b.getAttribute('data-lb'); if (a === 'close') closeLb(); else if (a === 'prev') lbNav(-1); else if (a === 'next') lbNav(1); else if (a === 'download') downloadFileUrl(_lb.list[_lb.i] && _lb.list[_lb.i].url, 'storia-gorsel-' + (_lb.i + 1) + '.jpg'); return; }
      if (e.target === lb) closeLb();
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
    // onboarding tour
    document.getElementById('tourNext').addEventListener('click', tourNext);
    document.getElementById('tourSkip').addEventListener('click', closeTour);
    // plan / upgrade
    var upBtn = document.querySelector('#planCard [data-act="upgrade"]');
    if (upBtn) upBtn.addEventListener('click', openPlanModal);
    var planModal = document.getElementById('planModal');
    document.getElementById('planClose').addEventListener('click', closePlan);
    planModal.addEventListener('click', function (e) { if (e.target === planModal) closePlan(); var c = e.target.closest('[data-act="checkout"]'); if (c) openCheckout(c.getAttribute('data-v')); });
    // global keyboard
    document.addEventListener('keydown', function (e) {
      if (lbOpen()) { if (e.key === 'ArrowLeft') { e.preventDefault(); lbNav(-1); return; } if (e.key === 'ArrowRight') { e.preventDefault(); lbNav(1); return; } if (e.key === 'Escape') { closeLb(); return; } }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmd(); return; }
      if (e.key === 'Escape') { closeCmd(); closeAuth(); closeEdit(); closeTour(); closePlan(); closeAcct(); return; }
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
      { ic: '◐', label: (document.documentElement.getAttribute('data-theme') === 'dark' ? 'Aydınlık mod' : 'Karanlık mod'), run: toggleTheme },
      { ic: '✦', label: 'Planı yükselt', run: openPlanModal },
      { ic: '◈', label: 'Hesap', run: openAcct }
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

  // ── Onboarding tour ───────────────────────────────────────────────────
  var TOUR = [
    { t: 'Fikrini yaz', x: 'Aklındaki konuyu bir cümleyle yaz. İlham için "Sen öner"e bas ya da bir şablon seç — gerisini Storia kurar.' },
    { t: 'Tarzını seç', x: 'Dil, ton, anlatıcı sesi, görsel stil, format ve süreyi ayarla. Sağdaki canlı önizlemede sonucu ve kredi maliyetini anında gör.' },
    { t: 'Dosyanı al', x: 'Senaryo, seslendirme, görseller, storyboard ve yayın paketi elinde. PDF indir, ⌘K ile her yere hızlıca ulaş.' }
  ];
  var _tourI = 0;
  function openTour() { _tourI = 0; tourGo(0); document.getElementById('tourModal').classList.add('show'); }
  function closeTour() { document.getElementById('tourModal').classList.remove('show'); try { localStorage.setItem('storia_tour', '1'); } catch (e) {} }
  function tourGo(i) { _tourI = i; var s = TOUR[i]; document.getElementById('tourBadge').textContent = (i + 1) + ' / ' + TOUR.length; document.getElementById('tourTitle').textContent = s.t; document.getElementById('tourText').textContent = s.x; document.getElementById('tourNext').textContent = (i === TOUR.length - 1 ? 'Başla ✦' : 'Devam →'); }
  function tourNext() { if (_tourI < TOUR.length - 1) tourGo(_tourI + 1); else closeTour(); }

  // ── Plan / upgrade ────────────────────────────────────────────────────
  var PLANS = [
    { id: 'yaratici', name: 'Yaratıcı', price: '599₺', cr: '1.000', feats: ['Sınırsız senaryo & yayın paketi', 'Seslendirme & görsel üretimi', 'Tüm formatlar (16:9 · 9:16 · 1:1)'] },
    { id: 'profesyonel', name: 'Profesyonel', price: '1.299₺', cr: '5.000', feat: true, feats: ['Yaratıcı’daki her şey', 'Öncelikli üretim hızı', 'Premium anlatıcı sesleri', 'Cihazlar arası kütüphane'] },
    { id: 'studio', name: 'Stüdyo', price: '1.999₺', cr: '15.000', feats: ['Profesyonel’deki her şey', 'En yüksek kredi havuzu', 'Ekip & öncelikli destek'] }
  ];
  function openPlanModal() { renderPlanCards(); document.getElementById('planModal').classList.add('show'); }
  function closePlan() { document.getElementById('planModal').classList.remove('show'); }
  function renderPlanCards() {
    document.getElementById('planCards').innerHTML = PLANS.map(function (pl) {
      return '<div class="plan-c' + (pl.feat ? ' feat' : '') + '">' + (pl.feat ? '<span class="pc-badge">En popüler</span>' : '') +
        '<div class="pn">' + pl.name + '</div><div class="pp"><b>' + pl.price + '</b><span>/ ay</span></div>' +
        '<div class="pcr">' + pl.cr + ' kredi / ay</div><ul>' + pl.feats.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
        '<button class="btn ' + (pl.feat ? 'btn-gold' : 'btn-quiet') + ' btn-sm" data-act="checkout" data-v="' + pl.id + '">Seç</button></div>';
    }).join('');
  }
  function openCheckout(id) {
    var url = (CFG.checkout || {})[id] || '';
    if (url) { window.open(url, '_blank', 'noopener'); closePlan(); }
    else toast('Ödeme bağlantısı henüz ayarlı değil — kurulum sonrası aktifleşir');
  }

  // ── Account panel ─────────────────────────────────────────────────────
  function openAcct() {
    var av = document.getElementById('amAv'), nm = document.getElementById('amName'), sub = document.getElementById('amSub');
    if (S.user) { av.textContent = (S.user.email || 'S').charAt(0).toUpperCase(); nm.textContent = S.user.email || 'Hesap'; sub.textContent = REAL ? 'Giriş yapıldı' : 'Demo'; }
    else { av.textContent = 'S'; nm.textContent = 'Misafir'; sub.textContent = REAL ? 'Giriş yapılmadı' : 'Demo modu'; }
    document.getElementById('amCr').textContent = (S.credits == null ? '—' : S.credits);
    document.getElementById('amBar').style.width = Math.max(6, Math.min(100, (S.credits || 0) / (S.creditMax || 500) * 100)) + '%';
    document.getElementById('amPlan').textContent = 'Keşif planı';
    var authRow = document.getElementById('amAuth');
    authRow.querySelector('span').innerHTML = S.user ? '⎋&nbsp;&nbsp;Çıkış yap' : (REAL ? '→&nbsp;&nbsp;Giriş yap' : '→&nbsp;&nbsp;Giriş (kurulum sonrası)');
    document.getElementById('acctModal').classList.add('show');
  }
  function closeAcct() { document.getElementById('acctModal').classList.remove('show'); }
  function acctAction(a) {
    if (a === 'upgrade') { closeAcct(); openPlanModal(); }
    else if (a === 'theme') { toggleTheme(); }
    else if (a === 'auth') {
      if (S.user) { if (sb) sb.auth.signOut(); S.user = null; S.credits = REAL ? null : 500; chrome(); closeAcct(); toast('Çıkış yapıldı'); }
      else { closeAcct(); openAuth(); }
    }
  }
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
    try { if (!localStorage.getItem('storia_tour')) setTimeout(openTour, 600); } catch (e) {}
    if (REAL) {
      loadSupabase().then(function () { sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey); return sb.auth.getSession(); })
        .then(function (res) { var s = res && res.data && res.data.session; if (s && s.user) { S.user = s.user; loadCredits(); } chrome(); })
        .catch(function () { toast('Sunucuya bağlanılamadı'); });
    }
  }
  function loadSupabase() { return new Promise(function (resolve, reject) { if (window.supabase) return resolve(); var s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; s.onload = resolve; s.onerror = reject; document.head.appendChild(s); }); }

  boot();
})();

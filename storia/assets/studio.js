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
    images: {}, covers: {}, videos: {}, videoJobs: {}, chars: {}, audio: null, history: [], ttsRate: 1,
    bgMusic: null, bgMusicName: '', musicVol: 0.5, capStyle: 'klasik', vengine: 'grok',
    brand: { logo: '', color: '#d9bc80', name: '', handle: '', wm: true, outro: false, outroText: 'Abone ol · yeni içerik her gün' },
    chat: { open: false, msgs: [], busy: false },
    trend: { open: false, niche: '', busy: false, items: [] },
    series: { open: false, mode: 'topic', topic: '', source: '', count: 5, busy: false, running: false, eps: [], done: 0 },
    // image studio
    imgPrompt: '', imgStyle: 'sinematik', imgAspect: '1:1', imgOut: null, imgMode: 'gorsel',
    // ses stüdyo
    ssText: '', ssVoice: 0, ssOut: null,
    // açık olan geçmiş kaydı (üretilen medya buraya kalıcı yazılır)
    _cur: null
  };

  // ── Data ─────────────────────────────────────────────────────────────
  // Viral, çok-sektörlü fikir havuzu (tarih değil — her niş). "Sen öner" bunu
  // kullanır; ayrıca AI arka planda taze fikirler ekleyip havuzu büyütür.
  var IDEAS = [
    // merak / bilim
    'Okyanusun en derin noktasında ne var?', 'Rüyalar neden bu kadar tuhaf?',
    'Evrenin sonu nasıl olacak?', 'Işık hızında gitseydik ne olurdu?',
    'Zaman gerçekten var mı?', 'Bir saniyede dünyada neler oluyor?',
    // psikoloji / kişisel gelişim
    'Beynini kandıran 3 psikolojik tuzak', 'Sabah 5’te kalkmak hayatını değiştirir mi?',
    'İnsanları 7 saniyede etkilemenin sırrı', 'Erteleme hastalığını bitiren tek kural',
    'Zengin ve fakir zihniyeti arasındaki 5 fark',
    // para / finans / girişim
    'Parayı kim, neden icat etti?', 'Milyarderlerin ortak 5 alışkanlığı',
    '20 yaşında bilmeni isterdim: para tuzakları', '0’dan marka kurmanın ilk 3 adımı',
    'Neden hep parasız kalıyorsun? (gerçek sebep)',
    // teknoloji / yapay zekâ
    'Yapay zekâ gerçekten düşünebilir mi?', 'Telefonun seni nasıl bağımlı yapıyor?',
    '5 yıl içinde yok olacak meslekler',
    // sağlık / fitness / yemek
    'Kahve vücuduna tam olarak ne yapıyor?', 'Uykusuzluk beynine neler yapar?',
    'Şeker bıraktığında vücudunda olan 7 şey', 'Sadece 1 hafta su içersen ne olur?',
    // ilişkiler / sosyal
    'İlk buluşmada asla yapılmaması gereken 3 şey', 'Neden bazı insanları unutamıyoruz?',
    // ürün / UGC / reklam
    'Bu ürünü 30 saniyede nasıl satarım?', 'Bir kahve dükkânı için UGC reklam senaryosu',
    'Müşteriyi ikna eden 3 saniyelik kanca',
    // gizem / hikâye
    'Kayıp şehir Atlantis efsanesi', 'Gerçekten yaşanmış 3 tüyler ürpertici olay',
    // motivasyon
    'Pes etmek üzereyken izlemen gereken video'
  ];
  var _ideaShuffled = null, _ideaIdx = 0;
  function ideaPool() {
    var extra = [];
    try { extra = JSON.parse(localStorage.getItem('storia_ideas') || '[]'); if (!Array.isArray(extra)) extra = []; } catch (e) { extra = []; }
    return extra.concat(IDEAS);
  }
  function shuffledIdeas() {
    if (_ideaShuffled) return _ideaShuffled;
    var a = ideaPool().slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    _ideaShuffled = a; return a;
  }
  function pushIdea(txt) {
    txt = (txt || '').trim().replace(/^["'\-•\d.\s]+/, '').replace(/["']+$/, '').slice(0, 120);
    if (!txt || txt.length < 8) return;
    var extra = [];
    try { extra = JSON.parse(localStorage.getItem('storia_ideas') || '[]'); if (!Array.isArray(extra)) extra = []; } catch (e) { extra = []; }
    var low = txt.toLowerCase();
    if (extra.some(function (x) { return x.toLowerCase() === low; }) || IDEAS.some(function (x) { return x.toLowerCase() === low; })) return;
    extra.unshift(txt); extra = extra.slice(0, 40);
    try { localStorage.setItem('storia_ideas', JSON.stringify(extra)); } catch (e) {}
    if (_ideaShuffled) _ideaShuffled.unshift(txt);
  }
  var _suggestBusy = false, _lastSuggest = '', _shownIdeas = [];
  var NICHES = ['psikoloji', 'para ve finans', 'girişimcilik', 'teknoloji', 'yapay zekâ', 'sağlık ve fitness', 'ilişkiler', 'yemek', 'bilim', 'uzay', 'gizem ve komplo', 'tarih', 'spor', 'oyun', 'kişisel gelişim', 'ürün reklamı / UGC', 'seyahat', 'motivasyon', 'sanat', 'doğa ve hayvanlar'];
  function suggestIdea() {
    // anında rastgele öner (son gösterilenleri tekrarlama), sonra AI taze fikirle değiştir
    var pool = shuffledIdeas();
    if (pool.length) {
      var pick = pool[Math.floor(Math.random() * pool.length)], g = 0;
      while (_shownIdeas.indexOf(pick) >= 0 && pool.length > _shownIdeas.length && g++ < 12) pick = pool[Math.floor(Math.random() * pool.length)];
      _shownIdeas.push(pick); if (_shownIdeas.length > 12) _shownIdeas.shift();
      _lastSuggest = pick; S.idea = pick; render();
    }
    if (!REAL || _suggestBusy) return;
    _suggestBusy = true;
    var niche = NICHES[Math.floor(Math.random() * NICHES.length)];
    var seen = _shownIdeas.slice(-8).join(' | ');
    var p = 'Sen viral kısa video fikirleri üreten bir içerik editörüsün. "' + niche + '" nişinde, YouTube Shorts / TikTok / Reels için çok tıklanabilecek, merak uyandıran, ÖZGÜN ve TAZE tek bir video konusu öner. Şu konuları KESİNLİKLE TEKRARLAMA: ' + seen + '. Klişe olmasın, spesifik ve çarpıcı olsun. Sadece konu başlığını tek satırda yaz; tırnak, numara, açıklama yok.';
    callFn({ action: '', prompt: p }).then(function (d) {
      var t = d && (d.text || d.result);
      if (t) {
        var fresh = String(t).split('\n')[0].trim().replace(/^["'•\-\d.\s]+/, '').replace(/["']+$/, '').slice(0, 120);
        if (fresh.length > 8) { pushIdea(fresh); _shownIdeas.push(fresh); if (S.step === 1 && S.idea === _lastSuggest) { S.idea = fresh; _lastSuggest = fresh; render(); } }
      }
    }).catch(function () {}).then(function () { _suggestBusy = false; });
  }
  // ── Trend & hook bulucu ──────────────────────────────────────────────
  function renderTrend() {
    var t = S.trend;
    var nicheChips = NICHES.slice(0, 12).map(function (n) {
      return '<button class="chip' + (t.niche === n ? ' on' : '') + '" data-act="trendNiche" data-v="' + esc(n) + '">' + esc(n) + '</button>';
    }).join('');
    var results = '';
    if (t.busy) {
      results = '<div class="trend-loading"><span class="mini-orb"></span> Trend konular ve hook\'lar bulunuyor…</div>';
    } else if (t.items && t.items.length) {
      results = '<div class="trend-grid">' + t.items.map(function (it, i) {
        return '<div class="trend-card">' +
          '<div class="tc-topic">' + esc(it.konu || '') + '</div>' +
          (it.hook ? '<div class="tc-hook"><span class="tc-lbl">İlk 3 sn</span>' + esc(it.hook) + '</div>' : '') +
          (it.neden ? '<div class="tc-why">' + esc(it.neden) + '</div>' : '') +
          '<div class="tc-acts"><button class="btn btn-gold btn-sm" data-act="useTrend" data-v="' + i + '">▶ Bu fikirle üret</button>' +
          '<button class="btn btn-quiet btn-sm" data-act="copyHook" data-v="' + esc(it.hook || it.konu || '') + '">Hook\'u kopyala</button></div>' +
        '</div>';
      }).join('') + '</div>';
    }
    return '<div class="trend-panel">' +
      '<div class="trend-head"><b>🔥 Trend & hook bulucu</b><span>Nişini seç, sana tıklanacak konular ve ilk-3-saniye kancaları çıkarayım.</span></div>' +
      '<div class="trend-niches">' + nicheChips + '</div>' +
      '<div class="trend-run"><input id="trendNiche" placeholder="ya da kendi nişini yaz (ör. vegan yemek)" value="' + esc(t.niche) + '">' +
      '<button class="btn btn-gold btn-sm" data-act="trendGo">Bul</button>' +
      '<button class="btn btn-quiet btn-sm" data-act="trendClose">Kapat</button></div>' +
      results + '</div>';
  }
  function findTrends() {
    var t = S.trend;
    var custom = document.getElementById('trendNiche');
    if (custom && custom.value.trim()) t.niche = custom.value.trim();
    if (!t.niche) { toast('Önce bir niş seç ya da yaz'); return; }
    if (t.busy) return;
    t.busy = true; t.items = []; render();
    if (!REAL) {
      setTimeout(function () {
        t.items = [
          { konu: t.niche + ' hakkında herkesin yanlış bildiği 3 şey', hook: '"Bunu hâlâ yapıyorsan, durman lazım."', neden: 'Yanlış-inanç kırma formatı yüksek tutar.' },
          { konu: t.niche + ' dünyasının kimsenin konuşmadığı sırrı', hook: '"Sana kimsenin söylemediği bir şey var…"', neden: 'Merak boşluğu + gizli bilgi.' },
          { konu: '30 günde ' + t.niche + ' — gerçekte ne oluyor?', hook: '"30 gün denedim. Sonuç şoke etti."', neden: 'Deney/dönüşüm anlatısı.' },
          { konu: t.niche + ' için 5 saniyede işe yarayan hile', hook: '"Bunu bilseydim yıllar önce…"', neden: 'Hızlı fayda, kaydetme tetikler.' }
        ];
        t.busy = false; render();
      }, 800);
      return;
    }
    var p = 'Sen viral kısa video stratejistisin. "' + t.niche + '" nişi için, YouTube Shorts/TikTok/Reels\'te ŞU AN tıklanma potansiyeli yüksek 6 ÖZGÜN video fikri üret. Her fikir için: 1) konu (tek cümle, spesifik ve çarpıcı), 2) hook = ilk 3 saniyede söylenecek/gösterilecek kanca cümlesi (merak boşluğu ya da cesur iddia), 3) neden = neden tutar (kısa). Klişe olmasın. SADECE geçerli JSON dizi döndür: [{"konu":"...","hook":"...","neden":"..."}]. Başka metin yok.';
    callFn({ action: '', prompt: p, max_tokens: 2000 }).then(function (d) {
      var txt = d && (d.text || d.result) ? String(d.text || d.result) : '';
      var arr = null;
      try { var m = /\[[\s\S]*\]/.exec(txt); if (m) arr = JSON.parse(m[0]); } catch (_e) {}
      if (Array.isArray(arr) && arr.length) t.items = arr.slice(0, 8);
      else t.items = [{ konu: t.niche + ' hakkında çarpıcı bir video', hook: 'Merak uyandıran bir açılış cümlesi', neden: 'Tekrar dene — daha spesifik bir niş yaz.' }];
      t.busy = false; render();
    }).catch(function () { t.busy = false; t.items = [{ konu: 'Bağlantı hatası', hook: 'Tekrar dene', neden: '' }]; render(); });
  }
  function useTrend(i) {
    var it = S.trend.items[i]; if (!it) return;
    S.idea = it.konu || ''; if (it.hook) S.custom = 'İlk 3 saniye kancası: ' + it.hook;
    S.trend.open = false; S.step = 2; render();
    toast('Fikir yüklendi — tarzını seç ve üret');
  }
  // ── Otomatik seri modu (tek konudan çoklu bölüm) ─────────────────────
  function renderSeries() {
    var s = S.series;
    if (s.running) {
      var total = s.eps.filter(function (e) { return e.on !== false; }).length;
      return '<div class="trend-panel"><div class="trend-head"><b>📚 Seri üretiliyor…</b><span>' + s.done + ' / ' + total + ' bölüm hazır — bittiğinde Kütüphane\'de toplanır.</span></div>' +
        '<div class="series-prog"><div class="series-bar" style="width:' + (total ? Math.round(s.done / total * 100) : 0) + '%"></div></div></div>';
    }
    var eps = '';
    if (s.busy) {
      eps = '<div class="trend-loading"><span class="mini-orb"></span> Bölümler planlanıyor…</div>';
    } else if (s.eps.length) {
      eps = '<div class="series-list">' + s.eps.map(function (e, i) {
        return '<label class="series-ep' + (e.on !== false ? ' on' : '') + '"><input type="checkbox" data-act="seriesToggle" data-v="' + i + '"' + (e.on !== false ? ' checked' : '') + '>' +
          '<span class="se-body"><span class="se-title">' + esc(e.baslik || ('Bölüm ' + (i + 1))) + '</span><span class="se-konu">' + esc(e.konu || '') + '</span></span></label>';
      }).join('') + '</div>' +
      '<div class="series-go"><button class="btn btn-gold btn-sm" data-act="seriesRun">✦ Seçili bölümleri üret</button>' +
      '<span class="se-note">Her bölüm ayrı bir dosya olarak Kütüphane\'ye eklenir. Kredi bölüm başına düşer.</span></div>';
    }
    var seg = '<div class="cap-seg series-seg">' +
      '<button class="' + (s.mode === 'topic' ? 'on' : '') + '" data-act="seriesMode" data-v="topic">Konudan üret</button>' +
      '<button class="' + (s.mode === 'repurpose' ? 'on' : '') + '" data-act="seriesMode" data-v="repurpose">Uzun metinden böl</button></div>';
    var input = s.mode === 'repurpose'
      ? '<textarea id="seriesSource" class="series-source" rows="5" placeholder="Uzun metni yapıştır: video transkripti, blog yazısı, podcast dökümü ya da uzun senaryo… En vurucu anları kısa videolara böleyim.">' + esc(s.source) + '</textarea>'
      : '<input id="seriesTopic" placeholder="Ana konu (ör. antik Roma\'nın sırları)" value="' + esc(s.topic) + '">';
    var head = s.mode === 'repurpose'
      ? '<div class="trend-head"><b>✂️ Uzun içeriği kısalara böl</b><span>Uzun bir metni yapıştır; en çok tıklanacak anları ayrı kısa videolara bölüp hepsini üreteyim.</span></div>'
      : '<div class="trend-head"><b>📚 Seri üret (çoklu bölüm)</b><span>Bir ana konu ver, sana birbirini tamamlayan bölümler planlayıp hepsini üreteyim.</span></div>';
    return '<div class="trend-panel">' + head + seg +
      '<div class="trend-run">' + input +
      '<input id="seriesCount" type="number" min="2" max="10" value="' + s.count + '" style="width:70px" title="Bölüm sayısı">' +
      '<button class="btn btn-gold btn-sm" data-act="seriesPlan">' + (s.mode === 'repurpose' ? 'Kısaları çıkar' : 'Bölümleri planla') + '</button>' +
      '<button class="btn btn-quiet btn-sm" data-act="seriesClose">Kapat</button></div>' + eps + '</div>';
  }
  function planSeries() {
    var s = S.series;
    var ci = document.getElementById('seriesCount'); if (ci) s.count = Math.min(10, Math.max(2, parseInt(ci.value, 10) || 5));
    var p;
    if (s.mode === 'repurpose') {
      var src = document.getElementById('seriesSource'); if (src) s.source = src.value;
      if (!s.source.trim() || s.source.trim().length < 40) { toast('Önce bölünecek uzun metni yapıştır'); return; }
      p = 'Sen viral kısa video editörüsün. Aşağıdaki UZUN METİNDEN, tek tek izlenebilen en vurucu ' + s.count + ' kısa video anı çıkar. Her biri metindeki gerçek bir fikre dayansın; en merak uyandıran/çarpıcı bölümleri seç. Her an için: baslik (kısa) ve konu (tek cümle, o kısa videonun ne anlatacağı). SADECE geçerli JSON dizi döndür: [{"baslik":"...","konu":"..."}]. Başka metin yok.\n\nUZUN METİN:\n"""\n' + s.source.slice(0, 9000) + '\n"""';
    } else {
      var ti = document.getElementById('seriesTopic'); if (ti && ti.value.trim()) s.topic = ti.value.trim();
      if (!s.topic) { toast('Önce seri konusunu yaz'); return; }
      p = 'Sen bir içerik serisi editörüsün. "' + s.topic + '" ana konusundan, birbirini tamamlayan ama her biri TEK BAŞINA izlenebilen ' + s.count + ' kısa video bölümü planla. Her bölüm farklı bir açı/alt-konu olsun; tekrar olmasın, sıralı bir mantığı olsun. SADECE geçerli JSON dizi döndür: [{"baslik":"bölüm başlığı","konu":"tek cümle spesifik konu"}]. Başka metin yok.';
    }
    if (s.busy) return;
    s.busy = true; s.eps = []; render();
    if (!REAL) {
      setTimeout(function () {
        s.eps = [];
        var base = s.mode === 'repurpose' ? 'Metinden çıkan an' : s.topic;
        for (var i = 0; i < s.count; i++) s.eps.push({ baslik: base + ' — ' + (i + 1), konu: (s.mode === 'repurpose' ? 'Yapıştırılan metindeki ' + (i + 1) + '. çarpıcı an' : s.topic + ' hakkında ' + (i + 1) + '. çarpıcı gerçek'), on: true });
        s.busy = false; render();
      }, 700);
      return;
    }
    callFn({ action: '', prompt: p, max_tokens: 2500 }).then(function (d) {
      var txt = d && (d.text || d.result) ? String(d.text || d.result) : ''; var arr = null;
      try { var m = /\[[\s\S]*\]/.exec(txt); if (m) arr = JSON.parse(m[0]); } catch (_e) {}
      if (Array.isArray(arr) && arr.length) s.eps = arr.slice(0, s.count).map(function (e) { e.on = true; return e; });
      else s.eps = [{ baslik: s.topic, konu: s.topic, on: true }];
      s.busy = false; render();
    }).catch(function () { s.busy = false; toast('Bölümler planlanamadı — tekrar dene'); render(); });
  }
  function pushSeriesEntry(result, ep) {
    var ent = { result: result, idea: ep.konu || ep.baslik, meta: fmtDur(S.durationSec) + ' · ' + styleObj().name + ' · ' + S.aspect + ' · seri', ts: Date.now(), aspect: S.aspect, style: S.style, voiceIdx: S.voiceIdx, durationSec: S.durationSec, images: {}, covers: {}, videos: {}, audio: null };
    S.history.unshift(ent); saveHist();
  }
  function runSeries() {
    var s = S.series;
    var eps = s.eps.filter(function (e) { return e.on !== false; });
    if (!eps.length) { toast('En az bir bölüm seç'); return; }
    if (REAL && !S.user) { openAuth(); return; }
    s.running = true; s.done = 0; render();
    var savedIdea = S.idea, i = 0;
    (function next() {
      if (i >= eps.length) {
        S.idea = savedIdea; s.running = false; s.open = false; s.eps = [];
        S.view = 'history'; render();
        toast(eps.length + ' bölüm üretildi ✦ Kütüphane\'de');
        return;
      }
      var ep = eps[i++]; S.idea = ep.konu || ep.baslik;
      if (!REAL) { pushSeriesEntry(synthDemo(), ep); s.done = i; render(); setTimeout(next, 450); return; }
      callFn({ action: 'generate', prompt: buildPrompt(), provider: S.provider, topic: S.idea, duration: 's' + S.durationSec, max_tokens: 12000 }).then(function (d) {
        if (d && d.ok) { var obj = typeof d.result === 'string' ? safeParse(d.result) : d.result; if (obj && !obj.gecersiz) { pushSeriesEntry(obj, ep); if (typeof d.credits === 'number') S.credits = d.credits; } }
        s.done = i; chrome(); render(); next();
      }).catch(function () { s.done = i; render(); next(); });
    })();
  }
  var TONES = [
    { id: 'merak', name: 'Merak uyandıran' }, { id: 'dramatik', name: 'Dramatik' },
    { id: 'belgesel', name: 'Belgesel' }, { id: 'destansi', name: 'Destansı' },
    { id: 'samimi', name: 'Samimi' }, { id: 'enerjik', name: 'Enerjik' }
  ];
  // ElevenLabs sesleri (eleven_multilingual_v2 — Türkçe'yi doğal okur). ev =
  // ElevenLabs voice_id (backend allowlist'inde). ov = ElevenLabs erişilemezse
  // OpenAI yedeği. x = kredi çarpanı (premium sesler daha pahalı).
  var VOICES = [
    { name: 'Seyfullah Kartal', desc: 'Güçlü, net anlatıcı', ev: 'mF7tIc9VLrznhGooGjaT', ov: 'onyx' },
    { name: 'Emin', desc: 'Derin, yumuşak ve sakin', ev: 'DsbR47WNEv8o9x37ib9X', ov: 'ash' },
    { name: 'Kadir Kayışcı', desc: 'Olgun, derin, güven veren', ev: 'j82ax9yhzfYwq9lDvRWL', ov: 'echo' },
    { name: 'Sultan', desc: 'Tiyatral, destansı anlatıcı', ev: 'gyxPK6bLXQAkBSCeAKvk', ov: 'alloy' },
    { name: 'Şevval Kılınç', desc: 'Canlı, öğretici kadın sesi', ev: '8LQS4H6IYf1unP46qbKD', ov: 'nova' },
    { name: 'Belma', desc: 'Sıcak, doğal kadın sesi', ev: 'KbaseEXyT9EE0CQLEfbB', ov: 'shimmer' },
    { name: 'Mahidevran', desc: 'Fısıltılı, sıcak', ev: 'yp3v9dmYlNwJf3mXPBLV', ov: 'sage' },
    { name: 'Doğa', desc: 'Doğal, dengeli', ev: 'IuRRIAcbQK5AQk1XevPj', ov: 'echo' },
    { name: 'Adam', desc: 'Klasik erkek anlatıcı', ev: 'J17lijyP1BHYcM7ld0Rg', ov: 'alloy', check: true },
    { name: 'Cassius', desc: 'Kadifemsi, otoriter (İngilizce ağırlıklı)', ev: 'ktrGUw7rURIQyMrQZqCu', ov: 'ash', check: true },
    { name: 'Mossbeard', desc: 'Vahşi, sinematik — premium ses', ev: 'bFrjFL4nlpeYNwNRhXxq', ov: 'onyx', premium: true, x: 4, check: true }
  ];
  var RATES = [{ v: 0.9, l: 'Yavaş' }, { v: 1, l: 'Normal' }, { v: 1.12, l: 'Hızlı' }];
  var STYLES = [
    { id: 'ultra', name: 'Ultra Gerçekçi', desc: 'Hiper detay, kusursuz netlik', en: 'ultra realistic, hyper-detailed, 8k, tack-sharp focus, professional photography, lifelike skin and material texture, true-to-life color, crisp' },
    { id: 'sinematik', name: 'Sinematik', desc: 'Film karesi, dramatik ışık', en: 'cinematic film still, dramatic volumetric lighting, shallow depth of field, anamorphic 35mm, color-graded, sharp focus, high detail' },
    { id: 'fotogercek', name: 'Foto-gerçekçi', desc: 'Gerçek fotoğraf dokusu', en: 'photorealistic, natural light, ultra high detail, DSLR photograph, sharp focus, realistic textures' },
    { id: 'belgesel', name: 'Belgesel', desc: 'Doğal, gözlemsel foto', en: 'documentary photography, candid observational moment, natural available light, photojournalistic, authentic, sharp and clear' },
    { id: 'render3d', name: '3D Render', desc: 'Hacimli, sinematik render', en: 'high-end 3D render, volumetric light, octane render, subsurface scattering, crisp, ultra detailed' },
    { id: 'illus', name: 'İllüstrasyon', desc: 'Modern dijital çizim', en: 'modern digital illustration, clean bold shapes, editorial style, polished, high detail' },
    { id: 'anime', name: 'Animasyon', desc: 'Anime / çizgi film estetiği', en: 'high-quality animation still, anime / cartoon aesthetic, clean cel shading, vivid colors, studio-quality key visual, crisp lines' },
    { id: 'minimal', name: 'Minimal', desc: 'Sade, zarif, geometrik', en: 'minimalist, elegant, geometric, refined negative space, clean, crisp' }
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
  function viewTitle() { return S.view === 'images' ? 'Görsel stüdyo' : S.view === 'audio' ? 'Ses stüdyo' : S.view === 'library' ? 'Kütüphane' : S.view === 'history' ? 'Geçmiş' : 'Yeni dosya'; }
  function miniSteps() {
    var labels = ['Fikir', 'Tarz', 'Üretim', 'Dosya'];
    var h = '<div class="mini-steps">';
    for (var i = 0; i < 4; i++) {
      var n = i + 1, cls = n === S.step ? 'on' : (n < S.step ? 'done' : '');
      // 1, 2 ve (sonuç varsa) 4 tıklanabilir — geri/ileri gidiş. 3 (üretim animasyonu) asla.
      var clk = n !== S.step && n !== 3 && (n === 1 || n === 2 || (n === 4 && !!S.result));
      h += '<div class="ms ' + cls + (clk ? ' clk' : '') + '"' + (clk ? ' data-act="goStep" data-v="' + n + '"' : '') + '><span class="n">' + (n < S.step ? '✓' : n) + '</span><span class="lb">' + labels[i] + '</span></div>';
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
    else if (S.view === 'audio') html = renderAudio();
    else if (S.view === 'library') html = renderLibrary();
    else html = renderHistory();
    view.innerHTML = html;
    bindDynamic();
    chrome();
  }

  // ── Composer (step 1) ────────────────────────────────────────────────
  function renderComposer() {
    var chips = shuffledIdeas().slice(_ideaIdx, _ideaIdx + 5).concat(shuffledIdeas().slice(0, 5)).slice(0, 5).map(function (t) { return '<button class="chip" data-act="useIdea" data-v="' + esc(t) + '"><span class="dot"></span>' + esc(t) + '</button>'; }).join('');
    return '<div class="composer">' +
      '<span class="eyebrow">Yeni dosya</span>' +
      '<h1 class="display">Ne anlatmak<br>istiyorsun?</h1>' +
      '<p class="sub">Bir cümle yeter. Gerisini Storia stüdyosu kurar.</p>' +
      '<div class="compose-box">' +
        '<textarea id="ideaInput" placeholder="Örn: Okyanusun en derin noktasında ne var?" rows="2">' + esc(S.idea) + '</textarea>' +
        '<div class="compose-tools"><div class="left">' +
          '<button class="btn btn-quiet btn-sm" data-act="suggest">✦ Sen öner</button>' +
          '<button class="btn btn-quiet btn-sm" data-act="trendFind">🔥 Trend & hook</button>' +
          '<button class="btn btn-quiet btn-sm" data-act="seriesFind">📚 Seri üret</button>' +
          '<span class="cnt" id="ideaCount"></span></div>' +
          '<button class="btn btn-gold" data-act="toStep2">Tarzını seç →</button>' +
        '</div>' +
      '</div>' +
      (S.trend.open ? renderTrend() : '') +
      (S.series.open ? renderSeries() : '') +
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
      var prem = v.premium ? '<span class="prem">Premium' + (v.x > 1 ? ' ×' + v.x : '') + '</span>' : '';
      var chk = v.check ? '<span class="v-chk" title="Türkçe telaffuzu önizlemeyle test et">TR?</span>' : '';
      return '<div class="tile voice-tile ' + (S.voiceIdx === i ? 'on' : '') + '" data-act="voice" data-v="' + i + '">' +
        '<button class="v-prev" data-act="voicePrev" data-v="' + i + '" aria-label="Sesi önizle" title="Önizle">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>' +
        '<div class="t-name">' + esc(v.name) + prem + chk + '</div><div class="t-desc">' + esc(v.desc) + '</div></div>';
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
      '<div class="opt-group"><div class="opt-title">Anlatıcı sesi</div><div class="tiles">' + voiceTiles + '</div>' + vengHtml() + '</div>' +
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
    if (((S.result || {}).karakterler || []).length) tabs.splice(3, 0, ['karakterler', 'Karakterler']);
    var tabBtns = tabs.map(function (t) { return '<button class="' + (S.tab === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '">' + t[1] + '</button>'; }).join('');
    var meta = [fmtDur(S.durationSec), styleObj().name, S.aspect, VOICES[S.voiceIdx].name].map(function (m) { return '<span class="m">' + esc(m) + '</span>'; }).join('');
    var hero = '<div class="doc-hero"><div class="doc-eyebrow">✦ Dosyan hazır</div>' +
      '<h1 class="doc-title">' + esc(r.baslik || S.idea) + '</h1>' +
      (r.logline ? '<p class="doc-logline">' + esc(r.logline) + '</p>' : '') +
      '<div class="doc-meta">' + meta + '</div>' +
      '<div class="doc-acts"><button class="btn btn-gold btn-sm" data-act="reviseChat">✎ Konuşarak düzenle</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="restart" style="color:var(--on-ink);border-color:rgba(255,255,255,.25)">＋ Yeni dosya</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="regen" style="color:var(--on-ink);border-color:rgba(255,255,255,.25)">↻ Yeniden üret</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="exportPdf" style="color:var(--on-ink);border-color:rgba(255,255,255,.25)">↓ PDF</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="download" style="color:var(--on-ink);border-color:rgba(255,255,255,.25)">↓ Metin</button></div></div>';
    return '<div class="doc">' + hero + '<div class="tabs">' + tabBtns + '</div><div class="tab-body" id="tabBody">' + renderTab() + '</div></div>';
  }

  function aspRatio() { return S.aspect === '9:16' ? '9/16' : S.aspect === '1:1' ? '1/1' : '16/9'; }
  function renderTab() {
    var r = S.result || {};
    if (S.tab === 'senaryo') {
      var scenes = (r.senaryo || []).map(function (sc, i) {
        var img = S.images[i], thumb, acts;
        if (img) {
          thumb = '<div class="th" style="aspect-ratio:' + aspRatio() + '"><img class="zoomable" src="' + esc(img) + '" data-act="zoom" data-v="' + esc(img) + '" alt=""></div>';
          acts = '<div class="th-acts"><button class="btn btn-quiet btn-sm" data-act="image" data-v="' + i + '">↻ Yeniden</button><button class="btn btn-quiet btn-sm" data-act="editImg" data-v="' + i + '">✏ Düzenle</button><button class="btn btn-quiet btn-sm" data-act="dl" data-v="' + esc(img) + '">↓ İndir</button></div>';
        } else {
          thumb = '<div class="th" style="aspect-ratio:' + aspRatio() + '"><div class="ph" style="background:' + GRADS[i % GRADS.length] + '">Sahne ' + (i + 1) + '</div></div>';
          acts = '<div class="th-acts"><button class="btn btn-gold btn-sm" data-act="image" data-v="' + i + '">✦ Görsel üret</button></div>';
        }
        return '<div class="scene"><div class="th-col">' + thumb + acts + '</div><div><div class="s-no">Sahne ' + (i + 1) + '</div>' +
          '<h4>' + esc(sc.baslik || ('Sahne ' + (i + 1))) + '</h4><p>' + esc(sc.anlatim || sc.metin || '') + '</p>' +
          (sc.gorsel ? '<div class="s-vis">🎬 <span>' + esc(sc.gorsel) + '</span></div>' : '') + '</div></div>';
      }).join('');
      return '<div class="tab-tools"><span class="tt-note">' + (r.senaryo || []).length + ' sahne · görsele tıkla → büyüt, gez, indir</span><div style="display:flex;gap:8px"><button class="btn btn-quiet btn-sm" data-act="addScene">＋ Ek sahne</button><button class="btn btn-quiet btn-sm" data-act="copyScript">Tümünü kopyala</button></div></div>' + (scenes || emptyInline());
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
    if (S.tab === 'karakterler') {
      var chars = r.karakterler || [];
      if (!chars.length) return emptyInline();
      var ccards = chars.map(function (c, i) {
        var name = (typeof c === 'string') ? c : (c.isim || ('Karakter ' + (i + 1)));
        var look = (typeof c === 'string') ? '' : (c.gorunum || c.tanim || '');
        var img = S.chars[i];
        var box = img ? '<img class="zoomable" src="' + esc(img) + '" data-act="zoom" data-v="' + esc(img) + '" alt="">' : '<div class="ph" style="background:' + GRADS[i % GRADS.length] + '">' + (REAL ? '✦ Portre üret' : 'Örnek portre') + '</div>';
        var acts = img
          ? '<button class="btn btn-quiet btn-sm" data-act="charImg" data-v="' + i + '">↻ Yeniden</button><button class="btn btn-quiet btn-sm" data-act="dl" data-v="' + esc(img) + '">↓ İndir</button>'
          : '<button class="btn btn-gold btn-sm" data-act="charImg" data-v="' + i + '">✦ Portre üret · 12</button>';
        return '<div class="gcard"><div class="gimg" style="aspect-ratio:1">' + box + '</div><div class="gbody"><div class="gno">' + esc(name) + '</div>' +
          '<div class="gtxt">' + esc(look) + '</div><div class="gacts">' + acts + '</div></div></div>';
      }).join('');
      var doneC = chars.filter(function (_, i) { return S.chars[i]; }).length;
      return '<div class="tab-tools"><span class="tt-note">Hikâyenin karakterleri · ' + chars.length + ' karakter · ' + doneC + ' portre · sahnelerde tutarlı görünür</span><button class="btn btn-gold btn-sm" data-act="genChars">✦ Tümünü üret</button></div><div class="gallery">' + ccards + '</div>';
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
        return '<div class="gcard"><div class="gimg" style="aspect-ratio:' + aspRatio() + '">' + box + '</div><div class="gbody"><div class="gno">Görsel ' + (i + 1) + '</div>' +
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
      var vsc = r.senaryo || [];
      var mp = (r.video_promptlar && r.video_promptlar.length) ? r.video_promptlar : (r.gorsel_promptlar || []).map(function (p) { return p + ', slow cinematic push-in with subtle parallax, smooth camera move, natural motion'; });
      var vn = Math.max(vsc.length, mp.length);
      if (!vn) return emptyInline();
      var vratio = S.aspect === '9:16' ? '9/16' : S.aspect === '1:1' ? '1/1' : '16/9';
      var vcards = '';
      for (var vi = 0; vi < vn; vi++) {
        var vurl = S.videos[vi], job = S.videoJobs[vi], vimg = S.images[vi], mprompt = mp[vi] || '';
        var media, actions;
        if (vurl) {
          media = '<video class="vid" src="' + esc(vurl) + '" controls playsinline style="aspect-ratio:' + vratio + '"></video>';
          actions = '<button class="btn btn-quiet btn-sm" data-act="video" data-v="' + vi + '">↻ Yeniden</button><button class="btn btn-quiet btn-sm" data-act="dl" data-v="' + esc(vurl) + '">↓ İndir</button>';
        } else if (job) {
          media = '<div class="vid vph" style="aspect-ratio:' + vratio + '"><span class="mini-orb"></span><span>Video render ediliyor…</span></div>';
          actions = '<span class="tt-note">Bu ~1-2 dk sürebilir</span>';
        } else if (vimg) {
          media = '<img class="vid zoomable" src="' + esc(vimg) + '" data-act="zoom" data-v="' + esc(vimg) + '" style="aspect-ratio:' + vratio + '">';
          actions = '<button class="btn btn-gold btn-sm" data-act="video" data-v="' + vi + '">🎬 Videoya çevir · 60kr</button>';
        } else {
          media = '<div class="vid vph" style="aspect-ratio:' + vratio + ';background:' + GRADS[vi % GRADS.length] + ';color:#fff">Önce görsel üret</div>';
          actions = '<button class="btn btn-gold btn-sm" data-act="image" data-v="' + vi + '">✦ Görsel üret</button>';
        }
        vcards += '<div class="vcard"><div class="vmedia">' + media + '</div><div class="vbody"><div class="sb-no">Sahne ' + (vi + 1) + '</div>' +
          '<div class="vprompt">' + esc(mprompt) + '</div><div class="th-acts">' + actions + '<button class="btn btn-quiet btn-sm" data-act="copyOne" data-v="' + esc(mprompt) + '">Prompt</button></div></div></div>';
      }
      var doneImgs = (r.senaryo || []).filter(function (s, i) { return S.images[i]; }).length;
      var musicChip = S.bgMusic
        ? '<div class="music-on"><span class="mo-ic">🎵</span><span class="mo-name">' + esc(S.bgMusicName || 'Müzik') + '</span><label class="mo-vol">Ses <input type="range" min="0" max="100" value="' + Math.round(S.musicVol * 100) + '" data-act="musicVol"></label><button class="btn btn-quiet btn-sm" data-act="musicClear">Kaldır</button></div>'
        : '<button class="btn btn-quiet btn-sm" data-act="musicPick">🎵 Arka plan müziği ekle</button>';
      var capSeg = Object.keys(CAP_STYLES).map(function (k) { return '<button class="' + (S.capStyle === k ? 'on' : '') + '" data-act="capStyle" data-v="' + k + '">' + esc(CAP_STYLES[k].name) + '</button>'; }).join('');
      var exportBar = '<div class="export-strip"><div class="es-txt"><b>Tek dosyada birleştir</b><span>Sahne görselleri + seslendirme + altyazı → Ken Burns efektli video (WebM/MP4). Ücretsiz, tarayıcıda oluşur.</span>' +
        '<div class="cap-pick"><span class="cp-lbl">Altyazı stili</span><div class="cap-seg">' + capSeg + '</div></div>' + musicChip +
        '<button class="btn btn-quiet btn-sm" data-act="brandKit" style="margin-top:12px">🎨 Marka kiti' + (S.brand.logo || S.brand.name ? ' ✓' : '') + '</button></div>' +
        '<button class="btn btn-gold" data-act="exportVid"' + (doneImgs ? '' : ' disabled') + '>🎬 Video oluştur &amp; indir</button></div>';
      var engSeg = '<div class="veng-pick"><span class="cp-lbl">Video motoru</span><div class="cap-seg">' +
        '<button class="' + (S.vengine === 'grok' ? 'on' : '') + '" data-act="vengine" data-v="grok">Grok · hızlı</button>' +
        '<button class="' + (S.vengine === 'kling' ? 'on' : '') + '" data-act="vengine" data-v="kling">Kling · sinematik</button>' +
        '</div></div>';
      return '<div class="tab-tools"><span class="tt-note">Sahne görselini <b>yapay zeka</b> ile ~5 sn videoya çevir · ' + vn + ' sahne</span>' + engSeg + '</div>' + exportBar + '<div class="vgrid">' + vcards + '</div>';
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
    var modeSeg = [['gorsel', 'Görsel'], ['avatar', 'Avatar / Karakter']].map(function (m) { return '<button class="' + (S.imgMode === m[0] ? 'on' : '') + '" data-act="imgMode" data-v="' + m[0] + '">' + m[1] + '</button>'; }).join('');
    var isAvatar = S.imgMode === 'avatar';
    return '<div class="imgstudio"><div class="room-head"><h1>Görsel stüdyo</h1><p>Tek bir prompt ile bağımsız görsel, avatar ya da karakter üret; düzenle ve indir.</p></div>' +
      '<div class="is-grid"><div>' +
        '<div class="opt-group"><div class="opt-title">Ne üretmek istiyorsun?</div><div class="seg">' + modeSeg + '</div></div>' +
        '<div class="opt-group"><div class="opt-title">' + (isAvatar ? 'Karakteri / avatarı tarif et' : 'Ne görmek istiyorsun?') + '</div>' +
          '<textarea class="field" id="imgPromptInput" placeholder="' + (isAvatar ? 'Örn: 30’lu yaşlarda gülümseyen bir barista, önlük, sıcak ışık' : 'Örn: gün batımında sisli bir dağ manzarası, kartal süzülüyor') + '" style="min-height:110px">' + esc(S.imgPrompt) + '</textarea></div>' +
        '<div class="opt-group"><div class="opt-title">Stil</div><div class="tiles">' + styleTiles + '</div></div>' +
        '<div class="opt-group"><div class="opt-title">Format</div><div class="aspects">' + aspects + '</div></div>' +
        '<button class="btn btn-gold btn-lg" data-act="genImage" style="width:100%">✦ Görseli üret · 12 kredi</button>' +
      '</div><div>' +
        '<div class="pv-card" style="padding:16px"><div id="imgOut">' + out + '</div></div>' +
      '</div></div></div>';
  }

  // ── Ses stüdyo (bağımsız TTS, ElevenLabs) ────────────────────────────
  function renderAudio() {
    var voiceTiles = VOICES.map(function (v, i) {
      var prem = v.premium ? '<span class="prem">Premium' + (v.x > 1 ? ' ×' + v.x : '') + '</span>' : '';
      return '<div class="tile voice-tile ' + (S.ssVoice === i ? 'on' : '') + '" data-act="ssVoice" data-v="' + i + '">' +
        '<button class="v-prev" data-act="voicePrev" data-v="' + i + '" aria-label="Önizle" title="Önizle"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></button>' +
        '<div class="t-name">' + esc(v.name) + prem + '</div><div class="t-desc">' + esc(v.desc) + '</div></div>';
    }).join('');
    var chars = (S.ssText || '').length, cost = Math.max(10, Math.ceil(chars / 1000) * 5) * (VOICES[S.ssVoice].x || 1);
    var out = S.ssOut
      ? '<audio controls src="' + esc(S.ssOut) + '" style="width:100%"></audio><div class="is-acts" style="margin-top:12px"><button class="btn btn-quiet btn-sm" data-act="dlAudioSs">↓ Sesi indir</button><button class="btn btn-quiet btn-sm" data-act="ssTts">↻ Yeniden</button></div>'
      : '<div class="ph" style="min-height:90px;display:grid;place-items:center;border-radius:var(--r-md);border:1px solid var(--line);background:linear-gradient(135deg,var(--paper-2),var(--paper-3));color:var(--muted);font-size:14px">Sesin burada belirir</div>';
    return '<div class="imgstudio"><div class="room-head"><h1>Ses stüdyo</h1><p>Metnini yaz, sesini seç — profesyonel seslendirmeyi tek başına üret ve indir.</p></div>' +
      '<div class="is-grid"><div>' +
        '<div class="opt-group"><div class="opt-title">Metin</div>' +
          '<textarea class="field" id="ssTextInput" placeholder="Seslendirmek istediğin metni buraya yaz…" style="min-height:150px">' + esc(S.ssText) + '</textarea>' +
          '<div id="ssMeta" style="text-align:right;font-size:12px;color:var(--muted);margin-top:6px">' + chars + ' karakter · ~' + cost + ' kredi</div></div>' +
        '<div class="opt-group"><div class="opt-title">Anlatıcı sesi</div><div class="tiles">' + voiceTiles + '</div>' + vengHtml() + '</div>' +
        '<button class="btn btn-gold btn-lg" data-act="ssTts" style="width:100%">✦ Seslendir</button>' +
      '</div><div>' +
        '<div class="pv-card" style="padding:18px"><div id="ssOut">' + out + '</div></div>' +
      '</div></div></div>';
  }
  function ttsToast(d) {
    if (d && d.engine === 'eleven') { toast('Seslendirme hazır · ElevenLabs 🎙️'); return; }
    var why = (d && d.elevenErr) ? (' — ' + String(d.elevenErr).slice(0, 90)) : '';
    toast('⚠ ElevenLabs kullanılamadı, OpenAI sesiyle üretildi' + why);
  }
  function doStudioTts() {
    var text = (S.ssText || '').trim(); if (!text) { toast('Önce bir metin yaz'); return; }
    if (!REAL) { if (!speak(text.slice(0, 600), 1)) { toast('Tarayıcı seslendirmeyi desteklemiyor'); return; } toast('Demo seslendirme (gerçek modda mp3)'); return; }
    if (!S.user) { openAuth(); return; }
    var v = VOICES[S.ssVoice], slot = document.getElementById('ssOut');
    if (slot) slot.innerHTML = '<p style="color:var(--muted);font-size:13px">Ses üretiliyor…</p>';
    callFn({ action: 'tts', text: text, engine: 'eleven', voiceId: v.ev, voice: v.ov, speed: 1 }).then(function (d) {
      if (d && d.ok && d.url) { S.ssOut = d.url; if (typeof d.credits === 'number') S.credits = d.credits; setEngineStatus(d); render(); chrome(); ttsToast(d); }
      else { if (slot) slot.innerHTML = ''; toast((d && d.error) || 'Ses üretilemedi'); }
    }).catch(function () { toast('Bağlantı hatası'); });
  }
  // ── Library / History ────────────────────────────────────────────────
  function renderLibrary() {
    if (!S.history.length) return '<div class="empty"><div class="e-ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M4 5h10v14H4zM14 7h6v12h-6"/></svg></div><h3>Kütüphanen boş</h3><p>Ürettiğin dosyalar burada toplanır. İlk dosyanı oluşturmaya ne dersin?</p><button class="btn btn-gold" data-act="goNew">＋ Yeni dosya</button></div>';
    return renderHistory();
  }
  function renderHistory() {
    if (!S.history.length) return '<div class="empty"><div class="e-ic"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg></div><h3>Henüz geçmiş yok</h3><p>Ürettiğin her dosya burada kalıcı olarak toplanır.</p><button class="btn btn-gold" data-act="goNew">＋ Yeni dosya</button></div>';
    var items = S.history.map(function (h, i) {
      var when = h.ts ? new Date(h.ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '';
      return '<div class="hist-item"><div class="hi-th" data-act="openHist" data-v="' + i + '" style="background:' + GRADS[i % GRADS.length] + '"></div>' +
        '<div class="hi-body" data-act="openHist" data-v="' + i + '"><div class="hi-title">' + esc((h.result && h.result.baslik) || h.idea || 'Dosya') + '</div><div class="hi-meta">' + esc(h.meta) + (when ? ' · ' + when : '') + '</div></div>' +
        '<button class="hi-del" data-act="delHist" data-v="' + i + '" title="Sil" aria-label="Sil">✕</button><div class="hi-go" data-act="openHist" data-v="' + i + '">→</div></div>';
    }).join('');
    return '<div class="room-head" style="max-width:760px"><h1>Geçmiş</h1><p>Ürettiğin dosyalar bu cihazda kalıcı olarak saklanır.</p></div><div class="hist">' + items + '</div>';
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
    var ssT = document.getElementById('ssTextInput');
    if (ssT) ssT.addEventListener('input', function () {
      S.ssText = ssT.value;
      var m = document.getElementById('ssMeta'); if (m) { var n = ssT.value.length, c = Math.max(10, Math.ceil(n / 1000) * 5) * (VOICES[S.ssVoice].x || 1); m.textContent = n + ' karakter · ~' + c + ' kredi'; }
    });
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
      case 'suggest': suggestIdea(); break;
      case 'trendFind': S.trend.open = !S.trend.open; render(); break;
      case 'trendNiche': S.trend.niche = v; render(); setTimeout(findTrends, 0); break;
      case 'trendGo': findTrends(); break;
      case 'trendClose': S.trend.open = false; render(); break;
      case 'useTrend': useTrend(parseInt(v, 10)); break;
      case 'copyHook': copy(v); toast('Hook kopyalandı'); break;
      case 'seriesFind': S.series.open = !S.series.open; render(); break;
      case 'seriesMode': var _sr = document.getElementById('seriesSource'); if (_sr) S.series.source = _sr.value; var _st = document.getElementById('seriesTopic'); if (_st) S.series.topic = _st.value; S.series.mode = v; S.series.eps = []; render(); break;
      case 'seriesPlan': planSeries(); break;
      case 'seriesToggle': var _ep = S.series.eps[parseInt(v, 10)]; if (_ep) _ep.on = !(_ep.on !== false); break;
      case 'seriesRun': runSeries(); break;
      case 'seriesClose': S.series.open = false; render(); break;
      case 'toStep2': if (!S.idea.trim()) { toast('Önce bir fikir yaz'); break; } S.step = 2; render(); break;
      case 'back': S.step = 1; render(); break;
      case 'goStep': var _gn = parseInt(v, 10); if (_gn === 4 && !S.result) break; if (_gn === 3) break; S.step = _gn; render(); break;
      case 'tone': S.tone = v; render(); break;
      case 'voice': S.voiceIdx = parseInt(v, 10); render(); break;
      case 'style': S.style = v; render(); break;
      case 'aspect': S.aspect = v; render(); break;
      case 'mode': applyMode(parseInt(v, 10)); break;
      case 'template': applyTemplate(parseInt(v, 10)); break;
      case 'lang': S.lang = v; render(); break;
      case 'generate': startGenerate(false); break;
      case 'regen': startGenerate(true); break;
      case 'reviseChat': openChat(); break;
      case 'restart': case 'goNew': startNew(); break;
      case 'tab': S.tab = v; document.querySelectorAll('.tabs button').forEach(function (b) { b.classList.remove('on'); }); el.classList.add('on'); document.getElementById('tabBody').innerHTML = renderTab(); break;
      case 'copyScript': copy((S.result.senaryo || []).map(function (s, i) { return (i + 1) + '. ' + (s.baslik || '') + '\n' + (s.anlatim || ''); }).join('\n\n')); break;
      case 'copyVo': copy(narrationText()); break;
      case 'copyOne': copy(v); break;
      case 'copyVids': var vp = (S.result.video_promptlar && S.result.video_promptlar.length) ? S.result.video_promptlar : (S.result.gorsel_promptlar || []).map(function (x) { return x + ', slow cinematic push-in with subtle parallax, smooth camera move, natural motion'; }); copy(vp.map(function (x, i) { return (i + 1) + '. ' + x; }).join('\n')); break;
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
      case 'charImg': doCharImage(parseInt(v, 10)); break;
      case 'genChars': genChars(); break;
      case 'addScene': openSceneModal(); break;
      case 'cover': doCover(parseInt(v, 10)); break;
      case 'video': doVideo(parseInt(v, 10)); break;
      case 'exportVid': exportVideo(); break;
      case 'capStyle': S.capStyle = v; refreshTab(); break;
      case 'vengine': S.vengine = v; refreshTab(); toast(v === 'kling' ? 'Kling · sinematik seçildi' : 'Grok · hızlı seçildi'); break;
      case 'brandKit': openBrandModal(); break;
      case 'musicPick': openMusicModal(); break;
      case 'musicClear': if (S.bgMusic && S.bgMusic.indexOf('blob:') === 0) { try { URL.revokeObjectURL(S.bgMusic); } catch (e) {} } S.bgMusic = null; S.bgMusicName = ''; refreshTab(); break;
      case 'musicVol': break;
      case 'editImg': openEdit(parseInt(v, 10)); break;
      case 'openHist': openHist(parseInt(v, 10)); break;
      case 'delHist': delHist(parseInt(v, 10)); break;
      case 'istyle': S.imgStyle = v; render(); break;
      case 'iaspect': S.imgAspect = v; render(); break;
      case 'genImage': genStandaloneImage(); break;
      case 'editStudio': openEditStudio(); break;
      case 'imgMode': S.imgMode = v; render(); break;
      case 'ssVoice': S.ssVoice = parseInt(v, 10); render(); break;
      case 'ssTts': doStudioTts(); break;
      case 'dlAudioSs': downloadFileUrl(S.ssOut, 'storia-seslendirme.mp3'); break;
      case 'upgrade': openPlanModal(); break;
    }
  });
  view.addEventListener('input', function (e) {
    var el = e.target.closest('[data-act]'); if (!el) return;
    if (el.getAttribute('data-act') === 'musicVol') S.musicVol = (parseInt(el.value, 10) || 0) / 100;
  });

  function applyMode(i) { var m = MODES[i]; if (!m) return; S.durationSec = m.sec; S.aspect = m.aspect; S.tone = m.tone; render(); toast(m.name + ' seçildi'); }
  function applyTemplate(i) { var t = TEMPLATES[i]; if (!t) return; S.template = i; S.tone = t.tone; S.style = t.style; S.durationSec = t.sec; S.aspect = t.aspect; render(); toast(t.name + ' şablonu · tarz ayarlandı'); }
  function startNew() { S.result = null; S.images = {}; S.covers = {}; S.videos = {}; S.videoJobs = {}; S.chars = {}; S.audio = null; S.idea = ''; S.custom = ''; S.step = 1; S.view = 'new'; S.tab = 'senaryo'; render(); }

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
    S.result = result; S.images = {}; S.covers = {}; S.videos = {}; S.videoJobs = {}; S.chars = {}; S.audio = null; S.tab = 'senaryo';
    if (typeof credits === 'number') S.credits = credits;
    else if (!REAL && charged) S.credits = Math.max(0, (S.credits || 0) - costGen(S.durationSec));
    var ent = { result: result, idea: S.idea, meta: fmtDur(S.durationSec) + ' · ' + styleObj().name + ' · ' + S.aspect, ts: Date.now(), aspect: S.aspect, style: S.style, voiceIdx: S.voiceIdx, durationSec: S.durationSec, images: {}, covers: {}, videos: {}, audio: null };
    S.history.unshift(ent); S._cur = ent;
    S.chat._revised = false;  // yeni dosya için düzenleme karşılaması yeniden gösterilsin
    saveHist();
    S.step = 4; render();
  }
  // Üretilen medyayı (görsel/kapak/video/ses — hepsi kalıcı depo URL'leri) açık
  // olan geçmiş kaydına yaz ki dosya yeniden açıldığında kaybolmasın (kredi boşa gitmesin).
  function persistMedia() {
    if (!S._cur) return;
    S._cur.images = S.images; S._cur.covers = S.covers; S._cur.videos = S.videos;
    S._cur.audio = (S.audio && String(S.audio).indexOf('http') === 0) ? S.audio : null;
    saveHist();
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
        '\nNARRATIVE STRUCTURE (MANDATORY — the viewer must follow ONE clear story from start to finish; NOT disconnected facts):\n' +
        '1. HOOK (scene 1): first 3 seconds — a striking question, bold claim or vivid image that stops the scroll and creates curiosity.\n' +
        '2. SETUP: frame the topic clearly so the viewer knows what they will learn.\n' +
        '3. BUILD: each scene ADDS to the previous one and CONNECTS to the next; advance with concrete examples, numbers, specifics. No random info-dumping.\n' +
        '4. TURN / CLIMAX: the most compelling moment or an unexpected truth.\n' +
        '5. PAYOFF + CTA: a satisfying conclusion and a clear closing line / call to action.\n' +
        'The whole thing must read as ONE coherent, understandable narrative that flows in logical order — a viewer should easily follow it.\n' +
        'IMAGE <-> SCENE: gorsel_promptlar[i] must depict EXACTLY what happens in senaryo[i] (that scene\'s concrete subject and action) — never a generic or unrelated mood image.\n' +
        '\nReturn ONLY valid JSON in this schema, in ENGLISH (keys stay exactly as below, no other text):\n' +
        '{ "baslik":"catchy title", "logline":"one-sentence summary", ' +
        '"karakterler":[{"isim":"character name","gorunum":"DETAILED physical description for consistent images (age, gender, hair, eyes, clothing, distinctive traits)"}], ' +
        '"senaryo":[{"baslik":"scene title","anlatim":"short narration that fits the duration (1 sentence for short videos)","gorsel":"RICH visual description: subject, action, composition, lighting, atmosphere, mood"}], ' +
        '"seslendirme_notu":"note to the narrator", ' +
        '"youtube":{"baslik":"a SCROLL-STOPPING, high-CTR title (max ~60 chars) built on a curiosity gap or bold promise — use a number, a power word, or an open loop (e.g. \\"The 3 seconds that changed everything\\"); NOT a flat descriptive/SEO phrase","aciklama":"2-3 line description: first line repeats the hook, then the value, then a CTA to subscribe","etiketler":["tag1","tag2","tag3"]}, ' +
        '"instagram":{"aciklama":"FULL Reels caption where the FIRST LINE is a thumb-stopping hook (a question, bold claim or surprising stat that creates a curiosity gap) — then 1-2 lines of value, then a clear CTA (save/follow/comment). 3-4 short lines, line breaks, 2-4 fitting emoji. Punchy, human, NOT generic.","hashtagler":["hashtag1","hashtag2","hashtag3"]}, "kapak":["striking thumbnail idea with a bold 2-4 word text overlay concept"], ' +
        '"gorsel_promptlar":["DETAILED English image prompt for each scene: subject + action + composition (rule of thirds, foreground/background) + camera angle & lens (e.g. wide 24mm, close-up 85mm, low angle) + lighting + atmosphere + ' + st.en + '. The image must contain NO text, letters, words, logos or watermark."], ' +
        '"video_promptlar":["per-scene cinematic MOTION prompt for image-to-video (one per scene, same subject as the image): describe ONE clear camera movement (slow push-in, dolly, pan left/right, tilt up, orbit, tracking) + subtle subject/environment motion + mood; smooth, cinematic, natural physics, no text"], "uretim_notu":"short production tip" }\n' +
        'RULES: senaryo, gorsel_promptlar and video_promptlar must EACH contain the SAME number of items — one per scene, at least ' + min + '. They are INDEX-ALIGNED and INTEGRATED: gorsel_promptlar[i] is the detailed image prompt for senaryo[i].gorsel (exact same scene), and video_promptlar[i] animates THAT exact image (same subject, same framing). Scene text → image → motion must be ONE coherent moment per index. If the story has clear character(s), fill "karakterler" and describe that character with the SAME physical traits in EVERY gorsel/video prompt (character consistency); if none, leave "karakterler" empty. If the topic is nonsense return {"gecersiz":true,"mesaj":"..."}.';
    }
    return 'Sen içerik üreticileri için çalışan uzman bir senarist ve yapım yönetmenisin. İzleyiciyi ilk saniyeden yakalayan, akıcı ve DOĞRU içerik üret.\n\n' +
      'KONU: ' + S.idea + '\nANLATIM TONU: ' + toneName() + '\nGÖRSEL STİL: ' + st.name + ' (' + st.en + ')\n' +
      'FORMAT: ' + S.aspect + ' · SÜRE: ' + fmtDur(S.durationSec) + ' · SAHNE SAYISI: yaklaşık ' + scenes + '\n' +
      'SÜRE-METİN DENGESİ (ÇOK ÖNEMLİ): Video ' + fmtDur(S.durationSec) + ' uzunluğunda ve seslendirme metni SESLİ okunacak. Tüm sahnelerin "anlatim" metinlerinin TOPLAMI EN FAZLA ~' + words + ' kelime olmalı — bu sınırı KESİNLİKLE AŞMA. Her sahnenin anlatımı kısa ve öz olsun (kısa videoda tek cümle). Sahne sayısı ' + scenes + ' olsa bile metni uzatma; seslendirme ' + fmtDur(S.durationSec) + ' süresine sığmalı.\n' +
      (S.custom ? 'ÖZEL İSTEK (en yüksek öncelik): ' + S.custom + '\n' : '') +
      '\nANLATIM YAPISI (ZORUNLU — izleyici baştan sona TEK bir hikâyeyi takip edebilmeli; kopuk bilgi yığını DEĞİL):\n' +
      '1. KANCA (1. sahne): ilk 3 saniye — kaydırmayı durduran, merak uyandıran çarpıcı bir soru, iddia ya da görüntü.\n' +
      '2. KURULUM: konuyu netçe çerçevele; izleyici ne öğreneceğini anlasın.\n' +
      '3. GELİŞME: her sahne bir öncekinin ÜSTÜNE koysun ve bir sonrakine BAĞLANSIN; somut örnek, sayı ve ayrıntıyla ilerle. Rastgele bilgi yığma yok.\n' +
      '4. DORUK/DÖNÜŞ: en çarpıcı an ya da beklenmedik bir gerçek.\n' +
      '5. SONUÇ + ÇAĞRI: tatmin edici bir kapanış ve net bir son cümle / eylem çağrısı.\n' +
      'Bütün metin, mantıklı sırayla akan TEK, tutarlı ve anlaşılır bir anlatı olsun — izleyici rahatça takip edebilsin.\n' +
      'GÖRSEL <-> SAHNE: gorsel_promptlar[i], senaryo[i]\'de TAM OLARAK ne oluyorsa onu göstersin (o sahnenin somut öznesi ve aksiyonu) — asla genel geçer ya da alakasız bir atmosfer görseli değil.\n' +
      '\nYalnızca aşağıdaki şemada, Türkçe ve GEÇERLİ JSON döndür (başka metin yok):\n' +
      '{ "baslik":"çarpıcı başlık", "logline":"tek cümle özet", ' +
      '"karakterler":[{"isim":"karakter adı","gorunum":"tutarlı görsel için DETAYLI fiziksel tanım (yaş, cinsiyet, saç, göz, kıyafet, ayırt edici özellik)"}], ' +
      '"senaryo":[{"baslik":"sahne başlığı","anlatim":"süreye uygun KISA anlatım (kısa videoda tek cümle)","gorsel":"sahnenin ZENGİN görsel tarifi: özne, aksiyon, kompozisyon, ışık, atmosfer, duygu"}], ' +
      '"seslendirme_notu":"anlatıcı yönergesi", ' +
      '"youtube":{"baslik":"KAYDIRMAYI DURDURAN, yüksek tıklanma alan bir başlık (en fazla ~60 karakter) — merak boşluğu ya da güçlü bir vaat üzerine kur: bir sayı, güçlü bir kelime ya da açık döngü kullan (ör. \\"Her şeyi değiştiren 3 saniye\\"); DÜZ betimleyici/SEO cümlesi OLMASIN","aciklama":"2-3 satır açıklama: ilk satır kancayı tekrarlasın, sonra değer, sonra abone olma çağrısı","etiketler":["e1","e2","e3"]}, ' +
      '"instagram":{"aciklama":"İLK SATIRI baş döndüren bir KANCA olan TAM Reels metni (merak boşluğu yaratan bir soru, cesur iddia ya da şaşırtıcı istatistik) — ardından 1-2 satır değer, sonra net bir CTA (kaydet/takip et/yorum yap). 3-4 kısa satır, satır araları, 2-4 uygun emoji. Vurucu, insansı, GENEL GEÇER DEĞİL.","hashtagler":["h1","h2","h3"]}, "kapak":["çarpıcı thumbnail fikri + 2-4 kelimelik cesur yazı katmanı konsepti"], ' +
      '"gorsel_promptlar":["her sahne için DETAYLI İngilizce görsel üretim promptu: özne + aksiyon + kompozisyon (üçler kuralı, ön/arka plan) + kamera açısı & lens (ör. wide 24mm, close-up 85mm, low angle) + ışık + atmosfer + ' + st.en + '. Görselin İÇİNDE kesinlikle yazı/harf/kelime/logo/watermark OLMASIN."], ' +
      '"video_promptlar":["her sahne için sinematik HAREKET promptu — image-to-video (sahne başına bir tane, görselle aynı özne): TEK net kamera hareketi (yavaş push-in, dolly, sağa/sola kaydırma, tilt, yörünge, takip) + hafif özne/ortam hareketi + atmosfer; İngilizce yaz, akıcı ve sinematik, gerçekçi fizik, yazısız"], "uretim_notu":"kısa tavsiye" }\n' +
      'KURALLAR: senaryo, gorsel_promptlar ve video_promptlar AYNI sayıda öğe içersin — sahne başına bir tane, en az ' + min + '. Bunlar İNDEKS-HİZALI ve ENTEGRE: gorsel_promptlar[i], senaryo[i].gorsel için detaylı görsel prompttur (birebir aynı sahne); video_promptlar[i] ise O görseli canlandırır (aynı özne, aynı çerçeve). Yani sahne metni → görsel → hareket, her indekste TEK ve tutarlı bir an olsun. Hikayede belirgin karakter(ler) varsa "karakterler"i doldur ve o karakteri HER görsel/video promptunda aynı fiziksel özelliklerle betimle (tutarlılık); yoksa boş bırak. Konu anlamsızsa {"gecersiz":true,"mesaj":"..."} döndür.';
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

  function openHist(i) { var h = S.history[i]; if (!h) return; S.result = h.result; S.images = h.images || {}; S.covers = h.covers || {}; S.videos = h.videos || {}; S.videoJobs = {}; S.chars = {}; S.audio = h.audio || null; S.aspect = h.aspect; S.style = h.style; S.voiceIdx = h.voiceIdx; S.durationSec = h.durationSec; S.idea = h.idea; S._cur = h; S.tab = 'senaryo'; S.view = 'new'; S.step = 4; render(); }
  function delHist(i) { S.history.splice(i, 1); saveHist(); render(); toast('Dosya geçmişten silindi'); }
  // Geçmiş kalıcılığı: tarayıcıda saklanır (yenilemede kaybolmaz). Kullanıcıya
  // göre anahtarlanır ki farklı hesaplar birbirinin geçmişini görmesin.
  function histKey() { return 'storia_hist_' + ((S.user && S.user.id) ? S.user.id.slice(0, 12) : 'guest'); }
  function saveHist() {
    try { localStorage.setItem(histKey(), JSON.stringify(S.history.slice(0, 50))); }
    catch (e) {
      // Kota dolduysa medyayı at, en azından metin/kayıtları koru (görsel URL'leri
      // küçüktür; bu yol yalnız data-URI'li nadir durumlarda tetiklenir).
      try {
        localStorage.setItem(histKey(), JSON.stringify(S.history.slice(0, 30).map(function (h) {
          return { result: h.result, idea: h.idea, meta: h.meta, ts: h.ts, aspect: h.aspect, style: h.style, voiceIdx: h.voiceIdx, durationSec: h.durationSec, images: h.images, covers: h.covers, videos: h.videos };
        })));
      } catch (_e) {}
    }
  }
  function loadHist() { try { var h = JSON.parse(localStorage.getItem(histKey()) || '[]'); S.history = Array.isArray(h) ? h : []; } catch (e) { S.history = []; } }
  // Marka kiti (logo/renk/isim/handle/outro) — cihazda, kullanıcıya göre saklanır
  function brandKey() { return 'storia_brand_' + ((S.user && S.user.id) ? S.user.id.slice(0, 12) : 'guest'); }
  function saveBrand() { try { localStorage.setItem(brandKey(), JSON.stringify(S.brand)); } catch (e) {} }
  function loadBrand() { try { var b = JSON.parse(localStorage.getItem(brandKey()) || 'null'); if (b && typeof b === 'object') { for (var k in b) if (k in S.brand) S.brand[k] = b[k]; } } catch (e) {} }
  function openBrandModal() { var m = document.getElementById('brandModal'); if (m) { fillBrandForm(); m.classList.add('show'); } }
  function closeBrandModal() { var m = document.getElementById('brandModal'); if (m) m.classList.remove('show'); }
  function fillBrandForm() {
    var g = function (id) { return document.getElementById(id); };
    if (g('brName')) g('brName').value = S.brand.name || '';
    if (g('brHandle')) g('brHandle').value = S.brand.handle || '';
    if (g('brColor')) g('brColor').value = S.brand.color || '#d9bc80';
    if (g('brWm')) g('brWm').checked = !!S.brand.wm;
    if (g('brOutro')) g('brOutro').checked = !!S.brand.outro;
    if (g('brOutroText')) g('brOutroText').value = S.brand.outroText || '';
    var lp = g('brLogoPrev'); if (lp) lp.innerHTML = S.brand.logo ? '<img src="' + esc(S.brand.logo) + '" alt="">' : '<span>Logo yok</span>';
  }
  function handleBrandLogo(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast('Lütfen bir görsel seç (PNG şeffaf önerilir)'); return; }
    if (file.size > 3 * 1024 * 1024) { toast('Logo çok büyük (en fazla 3 MB)'); return; }
    var fr = new FileReader(); fr.onload = function () { S.brand.logo = String(fr.result); var lp = document.getElementById('brLogoPrev'); if (lp) lp.innerHTML = '<img src="' + esc(S.brand.logo) + '" alt="">'; }; fr.readAsDataURL(file);
  }
  function saveBrandForm() {
    var g = function (id) { var e = document.getElementById(id); return e ? e.value : ''; };
    S.brand.name = g('brName').trim(); S.brand.handle = g('brHandle').trim();
    S.brand.color = g('brColor') || '#d9bc80'; S.brand.outroText = g('brOutroText');
    var wm = document.getElementById('brWm'), ou = document.getElementById('brOutro');
    S.brand.wm = wm ? wm.checked : true; S.brand.outro = ou ? ou.checked : false;
    saveBrand(); closeBrandModal(); refreshTab(); toast('Marka kiti kaydedildi');
  }
  function clearBrandLogo() { S.brand.logo = ''; var lp = document.getElementById('brLogoPrev'); if (lp) lp.innerHTML = '<span>Logo yok</span>'; }

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
    if (!REAL) { S.images[idx] = demoImage(idx, S.aspect); persistMedia(); refreshTab(); toast('Demo görsel eklendi'); return; }
    if (!S.user) { openAuth(); return; }
    toast('Görsel üretiliyor…');
    callFn({ action: 'image', prompt: full, size: S.aspect, imgIndex: idx }).then(function (d) {
      if (d && d.ok && d.url) { S.images[idx] = d.url; if (typeof d.credits === 'number') S.credits = d.credits; persistMedia(); refreshTab(); chrome(); toast('Görsel üretildi'); }
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
  // ── Video export (Ken Burns + altyazı + seslendirme → WebM, tarayıcıda) ──
  function loadImgEl(url) { return new Promise(function (res, rej) { if (!url) return rej(); var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { res(im); }; im.onerror = rej; im.src = url; }); }
  function showExport(frac, msg) { var o = document.getElementById('exportOverlay'); if (!o) return; o.classList.add('show'); document.getElementById('exBar').style.width = Math.round(frac * 100) + '%'; document.getElementById('exMsg').textContent = msg; }
  function hideExport() { var o = document.getElementById('exportOverlay'); if (o) o.classList.remove('show'); }
  function drawCover(ctx, img, W, H, scale, panFrac) {
    var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    var s = Math.max(W / iw, H / ih) * scale, dw = iw * s, dh = ih * s;
    ctx.drawImage(img, (W - dw) / 2 + panFrac * W, (H - dh) / 2, dw, dh);
  }
  // Türkçe-uyumlu altyazı stil şablonları (canvas ile çizilir, font sorunu yok)
  var CAP_STYLES = {
    klasik:  { name: 'Klasik', up: false, fill: '#fff', stroke: 'rgba(15,11,6,.85)', sw: 0.16, size: 0.052, pos: 0.10 },
    sari:    { name: 'Sarı Vurgu', up: true, fill: '#ffd21e', stroke: '#000', sw: 0.22, size: 0.056, pos: 0.11 },
    kutu:    { name: 'Kutulu', up: false, fill: '#fff', stroke: null, sw: 0, size: 0.046, pos: 0.10, box: 'rgba(15,11,6,.74)' },
    minimal: { name: 'Minimal', up: false, fill: '#fff', stroke: null, sw: 0, size: 0.044, pos: 0.09, shadow: true },
    impact:  { name: 'Impact', up: true, fill: '#fff', stroke: '#000', sw: 0.26, size: 0.06, pos: 0.12 },
    yok:     { name: 'Yok', none: true }
  };
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawCaption(ctx, text, W, H) {
    if (!text) return;
    var st = CAP_STYLES[S.capStyle] || CAP_STYLES.klasik;
    if (st.none) return;
    var body = st.up ? text.toLocaleUpperCase('tr-TR') : text;
    var fs = Math.round(W * st.size);
    ctx.font = '700 ' + fs + 'px "Hanken Grotesk", Arial, "Helvetica Neue", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    var maxW = W * 0.84, words = body.split(' '), lines = [], line = '';
    for (var i = 0; i < words.length; i++) { var t = line ? line + ' ' + words[i] : words[i]; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = words[i]; } else line = t; }
    if (line) lines.push(line);
    lines = lines.slice(0, 3);
    var lh = fs * 1.28, y0 = H - H * st.pos - lines.length * lh;
    for (var j = 0; j < lines.length; j++) {
      var y = y0 + j * lh + fs, x = W / 2, tw = ctx.measureText(lines[j]).width;
      if (st.box) { ctx.fillStyle = st.box; roundRect(ctx, x - tw / 2 - fs * 0.35, y - fs * 0.98, tw + fs * 0.7, fs * 1.34, fs * 0.24); ctx.fill(); }
      if (st.shadow) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = fs * 0.35; ctx.shadowOffsetY = fs * 0.06; }
      if (st.stroke) { ctx.lineWidth = fs * st.sw; ctx.strokeStyle = st.stroke; ctx.lineJoin = 'round'; ctx.miterLimit = 2; ctx.strokeText(lines[j], x, y); }
      ctx.fillStyle = st.fill; ctx.fillText(lines[j], x, y);
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }
  }
  var _exporting = false;
  function exportVideo() {
    if (_exporting) return;
    var r = S.result || {}, scenes = r.senaryo || [];
    if (!scenes.length) { toast('Önce bir dosya üret'); return; }
    if (!window.MediaRecorder) { toast('Tarayıcı video dışa aktarmayı desteklemiyor'); return; }
    _exporting = true; showExport(0, 'Hazırlanıyor…');
    var dims = S.aspect === '9:16' ? [720, 1280] : S.aspect === '1:1' ? [1080, 1080] : [1280, 720];
    var W = dims[0], H = dims[1], n = scenes.length;
    // Canvas'ı DOM'a (gizli) ekle — bazı tarayıcılarda captureStream ancak
    // canvas kompozisyona dahilse gerçek kare üretir.
    var canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    canvas.style.cssText = 'position:fixed;left:-99999px;top:0;width:2px;height:2px;opacity:.01;pointer-events:none';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var brand = S.brand, logoEl = null;
    if (brand.logo) { var _li = new Image(); _li.onload = function () { logoEl = _li; }; _li.src = brand.logo; }
    function drawWatermark() {
      if (!(brand.wm && logoEl)) return;
      var lw = W * 0.14, lh2 = lw * (logoEl.naturalHeight || 1) / (logoEl.naturalWidth || 1), pad = W * 0.035;
      ctx.globalAlpha = 0.9; ctx.drawImage(logoEl, W - lw - pad, pad, lw, lh2); ctx.globalAlpha = 1;
    }
    function drawOutro(prog) {
      var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a140b'); g.addColorStop(1, '#0d0a06'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      var cy = H * 0.5, ease = Math.min(1, prog * 2.2); ctx.globalAlpha = ease; ctx.textAlign = 'center';
      if (logoEl) { var lw = W * 0.24, lh2 = lw * (logoEl.naturalHeight || 1) / (logoEl.naturalWidth || 1); ctx.drawImage(logoEl, (W - lw) / 2, cy - lh2 - H * 0.07, lw, lh2); }
      if (brand.name) { var nf = Math.round(W * 0.075); ctx.font = '700 ' + nf + 'px "Hanken Grotesk", Arial, sans-serif'; ctx.fillStyle = brand.color || '#d9bc80'; ctx.fillText(brand.name, W / 2, cy + H * 0.02); }
      if (brand.outroText) { var tf = Math.round(W * 0.04); ctx.font = '600 ' + tf + 'px "Hanken Grotesk", Arial, sans-serif'; ctx.fillStyle = '#fff'; ctx.fillText(brand.outroText, W / 2, cy + H * 0.09); }
      if (brand.handle) { var hf = Math.round(W * 0.036); ctx.font = '500 ' + hf + 'px "Hanken Grotesk", Arial, sans-serif'; ctx.fillStyle = brand.color || '#d9bc80'; ctx.fillText(brand.handle, W / 2, cy + H * 0.155); }
      ctx.globalAlpha = 1;
    }
    function drawFrame(k, lt) {
      ctx.fillStyle = '#14110c'; ctx.fillRect(0, 0, W, H);
      if (imgsRef[k]) drawCover(ctx, imgsRef[k], W, H, 1.03 + 0.09 * lt, (k % 2 ? -1 : 1) * 0.02 * lt);
      else { var g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#efe6d2'); g.addColorStop(1, '#b4914d'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      drawCaption(ctx, scenes[k].anlatim || scenes[k].metin || '', W, H);
      drawWatermark();
    }
    var imgsRef = [];
    Promise.all(scenes.map(function (s, i) { return loadImgEl(S.images[i]).catch(function () { return null; }); })).then(function (imgs) {
      imgsRef = imgs;
      var AC = window.AudioContext || window.webkitAudioContext, actx = null;
      function decodeUrl(url) { if (!actx) { actx = new AC(); try { actx.resume(); } catch (e) {} } return fetch(url).then(function (rr) { return rr.arrayBuffer(); }).then(function (ab) { return actx.decodeAudioData(ab); }).catch(function () { return null; }); }
      Promise.all([S.audio ? decodeUrl(S.audio) : Promise.resolve(null), S.bgMusic ? decodeUrl(S.bgMusic) : Promise.resolve(null)]).then(function (bufs) {
        var voBuf = bufs[0], muBuf = bufs[1];
        var sceneTotal = voBuf ? voBuf.duration : n * 3.2;
        var OUTRO = (brand.outro && (brand.name || brand.handle || brand.outroText)) ? 1.8 : 0;
        var total = sceneTotal + OUTRO, per = sceneTotal / n;
        drawFrame(0, 0); // captureStream'den önce ilk kareyi çiz
        var vstream = canvas.captureStream(30), vtrack = vstream.getVideoTracks()[0], srcs = [];
        // Ses ancak gerçekten varsa parçaya eklenir — boş/sessiz ses izi kaydı bloke edebilir.
        var tracks = vstream.getVideoTracks();
        if ((voBuf || muBuf) && actx) {
          var dest = actx.createMediaStreamDestination();
          if (voBuf) { var vs = actx.createBufferSource(); vs.buffer = voBuf; var vg = actx.createGain(); vg.gain.value = 1; vs.connect(vg); vg.connect(dest); srcs.push(vs); }
          // müzik: seslendirme varken kısılır (ducking), yoksa daha yüksek; sona kadar döner
          if (muBuf) { var ms = actx.createBufferSource(); ms.buffer = muBuf; ms.loop = true; var mg = actx.createGain(); mg.gain.value = (voBuf ? 0.30 : 0.85) * S.musicVol; ms.connect(mg); mg.connect(dest); srcs.push(ms); }
          tracks = tracks.concat(dest.stream.getAudioTracks());
        }
        var mstream = new MediaStream(tracks);
        // Safari MediaRecorder'da WebM DESTEKLEMEZ, yalnızca MP4/H.264 → önce mp4
        // adaylarını da dene. Chrome/Firefox webm'i seçer, Safari mp4'ü.
        var isSup = function (m) { try { return MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m); } catch (e) { return false; } };
        var mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4'].filter(isSup)[0] || '';
        var ext = mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm', outType = mime.indexOf('mp4') >= 0 ? 'video/mp4' : 'video/webm';
        var rec, chunks = [];
        try { rec = mime ? new MediaRecorder(mstream, { mimeType: mime, videoBitsPerSecond: 6000000 }) : new MediaRecorder(mstream); }
        catch (e1) { try { rec = new MediaRecorder(mstream); ext = 'webm'; outType = 'video/webm'; } catch (e2) { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); try { if (actx) actx.close(); } catch (e3) {} hideExport(); _exporting = false; toast('Tarayıcın video kaydını desteklemiyor — Chrome dene'); return; } }
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = function () {
          try { if (actx) actx.close(); } catch (e) {}
          if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
          if (!chunks.length) { hideExport(); _exporting = false; toast('Video oluşturulamadı — tekrar dene'); return; }
          var blob = new Blob(chunks, { type: outType }), u = URL.createObjectURL(blob), a = document.createElement('a');
          a.href = u; a.download = (r.baslik || 'storia-video').replace(/[^\w\sğüşiöçİĞÜŞÖÇ-]/g, '').slice(0, 50).trim() + '.' + ext;
          document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 2000);
          hideExport(); _exporting = false; toast('Video indirildi (' + ext.toUpperCase() + ')');
        };
        var start = performance.now();
        srcs.forEach(function (s) { try { s.start(); } catch (e) {} });
        try { rec.start(1000); } catch (e) { try { rec.start(); } catch (e2) {} } // saniyede bir parça; olmazsa tek parça
        (function frame() {
          var el = (performance.now() - start) / 1000;
          if (el >= total) { try { if (rec.state !== 'inactive') rec.stop(); } catch (e) {} return; }
          if (OUTRO && el >= sceneTotal) { drawOutro((el - sceneTotal) / OUTRO); }
          else { var k = Math.min(n - 1, Math.floor(el / per)), lt = (el - k * per) / per; drawFrame(k, lt); }
          if (vtrack && vtrack.requestFrame) { try { vtrack.requestFrame(); } catch (e) {} }
          showExport(el / total, 'Video oluşturuluyor · %' + Math.round(el / total * 100));
          requestAnimationFrame(frame);
        })();
      });
    }).catch(function () { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); hideExport(); _exporting = false; toast('Video oluşturulamadı — görsellere erişilemedi'); });
  }
  // ── Arka plan müziği ──────────────────────────────────────────────────
  function openMusicModal() { var m = document.getElementById('musicModal'); if (m) m.classList.add('show'); }
  function closeMusicModal() { var m = document.getElementById('musicModal'); if (m) m.classList.remove('show'); }
  function handleMusicFile(file) {
    if (!file) return;
    if (!/^audio\//.test(file.type) && !/\.(mp3|m4a|aac|ogg|wav|webm)$/i.test(file.name)) { toast('Lütfen bir ses dosyası seç'); return; }
    if (file.size > 25 * 1024 * 1024) { toast('Dosya çok büyük (en fazla 25 MB)'); return; }
    if (S.bgMusic && S.bgMusic.indexOf('blob:') === 0) { try { URL.revokeObjectURL(S.bgMusic); } catch (e) {} }
    S.bgMusic = URL.createObjectURL(file); S.bgMusicName = file.name.replace(/\.[^.]+$/, '').slice(0, 40);
    closeMusicModal(); refreshTab(); toast('Müzik eklendi · ' + S.bgMusicName);
  }

  function doCover(idx) {
    var r = S.result || {}; var k = (r.kapak || [])[idx]; if (!k) return;
    var full = k + ' — YouTube thumbnail, bold composition, high contrast, dramatic lighting, eye-catching, ' + styleObj().en;
    if (!REAL) { S.covers[idx] = demoImage(idx, '16:9'); persistMedia(); refreshTab(); toast('Demo kapak eklendi'); return; }
    if (!S.user) { openAuth(); return; }
    toast('Thumbnail üretiliyor…');
    callFn({ action: 'image', prompt: full, size: '16:9', imgIndex: idx }).then(function (d) {
      if (d && d.ok && d.url) { S.covers[idx] = d.url; if (typeof d.credits === 'number') S.credits = d.credits; persistMedia(); refreshTab(); chrome(); toast('Thumbnail üretildi'); }
      else toast((d && d.error) || 'Üretilemedi');
    }).catch(function () { toast('Bağlantı hatası'); });
  }
  // ── Karakter portreleri (tutarlılık referansı) ───────────────────────
  function doCharImage(idx) {
    var r = S.result || {}; var c = (r.karakterler || [])[idx]; if (!c) return;
    var look = (typeof c === 'string') ? c : (c.gorunum || c.tanim || c.isim || '');
    var full = look + ' — character portrait, upper body, natural pose, soft studio background, ' + styleObj().en;
    if (!REAL) { S.chars[idx] = demoImage(idx, '1:1'); refreshTab(); toast('Demo portre eklendi'); return; }
    if (!S.user) { openAuth(); return; }
    toast('Portre üretiliyor…');
    callFn({ action: 'image', prompt: full, size: '1:1', imgIndex: idx }).then(function (d) {
      if (d && d.ok && d.url) { S.chars[idx] = d.url; if (typeof d.credits === 'number') S.credits = d.credits; refreshTab(); chrome(); toast('Portre üretildi'); }
      else toast((d && d.error) || 'Üretilemedi');
    }).catch(function () { toast('Bağlantı hatası'); });
  }
  function genChars() { ((S.result || {}).karakterler || []).forEach(function (_, i) { if (!S.chars[i]) doCharImage(i); }); }
  // ── Ajanla konuş (sohbet + proaktif öneri) ───────────────────────────
  function chatSystem() {
    // Üretilmiş bir dosya varsa ajan DÜZENLEME modundadır; yoksa FİKİR modu.
    if (S.result && !S.result.gecersiz && S.step === 4) return chatReviseSystem();
    var ctx = '';
    if (S.idea) ctx += 'Kullanıcının şu anki fikri: "' + S.idea + '". ';
    if (S.result && S.result.baslik) ctx += 'Son ürettiği dosya: "' + S.result.baslik + '". ';
    return 'Sen STORIA\'nın içerik ajanısın — YouTube Shorts, TikTok, Reels, faceless kanallar ve UGC reklamlar için VİRAL kısa video içerikleri üreten uzman, samimi bir yardımcı. Türkçe, net ve enerjik konuş. Kısa yaz (2-4 cümle). Her cevapta SOMUT bir sonraki adım ya da fikir ver; asla "yapamam" deyip bırakma. Bir video KONUSU önerdiğinde mesajının EN SON satırına ayrı olarak şu formatta yaz: KONU: <tek cümle konu>. ' + (ctx ? 'Bağlam: ' + ctx : '') + ' Not: kullanıcı bir fikir seçip Studio\'da senaryo+seslendirme+görsel+altyazı üretebiliyor.';
  }
  // Ajanın düzenleyeceği güncel dosyanın kompakt ama tam JSON özeti.
  function resultDigest() {
    var r = S.result || {};
    return JSON.stringify({
      baslik: r.baslik, logline: r.logline, karakterler: r.karakterler,
      senaryo: r.senaryo, seslendirme_notu: r.seslendirme_notu,
      youtube: r.youtube, instagram: r.instagram, kapak: r.kapak,
      gorsel_promptlar: r.gorsel_promptlar, video_promptlar: r.video_promptlar
    });
  }
  function chatReviseSystem() {
    return 'Sen STORIA\'nın içerik ajanısın. Kullanıcı ZATEN ÜRETİLMİŞ bir video dosyasını konuşarak düzenlemek istiyor. Samimi, net ve Türkçe konuş.\n\n' +
      'MEVCUT DOSYA (JSON):\n' + resultDigest() + '\n\n' +
      'Kullanıcının isteğine göre bu dosyayı düzenle. KURALLAR:\n' +
      '1) Önce TEK cümlelik, samimi bir Türkçe özet yaz (ne değiştirdiğini söyle).\n' +
      '2) Sonra AYRI bir satırda TAM güncellenmiş dosyayı şu blokta ver:\n```json\n{ ...aynı şema, aynı anahtarlar... }\n```\n' +
      '3) YALNIZCA istenen değişikliği yap; dokunulmayan alanları AYNEN koru (metni yeniden yazma).\n' +
      '4) senaryo, gorsel_promptlar ve video_promptlar HER ZAMAN aynı sayıda ve indeks-hizalı kalsın. Sahne ekl/çıkarırsan üçünü de birlikte güncelle.\n' +
      '5) Bir sahnenin metnini değiştirirsen o sahnenin gorsel_promptlar ve video_promptlar öğesini de uyumlu güncelle.\n' +
      '6) Kullanıcı yalnızca soru soruyorsa ya da değişiklik istemiyorsa JSON bloğu EKLEME; sadece kısa cevap ver.\n' +
      '7) JSON geçerli olsun (tek blok, başka JSON yok).';
  }
  function renderChat() {
    var log = document.getElementById('chatLog'); if (!log) return;
    log.innerHTML = S.chat.msgs.map(function (m) {
      if (m.r === 'u') return '<div class="cm cm-u">' + esc(m.t) + '</div>';
      var body = m.t, topic = '';
      var mm = /KONU:\s*(.+)\s*$/i.exec(m.t);
      if (mm) { topic = mm[1].trim().replace(/^["'\s]+|["'\s]+$/g, ''); body = m.t.replace(/KONU:\s*.+\s*$/i, '').trim(); }
      return '<div class="cm cm-a">' + esc(body).replace(/\n/g, '<br>') + (topic ? '<button class="btn btn-gold btn-sm cm-use" data-cact="use" data-v="' + esc(topic) + '">▶ Bu fikirle üret</button>' : '') + '</div>';
    }).join('') + (S.chat.busy ? '<div class="cm cm-a cm-typing"><span></span><span></span><span></span></div>' : '');
    log.scrollTop = log.scrollHeight;
  }
  function openChat() {
    S.chat.open = true;
    var reviseMode = !!(S.result && !S.result.gecersiz && S.step === 4);
    if (reviseMode && !S.chat._revised) {
      S.chat._revised = true;
      S.chat.msgs.push({ r: 'a', t: 'Bu dosyayı birlikte düzenleyelim ✎ Ne değiştireyim? Örn: "hook\'u güçlendir", "2. sahneyi kısalt", "daha esprili yap", "bir sahne ekle", "başlığı daha merak uyandır". Yaz, ben yeniden yazıp uygulayayım.' });
    } else if (!S.chat.msgs.length) {
      S.chat.msgs.push({ r: 'a', t: 'Merhaba! Ben STORIA ajanın. 🎬 Ne üretmek istersin? Bir konu söyle, ya da "sürpriz yap" yaz — senin için viral bir fikir bulup senaryoya götüreyim. İstersen nişini söyle (kahve dükkânı, fitness, teknoloji, oyun…), sana özel fikirler çıkarayım.' });
    }
    var p = document.getElementById('chatPanel'), s = document.getElementById('chatScrim');
    if (p) p.classList.add('open'); if (s) s.classList.add('show');
    renderChat();
    setTimeout(function () { var i = document.getElementById('chatInput2'); if (i) i.focus(); }, 120);
  }
  function closeChat() { S.chat.open = false; var p = document.getElementById('chatPanel'), s = document.getElementById('chatScrim'); if (p) p.classList.remove('open'); if (s) s.classList.remove('show'); }
  function sendChat(text) {
    text = (text || '').trim(); if (!text || S.chat.busy) return;
    S.chat.msgs.push({ r: 'u', t: text }); S.chat.busy = true; renderChat();
    var convo = S.chat.msgs.map(function (m) { return (m.r === 'u' ? 'Kullanıcı' : 'Ajan') + ': ' + m.t; }).join('\n');
    var prompt = chatSystem() + '\n\nKonuşma:\n' + convo + '\n\nAjan:';
    var reviseMode = !!(S.result && !S.result.gecersiz && S.step === 4);
    if (!REAL) {
      setTimeout(function () {
        if (reviseMode) { demoRevise(text); S.chat.busy = false; renderChat(); }
        else { S.chat.msgs.push({ r: 'a', t: '(Demo) Harika! Örneğin şu çok tutar: sıradan bir günü sinematik bir hikâyeye çeviren bir video.\nKONU: Sıradan bir sabahı sinematik bir hikâyeye dönüştür' }); S.chat.busy = false; renderChat(); }
      }, 700);
      return;
    }
    callFn({ action: '', prompt: prompt, max_tokens: reviseMode ? 12000 : 1200 }).then(function (d) {
      var t = (d && (d.text || d.result)) ? String(d.text || d.result).trim() : 'Bir sorun oldu, tekrar dener misin?';
      var applied = reviseMode ? tryApplyRevision(t) : { ok: false, body: t };
      S.chat.msgs.push({ r: 'a', t: applied.body }); S.chat.busy = false; renderChat();
      if (applied.ok) { toast('Değişiklik uygulandı ✦'); if (S.view === 'new' && S.step === 4) render(); if (S.chat.open) { setTimeout(function () { var p = document.getElementById('chatPanel'), s = document.getElementById('chatScrim'); if (p) p.classList.add('open'); if (s) s.classList.add('show'); renderChat(); }, 0); } }
    }).catch(function () { S.chat.msgs.push({ r: 'a', t: 'Bağlantı hatası — tekrar dene.' }); S.chat.busy = false; renderChat(); });
  }
  // Ajanın cevabındaki ```json bloğunu bul, dosyaya uygula. Değişiklik yoksa metni aynen döndür.
  function tryApplyRevision(text) {
    if (!S.result) return { ok: false, body: text };
    var m = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
    var jsonStr = m ? m[1] : null;
    if (!jsonStr) { var b = text.indexOf('{'), e = text.lastIndexOf('}'); if (b >= 0 && e > b) jsonStr = text.slice(b, e + 1); }
    if (!jsonStr) return { ok: false, body: text };
    var obj; try { obj = JSON.parse(jsonStr); } catch (_e) { return { ok: false, body: text }; }
    if (!obj || typeof obj !== 'object' || (!obj.senaryo && !obj.baslik && !obj.youtube && !obj.instagram)) return { ok: false, body: text };
    applyRevision(obj);
    var body = m ? text.replace(m[0], '').trim() : (text.indexOf('{') > 0 ? text.slice(0, text.indexOf('{')).trim() : '');
    if (!body) body = 'Güncelledim ✦';
    return { ok: true, body: body };
  }
  // Yeni JSON'u mevcut sonuca birleştir; değişen sahnelerin görsel/videosunu düşür (yeniden üretilsin), metin değiştiyse seslendirmeyi temizle.
  function applyRevision(obj) {
    var old = S.result || {};
    var oldG = old.gorsel_promptlar || [], oldS = old.senaryo || [];
    var merged = {}; var k;
    for (k in old) merged[k] = old[k];
    for (k in obj) merged[k] = obj[k];
    var newG = merged.gorsel_promptlar || [], newS = merged.senaryo || [];
    var n = Math.max(newS.length, newG.length);
    var keepImgs = {}, keepVids = {}, narrChanged = false;
    for (var i = 0; i < n; i++) {
      var sameVisual = oldG[i] != null && newG[i] != null && oldG[i] === newG[i];
      if (S.images[i] && sameVisual) keepImgs[i] = S.images[i];
      if (S.videos[i] && sameVisual) keepVids[i] = S.videos[i];
      var oa = oldS[i] && oldS[i].anlatim, na = newS[i] && newS[i].anlatim;
      if (oa !== na) narrChanged = true;
    }
    S.result = merged; S.images = keepImgs; S.videos = keepVids;
    if (narrChanged) S.audio = null;
    if (S._cur) { S._cur.result = merged; }
    S.tab = S.tab || 'senaryo';
    persistMedia();
  }
  // Demo modda basit yerel düzenlemeler (backend yokken sohbet düzenlemeyi göstermek için).
  function demoRevise(instr) {
    var r = S.result || {}; var low = instr.toLowerCase(); var did = '';
    if (/başl(ık|ığ)|title/.test(low)) { r.baslik = (r.baslik || 'Başlık') + ' — yeni sürüm'; did = 'Başlığı güncelledim.'; }
    else if (/hook|kanca|giriş/.test(low) && r.senaryo && r.senaryo[0]) { r.senaryo[0].anlatim = '(Güçlendirilmiş kanca) ' + (r.senaryo[0].anlatim || ''); did = 'Girişi daha çarpıcı yaptım.'; }
    else if (/kısalt|kısa/.test(low) && r.senaryo) { r.senaryo.forEach(function (s) { if (s.anlatim) s.anlatim = s.anlatim.split(' ').slice(0, 12).join(' '); }); did = 'Sahneleri kısalttım.'; }
    else { did = '(Demo) Gerçek modda bu düzenlemeyi tam yaparım — şimdilik örnek bir değişiklik uyguladım.'; if (r.baslik) r.baslik = r.baslik + ' ✎'; }
    S.result = r; if (S._cur) S._cur.result = r; persistMedia();
    S.chat.msgs.push({ r: 'a', t: did });
    if (S.view === 'new' && S.step === 4) render();
    if (S.chat.open) { setTimeout(function () { var p = document.getElementById('chatPanel'), s = document.getElementById('chatScrim'); if (p) p.classList.add('open'); if (s) s.classList.add('show'); renderChat(); }, 0); }
    toast('Değişiklik uygulandı ✦');
  }
  function applyChatIdea(topic) { if (!topic) return; S.idea = topic; S.view = 'new'; S.step = 2; closeChat(); render(); toast('Fikir yüklendi — tarzını seç ve üret'); }
  // ── Ek sahne ─────────────────────────────────────────────────────────
  function openSceneModal() { var m = document.getElementById('sceneModal'); if (m) { m.classList.add('show'); setTimeout(function () { var t = document.getElementById('sceneText'); if (t) { t.value = ''; t.focus(); } }, 100); } }
  function closeSceneModal() { var m = document.getElementById('sceneModal'); if (m) m.classList.remove('show'); }
  function addScene() {
    var t = document.getElementById('sceneText'); var brief = t ? t.value.trim() : '';
    if (!brief) { toast('Önce sahneyi kısaca yaz'); return; }
    var r = S.result || {}; if (!r.senaryo) r.senaryo = [];
    var st = styleObj(), no = r.senaryo.length + 1;
    var btn = document.getElementById('sceneAdd'); if (btn) { btn.disabled = true; btn.textContent = 'Ekleniyor…'; }
    function append(baslik, anlatim, gorsel) {
      r.senaryo.push({ baslik: baslik, anlatim: anlatim, gorsel: gorsel });
      if (!r.gorsel_promptlar) r.gorsel_promptlar = [];
      r.gorsel_promptlar.push(gorsel + ', ' + st.en);
      saveHist(); closeSceneModal(); if (btn) { btn.disabled = false; btn.textContent = 'Sahneyi ekle'; }
      S.tab = 'senaryo'; refreshTab(); toast('Ek sahne eklendi · Sahne ' + no);
    }
    if (!REAL) { setTimeout(function () { append('Sahne ' + no, brief, brief); }, 500); return; }
    var lang = S.lang === 'en' ? 'English' : 'Türkçe';
    var p = 'A video scene brief: "' + brief + '". Return ONLY valid JSON (in ' + lang + '): {"baslik":"short scene title","anlatim":"one short narration sentence","gorsel":"rich English image prompt: subject, composition, lighting, atmosphere"}. No text/watermark in the image.';
    callFn({ action: '', prompt: p }).then(function (d) {
      var o = null; try { o = JSON.parse((d && (d.text || d.result) || '').replace(/^[^{]*/, '').replace(/[^}]*$/, '')); } catch (e) {}
      if (o && o.gorsel) append(o.baslik || ('Sahne ' + no), o.anlatim || brief, o.gorsel);
      else append('Sahne ' + no, brief, brief);
    }).catch(function () { append('Sahne ' + no, brief, brief); });
  }
  // ── Video (Grok image→video) ──────────────────────────────────────────
  function doVideo(idx) {
    var img = S.images[idx];
    if (!img) { toast('Önce sahne görselini üret'); return; }
    var r = S.result || {};
    var motion = (r.video_promptlar && r.video_promptlar[idx]) || (((r.gorsel_promptlar && r.gorsel_promptlar[idx]) || 'cinematic scene') + ', slow cinematic push-in with subtle parallax, smooth camera move, natural motion');
    if (!REAL) { toast('Video gerçek modda (Grok) üretilir'); return; }
    if (!S.user) { openAuth(); return; }
    S.videoJobs[idx] = { state: 'submit' }; refreshTab();
    callFn({ action: 'video', image: img, prompt: motion, size: S.aspect, vsec: 5, vprovider: S.vengine }).then(function (d) {
      if (!d || !d.ok || !d.videoJob) { delete S.videoJobs[idx]; refreshTab(); toast((d && d.error) || 'Video başlatılamadı'); return; }
      if (typeof d.credits === 'number') S.credits = d.credits; chrome();
      S.videoJobs[idx] = { state: 'render', job: d.videoJob }; refreshTab();
      pollVideoJob(idx, d.videoJob, 0);
    }).catch(function () { delete S.videoJobs[idx]; refreshTab(); toast('Bağlantı hatası'); });
  }
  function pollVideoJob(idx, job, tries) {
    if (tries > 60) { delete S.videoJobs[idx]; refreshTab(); toast('Video zaman aşımı — tekrar dene'); return; }
    setTimeout(function () {
      callFn({ action: 'video_status', videoJob: job }).then(function (d) {
        if (d && d.ok && d.done && d.url) { S.videos[idx] = d.url; delete S.videoJobs[idx]; persistMedia(); refreshTab(); toast('Video hazır ✦'); }
        else if (d && d.ok && !d.done) { pollVideoJob(idx, job, tries + 1); }
        else { delete S.videoJobs[idx]; refreshTab(); toast((d && d.error) || 'Video üretilemedi'); }
      }).catch(function () { pollVideoJob(idx, job, tries + 1); });
    }, 5000);
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
    if (!REAL) { if (studio) S.imgOut = demoImage(0, size); else { S.images[_editIdx] = demoImage(_editIdx, size); persistMedia(); } if (studio) render(); else refreshTab(); toast('Düzenlendi (demo): ' + instr.slice(0, 36)); return; }
    if (!S.user) { openAuth(); return; }
    toast('Görsel düzenleniyor…');
    toDataUri(src).then(function (du) {
      return callFn({ action: 'edit', image: du, prompt: instr, size: size });
    }).then(function (d) {
      if (d && d.ok && d.url) { if (studio) S.imgOut = d.url; else { S.images[_editIdx] = d.url; persistMedia(); } if (typeof d.credits === 'number') S.credits = d.credits; if (studio) render(); else refreshTab(); chrome(); toast('Görsel düzenlendi'); }
      else toast((d && d.error) || 'Görsel düzenlenemedi');
    }).catch(function () { toast('Bağlantı hatası'); });
  }
  function genAll() {
    var r = S.result || {}; var prompts = r.gorsel_promptlar || [];
    if (!prompts.length) return;
    var idxs = []; for (var k = 0; k < prompts.length; k++) if (!S.images[k]) idxs.push(k);
    if (!idxs.length) { toast('Zaten hepsi üretildi'); return; }
    if (!REAL) { idxs.forEach(function (i) { S.images[i] = demoImage(i, S.aspect); }); persistMedia(); refreshTab(); toast(idxs.length + ' görsel üretildi (demo)'); return; }
    if (!S.user) { openAuth(); return; }
    toast(idxs.length + ' görsel sırayla üretiliyor…');
    var n = 0;
    (function next() {
      if (n >= idxs.length) { toast('Tüm görseller hazır'); return; }
      var idx = idxs[n++]; var full = prompts[idx] + ' — ' + styleObj().en;
      callFn({ action: 'image', prompt: full, size: S.aspect, imgIndex: idx }).then(function (d) {
        if (d && d.ok && d.url) { S.images[idx] = d.url; if (typeof d.credits === 'number') S.credits = d.credits; persistMedia(); refreshTab(); chrome(); }
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
    if (!S.imgPrompt.trim()) { toast(S.imgMode === 'avatar' ? 'Önce karakteri/avatarı tarif et' : 'Önce bir görsel tarifi yaz'); return; }
    var full = (S.imgMode === 'avatar' ? S.imgPrompt + ' — character portrait, upper body, looking at camera, clean studio background, ' : S.imgPrompt + ' — ') + styleObj(S.imgStyle).en;
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
  var _engMsg = '', _engOk = false;
  function engText(d) {
    if (!d) return '';
    if (typeof d.engine === 'undefined') return '⚠ Backend eski sürüm — güncel storia-generate dosyasını Supabase\'e deploy et';
    if (d.engine === 'eleven') return '🎙️ ElevenLabs aktif — sesler gerçek';
    return '⚠ OpenAI sesine düşüldü · ElevenLabs: ' + (d.elevenErr || 'bilinmeyen sebep');
  }
  function setEngineStatus(d) {
    _engMsg = engText(d); _engOk = !!(d && d.engine === 'eleven');
    var el = document.getElementById('veng');
    if (el) { el.textContent = _engMsg; el.style.display = _engMsg ? '' : 'none'; el.className = 'veng ' + (_engOk ? 'ok' : 'warn'); }
  }
  function vengHtml() { return '<div class="veng ' + (_engOk ? 'ok' : 'warn') + '" id="veng"' + (_engMsg ? '' : ' style="display:none"') + '>' + esc(_engMsg) + '</div>'; }
  var _prevAudio = null, _prevToken = 0;
  function stopPreview() {
    if (_prevAudio) { try { _prevAudio.pause(); _prevAudio.currentTime = 0; } catch (e) {} _prevAudio = null; }
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
  }
  function previewVoice(i) {
    stopPreview();                       // önceki önizlemeyi hemen durdur (üst üste binmesin)
    var tok = ++_prevToken;              // sadece EN SON tık çalsın
    var v = VOICES[i]; var sample = S.lang === 'en' ? 'Storia brings your story to life. This voice could be your narrator.' : 'Storia ile hikâyen hayat buluyor. Bu ses senin anlatıcın olabilir.';
    if (!REAL) { if (!speak(sample, S.ttsRate)) toast('Tarayıcı seslendirmeyi desteklemiyor'); else toast('Önizleme · ' + v.name); return; }
    toast('Önizleme · ' + v.name + '…');
    callFn({ action: 'tts', preview: true, engine: 'eleven', voiceId: v.ev, voice: v.ov }).then(function (d) {
      if (tok !== _prevToken) return;    // daha yeni bir önizleme istendi → bunu çalma
      setEngineStatus(d);
      if (d && d.ok && d.url) { try { _prevAudio = new Audio(d.url); _prevAudio.play(); } catch (e) {} } else toast('Önizleme alınamadı');
    }).catch(function () { if (tok === _prevToken) toast('Bağlantı hatası'); });
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
    callFn({ action: 'tts', text: text, engine: 'eleven', voiceId: VOICES[S.voiceIdx].ev, voice: VOICES[S.voiceIdx].ov, speed: S.ttsRate }).then(function (d) {
      if (d && d.ok && d.url) { S.audio = d.url; if (typeof d.credits === 'number') S.credits = d.credits; persistMedia(); setEngineStatus(d); if (slot) slot.innerHTML = '<audio controls src="' + esc(d.url) + '"></audio>'; chrome(); ttsToast(d); }
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
      baslik: topic.replace(/\?$/, '') + ' — The Truth You Didn’t Know', logline: topic + ' In this video we answer it step by step.', karakterler: [{ isim: 'The Narrator', gorunum: 'a calm storyteller in their 30s, warm eyes, simple dark outfit, soft rim light' }, { isim: 'The Explorer', gorunum: 'a curious young adventurer, weathered jacket, backpack, determined expression' }], senaryo: senaryo,
      seslendirme_notu: 'Read in a ' + toneName().toLowerCase() + ' tone at a natural pace.',
      youtube: { baslik: topic.replace(/\?$/, '') + ' | Storia', aciklama: 'In this video we answer "' + topic.toLowerCase() + '" step by step. Like and subscribe!\n\n00:00 Intro\n00:30 First clue\n02:00 Going deeper', etiketler: ['storia', 'documentary', 'curiosity', topic.split(' ')[0].toLowerCase(), 'facts'] },
      instagram: { aciklama: topic + ' 👀 Answer in the video. Save it for later!', hashtagler: ['storia', 'explore', 'facts', 'curiosity', 'reels'] },
      kapak: ['Big question mark + striking visual, warm light', 'Close-up detail + bold title text'],
      gorsel_promptlar: prompts, video_promptlar: prompts.map(function (p) { return p + ', slow cinematic push-in with subtle parallax, smooth camera move, natural motion'; }),
      uretim_notu: 'Put the strongest visual in the first 5 seconds; sync transitions to the music. (This is a DEMO output.)'
    };
    return {
      baslik: topic.replace(/\?$/, '') + ' — Bilmediğin Gerçek',
      logline: topic + ' Bu videoda merakını gidereceğiz.', karakterler: [{ isim: 'Anlatıcı', gorunum: '30’lu yaşlarda sakin bir hikâye anlatıcısı, sıcak bakışlar, sade koyu kıyafet, yumuşak kenar ışığı' }, { isim: 'Kâşif', gorunum: 'meraklı genç bir maceracı, yıpranmış ceket, sırt çantası, kararlı ifade' }], senaryo: senaryo,
      seslendirme_notu: toneName() + ' bir tonda, doğal tempoda oku.',
      youtube: { baslik: topic.replace(/\?$/, '') + ' | Storia', aciklama: 'Bu videoda ' + topic.toLowerCase() + ' sorusunu adım adım cevaplıyoruz. Beğenmeyi ve abone olmayı unutma!\n\n00:00 Giriş\n00:30 İlk ipucu\n02:00 Derinleşme', etiketler: ['storia', 'belgesel', 'merak', topic.split(' ')[0].toLowerCase(), 'bilgi'] },
      instagram: { aciklama: topic + ' 👀 Cevabı videoda. Kaydet, sonra izle!', hashtagler: ['storia', 'kesfet', 'bilgi', 'merak', 'reels'] },
      kapak: ['Büyük soru işareti + çarpıcı görsel, sıcak ışık', 'Yakın plan detay + kalın başlık metni'],
      gorsel_promptlar: prompts, video_promptlar: prompts.map(function (p) { return p + ', slow cinematic push-in with subtle parallax, smooth camera move, natural motion'; }),
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
    var tbc = document.getElementById('tbContext');
    if (tbc) tbc.addEventListener('click', function (e) {
      var el = e.target.closest('[data-act="goStep"]'); if (!el) return;
      var gn = parseInt(el.getAttribute('data-v'), 10);
      if ((gn === 4 && !S.result) || gn === 3) return;
      S.step = gn; render();
    });
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
    // background music modal
    var musicModal = document.getElementById('musicModal');
    if (musicModal) {
      musicModal.addEventListener('click', function (e) { if (e.target === musicModal) closeMusicModal(); });
      document.getElementById('musicCancel').addEventListener('click', closeMusicModal);
      var mFile = document.getElementById('musicFile');
      document.getElementById('musicUploadBtn').addEventListener('click', function () { mFile.click(); });
      mFile.addEventListener('change', function () { handleMusicFile(mFile.files && mFile.files[0]); mFile.value = ''; });
    }
    // ek sahne modal
    var sceneModal = document.getElementById('sceneModal');
    if (sceneModal) {
      sceneModal.addEventListener('click', function (e) { if (e.target === sceneModal) closeSceneModal(); });
      document.getElementById('sceneAdd').addEventListener('click', addScene);
      document.getElementById('sceneCancel').addEventListener('click', closeSceneModal);
    }
    // marka kiti modal
    var brandModal = document.getElementById('brandModal');
    if (brandModal) {
      brandModal.addEventListener('click', function (e) { if (e.target === brandModal) closeBrandModal(); });
      document.getElementById('brSave').addEventListener('click', saveBrandForm);
      document.getElementById('brCancel').addEventListener('click', closeBrandModal);
      document.getElementById('brLogoClear').addEventListener('click', clearBrandLogo);
      var brFile = document.getElementById('brLogoFile');
      document.getElementById('brLogoBtn').addEventListener('click', function () { brFile.click(); });
      brFile.addEventListener('change', function () { handleBrandLogo(brFile.files && brFile.files[0]); brFile.value = ''; });
    }
    // chat (Ajanla konuş)
    var chatFab = document.getElementById('chatFab');
    if (chatFab) {
      chatFab.addEventListener('click', openChat);
      document.getElementById('chatScrim').addEventListener('click', closeChat);
      var cin = document.getElementById('chatInput2');
      cin.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(cin.value); cin.value = ''; cin.style.height = 'auto'; } });
      cin.addEventListener('input', function () { cin.style.height = 'auto'; cin.style.height = Math.min(120, cin.scrollHeight) + 'px'; });
      document.getElementById('chatPanel').addEventListener('click', function (e) {
        var el = e.target.closest('[data-cact]'); if (!el) return;
        var a = el.getAttribute('data-cact'), v = el.getAttribute('data-v');
        if (a === 'close') closeChat();
        else if (a === 'send') { sendChat(cin.value); cin.value = ''; cin.style.height = 'auto'; }
        else if (a === 'quick') sendChat(v);
        else if (a === 'use') applyChatIdea(v);
      });
    }
    // onboarding tour
    document.getElementById('tourNext').addEventListener('click', tourNext);
    document.getElementById('tourSkip').addEventListener('click', closeTour);
    // plan / upgrade
    var upBtn = document.querySelector('#planCard [data-act="upgrade"]');
    if (upBtn) upBtn.addEventListener('click', openPlanModal);
    var planModal = document.getElementById('planModal');
    document.getElementById('planClose').addEventListener('click', closePlan);
    planModal.addEventListener('click', function (e) {
      if (e.target === planModal) { closePlan(); return; }
      var c = e.target.closest('[data-act]'); if (!c) return;
      var a = c.getAttribute('data-act'), v = c.getAttribute('data-v');
      if (a === 'checkout') openCheckout(v);
      else if (a === 'copyIban') { copy(String(v).replace(/\s+/g, '')); toast('IBAN kopyalandı'); }
      else if (a === 'backPlans') renderPlanCards();
    });
    // global keyboard
    document.addEventListener('keydown', function (e) {
      if (lbOpen()) { if (e.key === 'ArrowLeft') { e.preventDefault(); lbNav(-1); return; } if (e.key === 'ArrowRight') { e.preventDefault(); lbNav(1); return; } if (e.key === 'Escape') { closeLb(); return; } }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCmd(); return; }
      if (e.key === 'Escape') { closeCmd(); closeAuth(); closeEdit(); closeTour(); closePlan(); closeAcct(); closeMusicModal(); closeSceneModal(); if (S.chat.open) closeChat(); return; }
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
    if (url) { window.open(url, '_blank', 'noopener'); closePlan(); return; }
    showIban(id);   // ödeme linki yoksa Havale/EFT (IBAN) akışı
  }
  function showIban(id) {
    var pl = PLANS.filter(function (p) { return p.id === id; })[0]; if (!pl) return;
    var iban = CFG.iban || '', name = CFG.ibanName || '', mail = CFG.contactEmail || '';
    var uMail = (S.user && S.user.email) || '';
    var subj = encodeURIComponent('STORIA ' + pl.name + ' — ödeme dekontu');
    var bodym = encodeURIComponent('Merhaba, ' + pl.name + ' planı (' + pl.price + '/ay) için ödemeyi yaptım. Hesap e-postam: ' + (uMail || '...') + '. Dekont ektedir.');
    document.getElementById('planCards').innerHTML =
      '<div class="iban-pay">' +
        '<div class="ib-head"><b>' + esc(pl.name) + '</b> · ' + esc(pl.price) + '/ay · ' + esc(pl.cr) + ' kredi</div>' +
        '<p class="ib-note">Havale/EFT ile öde — kredin elle yüklenir. (Kartla ödeme yakında.)</p>' +
        '<div class="ib-box">' +
          '<div class="ib-row"><span class="ib-lbl">IBAN</span><span class="ib-val mono">' + esc(iban) + '</span><button class="btn btn-quiet btn-sm" data-act="copyIban" data-v="' + esc(iban) + '">Kopyala</button></div>' +
          '<div class="ib-row"><span class="ib-lbl">Alıcı</span><span class="ib-val">' + esc(name) + '</span></div>' +
          '<div class="ib-row"><span class="ib-lbl">Tutar</span><span class="ib-val">' + esc(pl.price) + '</span></div>' +
          '<div class="ib-row"><span class="ib-lbl">Açıklama</span><span class="ib-val">' + esc(uMail || 'kayıtlı e-postan') + '</span></div>' +
        '</div>' +
        '<p class="ib-help">Açıklamaya <b>' + esc(uMail || 'e-postanı') + '</b> yaz. Ödeme sonrası dekontu ilet; kredin <b>24 saat içinde</b> yüklenir.</p>' +
        '<div class="ib-acts">' +
          (mail ? '<a class="btn btn-gold btn-sm" href="mailto:' + esc(mail) + '?subject=' + subj + '&body=' + bodym + '">Dekont ilet</a>' : '') +
          '<button class="btn btn-quiet btn-sm" data-act="backPlans">← Planlar</button>' +
        '</div>' +
      '</div>';
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
      if (S.user) { if (sb) sb.auth.signOut(); S.user = null; S.credits = REAL ? null : 500; loadHist(); chrome(); closeAcct(); toast('Çıkış yapıldı'); render(); }
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
      if (res.data && res.data.user) { S.user = res.data.user; loadHist(); closeAuth(); toast('Hoş geldin'); loadCredits(); chrome(); render(); }
      else toast('E-postanı kontrol et');
    }).catch(function () { btn.disabled = false; toast('Bağlantı hatası'); });
  }
  function loadCredits() { if (!S.user || !sb) return; sb.from('profiles').select('credits,tier,monthly_quota').eq('id', S.user.id).single().then(function (res) { if (res && res.data) { if (typeof res.data.credits === 'number') S.credits = res.data.credits; if (res.data.monthly_quota) S.creditMax = Math.max(res.data.monthly_quota, res.data.credits || 0) || 500; chrome(); } }, function () {}); }

  // ── Boot ─────────────────────────────────────────────────────────────
  function boot() {
    loadHist(); loadBrand(); setupChrome(); render();
    try { if (!localStorage.getItem('storia_tour')) setTimeout(openTour, 600); } catch (e) {}
    if (REAL) {
      loadSupabase().then(function () { sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey); return sb.auth.getSession(); })
        .then(function (res) { var s = res && res.data && res.data.session; if (s && s.user) { S.user = s.user; loadHist(); loadBrand(); loadCredits(); if (S.view === 'history' || S.view === 'library') render(); } chrome(); })
        .catch(function () { toast('Sunucuya bağlanılamadı'); });
    }
  }
  function loadSupabase() { return new Promise(function (resolve, reject) { if (window.supabase) return resolve(); var s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; s.onload = resolve; s.onerror = reject; document.head.appendChild(s); }); }

  boot();
})();

/* Tarih Ajanı — Ana sayfa "Studio Canlı Demo" bölümü.
   #studio-demo-mount içine kendi kendine yerleşir (dc bağımsız).
   Sol panel: konu seç → STUDIO'YU DENE → çıktılar + üretilenler.
   Sağ sahne: GÖRSEL OLUŞTUR → hazır sinematik sahne. */
(function () {
  if (window.__sdInit) return;

  var PRESETS = [
    {
      ad: 'İstanbul’un Fethi', alt: '1453',
      img: '/assets/haber/istanbul-fethi.jpg',
      senaryo: 'Şafak. Elli üç gündür dövülen surlarda ilk gedik; kamera dev topun namlusundan sancaklara kayıyor.',
      ses: 'Derin erkek anlatım · gerilim vurgusu · ~14 sn',
      prompt: 'Cinematic dawn, breached Theodosian walls, banners through smoke, 35mm --ar 16:9',
      cap: 'İstanbul’un Fethi · surların yarıldığı an'
    },
    {
      ad: 'Vezüv Patladı', alt: 'MS 79',
      img: '/assets/haber/vezuv-pompeii.jpg',
      senaryo: 'Öğle sonrası gökyüzü ikiye yarılıyor; otuz kilometrelik kül sütunu Pompeii’nin üstüne çöküyor.',
      ses: 'Tedirgin anlatım · uzak gök gürültüsü · ~13 sn',
      prompt: 'Vesuvius erupting, 30km ash column over golden Pompeii, cinematic, 35mm --ar 16:9',
      cap: 'Vezüv patladı · Pompeii’nin son öğleni'
    },
    {
      ad: 'Sezar Suikastı', alt: 'MÖ 44',
      img: '/assets/haber/sezar-suikasti.jpg',
      senaryo: 'Senato salonu. Togayı kavrayan el, parlayan ilk hançer; kamera Sezar’ın şaşkın bakışında donuyor.',
      ses: 'Fısıltıdan yükselen gerilim · mermer yankısı · ~12 sn',
      prompt: 'Roman senate marble hall, togas closing in, daggers glinting, chiaroscuro, 35mm --ar 16:9',
      cap: 'Sezar senatoda · 23 hançer'
    }
  ];
  var EXTRA = ['Kapak görseli', 'Başlık & açıklama', '#etiketler', '6 sahne promptu', 'Yayın paketi'];

  var CSS = ''
    + '#studio-demo{position:relative;background:#06070d;border-top:1px solid rgba(193,154,82,.15);border-bottom:1px solid rgba(193,154,82,.15);overflow:hidden}'
    + '#studio-demo .sd-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle 620px at 84% 4%,rgba(230,196,120,.12),transparent 60%),radial-gradient(circle 520px at 6% 98%,rgba(158,43,35,.10),transparent 58%)}'
    + '#studio-demo .sd-wrap{position:relative;width:min(1620px,95vw);margin:0 auto;padding:clamp(40px,4.4vw,64px) clamp(20px,3.5vw,52px)}'
    // hafif üst başlık (sola yaslı)
    + '#studio-demo .sd-top{margin:0 0 clamp(22px,2.6vw,34px)}'
    + '#studio-demo .sd-live{display:inline-flex;align-items:center;gap:8px;color:#e08a80;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.24em;margin-bottom:11px}'
    + '#studio-demo .sd-live .d{width:9px;height:9px;border-radius:50%;background:#e11d1d;box-shadow:0 0 0 0 rgba(225,29,29,.6);animation:sd-pulse 1.4s ease-out infinite}'
    + '@keyframes sd-pulse{0%{box-shadow:0 0 0 0 rgba(225,29,29,.55)}70%{box-shadow:0 0 0 9px rgba(225,29,29,0)}100%{box-shadow:0 0 0 0 rgba(225,29,29,0)}}'
    + '#studio-demo h2{margin:0 0 8px;font-family:\'Playfair Display\',serif;font-size:clamp(28px,3.4vw,44px);font-weight:800;line-height:1.03;letter-spacing:-.01em;color:#f6efe0}'
    + '#studio-demo h2 .g{background:linear-gradient(102deg,#b18742,#e6c478 42%,#fff0b1 52%,#d6ad5b 64%,#a5762f);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '#studio-demo .sd-sub{margin:0;color:#a7adba;font-size:clamp(13.5px,1vw,15.5px);line-height:1.6;max-width:66ch}'
    // butonlar
    + '#studio-demo .sd-btn{cursor:pointer;border:0;display:inline-flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:13px;letter-spacing:.14em;padding:16px 30px;transition:transform .18s,box-shadow .18s}'
    + '#studio-demo .sd-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(230,196,120,.35)}'
    + '#studio-demo .sd-btn.hero{padding:19px 40px;font-size:14.5px;letter-spacing:.16em;box-shadow:0 16px 50px -16px rgba(230,196,120,.5)}'
    + '#studio-demo .sd-btn.ghost{background:transparent;border:1px solid rgba(193,154,82,.5);color:#e6c478}'
    + '#studio-demo .sd-btn.ghost:hover{background:rgba(193,154,82,.12);box-shadow:none}'
    // iki sütun: sol panel + sağ sahne
    + '#studio-demo .sd-work{display:grid;grid-template-columns:.72fr 1.28fr;gap:clamp(26px,3vw,52px);align-items:stretch}'
    + '#studio-demo .sd-panel{display:flex;flex-direction:column;justify-content:center}'
    // step A sol
    + '#studio-demo .sd-step{color:#818797;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.2em;margin-bottom:14px}'
    + '#studio-demo .sd-chips{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:22px}'
    + '#studio-demo .sd-chip{cursor:pointer;border:1px solid rgba(193,154,82,.38);background:rgba(193,154,82,.05);color:#d8c79b;font-family:\'Special Elite\',monospace;font-size:12.5px;letter-spacing:.04em;padding:12px 18px;transition:all .18s}'
    + '#studio-demo .sd-chip:hover{border-color:#c19a52;color:#f2ecd9}'
    + '#studio-demo .sd-chip.on{background:linear-gradient(110deg,#a77d35,#d8b26a 55%,#c19a52);color:#171207;border-color:transparent;font-weight:700}'
    + '#studio-demo .sd-chip small{opacity:.7;margin-left:7px;font-size:.85em}'
    + '#studio-demo .sd-note{color:#6d7380;font-size:11.5px;margin-top:13px}'
    // çıktı satırları
    + '#studio-demo .sd-oh{color:#c19a52;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.2em;margin:0 0 12px}'
    + '#studio-demo .sd-line{display:flex;gap:13px;align-items:flex-start;padding:12px 0;border-bottom:1px solid rgba(193,154,82,.14);opacity:0;transform:translateY(8px);transition:opacity .45s,transform .45s}'
    + '#studio-demo .sd-line.in{opacity:1;transform:none}'
    + '#studio-demo .sd-line .ck{flex-shrink:0;width:22px;height:22px;border-radius:50%;border:1px solid rgba(193,154,82,.4);display:grid;place-items:center;color:#5A7A3E;font-size:12px;margin-top:1px}'
    + '#studio-demo .sd-line.in .ck{background:rgba(90,122,62,.14);border-color:rgba(90,122,62,.5)}'
    + '#studio-demo .sd-line b{display:block;color:#eadfc6;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.1em;margin-bottom:3px}'
    + '#studio-demo .sd-line .pv{display:block;color:#8b93a1;font-size:12.5px;line-height:1.45;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}'
    // üretilen ekstralar (harici neler yaptık)
    + '#studio-demo .sd-more{margin-top:16px;opacity:0;transform:translateY(8px);transition:opacity .5s .5s,transform .5s .5s}'
    + '#studio-demo .sd-more.in{opacity:1;transform:none}'
    + '#studio-demo .sd-more .mh{color:#7a8090;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.16em;margin-bottom:9px}'
    + '#studio-demo .sd-pills{display:flex;flex-wrap:wrap;gap:7px}'
    + '#studio-demo .sd-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(193,154,82,.28);color:#cdb98a;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.04em;padding:6px 11px;background:rgba(193,154,82,.04)}'
    + '#studio-demo .sd-pill::before{content:"✓";color:#5A7A3E;font-size:10px}'
    // sağ sahne
    + '#studio-demo .sd-stage{display:flex}'
    + '#studio-demo .sd-canvas{position:relative;flex:1;min-height:300px;aspect-ratio:16/9;overflow:hidden;border:1px solid rgba(193,154,82,.3);background:radial-gradient(circle at 50% 38%,#12131a,#08090e);display:grid;place-items:center;box-shadow:0 40px 90px -50px rgba(0,0,0,.9)}'
    + '#studio-demo .sd-ph{display:grid;gap:12px;justify-items:center;text-align:center;color:#5a6070;padding:20px}'
    + '#studio-demo .sd-ph .ic{font-size:30px;opacity:.5;filter:grayscale(.3)}'
    + '#studio-demo .sd-ph span:last-child{font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.14em}'
    + '#studio-demo .sd-canvas img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.06);transition:opacity 1s ease,transform 6s ease}'
    + '#studio-demo .sd-canvas img.in{opacity:1;transform:scale(1)}'
    + '#studio-demo .sd-cap{position:absolute;left:0;right:0;bottom:0;padding:15px 18px;background:linear-gradient(to top,rgba(4,5,10,.94),transparent);color:#f2ecd9;font-family:\'Special Elite\',monospace;font-size:12px;letter-spacing:.05em;opacity:0;transition:opacity .6s .35s;display:flex;align-items:center;justify-content:space-between;gap:10px}'
    + '#studio-demo .sd-cap.in{opacity:1}'
    + '#studio-demo .sd-cap a{color:#e6c478;text-decoration:none;white-space:nowrap}'
    + '#studio-demo .sd-cap a:hover{color:#fff0b1}'
    + '#studio-demo .sd-load{position:absolute;inset:0;display:grid;place-items:center;gap:15px;background:rgba(6,7,13,.55);text-align:center}'
    + '#studio-demo .sd-spin{width:46px;height:46px;border-radius:50%;border:2px solid rgba(193,154,82,.25);border-top-color:#e6c478;animation:sd-spin .8s linear infinite}'
    + '@keyframes sd-spin{to{transform:rotate(360deg)}}'
    + '#studio-demo .sd-load .lt{color:#d8c79b;font-family:\'Special Elite\',monospace;font-size:11.5px;letter-spacing:.14em}'
    + '#studio-demo .sd-prog{width:190px;height:3px;background:rgba(193,154,82,.18);overflow:hidden}'
    + '#studio-demo .sd-prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,#a77d35,#e6c478);animation:sd-prog 1.8s ease forwards}'
    + '@keyframes sd-prog{to{width:100%}}'
    + '#studio-demo .sd-foot{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-top:24px}'
    + '#studio-demo .sd-cta{display:inline-flex;align-items:center;gap:8px;color:#e6c478;font-family:\'Special Elite\',monospace;font-weight:700;font-size:12.5px;letter-spacing:.12em;text-decoration:none;border-bottom:1px solid rgba(193,154,82,.4);padding-bottom:2px}'
    + '#studio-demo .sd-cta:hover{color:#fff0b1}'
    + '@media(max-width:820px){#studio-demo .sd-work{grid-template-columns:1fr}#studio-demo .sd-stage{order:-1}}';

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function render(mount) {
    var cur = 0;

    function chipsHTML() {
      return PRESETS.map(function (x, i) {
        return '<button class="sd-chip' + (i === cur ? ' on' : '') + '" data-i="' + i + '">' + esc(x.ad) + '<small>' + esc(x.alt) + '</small></button>';
      }).join('');
    }

    function stepA() {
      mount.querySelector('.sd-body').innerHTML =
        '<div class="sd-work">'
        + '<div class="sd-panel">'
        + '<div class="sd-step">BİR KONU SEÇ</div>'
        + '<div class="sd-chips" id="sd-chips">' + chipsHTML() + '</div>'
        + '<div><button class="sd-btn hero" id="sd-try">STUDIO’YU DENE <span style="font-size:16px">▸</span></button></div>'
        + '<div class="sd-note">Gerçek örnek · kayıt gerekmez</div>'
        + '</div>'
        + '<div class="sd-stage"><div class="sd-canvas"><div class="sd-ph"><span class="ic">🎬</span><span>SAHNE BURADA BELİRECEK</span></div></div></div>'
        + '</div>';
      mount.querySelector('#sd-chips').addEventListener('click', function (e) {
        var btn = e.target.closest('.sd-chip'); if (!btn) return;
        cur = +btn.getAttribute('data-i'); stepA();
      });
      mount.querySelector('#sd-try').addEventListener('click', workspace);
    }

    function workspace() {
      var p = PRESETS[cur];
      mount.querySelector('.sd-body').innerHTML =
        '<div class="sd-work">'
        + '<div class="sd-panel">'
        + '<div class="sd-oh">◈ STUDIO ÇIKTISI</div>'
        + '<div class="sd-line" id="o1"><span class="ck">✓</span><div><b>SENARYO</b><span class="pv">' + esc(p.senaryo) + '</span></div></div>'
        + '<div class="sd-line" id="o2"><span class="ck">✓</span><div><b>SESLENDİRME</b><span class="pv">' + esc(p.ses) + '</span></div></div>'
        + '<div class="sd-line" id="o3"><span class="ck">✓</span><div><b>GÖRSEL PROMPTU</b><span class="pv">' + esc(p.prompt) + '</span></div></div>'
        + '<div class="sd-more" id="o4"><div class="mh">AYRICA ÜRETİLDİ</div><div class="sd-pills">' + EXTRA.map(function (t) { return '<span class="sd-pill">' + esc(t) + '</span>'; }).join('') + '</div></div>'
        + '</div>'
        + '<div class="sd-stage"><div class="sd-canvas" id="sd-canvas"><button class="sd-btn hero" id="sd-gen">◉ GÖRSEL OLUŞTUR</button></div></div>'
        + '</div>'
        + '<div class="sd-foot"><button class="sd-btn ghost" id="sd-reset">↺ Başka konu</button><a class="sd-cta" href="/studio">Studio’da kendin üret →</a></div>';
      ['o1', 'o2', 'o3', 'o4'].forEach(function (id, i) {
        setTimeout(function () { var n = mount.querySelector('#' + id); if (n) n.classList.add('in'); }, 150 + i * 340);
      });
      mount.querySelector('#sd-reset').addEventListener('click', stepA);
      mount.querySelector('#sd-gen').addEventListener('click', generate);
    }

    function generate() {
      var p = PRESETS[cur];
      var canvas = mount.querySelector('#sd-canvas');
      canvas.innerHTML = '<div class="sd-load" id="sd-load"><div class="sd-spin"></div><div class="lt">Sahne oluşturuluyor…</div><div class="sd-prog"><i></i></div></div>';
      var pre = new Image(); pre.src = p.img;
      setTimeout(function () {
        canvas.innerHTML = '<img id="sd-img" src="' + esc(p.img) + '" alt="' + esc(p.cap) + '">'
          + '<div class="sd-cap" id="sd-cap"><span>' + esc(p.cap) + '</span><a href="/studio">Studio’da aç →</a></div>';
        requestAnimationFrame(function () {
          var im = mount.querySelector('#sd-img'); if (im) im.classList.add('in');
          var cap = mount.querySelector('#sd-cap'); if (cap) cap.classList.add('in');
        });
      }, 1850);
    }

    mount.innerHTML =
      '<div class="sd-glow"></div>'
      + '<div class="sd-wrap">'
      + '<div class="sd-top">'
      + '<span class="sd-live"><span class="d"></span>CANLI DEMO</span>'
      + '<h2>Studio’yu Dene — <span class="g">bir sahneyi canlı üret.</span></h2>'
      + '<p class="sd-sub">Bir konu seç; senaryo, seslendirme ve sinematik sahne saniyeler içinde çıksın. İşte tam olarak böyle çalışıyor.</p>'
      + '</div>'
      + '<div class="sd-body"></div>'
      + '</div>';
    stepA();
  }

  function injectStyle() {
    if (document.getElementById('sd-style')) return;
    var style = document.createElement('style'); style.id = 'sd-style'; style.textContent = CSS;
    document.head.appendChild(style);
  }
  function ensure() {
    var mount = document.getElementById('studio-demo-mount');
    if (!mount) return;
    if (mount.__sdDone && mount.querySelector('.sd-wrap')) return;
    injectStyle();
    mount.__sdDone = true;
    render(mount);
  }

  window.__sdInit = true;
  ensure();
  document.addEventListener('DOMContentLoaded', ensure);
  var ticks = 0, iv = setInterval(function () { ensure(); if (++ticks > 40) clearInterval(iv); }, 500);
  if (window.MutationObserver) {
    var moT = null;
    new MutationObserver(function () { clearTimeout(moT); moT = setTimeout(ensure, 150); })
      .observe(document.documentElement, { childList: true, subtree: true });
  }
})();

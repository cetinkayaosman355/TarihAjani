/* Tarih Ajanı — Ana sayfa "Studio Canlı Demo" bölümü.
   #studio-demo-mount içine kendi kendine yerleşir (dc bağımsız).
   Konu seç → STUDIO'YU DENE → çıktılar belirir → GÖRSEL OLUŞTUR → sahne gelir. */
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

  var CSS = ''
    + '#studio-demo{position:relative;background:#06070d;border-top:1px solid rgba(193,154,82,.15);border-bottom:1px solid rgba(193,154,82,.15);overflow:hidden}'
    + '#studio-demo .sd-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle 480px at 84% 6%,rgba(230,196,120,.12),transparent 60%),radial-gradient(circle 400px at 6% 96%,rgba(158,43,35,.09),transparent 58%)}'
    + '#studio-demo .sd-wrap{position:relative;width:min(1240px,92vw);margin:0 auto;padding:clamp(42px,4.6vw,64px) clamp(20px,4vw,40px)}'
    + '#studio-demo .sd-head{text-align:center;max-width:760px;margin:0 auto clamp(26px,3vw,38px)}'
    + '#studio-demo .sd-kick{margin:0 0 15px;color:#c19a52;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.32em;display:inline-flex;align-items:center;gap:9px}'
    + '#studio-demo .sd-kick .d{width:7px;height:7px;border-radius:50%;background:#9E2B23;box-shadow:0 0 8px rgba(158,43,35,.9);animation:sd-blink 1.6s ease-in-out infinite}'
    + '@keyframes sd-blink{0%,100%{opacity:1}50%{opacity:.3}}'
    + '#studio-demo h2{margin:0 0 12px;font-family:\'Playfair Display\',serif;font-size:clamp(34px,5vw,56px);font-weight:800;line-height:1.02;letter-spacing:-.01em;color:#f6efe0}'
    + '#studio-demo h2 .g{background:linear-gradient(102deg,#b18742,#e6c478 42%,#fff0b1 52%,#d6ad5b 64%,#a5762f);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '#studio-demo .sd-sub{margin:0;color:#a7adba;font-size:clamp(14px,1.1vw,16px);line-height:1.6}'
    + '#studio-demo .sd-app{max-width:1060px;margin:0 auto;border:1px solid rgba(193,154,82,.26);background:linear-gradient(160deg,rgba(16,15,21,.97),rgba(6,7,12,.99));box-shadow:0 44px 100px -54px rgba(0,0,0,.95)}'
    + '#studio-demo .sd-bar{display:flex;align-items:center;gap:8px;padding:11px 15px;border-bottom:1px solid rgba(193,154,82,.16);background:rgba(3,4,9,.6)}'
    + '#studio-demo .sd-bar .dot{width:10px;height:10px;border-radius:50%;background:#2a2f3a}'
    + '#studio-demo .sd-bar .tt{margin-left:9px;color:#8a8f9c;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.14em}'
    + '#studio-demo .sd-body{padding:clamp(22px,3vw,36px)}'
    + '#studio-demo .sd-btn{cursor:pointer;border:0;display:inline-flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:13px;letter-spacing:.14em;padding:16px 30px;transition:transform .18s,box-shadow .18s}'
    + '#studio-demo .sd-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(230,196,120,.35)}'
    + '#studio-demo .sd-btn.ghost{background:transparent;border:1px solid rgba(193,154,82,.5);color:#e6c478}'
    + '#studio-demo .sd-btn.ghost:hover{background:rgba(193,154,82,.12);box-shadow:none}'
    // step A — kompakt
    + '#studio-demo .sd-brief{display:flex;flex-direction:column;align-items:center;gap:18px;text-align:center;padding:clamp(10px,2vw,22px) 0}'
    + '#studio-demo .sd-step{color:#818797;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.22em}'
    + '#studio-demo .sd-chips{display:flex;flex-wrap:wrap;gap:9px;justify-content:center}'
    + '#studio-demo .sd-chip{cursor:pointer;border:1px solid rgba(193,154,82,.38);background:rgba(193,154,82,.05);color:#d8c79b;font-family:\'Special Elite\',monospace;font-size:12px;letter-spacing:.05em;padding:11px 17px;transition:all .18s}'
    + '#studio-demo .sd-chip:hover{border-color:#c19a52;color:#f2ecd9}'
    + '#studio-demo .sd-chip.on{background:linear-gradient(110deg,#a77d35,#d8b26a 55%,#c19a52);color:#171207;border-color:transparent;font-weight:700}'
    + '#studio-demo .sd-chip small{opacity:.7;margin-left:7px;font-size:.85em}'
    + '#studio-demo .sd-note{color:#6d7380;font-size:11.5px}'
    // workspace — çıktılar ince, sahne büyük
    + '#studio-demo .sd-work{display:grid;grid-template-columns:.82fr 1.18fr;gap:24px;align-items:stretch}'
    + '#studio-demo .sd-oh{color:#c19a52;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.2em;margin:0 0 14px}'
    + '#studio-demo .sd-line{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid rgba(193,154,82,.14);opacity:0;transform:translateY(8px);transition:opacity .45s,transform .45s}'
    + '#studio-demo .sd-line.in{opacity:1;transform:none}'
    + '#studio-demo .sd-line .ck{flex-shrink:0;width:20px;height:20px;border-radius:50%;border:1px solid rgba(193,154,82,.4);display:grid;place-items:center;color:#5A7A3E;font-size:11px;margin-top:1px}'
    + '#studio-demo .sd-line.in .ck{background:rgba(90,122,62,.14);border-color:rgba(90,122,62,.5)}'
    + '#studio-demo .sd-line b{display:block;color:#eadfc6;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.1em;margin-bottom:3px}'
    + '#studio-demo .sd-line .pv{display:block;color:#8b93a1;font-size:12.5px;line-height:1.45;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}'
    + '#studio-demo .sd-tags{margin-top:15px;color:#7a8090;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.06em;line-height:1.7}'
    + '#studio-demo .sd-tags b{color:#c19a52}'
    + '#studio-demo .sd-stage{display:flex}'
    + '#studio-demo .sd-canvas{position:relative;flex:1;min-height:230px;aspect-ratio:16/9;overflow:hidden;border:1px solid rgba(193,154,82,.28);background:radial-gradient(circle at 50% 38%,#12131a,#08090e);display:grid;place-items:center}'
    + '#studio-demo .sd-canvas img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.06);transition:opacity 1s ease,transform 6s ease}'
    + '#studio-demo .sd-canvas img.in{opacity:1;transform:scale(1)}'
    + '#studio-demo .sd-cap{position:absolute;left:0;right:0;bottom:0;padding:13px 15px;background:linear-gradient(to top,rgba(4,5,10,.94),transparent);color:#f2ecd9;font-family:\'Special Elite\',monospace;font-size:11.5px;letter-spacing:.05em;opacity:0;transition:opacity .6s .35s;display:flex;align-items:center;justify-content:space-between;gap:10px}'
    + '#studio-demo .sd-cap.in{opacity:1}'
    + '#studio-demo .sd-cap a{color:#e6c478;text-decoration:none;white-space:nowrap}'
    + '#studio-demo .sd-cap a:hover{color:#fff0b1}'
    + '#studio-demo .sd-load{position:absolute;inset:0;display:grid;place-items:center;gap:14px;background:rgba(6,7,13,.55);text-align:center}'
    + '#studio-demo .sd-spin{width:42px;height:42px;border-radius:50%;border:2px solid rgba(193,154,82,.25);border-top-color:#e6c478;animation:sd-spin .8s linear infinite}'
    + '@keyframes sd-spin{to{transform:rotate(360deg)}}'
    + '#studio-demo .sd-load .lt{color:#d8c79b;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.14em}'
    + '#studio-demo .sd-prog{width:170px;height:3px;background:rgba(193,154,82,.18);overflow:hidden}'
    + '#studio-demo .sd-prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,#a77d35,#e6c478);animation:sd-prog 1.8s ease forwards}'
    + '@keyframes sd-prog{to{width:100%}}'
    + '#studio-demo .sd-foot{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-top:22px}'
    + '#studio-demo .sd-cta{display:inline-flex;align-items:center;gap:8px;color:#e6c478;font-family:\'Special Elite\',monospace;font-weight:700;font-size:12px;letter-spacing:.12em;text-decoration:none;border-bottom:1px solid rgba(193,154,82,.4);padding-bottom:2px}'
    + '#studio-demo .sd-cta:hover{color:#fff0b1}'
    + '@media(max-width:780px){#studio-demo .sd-work{grid-template-columns:1fr}#studio-demo .sd-stage{order:-1}}';

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function render(mount) {
    var cur = 0;

    function stepA() {
      var chips = PRESETS.map(function (x, i) {
        return '<button class="sd-chip' + (i === cur ? ' on' : '') + '" data-i="' + i + '">' + esc(x.ad) + '<small>' + esc(x.alt) + '</small></button>';
      }).join('');
      mount.querySelector('.sd-body').innerHTML =
        '<div class="sd-brief">'
        + '<span class="sd-step">BİR KONU SEÇ</span>'
        + '<div class="sd-chips" id="sd-chips">' + chips + '</div>'
        + '<button class="sd-btn" id="sd-try" style="margin-top:4px;padding:17px 34px;font-size:13.5px">STUDIO’YU DENE <span style="font-size:15px">▸</span></button>'
        + '<div class="sd-note">Gerçek örnek · kayıt gerekmez</div>'
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
        + '<div class="sd-outs">'
        + '<div class="sd-oh">◈ STUDIO ÇIKTISI</div>'
        + '<div class="sd-line" id="o1"><span class="ck">✓</span><div><b>SENARYO</b><span class="pv">' + esc(p.senaryo) + '</span></div></div>'
        + '<div class="sd-line" id="o2"><span class="ck">✓</span><div><b>SESLENDİRME</b><span class="pv">' + esc(p.ses) + '</span></div></div>'
        + '<div class="sd-line" id="o3"><span class="ck">✓</span><div><b>GÖRSEL PROMPTU</b><span class="pv">' + esc(p.prompt) + '</span></div></div>'
        + '<div class="sd-tags">Tek dosyada: <b>senaryo · seslendirme · 6 sahne promptu · kapak</b></div>'
        + '</div>'
        + '<div class="sd-stage"><div class="sd-canvas" id="sd-canvas">'
        + '<button class="sd-btn" id="sd-gen">◉ GÖRSEL OLUŞTUR</button>'
        + '</div></div>'
        + '</div>'
        + '<div class="sd-foot"><button class="sd-btn ghost" id="sd-reset">↺ Başka konu</button><a class="sd-cta" href="/studio">Studio’da kendin üret →</a></div>';
      ['o1', 'o2', 'o3'].forEach(function (id, i) {
        setTimeout(function () { var n = mount.querySelector('#' + id); if (n) n.classList.add('in'); }, 160 + i * 380);
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
      + '<div class="sd-head">'
      + '<p class="sd-kick"><span class="d"></span>STUDIO · CANLI DEMO</p>'
      + '<h2>Bir konu seç, <span class="g">gerisini Studio yapsın.</span></h2>'
      + '<p class="sd-sub">Senaryo, seslendirme ve sinematik sahne — tek tıkla. Aşağıda canlı dene.</p>'
      + '</div>'
      + '<div class="sd-app"><div class="sd-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="tt">tarihajani.com / studio</span></div><div class="sd-body"></div></div>'
      + '</div>';
    stepA();
  }

  function injectStyle() {
    if (document.getElementById('sd-style')) return;
    var style = document.createElement('style'); style.id = 'sd-style'; style.textContent = CSS;
    document.head.appendChild(style);
  }
  // dc framework gövdeyi yeniden kurabildiği için tek seferlik hidrasyon silinebiliyor.
  function ensure() {
    var mount = document.getElementById('studio-demo-mount');
    if (!mount) return;
    if (mount.__sdDone && mount.querySelector('.sd-app')) return;
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

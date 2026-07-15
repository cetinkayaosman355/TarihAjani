/* Tarih Ajanı — Ana sayfa "Studio Canlı Demo" bölümü.
   Sol: başlık + yazılıyormuş gibi konu kutusu + yan yana çıktı kutuları.
   Sağ: üç parçaya bölünmüş storyboard önizleme → GÖRSEL OLUŞTUR → sahne.
   Sol içerik ile sağ görsel aynı hizada; bölüm görselden taşmaz. */
(function () {
  if (window.__sdInit) return;

  var PRESETS = [
    {
      ad: 'İstanbul’un Fethi', alt: '1453',
      img: '/assets/haber/istanbul-fethi.jpg',
      konu: 'İstanbul’un Fethi — surların yarıldığı an',
      senaryo: 'Şafak; surlarda ilk gedik, kamera dev topun namlusundan sancaklara kayıyor.',
      ses: 'Derin erkek anlatım · gerilim · ~14 sn',
      prompt: 'Cinematic dawn, breached walls, banners through smoke, 35mm',
      cap: 'İstanbul’un Fethi · surların yarıldığı an'
    },
    {
      ad: 'Vezüv Patladı', alt: 'MS 79',
      img: '/assets/haber/vezuv-pompeii.jpg',
      konu: 'Vezüv’ün patladığı öğle — Pompeii’nin son saati',
      senaryo: 'Gökyüzü ikiye yarılıyor; otuz kilometrelik kül sütunu kentin üstüne çöküyor.',
      ses: 'Tedirgin anlatım · uzak gök gürültüsü · ~13 sn',
      prompt: 'Vesuvius erupting, ash column over golden Pompeii, cinematic, 35mm',
      cap: 'Vezüv patladı · Pompeii’nin son öğleni'
    },
    {
      ad: 'Sezar Suikastı', alt: 'MÖ 44',
      img: '/assets/haber/sezar-suikasti.jpg',
      konu: 'Sezar’ın senatoda öldürüldüğü an — Mart’ın 15’i',
      senaryo: 'Togayı kavrayan el, parlayan ilk hançer; kamera Sezar’ın bakışında donuyor.',
      ses: 'Fısıltıdan yükselen gerilim · mermer yankısı · ~12 sn',
      prompt: 'Roman senate marble hall, daggers glinting, chiaroscuro, 35mm',
      cap: 'Sezar senatoda · 23 hançer'
    },
    {
      ad: 'Malazgirt', alt: '1071',
      img: '/assets/haber/malazgirt.jpg',
      konu: 'Malazgirt 1071 — imparatorun esir düştüğü gün',
      senaryo: 'Sahte ricat; toz bulutu yarılıyor, çember imparatorun etrafında kapanıyor.',
      ses: 'Destansı anlatım · davul ve nal sesi · ~13 sn',
      prompt: 'Anatolian steppe battle at dusk, encirclement, dust and banners, 35mm',
      cap: 'Malazgirt 1071 · çember kapanıyor'
    }
  ];
  // 6'lı çıktı kutuları — ilk üçü konuya göre dolar, son üçü pakete dair
  var EXTRAS = [
    {b:'SAHNE PROMPTLARI', s:'6 sahne kartı · her biri ayrı çekim promptu'},
    {b:'KAPAK & BAŞLIK',   s:'Tık odaklı kapak + başlık ve #etiketler'},
    {b:'YAYIN PAKETİ',     s:'Açıklama, etiket seti, yayın saati önerisi'}
  ];

  var CSS = ''
    + '#studio-demo{position:relative;background:#040509;overflow:hidden}'
    + '#studio-demo .sd-glow{display:none}'
    + '#studio-demo .sd-wrap{position:relative;width:min(1740px,94vw);margin:0 auto;padding:clamp(48px,5vw,64px) clamp(20px,3vw,40px)}'
    // iki sütun — tepeden hizalı
    + '#studio-demo .sd-work{display:grid;grid-template-columns:.84fr 1.16fr;gap:clamp(24px,2.8vw,44px);align-items:stretch}'
    + '#studio-demo .sd-panel{display:flex;flex-direction:column;justify-content:flex-start;gap:15px;min-width:0;padding-top:0}'
    + '#studio-demo .sd-panel.sd-mid{justify-content:flex-start;padding-top:0}'
    + '#studio-demo .sd-live{display:inline-flex;align-items:center;gap:8px;color:#e08a80;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.22em;margin-bottom:2px}'
    + '#studio-demo .sd-live .d{width:9px;height:9px;border-radius:50%;background:#e11d1d;box-shadow:0 0 0 0 rgba(225,29,29,.6);animation:sd-pulse 1.4s ease-out infinite}'
    + '@keyframes sd-pulse{0%{box-shadow:0 0 0 0 rgba(225,29,29,.55)}70%{box-shadow:0 0 0 9px rgba(225,29,29,0)}100%{box-shadow:0 0 0 0 rgba(225,29,29,0)}}'
    + '#studio-demo h2{margin:0;font-family:\'Playfair Display\',serif;font-size:clamp(27px,3.1vw,40px);font-weight:800;line-height:1.04;letter-spacing:-.01em;color:#f6efe0}'
    + '#studio-demo h2 .g{background:linear-gradient(102deg,#b18742,#e6c478 42%,#fff0b1 52%,#d6ad5b 64%,#a5762f);-webkit-background-clip:text;background-clip:text;color:transparent}'
    // konu kutusu — yazılıyormuş gibi
    + '#studio-demo .sd-promptbox{border:1px solid rgba(193,154,82,.3);background:#0c0a06;padding:13px 15px;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}'
    + '#studio-demo .sd-promptbox .pl{flex-shrink:0;color:#c19a52;font-family:\'Special Elite\',monospace;font-size:9.5px;letter-spacing:.18em}'
    + '#studio-demo .sd-promptbox .tx{color:#eadfc6;font-size:14.5px;line-height:1.4;font-family:\'Playfair Display\',serif;font-style:italic}'
    + '#studio-demo .sd-promptbox .caret{display:inline-block;width:2px;height:15px;background:#e6c478;transform:translateY(2px);animation:sd-caret 1s step-end infinite}'
    + '@keyframes sd-caret{50%{opacity:0}}'
    + '#studio-demo .sd-chips{display:flex;flex-wrap:wrap;gap:8px}'
    + '#studio-demo .sd-chip{cursor:pointer;border:1px solid rgba(193,154,82,.34);background:rgba(193,154,82,.05);color:#cdb98a;font-family:\'Special Elite\',monospace;font-size:13px;letter-spacing:.04em;padding:12px 20px;transition:all .16s}'
    + '#studio-demo .sd-chip:hover{border-color:#c19a52;color:#f2ecd9}'
    + '#studio-demo .sd-chip.on{background:linear-gradient(110deg,#a77d35,#d8b26a 55%,#c19a52);color:#171207;border-color:transparent;font-weight:700}'
    // butonlar
    + '#studio-demo .sd-btn{cursor:pointer;border:0;display:inline-flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:13px;letter-spacing:.14em;padding:15px 28px;transition:transform .18s,box-shadow .18s}'
    + '#studio-demo .sd-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(230,196,120,.35)}'
    + '#studio-demo .sd-btn.hero{padding:17px 34px;font-size:14px;letter-spacing:.16em;box-shadow:0 16px 48px -18px rgba(230,196,120,.55)}'
    + '#studio-demo .sd-btn.ghost{background:transparent;border:1px solid rgba(193,154,82,.5);color:#e6c478;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-weight:700;font-size:13px;letter-spacing:.03em}'
    + '#studio-demo .sd-btn.ghost:hover{background:rgba(193,154,82,.12);box-shadow:none}'
    + '#studio-demo .sd-tryrow{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-top:14px}'
    + '#studio-demo .sd-note{color:#868c9c;font-size:11px}'
    // yan yana çıktı kutuları
    + '#studio-demo .sd-oh{color:#c19a52;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.2em}'
    + '#studio-demo .sd-outrow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}'
    + '#studio-demo .sd-obox{min-width:0;border:1px solid rgba(193,154,82,.2);background:#0c0a06;padding:12px 13px;opacity:0;transform:translateY(8px);transition:opacity .45s,transform .45s}'
    + '#studio-demo .sd-obox.in{opacity:1;transform:none}'
    + '#studio-demo .sd-obox .bh{display:flex;align-items:center;gap:7px;margin-bottom:7px}'
    + '#studio-demo .sd-obox .ck{width:16px;height:16px;border-radius:50%;background:rgba(90,122,62,.16);border:1px solid rgba(90,122,62,.5);display:grid;place-items:center;color:#7ba05a;font-size:9px}'
    + '#studio-demo .sd-obox b{color:#eadfc6;font-family:\'Special Elite\',monospace;font-size:9.5px;letter-spacing:.08em}'
    + '#studio-demo .sd-obox span{display:block;color:#8b93a1;font-size:12px;line-height:1.45;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}'
    // sağ sahne — Tarih Ajanı önizleme (büyük görsel)
    + '#studio-demo .sd-stage{display:block}'
    + '#studio-demo .sd-canvas{position:relative;width:100%;aspect-ratio:2/1;overflow:hidden;border:1px solid rgba(193,154,82,.3);background:radial-gradient(circle at 50% 40%,#101120,#08090e);box-shadow:0 40px 90px -52px rgba(0,0,0,.9)}'
    // boş ekran yerine: 4 preset görselinden çapraz (X) mozaik
    + '#studio-demo .sd-mosaic{position:absolute;inset:0;z-index:0}'
    + '#studio-demo .sd-mosaic i{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.34) saturate(.62)}'
    + '#studio-demo .sd-mosaic i:nth-child(1){clip-path:polygon(0 0,100% 0,50% 50%)}'
    + '#studio-demo .sd-mosaic i:nth-child(2){clip-path:polygon(100% 0,100% 100%,50% 50%)}'
    + '#studio-demo .sd-mosaic i:nth-child(3){clip-path:polygon(0 100%,100% 100%,50% 50%)}'
    + '#studio-demo .sd-mosaic i:nth-child(4){clip-path:polygon(0 0,0 100%,50% 50%)}'
    + '#studio-demo .sd-mosaic::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom right,transparent calc(50% - 1px),rgba(193,154,82,.16) calc(50% - 1px),rgba(193,154,82,.16) calc(50% + 1px),transparent calc(50% + 1px)),linear-gradient(to bottom left,transparent calc(50% - 1px),rgba(193,154,82,.16) calc(50% - 1px),rgba(193,154,82,.16) calc(50% + 1px),transparent calc(50% + 1px))}'
    + '#studio-demo .sd-brand{position:absolute;inset:0;z-index:1;overflow:hidden;display:grid;place-items:center;pointer-events:none}'
    + '#studio-demo .sd-brand .bw{font-family:\'Playfair Display\',serif;font-weight:800;font-size:clamp(30px,4.2vw,56px);line-height:.92;letter-spacing:.01em;transform:rotate(-9deg) translateY(-8%);text-align:center;background:linear-gradient(102deg,rgba(230,196,120,.4),rgba(255,240,177,.55) 48%,rgba(230,196,120,.36));-webkit-background-clip:text;background-clip:text;color:transparent;white-space:nowrap;filter:drop-shadow(0 2px 12px rgba(0,0,0,.8))}'
    + '#studio-demo .sd-brand .bl{position:absolute;bottom:12px;left:0;right:0;text-align:center;color:#b9ab86;font-family:\'Special Elite\',monospace;font-size:9.5px;letter-spacing:.2em;text-shadow:0 1px 8px rgba(0,0,0,.9)}'
    + '#studio-demo .sd-canvas>.sd-btn{position:absolute;left:50%;bottom:11%;transform:translateX(-50%);z-index:2}'
    + '#studio-demo .sd-canvas>.sd-btn:hover{transform:translateX(-50%) translateY(-2px)}'
    + '#studio-demo .sd-canvas img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .9s ease;z-index:3}'
    + '#studio-demo .sd-canvas img.in{opacity:1}'
    + '#studio-demo .sd-cap{position:absolute;left:0;right:0;bottom:0;z-index:4;padding:14px 16px;background:linear-gradient(to top,rgba(4,5,10,.94),transparent);color:#f2ecd9;font-family:\'Special Elite\',monospace;font-size:11.5px;letter-spacing:.05em;opacity:0;transition:opacity .6s .35s;display:flex;align-items:center;justify-content:space-between;gap:10px}'
    + '#studio-demo .sd-cap.in{opacity:1}'
    + '#studio-demo .sd-cap a{color:#e6c478;text-decoration:none;white-space:nowrap}'
    + '#studio-demo .sd-cap a:hover{color:#fff0b1}'
    + '#studio-demo .sd-load{position:absolute;inset:0;z-index:5;display:grid;place-items:center;gap:14px;background:rgba(6,7,13,.62);text-align:center}'
    + '#studio-demo .sd-spin{width:44px;height:44px;border-radius:50%;border:2px solid rgba(193,154,82,.25);border-top-color:#e6c478;animation:sd-spin .8s linear infinite}'
    + '@keyframes sd-spin{to{transform:rotate(360deg)}}'
    + '#studio-demo .sd-load .lt{color:#d8c79b;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.14em}'
    + '#studio-demo .sd-prog{width:180px;height:3px;background:rgba(193,154,82,.18);overflow:hidden}'
    + '#studio-demo .sd-prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,#a77d35,#e6c478);animation:sd-prog 1.8s ease forwards}'
    + '@keyframes sd-prog{to{width:100%}}'
    + '#studio-demo .sd-foot{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-top:4px}'
    + '#studio-demo .sd-cta{display:inline-flex;align-items:center;gap:8px;color:#e6c478;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-weight:700;font-size:13.5px;letter-spacing:.02em;text-decoration:none;border-bottom:1px solid rgba(193,154,82,.4);padding-bottom:2px}'
    + '#studio-demo .sd-cta:hover{color:#fff0b1}'
    + '@media(max-width:800px){#studio-demo .sd-work{grid-template-columns:1fr}#studio-demo .sd-stage{order:-1}}';

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function brandHTML(label){
    var mos = '<div class="sd-mosaic">' + PRESETS.slice(0,4).map(function(p){ return '<i style="background-image:url(' + p.img + ')"></i>'; }).join('') + '</div>';
    return mos + '<div class="sd-brand"><div class="bw">Tarih<br>Ajanı</div>' + (label ? '<div class="bl">' + label + '</div>' : '') + '</div>';
  }

  function render(mount) {
    var cur = 0, typeTimer = null;

    function topbar() {
      return '<div><div class="sd-live"><span class="d"></span>CANLI DEMO</div>'
        + '<h2>Studio’yu <span class="g">Dene</span></h2></div>';
    }
    function chipsHTML() {
      return PRESETS.map(function (x, i) { return '<button class="sd-chip' + (i === cur ? ' on' : '') + '" data-i="' + i + '">' + esc(x.ad) + '</button>'; }).join('');
    }
    function typeInto(el, text) {
      if (!el) return;
      clearInterval(typeTimer);
      var i = 0; el.textContent = '';
      typeTimer = setInterval(function () { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typeTimer); }, 34);
    }

    function stepA() {
      var p = PRESETS[cur];
      mount.querySelector('.sd-body').innerHTML =
        '<div class="sd-work">'
        + '<div class="sd-panel">'
        + topbar()
        + '<div class="sd-promptbox"><span class="pl">KONU</span><span class="tx" id="sd-type"></span><span class="caret"></span></div>'
        + '<div class="sd-chips" id="sd-chips">' + chipsHTML() + '</div>'
        + '<div class="sd-tryrow"><button class="sd-btn hero" id="sd-try">STUDIO’YU DENE <span style="font-size:16px">▸</span></button><span class="sd-note">Gerçek örnek · kayıt gerekmez</span></div>'
        + '</div>'
        + '<div class="sd-stage"><div class="sd-canvas">' + brandHTML('STUDIO · SAHNE ÖNİZLEME') + '</div></div>'
        + '</div>';
      typeInto(mount.querySelector('#sd-type'), p.konu);
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
        + '<div class="sd-panel sd-mid">'
        + topbar()
        + '<div class="sd-oh">◈ STUDIO ÇIKTISI</div>'
        + '<div class="sd-outrow">'
        + '<div class="sd-obox" id="o1"><div class="bh"><span class="ck">✓</span><b>SENARYO</b></div><span>' + esc(p.senaryo) + '</span></div>'
        + '<div class="sd-obox" id="o2"><div class="bh"><span class="ck">✓</span><b>SESLENDİRME</b></div><span>' + esc(p.ses) + '</span></div>'
        + '<div class="sd-obox" id="o3"><div class="bh"><span class="ck">✓</span><b>GÖRSEL PROMPTU</b></div><span>' + esc(p.prompt) + '</span></div>'
        + EXTRAS.map(function (x, i) { return '<div class="sd-obox" id="o' + (4 + i) + '"><div class="bh"><span class="ck">✓</span><b>' + x.b + '</b></div><span>' + esc(x.s) + '</span></div>'; }).join('')
        + '</div>'
        + '<div class="sd-foot"><button class="sd-btn ghost" id="sd-reset">↺ Başka konu</button><a class="sd-cta" href="/studio">Studio’da kendin üret →</a></div>'
        + '</div>'
        + '<div class="sd-stage"><div class="sd-canvas" id="sd-canvas">' + brandHTML('') + '<button class="sd-btn hero" id="sd-gen">◉ GÖRSEL OLUŞTUR</button></div></div>'
        + '</div>';
      ['o1', 'o2', 'o3', 'o4', 'o5', 'o6'].forEach(function (id, i) {
        setTimeout(function () { var n = mount.querySelector('#' + id); if (n) n.classList.add('in'); }, 120 + i * 200);
      });
      mount.querySelector('#sd-reset').addEventListener('click', stepA);
      mount.querySelector('#sd-gen').addEventListener('click', generate);
    }

    function generate() {
      var p = PRESETS[cur];
      var canvas = mount.querySelector('#sd-canvas');
      canvas.innerHTML = brandHTML('') + '<div class="sd-load" id="sd-load"><div class="sd-spin"></div><div class="lt">Sahne oluşturuluyor…</div><div class="sd-prog"><i></i></div></div>';
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

    mount.innerHTML = '<div class="sd-glow"></div><div class="sd-wrap"><div class="sd-body"></div></div>';
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

/* Tarih Ajanı — Ana sayfa "Studio Canlı Demo" bölümü.
   #studio-demo-mount içine kendi kendine yerleşir (dc bağımsız).
   Kullanıcı bir konu seçer → STUDIO'YU DENE → yanda promptlar çıkar →
   GÖRSEL OLUŞTUR → hazır sinematik görselimiz belirir. */
(function () {
  if (window.__sdInit) return;

  var PRESETS = [
    {
      ad: 'İstanbul’un Fethi',
      alt: 'Surların yarıldığı an · 1453',
      img: '/assets/haber/istanbul-fethi.jpg',
      senaryo: '29 Mayıs 1453, şafak. Elli üç gündür dövülen Theodosius surlarında ilk gedik açılıyor. Kamera, Urban’ın devasa bronz topunun namlusundan dumanın içindeki sancaklara kayıyor.',
      ses: 'Derin, sinematik erkek anlatım · 0.92x tempo · nefes ve gerilim vurgusu · ~14 sn',
      prompt: 'Cinematic wide shot at dawn, the massive Theodosian walls breached, Ottoman banners rising through smoke, colossal bronze cannon in the foreground, epic historical film still, volumetric haze, 35mm, muted gold and crimson palette --ar 16:9',
      cap: 'İstanbul’un Fethi · surların yarıldığı an'
    },
    {
      ad: 'Vezüv Patladı',
      alt: 'Pompeii’nin son öğleni · MS 79',
      img: '/assets/haber/vezuv-pompeii.jpg',
      senaryo: '24 Ağustos 79, öğle sonrası. Gökyüzü ikiye yarılıyor; Vezüv’ün tepesinden otuz kilometre yükselen kül sütunu Pompeii’nin üstüne bir gölge gibi çöküyor.',
      ses: 'Derin, tedirgin anlatım · 0.9x tempo · uzak gök gürültüsü altında · ~13 sn',
      prompt: 'Cinematic shot of Mount Vesuvius erupting, a towering 30km ash column, the Roman town of Pompeii below in golden afternoon light turning dark, ominous pyroclastic cloud, epic disaster film still, volumetric ash, 35mm --ar 16:9',
      cap: 'Vezüv patladı · Pompeii’nin son öğleni'
    },
    {
      ad: 'Sezar Suikastı',
      alt: 'Senatoda 23 hançer · MÖ 44',
      img: '/assets/haber/sezar-suikasti.jpg',
      senaryo: 'MÖ 44, Mart’ın 15’i. Senato salonu. Tillius Cimber togayı kavrıyor, ilk hançer parlıyor. Kamera, Sezar’ın şaşkın bakışında bir an donuyor.',
      ses: 'Fısıltıdan yükselen gerilim · 0.95x tempo · mermer yankısı · ~12 sn',
      prompt: 'Cinematic dramatic shot, Roman senate marble hall, senators in togas closing around Julius Caesar, daggers glinting, cold shafts of light, chiaroscuro, epic historical film still, 35mm, desaturated marble and blood-red palette --ar 16:9',
      cap: 'Sezar senatoda · 23 hançer'
    }
  ];

  var CSS = ''
    + '#studio-demo{position:relative;background:#06070d;border-top:1px solid rgba(193,154,82,.15);border-bottom:1px solid rgba(193,154,82,.15);overflow:hidden}'
    + '#studio-demo .sd-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle 460px at 82% 8%,rgba(230,196,120,.10),transparent 60%),radial-gradient(circle 380px at 8% 94%,rgba(158,43,35,.08),transparent 58%)}'
    + '#studio-demo .sd-wrap{position:relative;width:min(1340px,92vw);margin:0 auto;padding:clamp(56px,6vw,84px) clamp(20px,4vw,40px)}'
    + '#studio-demo .sd-kick{margin:0 0 14px;color:#c19a52;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.3em;display:inline-flex;align-items:center;gap:9px}'
    + '#studio-demo .sd-kick .d{width:7px;height:7px;border-radius:50%;background:#9E2B23;box-shadow:0 0 7px rgba(158,43,35,.8);animation:sd-blink 1.6s ease-in-out infinite}'
    + '@keyframes sd-blink{0%,100%{opacity:1}50%{opacity:.3}}'
    + '#studio-demo h2{margin:0 0 12px;font-family:\'Playfair Display\',serif;font-size:clamp(32px,4.4vw,56px);font-weight:800;line-height:1.02;color:#f4ecd8}'
    + '#studio-demo .sd-sub{margin:0 0 34px;color:#a7adba;font-size:clamp(14px,1.1vw,16.5px);line-height:1.65;max-width:60ch}'
    + '#studio-demo .sd-app{border:1px solid rgba(193,154,82,.24);background:linear-gradient(160deg,rgba(15,14,20,.96),rgba(6,7,12,.98));box-shadow:0 40px 90px -50px rgba(0,0,0,.9)}'
    + '#studio-demo .sd-bar{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid rgba(193,154,82,.16);background:rgba(3,4,9,.6)}'
    + '#studio-demo .sd-bar .dot{width:11px;height:11px;border-radius:50%;background:#2a2f3a}'
    + '#studio-demo .sd-bar .tt{margin-left:10px;color:#8a8f9c;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.16em}'
    + '#studio-demo .sd-body{padding:clamp(22px,3vw,40px)}'
    // step A
    + '#studio-demo .sd-brief{display:grid;gap:22px;justify-items:center;text-align:center;padding:clamp(18px,3vw,38px) 0}'
    + '#studio-demo .sd-lbl{color:#818797;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.2em}'
    + '#studio-demo .sd-chips{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}'
    + '#studio-demo .sd-chip{cursor:pointer;border:1px solid rgba(193,154,82,.4);background:rgba(193,154,82,.05);color:#d8c79b;font-family:\'Special Elite\',monospace;font-size:12.5px;letter-spacing:.06em;padding:12px 18px;transition:all .18s}'
    + '#studio-demo .sd-chip:hover{border-color:#c19a52;color:#f2ecd9}'
    + '#studio-demo .sd-chip.on{background:linear-gradient(110deg,#a77d35,#d8b26a 55%,#c19a52);color:#171207;border-color:transparent;font-weight:700}'
    + '#studio-demo .sd-topic{font-family:\'Playfair Display\',serif;font-size:clamp(22px,2.6vw,30px);font-weight:700;color:#f2ecd9}'
    + '#studio-demo .sd-btn{cursor:pointer;border:0;display:inline-flex;align-items:center;gap:11px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:13.5px;letter-spacing:.14em;padding:17px 30px;transition:transform .18s,box-shadow .18s}'
    + '#studio-demo .sd-btn:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(230,196,120,.35)}'
    + '#studio-demo .sd-btn.ghost{background:transparent;border:1px solid rgba(193,154,82,.5);color:#e6c478}'
    + '#studio-demo .sd-btn.ghost:hover{background:rgba(193,154,82,.12);box-shadow:none}'
    // workspace
    + '#studio-demo .sd-work{display:grid;grid-template-columns:1fr 1.05fr;gap:26px}'
    + '#studio-demo .sd-col-h{color:#c19a52;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.2em;margin:0 0 14px;display:flex;align-items:center;gap:8px}'
    + '#studio-demo .sd-out{border:1px solid rgba(193,154,82,.18);background:rgba(3,4,9,.5);padding:16px 18px;margin-bottom:13px;opacity:0;transform:translateY(10px);transition:opacity .5s,transform .5s}'
    + '#studio-demo .sd-out.in{opacity:1;transform:none}'
    + '#studio-demo .sd-out .ot{color:#e6c478;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.16em;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}'
    + '#studio-demo .sd-out .ot .ok{color:#5A7A3E}'
    + '#studio-demo .sd-out p{margin:0;color:#cdd2dc;font-size:13.5px;line-height:1.6}'
    + '#studio-demo .sd-out.mono p{font-family:\'Special Elite\',monospace;font-size:12px;color:#9fb0a4;line-height:1.7;word-break:break-word}'
    + '#studio-demo .sd-canvas{position:relative;aspect-ratio:16/9;overflow:hidden;border:1px solid rgba(193,154,82,.28);background:radial-gradient(circle at 50% 40%,#12131a,#08090e);display:grid;place-items:center}'
    + '#studio-demo .sd-canvas .empty{text-align:center;display:grid;gap:16px;justify-items:center;padding:20px}'
    + '#studio-demo .sd-canvas .empty .hint{color:#6d7380;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.12em}'
    + '#studio-demo .sd-canvas img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.06);transition:opacity 1s ease,transform 6s ease}'
    + '#studio-demo .sd-canvas img.in{opacity:1;transform:scale(1)}'
    + '#studio-demo .sd-cap{position:absolute;left:0;right:0;bottom:0;padding:12px 15px;background:linear-gradient(to top,rgba(4,5,10,.92),transparent);color:#f2ecd9;font-family:\'Special Elite\',monospace;font-size:11.5px;letter-spacing:.06em;opacity:0;transition:opacity .6s .4s;display:flex;align-items:center;justify-content:space-between;gap:10px}'
    + '#studio-demo .sd-cap.in{opacity:1}'
    + '#studio-demo .sd-cap a{color:#e6c478;text-decoration:none;white-space:nowrap}'
    + '#studio-demo .sd-cap a:hover{color:#fff0b1}'
    + '#studio-demo .sd-load{position:absolute;inset:0;display:grid;place-items:center;gap:16px;background:rgba(6,7,13,.6);text-align:center}'
    + '#studio-demo .sd-spin{width:44px;height:44px;border-radius:50%;border:2px solid rgba(193,154,82,.25);border-top-color:#e6c478;animation:sd-spin .8s linear infinite}'
    + '@keyframes sd-spin{to{transform:rotate(360deg)}}'
    + '#studio-demo .sd-load .lt{color:#d8c79b;font-family:\'Special Elite\',monospace;font-size:11.5px;letter-spacing:.14em}'
    + '#studio-demo .sd-prog{width:180px;height:3px;background:rgba(193,154,82,.18);overflow:hidden}'
    + '#studio-demo .sd-prog i{display:block;height:100%;width:0;background:linear-gradient(90deg,#a77d35,#e6c478);animation:sd-prog 1.9s ease forwards}'
    + '@keyframes sd-prog{to{width:100%}}'
    + '#studio-demo .sd-foot{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:22px}'
    + '#studio-demo .sd-note{color:#6d7380;font-size:11.5px}'
    + '@media(max-width:820px){#studio-demo .sd-work{grid-template-columns:1fr}}';

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function render(mount) {
    var cur = 0;

    function stepA() {
      var p = PRESETS[cur];
      mount.querySelector('.sd-body').innerHTML =
        '<div class="sd-brief">'
        + '<span class="sd-lbl">1 · KONUNU SEÇ</span>'
        + '<div class="sd-chips" id="sd-chips">'
        + PRESETS.map(function (x, i) { return '<button class="sd-chip' + (i === cur ? ' on' : '') + '" data-i="' + i + '">' + esc(x.ad) + '</button>'; }).join('')
        + '</div>'
        + '<div class="sd-topic" id="sd-topic">“' + esc(p.ad) + '” <span style="color:#818797;font-weight:400;font-size:.62em;font-family:\'Special Elite\',monospace"> · ' + esc(p.alt) + '</span></div>'
        + '<span class="sd-lbl" style="margin-top:6px">2 · STUDIO’YU ÇALIŞTIR</span>'
        + '<button class="sd-btn" id="sd-try"><span style="font-size:16px">⌖</span> STUDIO’YU DENE <span>→</span></button>'
        + '<div class="sd-note">Gerçek örnek · kredi harcanmaz</div>'
        + '</div>';
      mount.querySelector('#sd-chips').addEventListener('click', function (e) {
        var b = e.target.closest('.sd-chip'); if (!b) return;
        cur = +b.getAttribute('data-i'); stepA();
      });
      mount.querySelector('#sd-try').addEventListener('click', workspace);
    }

    function workspace() {
      var p = PRESETS[cur];
      mount.querySelector('.sd-body').innerHTML =
        '<div class="sd-work">'
        + '<div>'
        + '<div class="sd-col-h">◈ AJAN ÇIKTISI</div>'
        + '<div class="sd-out" id="o1"><div class="ot"><span>SENARYO</span><span class="ok">✓ hazır</span></div><p>' + esc(p.senaryo) + '</p></div>'
        + '<div class="sd-out" id="o2"><div class="ot"><span>SESLENDİRME YÖNERGESİ</span><span class="ok">✓ hazır</span></div><p>' + esc(p.ses) + '</p></div>'
        + '<div class="sd-out mono" id="o3"><div class="ot"><span>GÖRSEL PROMPTU</span><span class="ok">✓ hazır</span></div><p>' + esc(p.prompt) + '</p></div>'
        + '</div>'
        + '<div>'
        + '<div class="sd-col-h">◉ SAHNE</div>'
        + '<div class="sd-canvas" id="sd-canvas">'
        + '<div class="empty" id="sd-empty"><span class="hint">Prompt hazır — sahneye çevir</span>'
        + '<button class="sd-btn" id="sd-gen"><span style="font-size:15px">◉</span> GÖRSEL OLUŞTUR</button></div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<div class="sd-foot"><button class="sd-btn ghost" id="sd-reset">↺ Başka konu dene</button><a class="sd-btn" href="/studio" style="text-decoration:none">Studio’da kendin üret →</a></div>';
      // çıktıları sırayla belirt
      ['o1', 'o2', 'o3'].forEach(function (id, i) {
        setTimeout(function () { var n = mount.querySelector('#' + id); if (n) n.classList.add('in'); }, 220 + i * 480);
      });
      mount.querySelector('#sd-reset').addEventListener('click', stepA);
      mount.querySelector('#sd-gen').addEventListener('click', generate);
    }

    function generate() {
      var p = PRESETS[cur];
      var canvas = mount.querySelector('#sd-canvas');
      var empty = mount.querySelector('#sd-empty');
      if (empty) empty.remove();
      canvas.insertAdjacentHTML('beforeend',
        '<div class="sd-load" id="sd-load"><div class="sd-spin"></div><div class="lt">Sahne oluşturuluyor…</div><div class="sd-prog"><i></i></div></div>');
      // görseli önceden yükle
      var pre = new Image(); pre.src = p.img;
      setTimeout(function () {
        var load = mount.querySelector('#sd-load'); if (load) load.remove();
        canvas.insertAdjacentHTML('beforeend',
          '<img id="sd-img" src="' + esc(p.img) + '" alt="' + esc(p.cap) + '">'
          + '<div class="sd-cap" id="sd-cap"><span>' + esc(p.cap) + '</span><a href="/studio">Studio’da aç →</a></div>');
        requestAnimationFrame(function () {
          var im = mount.querySelector('#sd-img'); if (im) im.classList.add('in');
          var cap = mount.querySelector('#sd-cap'); if (cap) cap.classList.add('in');
        });
      }, 1950);
    }

    // iskelet
    mount.innerHTML =
      '<div class="sd-glow"></div>'
      + '<div class="sd-wrap">'
      + '<p class="sd-kick"><span class="d"></span>CANLI DEMO · STUDIO</p>'
      + '<h2>30 saniyede bir sahne üret</h2>'
      + '<p class="sd-sub">Bir konu seç; Studio senaryoyu, seslendirme yönergesini ve sinematik görsel promptunu çıkarsın. Sonra tek tıkla sahneyi görsele çevir. İşte tam olarak böyle çalışıyor — hemen burada dene.</p>'
      + '<div class="sd-app"><div class="sd-bar"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="tt">tarihajani.com / studio · canlı demo</span></div><div class="sd-body"></div></div>'
      + '</div>';
    stepA();
  }

  function boot() {
    var mount = document.getElementById('studio-demo-mount');
    if (!mount) return false;
    if (mount.getAttribute('data-ready')) return true;
    var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    mount.setAttribute('data-ready', '1');
    render(mount);
    return true;
  }

  window.__sdInit = true;
  if (!boot()) {
    var tries = 0;
    var iv = setInterval(function () { if (boot() || ++tries > 60) clearInterval(iv); }, 120);
    document.addEventListener('DOMContentLoaded', boot);
  }
})();

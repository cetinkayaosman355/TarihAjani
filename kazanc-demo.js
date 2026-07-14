/* Tarih Ajanı — Ana sayfa "Seni Ne Bekliyor" bölümü (kazanç projeksiyonu).
   Tam genişlik büyüme grafiği: ilk 90 günün temsilî abone eğrisi, kilometre
   taşları (ilk video → para kazanma → ilk gelir), sayaçlı istatistikler ve
   gelir kanalları. Görünüme girince animasyonla çizilir.
   #kazanc-demo-mount içine kendi kendine yerleşir (dc bağımsız). */
(function () {
  if (window.__kzInit) return;

  var MILES = [
    {x:100, y:277, ln:'yt', pos:'up',   k:'GÜN 3',  d:'İlk video + ilk Reels'},
    {x:500, y:221, ln:'ig', pos:'up',   k:'GÜN 15', d:'İlk viral kesit · 1M izlenme'},
    {x:760, y:190, ln:'yt', pos:'down', k:'GÜN 22', d:'YouTube para kazanma açıldı'}
  ];
  var STATS = [
    {n:35000, s:'',  l:'INSTAGRAM TAKİPÇİ'},
    {n:7000,  s:'',  l:'YOUTUBE ABONE'},
    {n:5,     s:'M', l:'YOUTUBE İZLENME'},
    {n:3,     s:'',  l:'GELİR KANALI'}
  ];
  var GELIR = [
    {ico:'▶', b:'REKLAM GELİRİ', s:'1.000 abone ve izlenme eşiği sonrası kanal reklam kazancına açılır.'},
    {ico:'◈', b:'SPONSORLUK',    s:'Niş tarih kanalları, marka iş birlikleri için küçükken bile değerlidir.'},
    {ico:'⌘', b:'ÜRÜN & ÜYELİK', s:'Kendi e-kitabını, içeriğini ve üyeliğini kitlene doğrudan sat.'}
  ];

  var CSS = ''
    + '#kazanc-demo{position:relative;background:#06070d;border-top:1px solid rgba(193,154,82,.14);overflow:hidden}'
    + '#kazanc-demo .kz-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle 640px at 88% 10%,rgba(230,196,120,.09),transparent 60%),radial-gradient(circle 520px at 4% 90%,rgba(158,43,35,.08),transparent 58%)}'
    + '#kazanc-demo .kz-wrap{position:relative;width:min(1540px,92vw);margin:0 auto;padding:clamp(30px,3.2vw,50px) clamp(22px,3vw,48px)}'
    + '#kazanc-demo .kz-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:14px;margin-bottom:clamp(18px,2vw,28px)}'
    + '#kazanc-demo .kz-live{display:inline-flex;align-items:center;gap:9px;color:#e6c478;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.22em;border:1px solid rgba(193,154,82,.38);padding:7px 14px;background:rgba(12,10,6,.5)}'
    + '#kazanc-demo .kz-live i{font-style:normal;color:#7ba05a}'
    + '#kazanc-demo h2{margin:12px 0 8px;font-family:\'Playfair Display\',serif;font-size:clamp(28px,3.2vw,44px);font-weight:800;line-height:1.04;letter-spacing:-.015em;color:#f6efe0}'
    + '#kazanc-demo h2 .g{background:linear-gradient(102deg,#b18742,#e6c478 42%,#fff0b1 52%,#a5762f);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '#kazanc-demo .kz-sub{margin:0;color:#b3b9c6;font-size:14.5px;line-height:1.6;max-width:60ch}'
    // istatistik sayaçları (başlığın sağında)
    + '#kazanc-demo .kz-stats{display:grid;grid-template-columns:repeat(4,auto);gap:clamp(16px,2.4vw,44px)}'
    + '#kazanc-demo .kz-st b{display:block;font-family:\'Playfair Display\',serif;font-size:clamp(26px,2.6vw,40px);font-weight:800;color:#e6c478;line-height:1;font-variant-numeric:tabular-nums}'
    + '#kazanc-demo .kz-st span{display:block;margin-top:6px;font-family:\'Special Elite\',monospace;font-size:9.5px;letter-spacing:.16em;color:#77705c}'
    // grafik paneli
    + '#kazanc-demo .kz-chart{position:relative;border:1px solid rgba(193,154,82,.28);background:linear-gradient(165deg,#0a0b13,#080910 60%,#0a0b12);padding:clamp(14px,1.6vw,24px) clamp(14px,1.6vw,24px) 8px;box-shadow:0 36px 80px -44px rgba(0,0,0,.9)}'
    + '#kazanc-demo .kz-chart .lbl{position:absolute;top:16px;left:20px;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.2em;color:#9aa2b0}'
    + '#kazanc-demo .kz-chart .end{position:absolute;top:14px;right:20px;text-align:right}'
    + '#kazanc-demo .kz-chart .end small{display:block;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.18em;color:#c19a52;margin-bottom:5px}'
    + '#kazanc-demo .kz-chart .leg{display:flex;gap:14px;justify-content:flex-end;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.12em}'
    + '#kazanc-demo .kz-chart .leg .lg{display:inline-flex;align-items:center;gap:6px}'
    + '#kazanc-demo .kz-chart .leg .lg i{font-style:normal;font-size:12px}'
    + '#kazanc-demo .kz-chart .leg .ig{color:#e6c478}'
    + '#kazanc-demo .kz-chart .leg .yt{color:#e08a80}'
    + '#kazanc-demo svg{display:block;width:100%;height:auto}'
    + '#kazanc-demo .ln{fill:none;stroke-linecap:round}'
    + '#kazanc-demo .ln.ig{stroke:url(#kz-gold);stroke-width:3}'
    + '#kazanc-demo .ln.yt{stroke:url(#kz-red);stroke-width:2.5}'
    + '#kazanc-demo.kz-on .ln.ig{animation:kz-draw 2.2s ease forwards}'
    + '#kazanc-demo.kz-on .ln.yt{animation:kz-draw 2.2s ease .25s forwards}'
    + '@keyframes kz-draw{to{stroke-dashoffset:0}}'
    + '#kazanc-demo .ar{fill:url(#kz-area);opacity:0;transition:opacity 1.2s .9s}'
    + '#kazanc-demo.kz-on .ar{opacity:1}'
    + '#kazanc-demo .etxt{font-family:\'Special Elite\',monospace;font-size:11.5px;letter-spacing:.08em;opacity:0;transition:opacity .5s 2s;paint-order:stroke;stroke:#0a0b13;stroke-width:5px;stroke-linejoin:round}'
    + '#kazanc-demo .etxt.ig{fill:#e6c478}'
    + '#kazanc-demo .etxt.yt{fill:#e08a80}'
    + '#kazanc-demo.kz-on .etxt{opacity:1}'
    + '#kazanc-demo .mdot{fill:#e6c478;stroke:#171207;stroke-width:2;opacity:0;transition:opacity .4s}'
    + '#kazanc-demo .mdot.yt{fill:#c0463b}'
    + '#kazanc-demo .mtxt{font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.08em;fill:#c19a52;opacity:0;transition:opacity .4s;paint-order:stroke;stroke:#0a0b13;stroke-width:5px;stroke-linejoin:round}'
    + '#kazanc-demo .mtxt tspan.d{fill:#8d94a3;font-size:10.5px}'
    + '#kazanc-demo .grid line{stroke:rgba(230,220,196,.06);stroke-width:1}'
    + '#kazanc-demo .gx{font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.12em;fill:#5d6370}'
    // gelir kanalları + CTA
    + '#kazanc-demo .kz-low{display:grid;grid-template-columns:repeat(3,1fr) auto;gap:12px;align-items:stretch;margin-top:14px}'
    + '#kazanc-demo .kz-gel{border:1px solid rgba(193,154,82,.2);background:#070a12;padding:13px 15px;display:flex;gap:11px;align-items:flex-start}'
    + '#kazanc-demo .kz-gel .ico{flex:0 0 30px;height:30px;border:1px solid rgba(193,154,82,.4);color:#e6c478;display:grid;place-items:center;font-size:13px}'
    + '#kazanc-demo .kz-gel b{display:block;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.14em;color:#eadfc6;margin-bottom:4px}'
    + '#kazanc-demo .kz-gel span{color:#8b93a1;font-size:12px;line-height:1.5}'
    + '#kazanc-demo .kz-cta{display:flex;flex-direction:column;gap:8px;justify-content:center}'
    + '#kazanc-demo .kz-btn{cursor:pointer;border:0;display:inline-flex;align-items:center;justify-content:center;gap:9px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:13px;letter-spacing:.14em;padding:15px 30px;text-decoration:none;white-space:nowrap;transition:transform .18s,box-shadow .18s}'
    + '#kazanc-demo .kz-btn:hover{transform:translateY(-2px);box-shadow:0 14px 44px -14px rgba(230,196,120,.55)}'
    + '#kazanc-demo .kz-btn.ghost{background:transparent;border:1px solid rgba(193,154,82,.5);color:#e6c478}'
    + '#kazanc-demo .kz-btn.ghost:hover{background:rgba(193,154,82,.12);box-shadow:none}'
    + '#kazanc-demo .kz-dis{margin:12px 2px 0;color:#5d6370;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.06em}'
    + '@media(max-width:1100px){#kazanc-demo .kz-stats{grid-template-columns:repeat(2,auto)}#kazanc-demo .kz-low{grid-template-columns:1fr 1fr}#kazanc-demo .kz-cta{grid-column:1/-1;flex-direction:row}}'
    + '@media(max-width:640px){#kazanc-demo .kz-low{grid-template-columns:1fr}#kazanc-demo .mtxt{display:none}}'
    + '@media(prefers-reduced-motion:reduce){#kazanc-demo .ln{stroke-dashoffset:0!important;animation:none}#kazanc-demo .ar,#kazanc-demo .mdot,#kazanc-demo .mtxt,#kazanc-demo .kz-chart .end b{opacity:1!important;transition:none}}';

  // iki eğri (viewBox 1000x320): Instagram hızlı yükselir, YouTube daha yavaş ama istikrarlı
  var PATH_IG = 'M20,278 C150,274 260,264 400,238 C520,214 620,160 720,110 C820,66 900,48 968,40';
  var PATH_YT = 'M20,278 C160,277 300,272 440,258 C560,246 680,215 780,185 C870,162 930,148 968,140';

  function svgHTML(){
    var m = MILES.map(function(mi,i){
      var ty = mi.pos==='down' ? mi.y+34 : mi.y-40;
      return '<circle class="mdot '+mi.ln+'" data-i="'+i+'" cx="'+mi.x+'" cy="'+mi.y+'" r="5"></circle>'
        + '<text class="mtxt" data-i="'+i+'" x="'+mi.x+'" y="'+ty+'" text-anchor="'+(mi.x>860?'end':'middle')+'">'
        + '<tspan>'+mi.k+'</tspan><tspan class="d" x="'+mi.x+'" dy="15" '+(mi.x>860?'text-anchor="end"':'')+'>'+mi.d+'</tspan></text>';
    }).join('');
    return '<svg viewBox="0 0 1000 320" preserveAspectRatio="xMidYMid meet" aria-label="İlk 30 gün temsilî büyüme: Instagram ve YouTube">'
      + '<defs>'
      + '<linearGradient id="kz-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a77d35"/><stop offset=".55" stop-color="#e6c478"/><stop offset="1" stop-color="#fff0b1"/></linearGradient>'
      + '<linearGradient id="kz-red" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7c261d"/><stop offset=".6" stop-color="#c0463b"/><stop offset="1" stop-color="#e08a80"/></linearGradient>'
      + '<linearGradient id="kz-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(230,196,120,.2)"/><stop offset="1" stop-color="rgba(230,196,120,0)"/></linearGradient>'
      + '</defs>'
      + '<g class="grid"><line x1="20" y1="278" x2="980" y2="278"/><line x1="20" y1="200" x2="980" y2="200"/><line x1="20" y1="122" x2="980" y2="122"/></g>'
      + '<text class="gx" x="20" y="304">GÜN 0</text><text class="gx" x="500" y="304" text-anchor="middle">GÜN 15</text><text class="gx" x="980" y="304" text-anchor="end">GÜN 30</text>'
      + '<path class="ar" d="'+PATH_IG+' L968,278 L20,278 Z"></path>'
      + '<path class="ln yt" id="kz-line-yt" d="'+PATH_YT+'"></path>'
      + '<path class="ln ig" id="kz-line-ig" d="'+PATH_IG+'"></path>'
      + '<text class="etxt ig" x="958" y="26" text-anchor="end">INSTAGRAM · 35.000 takipçi</text>'
      + '<text class="etxt yt" x="958" y="118" text-anchor="end">YOUTUBE · 7.000 abone · 5M izlenme</text>'
      + m + '</svg>';
  }

  function render(mount) {
    mount.innerHTML =
      '<div class="kz-glow"></div><div class="kz-wrap">'
      + '<div class="kz-head"><div>'
      + '<div class="kz-live"><i>₺</i>SENİ NE BEKLİYOR · TEMSİLÎ PROJEKSİYON</div>'
      + '<h2>Sistemi kur, <span class="g">kazanca çevir.</span></h2>'
      + '<p class="kz-sub">Akademi’de öğren, Arşiv’den konu çek, Studio’da üret. Video + kesit yayınlayan bir tarih kanalının ilk 30 günü böyle görünür.</p>'
      + '</div>'
      + '<div class="kz-stats">' + STATS.map(function(s,i){return '<div class="kz-st"><b data-n="'+s.n+'" data-s="'+s.s+'" id="kz-n'+i+'">0'+s.s+'</b><span>'+s.l+'</span></div>';}).join('') + '</div>'
      + '</div>'
      + '<div class="kz-chart"><div class="lbl">BÜYÜME · İLK 30 GÜN</div>'
      + '<div class="end"><small>İLK 30 GÜN (temsilî)</small>'
      + '<div class="leg"><span class="lg ig"><i>◉</i>INSTAGRAM</span><span class="lg yt"><i>▶</i>YOUTUBE</span></div></div>'
      + svgHTML() + '</div>'
      + '<div class="kz-low">'
      + GELIR.map(function(g){return '<div class="kz-gel"><span class="ico">'+g.ico+'</span><div><b>'+g.b+'</b><span>'+g.s+'</span></div></div>';}).join('')
      + '<div class="kz-cta"><a class="kz-btn" href="/uyelik">SİSTEME KATIL →</a><a class="kz-btn ghost" href="/egitim">Akademi’yi Gör</a></div>'
      + '</div>'
      + '<p class="kz-dis">* Temsilî senaryo: Tarih Ajanı yöntemleriyle, düzenli video + kesit (Reels/Shorts) üretimi varsayımıyla hazırlanmış örnek projeksiyondur; kazanç garantisi değildir.</p>'
      + '</div>';

    var sec = document.getElementById('kazanc-demo') || mount;
    mount.querySelectorAll('.ln').forEach(function(line){
      if (!line.getTotalLength) return;
      var L = line.getTotalLength();
      line.style.strokeDasharray = L; line.style.strokeDashoffset = L;
    });

    var played = false;
    function playAnim(){
      if (played) return; played = true;
      sec.classList.add('kz-on');
      // kilometre taşları çizim ilerledikçe belirsin
      MILES.forEach(function(mi,i){
        setTimeout(function(){
          mount.querySelectorAll('[data-i="'+i+'"]').forEach(function(n){ n.style.opacity='1'; });
        }, 300 + (mi.x/1000)*2000);
      });
      // sayaçlar
      STATS.forEach(function(s,i){
        var el = mount.querySelector('#kz-n'+i); if(!el) return;
        var t0 = null, dur = 1600;
        function step(ts){
          if(!t0) t0 = ts;
          var p = Math.min(1,(ts-t0)/dur); p = 1-Math.pow(1-p,3);
          el.textContent = Math.round(s.n*p).toLocaleString('tr-TR') + s.s;
          if(p<1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }

    if (window.IntersectionObserver) {
      new IntersectionObserver(function(es,obs){
        es.forEach(function(e){ if(e.isIntersecting){ playAnim(); obs.disconnect(); } });
      },{threshold:.35}).observe(mount.querySelector('.kz-chart'));
    } else { playAnim(); }
  }

  function injectStyle(){ if(document.getElementById('kz-style'))return; var s=document.createElement('style'); s.id='kz-style'; s.textContent=CSS; document.head.appendChild(s); }
  function ensure(){ var m=document.getElementById('kazanc-demo-mount'); if(!m)return; if(m.__kzDone&&m.querySelector('.kz-wrap'))return; injectStyle(); m.__kzDone=true; render(m); }
  window.__kzInit=true; ensure(); document.addEventListener('DOMContentLoaded',ensure);
  var t=0,iv=setInterval(function(){ensure();if(++t>40)clearInterval(iv);},500);
  if(window.MutationObserver){var mt=null;new MutationObserver(function(){clearTimeout(mt);mt=setTimeout(ensure,150);}).observe(document.documentElement,{childList:true,subtree:true});}
})();

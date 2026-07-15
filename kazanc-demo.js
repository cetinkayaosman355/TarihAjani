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
    {ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v4a1 1 0 0 0 1 1h2l9 4V5l-9 4H5a1 1 0 0 0-1 1Z"/><path d="M8 15v3.4"/><path d="M18.5 9.5a3.2 3.2 0 0 1 0 5"/></svg>', b:'REKLAM GELİRİ', s:'1.000 abone ve izlenme eşiği sonrası kanal reklam kazancına açılır.'},
    {ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="4.8"/><path d="M9.2 13 7.7 20l4.3-2.4L16.3 20l-1.5-7"/></svg>', b:'SPONSORLUK',    s:'Niş tarih kanalları, marka iş birlikleri için küçükken bile değerlidir.'},
    {ico:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 4.8h6.8c.5 0 1 .2 1.3.6l6 6a1.9 1.9 0 0 1 0 2.7l-4.4 4.4a1.9 1.9 0 0 1-2.7 0l-6-6a1.9 1.9 0 0 1-.6-1.3V4.8Z"/><circle cx="8.6" cy="8.6" r="1.2"/></svg>', b:'ÜRÜN & ÜYELİK', s:'Kendi e-kitabını, içeriğini ve üyeliğini kitlene doğrudan sat.'}
  ];

  var CSS = ''
    + '#kazanc-demo{position:relative;background:linear-gradient(180deg,#040509,#080705 42%,#080705 58%,#040509);overflow:hidden}'
    + '#kazanc-demo .kz-glow{display:none}'
    + '#kazanc-demo .kz-wrap{position:relative;width:min(1460px,90vw);margin:0 auto;padding:clamp(48px,5vw,64px) clamp(22px,3vw,48px)}'
    + '#kazanc-demo .kz-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:14px;margin-bottom:clamp(18px,2vw,28px)}'
    + '#kazanc-demo .kz-live{display:inline-flex;align-items:center;gap:9px;color:#e6c478;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.22em;border:1px solid rgba(193,154,82,.38);padding:7px 14px;background:rgba(12,10,6,.5)}'
    + '#kazanc-demo .kz-live i{font-style:normal;color:#7ba05a}'
    + '#kazanc-demo h2{margin:12px 0 8px;font-family:\'Playfair Display\',serif;font-size:clamp(25px,2.8vw,38px);font-weight:800;line-height:1.04;letter-spacing:-.015em;color:#f6efe0}'
    + '#kazanc-demo h2 .g{background:linear-gradient(102deg,#b18742,#e6c478 42%,#fff0b1 52%,#a5762f);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '#kazanc-demo .kz-sub{margin:0;color:#b3b9c6;font-size:14.5px;line-height:1.6;max-width:60ch}'
    // istatistik sayaçları (başlığın sağında)
    + '#kazanc-demo .kz-stats{display:grid;grid-template-columns:repeat(4,auto);gap:clamp(16px,2.4vw,44px)}'
    + '#kazanc-demo .kz-st b{display:block;font-family:\'Playfair Display\',serif;font-size:clamp(26px,2.6vw,40px);font-weight:800;color:#e6c478;line-height:1;font-variant-numeric:tabular-nums}'
    + '#kazanc-demo .kz-st span{display:block;margin-top:6px;font-family:\'Special Elite\',monospace;font-size:9.5px;letter-spacing:.16em;color:#948c72}'
    // grafik paneli
    + '#kazanc-demo .kz-chart{position:relative;border:1px solid rgba(193,154,82,.28);background:radial-gradient(120% 130% at 86% 6%, #14100a 0%, #0c0906 42%, #090705 100%);padding:clamp(14px,1.6vw,24px) clamp(14px,1.6vw,24px) 8px;box-shadow:0 36px 80px -44px rgba(0,0,0,.9)}'
    + '#kazanc-demo .kz-chart .lbl{position:absolute;top:16px;left:20px;display:flex;align-items:center;gap:18px;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.2em;color:#9aa2b0}'
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
    + '#kazanc-demo .ln.glow{filter:url(#kz-glow)}'
    + '#kazanc-demo .ln.yt{stroke:url(#kz-red);stroke-width:2.2;opacity:.85}'
    + '#kazanc-demo.kz-on .ln.ig{animation:kz-draw 2.2s ease forwards}'
    + '#kazanc-demo.kz-on .ln.yt{animation:kz-draw 2.2s ease .25s forwards}'
    + '@keyframes kz-draw{to{stroke-dashoffset:0}}'
    // altın eğri düğümleri + parlayan uç
    + '#kazanc-demo .ignode{fill:#0b0805;stroke:#e6c478;stroke-width:2;opacity:0;transition:opacity .4s}'
    + '#kazanc-demo.kz-on .ignode{opacity:.9;animation:kz-node 2.4s ease-in-out infinite}'
    + '#kazanc-demo .igtip{fill:#fff0b1;filter:url(#kz-glow);opacity:0;transition:opacity .5s 1.9s}'
    + '#kazanc-demo .igtip-core{fill:#fffaf0;opacity:0;transition:opacity .5s 1.9s}'
    + '#kazanc-demo.kz-on .igtip{opacity:.95;animation:kz-tip 2.2s ease-in-out infinite}'
    + '#kazanc-demo.kz-on .igtip-core{opacity:1}'
    + '@keyframes kz-node{0%,100%{opacity:.55}50%{opacity:1}}'
    + '@keyframes kz-tip{0%,100%{opacity:.75}50%{opacity:1}}'
    + '#kazanc-demo .ar{fill:url(#kz-area);opacity:0;transition:opacity 1.2s .9s}'
    + '#kazanc-demo.kz-on .ar{opacity:1}'
    + '#kazanc-demo .etxt{opacity:0;transition:opacity .5s 2s;paint-order:stroke;stroke:rgba(8,9,16,.85);stroke-width:3px;stroke-linejoin:round}'
    + '#kazanc-demo .etxt .pn{font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:.22em}'
    + '#kazanc-demo .etxt .nv{font-family:\'Playfair Display\',serif;font-style:italic;font-weight:700;font-size:17px;letter-spacing:.01em}'
    + '#kazanc-demo .etxt.ig .pn{fill:#c19a52}'
    + '#kazanc-demo .etxt.ig .nv{fill:#f0d9a0}'
    + '#kazanc-demo .etxt.yt .pn{fill:#cf6d63}'
    + '#kazanc-demo .etxt.yt .nv{fill:#efb0a8}'
    + '#kazanc-demo.kz-on .etxt{opacity:1}'
    + '#kazanc-demo .mdot{fill:#e6c478;stroke:#171207;stroke-width:2;opacity:0;transition:opacity .4s}'
    + '#kazanc-demo .mdot.yt{fill:#c0463b}'
    + '#kazanc-demo .mtxt{opacity:0;transition:opacity .4s;paint-order:stroke;stroke:rgba(8,9,16,.85);stroke-width:3px;stroke-linejoin:round}'
    + '#kazanc-demo .mtxt tspan.k{font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:.22em;fill:#a5824a}'
    + '#kazanc-demo .mtxt tspan.d{font-family:\'Playfair Display\',serif;font-style:italic;font-size:14.5px;fill:#d6dbe4;letter-spacing:.01em}'
    + '#kazanc-demo .grid line{stroke:rgba(230,220,196,.06);stroke-width:1}'
    + '#kazanc-demo .gx{font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.12em;fill:#7e8598}'
    // gelir kanalları + CTA
    + '#kazanc-demo .kz-low{display:grid;grid-template-columns:repeat(3,1fr) auto;gap:12px;align-items:stretch;margin-top:14px}'
    + '#kazanc-demo .kz-gel{border:1px solid rgba(193,154,82,.2);background:#070a12;padding:13px 15px;display:flex;gap:11px;align-items:flex-start}'
    + '#kazanc-demo .kz-gel .ico{flex:0 0 30px;height:30px;border:1px solid rgba(193,154,82,.4);color:#e6c478;display:grid;place-items:center}'
    + '#kazanc-demo .kz-gel .ico svg{width:15px;height:15px}'
    + '#kazanc-demo .kz-gel b{display:block;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.14em;color:#eadfc6;margin-bottom:4px}'
    + '#kazanc-demo .kz-gel span{color:#8b93a1;font-size:12px;line-height:1.5}'
    + '#kazanc-demo .kz-cta{display:flex;flex-direction:column;gap:8px;justify-content:center}'
    + '#kazanc-demo .kz-btn{cursor:pointer;border:0;display:inline-flex;align-items:center;justify-content:center;gap:9px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:13px;letter-spacing:.14em;padding:15px 30px;text-decoration:none;white-space:nowrap;transition:transform .18s,box-shadow .18s}'
    + '#kazanc-demo .kz-btn:hover{transform:translateY(-2px);box-shadow:0 14px 44px -14px rgba(230,196,120,.55)}'
    + '#kazanc-demo .kz-btn.ghost{background:transparent;border:1px solid rgba(193,154,82,.5);color:#e6c478}'
    + '#kazanc-demo .kz-btn.ghost:hover{background:rgba(193,154,82,.12);box-shadow:none}'
    + '#kazanc-demo .kz-link{align-self:center;text-align:center;color:#c19a52;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-weight:600;font-size:13px;text-decoration:underline;text-underline-offset:3px;padding:6px}'
    + '#kazanc-demo .kz-link:hover{color:#e6c478}'
    + '#kazanc-demo .kz-dis{margin:12px 2px 0;color:#7e8598;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.06em}'
    + '@media(max-width:1100px){#kazanc-demo .kz-stats{grid-template-columns:repeat(2,auto)}#kazanc-demo .kz-low{grid-template-columns:1fr 1fr}#kazanc-demo .kz-cta{grid-column:1/-1;flex-direction:row}}'
    + '@media(max-width:640px){'
      + '#kazanc-demo .kz-wrap{width:min(1460px,92vw);padding:clamp(40px,9vw,52px) 14px}'
      + '#kazanc-demo h2{font-size:clamp(24px,7.4vw,34px)}#kazanc-demo .kz-sub{font-size:13.5px}'
      + '#kazanc-demo .kz-stats{grid-template-columns:repeat(2,1fr);gap:16px 18px}#kazanc-demo .kz-st b{font-size:28px}'
      + '#kazanc-demo .kz-low{grid-template-columns:1fr}#kazanc-demo .kz-low>*{min-width:0}'
      + '#kazanc-demo .kz-cta{grid-column:auto;flex-direction:column}#kazanc-demo .kz-btn{width:100%}'
      + '#kazanc-demo .kz-chart{padding:14px 14px 8px}'
      + '#kazanc-demo .kz-chart .lbl{position:static;display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin-bottom:6px}'
      + '#kazanc-demo .kz-chart .end{position:static;text-align:left;margin-bottom:4px}#kazanc-demo .kz-chart .end small{margin-bottom:0}'
      + '#kazanc-demo .mtxt,#kazanc-demo .etxt{display:none}'
      + '#kazanc-demo .kz-gel span{font-size:12px}#kazanc-demo .kz-dis{font-size:9px}'
      + '}'
    + '@media(prefers-reduced-motion:reduce){#kazanc-demo .ln{stroke-dashoffset:0!important;animation:none}#kazanc-demo .ar,#kazanc-demo .mdot,#kazanc-demo .mtxt,#kazanc-demo .kz-chart .end b,#kazanc-demo .ignode,#kazanc-demo .igtip,#kazanc-demo .igtip-core{opacity:1!important;transition:none;animation:none!important}}';

  // iki eğri (viewBox 0 62 1000 258): tepe noktası çerçeve içinde kalsın (y>=88), yukarı taşma yok.
  // Instagram: yumuşak ivmeli S-eğrisi, sağ üstte parlak uç. YouTube: daha yavaş, istikrarlı.
  var PATH_IG = 'M20,282 C180,279 320,270 450,244 C560,222 650,182 740,150 C830,120 905,104 968,92';
  var PATH_YT = 'M20,282 C170,280 300,274 440,260 C560,248 680,218 780,188 C868,162 930,150 968,144';
  // altın eğri üzerinde parlayan halka-düğümler (referanstaki tırmanan noktalar)
  var IG_NODES = [[140,278],[300,268],[450,244],[600,206],[740,150],[860,112]];

  function svgHTML(){
    var m = MILES.map(function(mi,i){
      var ty = mi.pos==='down' ? mi.y+32 : mi.y-42;
      return '<circle class="mdot '+mi.ln+'" data-i="'+i+'" cx="'+mi.x+'" cy="'+mi.y+'" r="5"></circle>'
        + '<text class="mtxt" data-i="'+i+'" x="'+mi.x+'" y="'+ty+'" text-anchor="'+(mi.x>860?'end':'middle')+'">'
        + '<tspan class="k">'+mi.k+'</tspan><tspan class="d" x="'+mi.x+'" dy="19" '+(mi.x>860?'text-anchor="end"':'')+'>'+mi.d+'</tspan></text>';
    }).join('');
    var nodes = IG_NODES.map(function(p){
      return '<circle class="ignode" cx="'+p[0]+'" cy="'+p[1]+'" r="4.5"></circle>';
    }).join('');
    return '<svg viewBox="0 62 1000 258" preserveAspectRatio="xMidYMid meet" aria-label="İlk 30 gün temsilî büyüme: Instagram ve YouTube">'
      + '<defs>'
      + '<linearGradient id="kz-gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a77d35"/><stop offset=".55" stop-color="#e6c478"/><stop offset="1" stop-color="#fff0b1"/></linearGradient>'
      + '<linearGradient id="kz-red" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7c261d"/><stop offset=".6" stop-color="#c0463b"/><stop offset="1" stop-color="#e08a80"/></linearGradient>'
      + '<linearGradient id="kz-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(230,196,120,.16)"/><stop offset="1" stop-color="rgba(230,196,120,0)"/></linearGradient>'
      + '<radialGradient id="kz-atmo" cx="0.86" cy="0.12" r="0.62"><stop offset="0" stop-color="rgba(230,180,90,.16)"/><stop offset=".4" stop-color="rgba(150,96,40,.06)"/><stop offset="1" stop-color="rgba(0,0,0,0)"/></radialGradient>'
      + '<filter id="kz-glow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
      + '</defs>'
      + '<rect x="0" y="62" width="1000" height="258" fill="url(#kz-atmo)"></rect>'
      + '<g class="grid"><line x1="20" y1="278" x2="980" y2="278"/><line x1="20" y1="200" x2="980" y2="200"/><line x1="20" y1="122" x2="980" y2="122"/></g>'
      + '<text class="gx" x="20" y="304">GÜN 0</text><text class="gx" x="500" y="304" text-anchor="middle">GÜN 15</text><text class="gx" x="980" y="304" text-anchor="end">GÜN 30</text>'
      + '<path class="ar" d="'+PATH_IG+' L968,278 L20,278 Z"></path>'
      + '<path class="ln yt" id="kz-line-yt" d="'+PATH_YT+'"></path>'
      + '<path class="ln ig glow" id="kz-line-ig" d="'+PATH_IG+'"></path>'
      + '<g class="ignodes">'+nodes+'</g>'
      + '<circle class="igtip" cx="968" cy="92" r="6"></circle><circle class="igtip-core" cx="968" cy="92" r="2.6"></circle>'
      + '<text class="etxt ig" x="958" y="70" text-anchor="end"><tspan class="pn">INSTAGRAM</tspan><tspan class="nv" x="958" dy="19">35.000 takipçi</tspan></text>'
      + '<text class="etxt yt" x="958" y="122" text-anchor="end"><tspan class="pn">YOUTUBE</tspan><tspan class="nv" x="958" dy="19">7.000 abone · 5M izlenme</tspan></text>'
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
      + '<div class="kz-chart"><div class="lbl"><span>BÜYÜME · İLK 30 GÜN</span>'
      + '<span class="leg"><span class="lg ig"><i>◉</i>INSTAGRAM</span><span class="lg yt"><i>▶</i>YOUTUBE</span></span></div>'
      + '<div class="end"><small>İLK 30 GÜN (temsilî)</small></div>'
      + svgHTML() + '</div>'
      + '<div class="kz-low">'
      + GELIR.map(function(g){return '<div class="kz-gel"><span class="ico">'+g.ico+'</span><div><b>'+g.b+'</b><span>'+g.s+'</span></div></div>';}).join('')
      + '<div class="kz-cta"><a class="kz-btn" href="/uyelik">SİSTEME KATIL →</a><a class="kz-link" href="/egitim">Akademi’yi Gör →</a></div>'
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

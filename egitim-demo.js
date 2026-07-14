/* Tarih Ajanı — Ana sayfa "Akademi Canlı Demo" (Kanalını Kur).
   Sade konsept: bir niş seç → sahte kanal önizlemesi kurulur (banner + video
   kapakları + abone sayacı + büyüme grafiği). Eğitim/yol haritası yok.
   #egitim-demo-mount içine kendi kendine yerleşir (dc bağımsız). */
(function () {
  if (window.__edInit) return;

  var NICHES = [
    {k:'Savaş & Zafer', c:'#9E2B23', target:41000,
     vids:[{s:'istanbul-fethi',t:'İstanbul’un düştüğü son gece'},{s:'malazgirt',t:'Bir imparator nasıl esir düştü?'},{s:'kartaca',t:'Bir kent haritadan nasıl silinir'}]},
    {k:'Sır Dosyaları', c:'#7c5cab', target:53000,
     vids:[{s:'sezar-suikasti',t:'Sezar’ı kim kurtarabilirdi?'},{s:'otzi',t:'5300 yıllık cinayet çözüldü mü?'},{s:'fatih-olumu',t:'Fatih gerçekten zehirlendi mi?'}]},
    {k:'Antik Dünya', c:'#b5731f', target:32000,
     vids:[{s:'grek-atesi',t:'Suda sönmeyen ateşin sırrı'},{s:'vezuv-pompeii',t:'Bir günde yok olan şehir'},{s:'ea-nasir',t:'Tarihin ilk şikâyet mektubu'}]}
  ];

  var CSS = ''
    + '#egitim-demo{position:relative;background:#080910;border-top:1px solid rgba(193,154,82,.15);border-bottom:1px solid rgba(193,154,82,.15);overflow:hidden}'
    + '#egitim-demo .ed-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle 560px at 90% 6%,rgba(230,196,120,.11),transparent 60%),radial-gradient(circle 520px at 6% 96%,rgba(158,43,35,.08),transparent 58%)}'
    + '#egitim-demo .ed-wrap{position:relative;width:min(1660px,94vw);margin:0 auto;padding:clamp(28px,3vw,44px) clamp(20px,3vw,40px)}'
    + '#egitim-demo .ed-work{display:grid;grid-template-columns:.84fr 1.16fr;gap:clamp(24px,2.8vw,44px);align-items:center}'
    + '#egitim-demo .ed-panel{display:flex;flex-direction:column;gap:13px;min-width:0}'
    + '#egitim-demo .ed-live{display:inline-flex;align-items:center;gap:8px;color:#e08a80;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.2em}'
    + '#egitim-demo .ed-live .d{width:9px;height:9px;border-radius:50%;background:#e11d1d;box-shadow:0 0 0 0 rgba(225,29,29,.6);animation:ed-pulse 1.4s ease-out infinite}'
    + '@keyframes ed-pulse{0%{box-shadow:0 0 0 0 rgba(225,29,29,.55)}70%{box-shadow:0 0 0 9px rgba(225,29,29,0)}100%{box-shadow:0 0 0 0 rgba(225,29,29,0)}}'
    + '#egitim-demo h2{margin:6px 0 4px;font-family:\'Playfair Display\',serif;font-size:clamp(27px,3.1vw,42px);font-weight:800;line-height:1.03;letter-spacing:-.01em;color:#f6efe0}'
    + '#egitim-demo h2 .g{background:linear-gradient(102deg,#b18742,#e6c478 42%,#fff0b1 52%,#a5762f);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '#egitim-demo .ed-sub{margin:0 0 4px;color:#a7adba;font-size:13.5px;line-height:1.55;max-width:46ch}'
    + '#egitim-demo .ed-step{font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.2em;color:#818797}'
    + '#egitim-demo .ed-chips{display:flex;flex-wrap:wrap;gap:9px}'
    + '#egitim-demo .nchip{cursor:pointer;border:1px solid rgba(193,154,82,.38);background:rgba(193,154,82,.05);color:#d8c79b;font-family:\'Special Elite\',monospace;font-size:12.5px;letter-spacing:.04em;padding:12px 18px;transition:all .16s}'
    + '#egitim-demo .nchip:hover{border-color:#c19a52;color:#f2ecd9}'
    + '#egitim-demo .nchip.on{background:linear-gradient(110deg,#a77d35,#d8b26a 55%,#c19a52);color:#171207;border-color:transparent;font-weight:700}'
    + '#egitim-demo .ed-btn{cursor:pointer;border:0;display:inline-flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:13.5px;letter-spacing:.15em;padding:16px 28px;transition:transform .18s,box-shadow .18s;margin-top:2px}'
    + '#egitim-demo .ed-btn:hover{transform:translateY(-2px);box-shadow:0 14px 44px -14px rgba(230,196,120,.5)}'
    + '#egitim-demo .ed-btn:disabled{opacity:.75;cursor:default;transform:none;box-shadow:none}'
    + '#egitim-demo .ed-ghost{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:#e6c478;font-family:\'Special Elite\',monospace;font-weight:700;font-size:12px;letter-spacing:.1em;border-bottom:1px solid rgba(193,154,82,.4);padding-bottom:2px}'
    + '#egitim-demo .ed-ghost:hover{color:#fff0b1}'
    // kanal
    + '#egitim-demo .channel{border:1px solid rgba(193,154,82,.3);background:#0a0b12;overflow:hidden;box-shadow:0 40px 90px -54px #000}'
    + '#egitim-demo .ban{position:relative;height:112px;overflow:hidden}'
    + '#egitim-demo .ban canvas{position:absolute;inset:0;width:100%;height:100%}'
    + '#egitim-demo .idrow{display:flex;align-items:center;gap:14px;padding:0 20px;margin-top:-24px;position:relative;z-index:2}'
    + '#egitim-demo .av{width:60px;height:60px;border-radius:50%;border:3px solid #0a0b12;background:radial-gradient(circle at 40% 35%,#241b10,#0a0710);display:grid;place-items:center;font-family:\'Playfair Display\',serif;font-weight:800;font-size:24px;color:#e6c478;box-shadow:0 0 0 1px rgba(193,154,82,.5)}'
    + '#egitim-demo .idrow .nm{padding-bottom:4px}'
    + '#egitim-demo .idrow h3{font-family:\'Playfair Display\',serif;font-weight:800;font-size:19px;color:#fff;margin:0}'
    + '#egitim-demo .idrow .h{font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.1em;color:#9aa0ad}'
    + '#egitim-demo .subs{display:flex;align-items:baseline;gap:11px;padding:15px 20px 4px;flex-wrap:wrap}'
    + '#egitim-demo .subs .big{font-family:\'Playfair Display\',serif;font-weight:800;font-size:clamp(30px,3.8vw,46px);color:#e6c478;line-height:1;font-variant-numeric:tabular-nums}'
    + '#egitim-demo .subs .lb{font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.1em;color:#8b93a1}'
    + '#egitim-demo .subs .day{margin-left:auto;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.09em;color:#c19a52;border:1px solid rgba(193,154,82,.35);padding:5px 10px}'
    + '#egitim-demo .spark{width:100%;height:60px;display:block;padding:0 8px}'
    + '#egitim-demo .vids{display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;padding:6px 20px 18px}'
    + '#egitim-demo .vid{opacity:0;transform:translateY(8px);transition:opacity .5s,transform .5s}'
    + '#egitim-demo .vid.in{opacity:1;transform:none}'
    + '#egitim-demo .vid .pic{position:relative;aspect-ratio:16/9;overflow:hidden;border:1px solid rgba(193,154,82,.2)}'
    + '#egitim-demo .vid .pic img{width:100%;height:100%;object-fit:cover;opacity:.82}'
    + '#egitim-demo .vid .pic .pl{position:absolute;inset:0;margin:auto;width:26px;height:26px;border-radius:50%;background:rgba(158,43,35,.92);display:grid;place-items:center;color:#fff;font-size:10px}'
    + '#egitim-demo .vid .t{font-family:\'Playfair Display\',serif;font-size:11.5px;line-height:1.2;color:#cdd2dc;margin-top:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'
    + '@media(max-width:820px){#egitim-demo .ed-work{grid-template-columns:1fr}}';

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function render(mount){
    var RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
    var cur=0, anim=null;

    mount.innerHTML=
      '<div class="ed-glow"></div><div class="ed-wrap"><div class="ed-work">'
      + '<div class="ed-panel">'
      +   '<div class="ed-live"><span class="d"></span>AKADEMİ · CANLI DEMO</div>'
      +   '<h2>Kanalını kur, <span class="g">böyle görünür.</span></h2>'
      +   '<p class="ed-sub">Bir niş seç; kanalın nasıl görüneceğini ve ilk ayda nereye ulaşabileceğini canlı gör.</p>'
      +   '<div class="ed-step">1 · NİŞİNİ SEÇ</div>'
      +   '<div class="ed-chips" id="ed-chips">'+NICHES.map(function(x,i){return '<button class="nchip'+(i===0?' on':'')+'" data-i="'+i+'">'+esc(x.k)+'</button>';}).join('')+'</div>'
      +   '<button class="ed-btn" id="ed-go">▸ KANALI KUR</button>'
      +   '<a class="ed-ghost" href="/egitim">9 derslik Akademi ile öğren →</a>'
      + '</div>'
      + '<div class="channel">'
      +   '<div class="ban"><canvas id="ed-ban" width="900" height="224"></canvas></div>'
      +   '<div class="idrow"><div class="av">A</div><div class="nm"><h3 id="ed-name">Tarih Ajanı</h3><div class="h" id="ed-hand">TARİH KANALI</div></div></div>'
      +   '<div class="subs"><span class="big" id="ed-num">0</span><span class="lb">abone</span><span class="day">İLK 30 GÜN · temsilî</span></div>'
      +   '<canvas class="spark" id="ed-spark" width="520" height="60"></canvas>'
      +   '<div class="vids" id="ed-vids"></div>'
      + '</div>'
      + '</div></div>';

    var chips=mount.querySelector('#ed-chips'), go=mount.querySelector('#ed-go'),
        ban=mount.querySelector('#ed-ban'), spark=mount.querySelector('#ed-spark'),
        num=mount.querySelector('#ed-num'), name=mount.querySelector('#ed-name'),
        hand=mount.querySelector('#ed-hand'), vids=mount.querySelector('#ed-vids');

    function paintBan(c){var g=ban.getContext('2d'),W=ban.width,H=ban.height;var grd=g.createLinearGradient(0,0,W,H);grd.addColorStop(0,'#0a0710');grd.addColorStop(.5,c+'44');grd.addColorStop(1,'#0a0710');g.fillStyle=grd;g.fillRect(0,0,W,H);g.save();g.translate(W*.66,H*.54);g.rotate(-.13);g.font='800 84px "Playfair Display",Georgia,serif';g.textAlign='center';g.fillStyle='rgba(193,154,82,.12)';g.fillText('TARİH AJANI',0,28);g.restore();}
    function drawSpark(p){var g=spark.getContext('2d'),W=spark.width,H=spark.height;g.clearRect(0,0,W,H);var N=Math.max(2,Math.floor(p*40)),pts=[];for(var i=0;i<=N;i++){var t=i/40,y=Math.pow(t,2.1);pts.push([t*W,H-5-y*(H-10)]);}var grd=g.createLinearGradient(0,0,0,H);grd.addColorStop(0,'rgba(230,196,120,.34)');grd.addColorStop(1,'transparent');g.beginPath();g.moveTo(0,H);pts.forEach(function(q){g.lineTo(q[0],q[1]);});g.lineTo(pts[pts.length-1][0],H);g.closePath();g.fillStyle=grd;g.fill();g.beginPath();pts.forEach(function(q,i){i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]);});g.strokeStyle='#e6c478';g.lineWidth=2;g.stroke();var l=pts[pts.length-1];g.beginPath();g.arc(l[0],l[1],3.5,0,7);g.fillStyle='#fff0b1';g.fill();}

    function build(i){
      cur=i; var x=NICHES[i];
      [].forEach.call(chips.children,function(b,j){b.classList.toggle('on',j===i);});
      name.textContent='Tarih Ajanı · '+x.k.split(' ')[0];
      hand.textContent=x.k.toUpperCase()+' KANALI';
      paintBan(x.c);
      vids.innerHTML=x.vids.map(function(v,k){return '<div class="vid" id="ev'+k+'"><div class="pic"><img src="/assets/haber/'+v.s+'.jpg" alt="" loading="lazy"><span class="pl">▶</span></div><div class="t">'+esc(v.t)+'</div></div>';}).join('');
      x.vids.forEach(function(v,k){setTimeout(function(){var el=mount.querySelector('#ev'+k);if(el)el.classList.add('in');},RM?0:140+k*150);});
      // abone + grafik animasyonu
      if(anim)cancelAnimationFrame(anim);
      var t0=performance.now(),dur=RM?200:1500;
      (function tick(now){var p=Math.min(1,(now-t0)/dur||1);var e=1-Math.pow(1-p,2.3);num.textContent=Math.floor(x.target*e).toLocaleString('tr-TR');drawSpark(e);if(p<1)anim=requestAnimationFrame(tick);else num.textContent=x.target.toLocaleString('tr-TR');})(t0);
    }
    chips.addEventListener('click',function(e){var b=e.target.closest('.nchip');if(b)build(+b.dataset.i);});
    go.addEventListener('click',function(){build(cur);});
    drawSpark(0); paintBan(NICHES[0].c);
    // görününce otomatik kur
    var started=false;
    function start(){if(started)return;started=true;build(0);}
    if('IntersectionObserver' in window && !RM){var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){io.disconnect();setTimeout(start,250);}});},{threshold:.4});io.observe(mount.querySelector('.channel'));}
    else start();
  }

  function injectStyle(){ if(document.getElementById('ed-style'))return; var s=document.createElement('style'); s.id='ed-style'; s.textContent=CSS; document.head.appendChild(s); }
  function ensure(){ var m=document.getElementById('egitim-demo-mount'); if(!m)return; if(m.__edDone&&m.querySelector('.ed-wrap'))return; injectStyle(); m.__edDone=true; render(m); }
  window.__edInit=true; ensure(); document.addEventListener('DOMContentLoaded',ensure);
  var t=0,iv=setInterval(function(){ensure();if(++t>40)clearInterval(iv);},500);
  if(window.MutationObserver){var mt=null;new MutationObserver(function(){clearTimeout(mt);mt=setTimeout(ensure,150);}).observe(document.documentElement,{childList:true,subtree:true});}
})();

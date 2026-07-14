/* Tarih Ajanı — Ana sayfa "Akademi Canlı Demo" (Kanalını Kur yolculuğu).
   Üstte Eğitim · Arşiv · Studio araç kutusu. Simülasyon: arşivden dosya →
   Studio ile üret → Akademi ile kur → yayınla → büyü → 1 ayda 40.000 takipçi
   → para kazanma açılır. #egitim-demo-mount içine kendi yerleşir. */
(function () {
  if (window.__edInit) return;

  var STEPS = [
    {k:'ARŞİV',t:'Dosyayı seç',d:'42 hazır vakadan birini al — senaryo, kaynak ve sahne planı hazır.'},
    {k:'STUDIO',t:'Sahneyi üret',d:'Senaryo, seslendirme ve sinematik görsel tek dosyada çıksın.'},
    {k:'AKADEMİ',t:'Kanalı kur & parlat',d:'9 derslik programla kanalını kur, başlığı ve kapağı işle.'},
    {k:'YAYIN',t:'İlk videoyu yayınla',d:'Doğru başlık, kapak ve zamanlama — ilk 60 dakikayı yönet.'},
    {k:'BÜYÜME',t:'Seri seriye bağlanır',d:'İzleyici topluluğa döner; her video bir öncekini büyütür.'},
    {k:'KAZANÇ',t:'Para kazanmayı aç',d:'Reklam, üyelik ve ürünle gelir modellerin devreye girer.'}
  ];
  var VIDS=[
    {slug:'istanbul-fethi',t:'İstanbul’un düştüğü son gece'},
    {slug:'sezar-suikasti',t:'Sezar’ı kim kurtarabilirdi?'},
    {slug:'otzi',t:'5300 yıllık cinayet'}
  ];
  var TARGET=40000;

  var CSS = ''
    + '#egitim-demo{position:relative;background:#06070d;border-top:1px solid rgba(193,154,82,.15);border-bottom:1px solid rgba(193,154,82,.15);overflow:hidden}'
    + '#egitim-demo .ed-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle 600px at 88% 4%,rgba(230,196,120,.12),transparent 60%),radial-gradient(circle 520px at 6% 98%,rgba(90,122,62,.08),transparent 58%)}'
    + '#egitim-demo .ed-wrap{position:relative;width:min(1720px,95vw);margin:0 auto;padding:clamp(40px,4.4vw,64px) clamp(20px,3vw,40px)}'
    + '#egitim-demo .ed-top{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:clamp(20px,2.4vw,30px)}'
    + '#egitim-demo .ed-live{display:inline-flex;align-items:center;gap:8px;color:#e08a80;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.22em;margin-bottom:10px}'
    + '#egitim-demo .ed-live .d{width:9px;height:9px;border-radius:50%;background:#e11d1d;box-shadow:0 0 0 0 rgba(225,29,29,.6);animation:ed-pulse 1.4s ease-out infinite}'
    + '@keyframes ed-pulse{0%{box-shadow:0 0 0 0 rgba(225,29,29,.55)}70%{box-shadow:0 0 0 9px rgba(225,29,29,0)}100%{box-shadow:0 0 0 0 rgba(225,29,29,0)}}'
    + '#egitim-demo h2{margin:0 0 6px;font-family:\'Playfair Display\',serif;font-size:clamp(27px,3.1vw,42px);font-weight:800;line-height:1.03;letter-spacing:-.01em;color:#f6efe0;max-width:18ch}'
    + '#egitim-demo h2 .g{background:linear-gradient(102deg,#b18742,#e6c478 42%,#fff0b1 52%,#a5762f);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '#egitim-demo .ed-sub{margin:0;color:#a7adba;font-size:13.5px;line-height:1.55;max-width:52ch}'
    + '#egitim-demo .ed-tools{display:flex;gap:9px;flex-wrap:wrap}'
    + '#egitim-demo .tool{display:inline-flex;align-items:center;gap:8px;text-decoration:none;border:1px solid rgba(193,154,82,.4);background:rgba(193,154,82,.05);color:#e6c478;font-family:\'Special Elite\',monospace;font-size:11.5px;letter-spacing:.08em;padding:11px 15px;transition:all .16s}'
    + '#egitim-demo .tool:hover{background:rgba(193,154,82,.13);border-color:#c19a52;transform:translateY(-1px)}'
    + '#egitim-demo .tool .i{font-size:13px}'
    + '#egitim-demo .ed-work{display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(24px,2.8vw,44px);align-items:start}'
    // sol: yol
    + '#egitim-demo .ed-road{display:flex;flex-direction:column;gap:0;border:1px solid rgba(193,154,82,.16);background:linear-gradient(168deg,rgba(15,16,25,.7),rgba(7,8,13,.9))}'
    + '#egitim-demo .rstep{position:relative;display:flex;gap:13px;padding:14px 16px;border-bottom:1px solid rgba(193,154,82,.12);opacity:.4;transition:opacity .4s,background .4s}'
    + '#egitim-demo .rstep:last-child{border-bottom:0}'
    + '#egitim-demo .rstep.on{opacity:1;background:rgba(193,154,82,.06)}'
    + '#egitim-demo .rstep.done{opacity:.9}'
    + '#egitim-demo .rstep .num{flex-shrink:0;width:26px;height:26px;border-radius:50%;border:1px solid rgba(193,154,82,.4);display:grid;place-items:center;font-family:\'Special Elite\',monospace;font-size:11px;color:#c19a52;transition:all .3s}'
    + '#egitim-demo .rstep.on .num{background:var(--rd,#9E2B23);border-color:transparent;color:#fff}'
    + '#egitim-demo .rstep.done .num{background:rgba(111,155,74,.18);border-color:rgba(111,155,74,.5);color:#7ba05a}'
    + '#egitim-demo .rstep .k{font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:.14em;color:#c19a52}'
    + '#egitim-demo .rstep h4{font-family:\'Playfair Display\',serif;font-weight:700;font-size:16px;color:#f2ecd9;margin:2px 0 3px}'
    + '#egitim-demo .rstep p{margin:0;font-size:12px;line-height:1.45;color:#8b93a1;max-width:44ch}'
    + '#egitim-demo .ed-cta{padding:16px}'
    + '#egitim-demo .ed-btn{cursor:pointer;border:0;width:100%;display:inline-flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:14px;letter-spacing:.15em;padding:16px;transition:transform .18s,box-shadow .18s}'
    + '#egitim-demo .ed-btn:hover{transform:translateY(-2px);box-shadow:0 14px 44px -14px rgba(230,196,120,.5)}'
    + '#egitim-demo .ed-btn:disabled{opacity:.7;cursor:default;transform:none;box-shadow:none}'
    // sağ: kanal
    + '#egitim-demo .channel{border:1px solid rgba(193,154,82,.3);background:#0a0b12;overflow:hidden;box-shadow:0 40px 90px -54px #000}'
    + '#egitim-demo .ban{position:relative;height:120px;overflow:hidden}'
    + '#egitim-demo .ban canvas{position:absolute;inset:0;width:100%;height:100%}'
    + '#egitim-demo .idrow{display:flex;align-items:center;gap:14px;padding:0 20px;margin-top:-26px;position:relative;z-index:2}'
    + '#egitim-demo .av{width:64px;height:64px;border-radius:50%;border:3px solid #0a0b12;background:radial-gradient(circle at 40% 35%,#241b10,#0a0710);display:grid;place-items:center;font-family:\'Playfair Display\',serif;font-weight:800;font-size:26px;color:#e6c478;box-shadow:0 0 0 1px rgba(193,154,82,.5)}'
    + '#egitim-demo .idrow .nm{padding-bottom:4px}'
    + '#egitim-demo .idrow h3{font-family:\'Playfair Display\',serif;font-weight:800;font-size:20px;color:#fff;margin:0}'
    + '#egitim-demo .idrow .h{font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.1em;color:#9aa0ad}'
    + '#egitim-demo .subs{display:flex;align-items:baseline;gap:12px;padding:16px 20px 6px;flex-wrap:wrap}'
    + '#egitim-demo .subs .big{font-family:\'Playfair Display\',serif;font-weight:800;font-size:clamp(34px,4.4vw,52px);color:#e6c478;line-height:1;font-variant-numeric:tabular-nums}'
    + '#egitim-demo .subs .lb{font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.1em;color:#8b93a1}'
    + '#egitim-demo .subs .day{margin-left:auto;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.1em;color:#c19a52;border:1px solid rgba(193,154,82,.35);padding:5px 10px}'
    + '#egitim-demo .spark{width:100%;height:70px;display:block;padding:0 8px}'
    + '#egitim-demo .vids{display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;padding:8px 20px 4px}'
    + '#egitim-demo .vid{opacity:0;transform:translateY(8px);transition:opacity .5s,transform .5s}'
    + '#egitim-demo .vid.in{opacity:1;transform:none}'
    + '#egitim-demo .vid .pic{position:relative;aspect-ratio:16/9;overflow:hidden;border:1px solid rgba(193,154,82,.2)}'
    + '#egitim-demo .vid .pic img{width:100%;height:100%;object-fit:cover;opacity:.82}'
    + '#egitim-demo .vid .pic .pl{position:absolute;inset:0;margin:auto;width:26px;height:26px;border-radius:50%;background:rgba(158,43,35,.9);display:grid;place-items:center;color:#fff;font-size:10px}'
    + '#egitim-demo .vid .t{font-family:\'Playfair Display\',serif;font-size:11.5px;line-height:1.2;color:#cdd2dc;margin-top:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'
    + '#egitim-demo .money{display:flex;gap:9px;flex-wrap:wrap;padding:12px 20px 20px}'
    + '#egitim-demo .mchip{display:inline-flex;align-items:center;gap:7px;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.04em;color:#6c7382;border:1px solid rgba(193,154,82,.2);padding:8px 12px;opacity:.4;transition:all .4s}'
    + '#egitim-demo .mchip.on{opacity:1;color:#7ba05a;border-color:rgba(111,155,74,.5);background:rgba(111,155,74,.08)}'
    + '@media(max-width:820px){#egitim-demo .ed-work{grid-template-columns:1fr}}';

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function render(mount){
    var RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
    var RD=['#9E2B23','#b5731f','#3f7d78','#9E2B23','#a5762f','#6f9b4a'];

    mount.innerHTML=
      '<div class="ed-glow"></div><div class="ed-wrap">'
      + '<div class="ed-top"><div>'
      +   '<div class="ed-live"><span class="d"></span>AKADEMİ · CANLI DEMO</div>'
      +   '<h2>Kanalını kur, <span class="g">1 ayda 40.000’e ulaş.</span></h2>'
      +   '<p class="ed-sub">Arşiv, Studio ve Akademi bir arada: dosyayı al, sahneyi üret, kanalı kur ve büyüt — sonunda para kazanmayı aç.</p>'
      + '</div><div class="ed-tools">'
      +   '<a class="tool" href="/egitim"><span class="i">🎓</span>EĞİTİM</a>'
      +   '<a class="tool" href="/arsiv"><span class="i">🗂</span>ARŞİV</a>'
      +   '<a class="tool" href="/studio"><span class="i">◉</span>STUDIO</a>'
      + '</div></div>'
      + '<div class="ed-work">'
      + '<div class="ed-road" id="ed-road">'
      +   STEPS.map(function(s,i){return '<div class="rstep" id="rs'+i+'" style="--rd:'+RD[i]+'"><div class="num">'+(i+1)+'</div><div><div class="k">'+esc(s.k)+'</div><h4>'+esc(s.t)+'</h4><p>'+esc(s.d)+'</p></div></div>';}).join('')
      +   '<div class="ed-cta"><button class="ed-btn" id="ed-go">▸ KANALI KUR (30 GÜN)</button></div>'
      + '</div>'
      + '<div class="channel">'
      +   '<div class="ban"><canvas id="ed-ban" width="900" height="240"></canvas></div>'
      +   '<div class="idrow"><div class="av">A</div><div class="nm"><h3>Tarih Ajanı</h3><div class="h">TARİH KANALI · YENİ</div></div></div>'
      +   '<div class="subs"><span class="big" id="ed-num">0</span><span class="lb">abone</span><span class="day" id="ed-day">GÜN 0 / 30</span></div>'
      +   '<canvas class="spark" id="ed-spark" width="520" height="70"></canvas>'
      +   '<div class="vids" id="ed-vids">'+VIDS.map(function(v,i){return '<div class="vid" id="ev'+i+'"><div class="pic"><img src="/assets/haber/'+v.slug+'.jpg" alt="" loading="lazy"><span class="pl">▶</span></div><div class="t">'+esc(v.t)+'</div></div>';}).join('')+'</div>'
      +   '<div class="money" id="ed-money"><span class="mchip" id="m0">💰 Para kazanma</span><span class="mchip" id="m1">📣 İlk reklam</span><span class="mchip" id="m2">🎖️ Üyelikler</span></div>'
      + '</div>'
      + '</div></div>';

    var num=mount.querySelector('#ed-num'), day=mount.querySelector('#ed-day'), go=mount.querySelector('#ed-go'),
        ban=mount.querySelector('#ed-ban'), spark=mount.querySelector('#ed-spark');

    // banner çizimi
    (function(){var g=ban.getContext('2d'),W=ban.width,H=ban.height;var grd=g.createLinearGradient(0,0,W,H);grd.addColorStop(0,'#0a0710');grd.addColorStop(.5,'#3a1a16');grd.addColorStop(1,'#0a0710');g.fillStyle=grd;g.fillRect(0,0,W,H);g.save();g.translate(W*.66,H*.52);g.rotate(-.14);g.font='800 88px "Playfair Display",Georgia,serif';g.textAlign='center';g.fillStyle='rgba(193,154,82,.13)';g.fillText('TARİH AJANI',0,30);g.restore();})();

    function drawSpark(p){
      var g=spark.getContext('2d'),W=spark.width,H=spark.height;g.clearRect(0,0,W,H);
      var N=Math.max(2,Math.floor(p*40));var pts=[];
      for(var i=0;i<=N;i++){var t=i/40;var y=Math.pow(t,2.1);pts.push([t*W,H-5-y*(H-10)]);}
      var grd=g.createLinearGradient(0,0,0,H);grd.addColorStop(0,'rgba(230,196,120,.34)');grd.addColorStop(1,'transparent');
      g.beginPath();g.moveTo(0,H);pts.forEach(function(q){g.lineTo(q[0],q[1]);});g.lineTo(pts[pts.length-1][0],H);g.closePath();g.fillStyle=grd;g.fill();
      g.beginPath();pts.forEach(function(q,i){i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]);});g.strokeStyle='#e6c478';g.lineWidth=2;g.stroke();
      var l=pts[pts.length-1];g.beginPath();g.arc(l[0],l[1],3.5,0,7);g.fillStyle='#fff0b1';g.fill();
    }
    drawSpark(0);

    function reset(){
      for(var i=0;i<STEPS.length;i++){var el=mount.querySelector('#rs'+i);el.classList.remove('on','done');}
      for(var v=0;v<VIDS.length;v++)mount.querySelector('#ev'+v).classList.remove('in');
      for(var m=0;m<3;m++)mount.querySelector('#m'+m).classList.remove('on');
      num.textContent='0';day.textContent='GÜN 0 / 30';drawSpark(0);
    }

    var running=false;
    function run(){
      if(running)return;running=true;reset();go.disabled=true;go.textContent='KURULUYOR…';
      var stepDur=RM?60:620;
      STEPS.forEach(function(s,i){
        setTimeout(function(){
          var el=mount.querySelector('#rs'+i);el.classList.add('on');
          if(i>0){var p=mount.querySelector('#rs'+(i-1));p.classList.remove('on');p.classList.add('done');}
          if(i===3){VIDS.forEach(function(v,k){setTimeout(function(){mount.querySelector('#ev'+k).classList.add('in');},RM?0:k*160);});}
        }, i*stepDur);
      });
      // sayaç + gün + grafik büyüme fazı (adım 4-5 boyunca)
      var t0=performance.now()+ (RM?0:2*stepDur), dur=RM?200:3200;
      function tick(now){
        var p=Math.max(0,Math.min(1,(now-(t0))/dur));
        var e=1-Math.pow(1-p,2.4);
        num.textContent=Math.floor(TARGET*e).toLocaleString('tr-TR');
        day.textContent='GÜN '+Math.min(30,Math.floor(1+29*p))+' / 30';
        drawSpark(e);
        if(p<1){requestAnimationFrame(tick);} else finish();
      }
      setTimeout(function(){requestAnimationFrame(tick);}, RM?0:2*stepDur);
      function finish(){
        var last=mount.querySelector('#rs'+(STEPS.length-1));last.classList.remove('on');last.classList.add('done');
        // önceki tüm adımlar done
        for(var i=0;i<STEPS.length;i++){mount.querySelector('#rs'+i).classList.add('done');mount.querySelector('#rs'+i).classList.remove('on');}
        mount.querySelector('#rs'+(STEPS.length-1)).classList.add('on');
        [0,1,2].forEach(function(m,k){setTimeout(function(){mount.querySelector('#m'+m).classList.add('on');},RM?0:k*220);});
        num.textContent=TARGET.toLocaleString('tr-TR');
        go.disabled=false;go.textContent='↻ Tekrar kur';running=false;
      }
    }
    go.addEventListener('click',run);
    // görünür olunca bir kez otomatik başlat
    if('IntersectionObserver' in window && !RM){
      var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){io.disconnect();setTimeout(run,300);}});},{threshold:.4});
      io.observe(mount.querySelector('.channel'));
    }
  }

  function injectStyle(){ if(document.getElementById('ed-style'))return; var s=document.createElement('style'); s.id='ed-style'; s.textContent=CSS; document.head.appendChild(s); }
  function ensure(){ var m=document.getElementById('egitim-demo-mount'); if(!m)return; if(m.__edDone&&m.querySelector('.ed-wrap'))return; injectStyle(); m.__edDone=true; render(m); }
  window.__edInit=true; ensure(); document.addEventListener('DOMContentLoaded',ensure);
  var t=0,iv=setInterval(function(){ensure();if(++t>40)clearInterval(iv);},500);
  if(window.MutationObserver){var mt=null;new MutationObserver(function(){clearTimeout(mt);mt=setTimeout(ensure,150);}).observe(document.documentElement,{childList:true,subtree:true});}
})();

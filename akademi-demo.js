/* Tarih Ajanı — Ana sayfa "Akademi" demosu.
   İki sekme: 1) Yol Haritası (fikirden kazanca yolculuk, gaza getiren)
             2) Dersi Ön İzle (tüm dersler değil — izlenen bir fragman).
   #akademi-demo-mount içine kendi kendine yerleşir (dc bağımsız). */
(function () {
  if (window.__akInit) return;

  var STEPS = [
    {k:'FİKİR',   d:'Çatışması güçlü bir konu bul.',        m:'Haftada 5 fikir'},
    {k:'SENARYO', d:'Kanca → gerilim → doruk iskeleti.',    m:'İlk senaryo: 30 dk'},
    {k:'ÜRETİM',  d:'Studio ile sahneyi tek dosyada üret.', m:'İlk video hazır'},
    {k:'YAYIN',   d:'Kapak, başlık ve doğru zamanlama.',    m:'İlk 1.000 izlenme'},
    {k:'BÜYÜME',  d:'Seri seriye bağlanır, topluluk kurulur.', m:'İlk 1.000 abone'},
    {k:'KAZANÇ',  d:'Reklam, üyelik ve ürünle gelir.',      m:'İlk gelir 💰'}
  ];
  var TRAILER = [
    {img:'istanbul-fethi', cap:'Bir konu seç…'},
    {img:'sezar-suikasti', cap:'Senaryonu yaz…'},
    {img:'vezuv-pompeii',  cap:'Sahneni üret…'},
    {img:'malazgirt',      cap:'Kanalını büyüt.'},
    {img:'bagdat-1258',    cap:'TARİH AJANI AKADEMİSİ'}
  ];

  var CSS = ''
    + '#akademi-demo{position:relative;background:#06070d;border-top:1px solid rgba(193,154,82,.15);border-bottom:1px solid rgba(193,154,82,.15);overflow:hidden}'
    + '#akademi-demo .ak-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle 560px at 88% 6%,rgba(230,196,120,.11),transparent 60%),radial-gradient(circle 520px at 6% 96%,rgba(90,122,62,.08),transparent 58%)}'
    + '#akademi-demo .ak-wrap{position:relative;width:min(1660px,94vw);margin:0 auto;padding:clamp(28px,3vw,44px) clamp(20px,3vw,40px)}'
    + '#akademi-demo .ak-work{display:grid;grid-template-columns:.72fr 1.28fr;gap:clamp(24px,2.8vw,44px);align-items:stretch}'
    + '#akademi-demo .ak-panel{display:flex;flex-direction:column;gap:13px;min-width:0;justify-content:center}'
    + '#akademi-demo .ak-live{display:inline-flex;align-items:center;gap:8px;color:#e08a80;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.2em}'
    + '#akademi-demo .ak-live .d{width:9px;height:9px;border-radius:50%;background:#e11d1d;box-shadow:0 0 0 0 rgba(225,29,29,.6);animation:ak-pulse 1.4s ease-out infinite}'
    + '@keyframes ak-pulse{0%{box-shadow:0 0 0 0 rgba(225,29,29,.55)}70%{box-shadow:0 0 0 9px rgba(225,29,29,0)}100%{box-shadow:0 0 0 0 rgba(225,29,29,0)}}'
    + '#akademi-demo h2{margin:6px 0 3px;font-family:\'Playfair Display\',serif;font-size:clamp(27px,3.1vw,42px);font-weight:800;line-height:1.03;letter-spacing:-.01em;color:#f6efe0}'
    + '#akademi-demo h2 .g{background:linear-gradient(102deg,#b18742,#e6c478 42%,#fff0b1 52%,#a5762f);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '#akademi-demo .ak-sub{margin:0 0 6px;color:#a7adba;font-size:13.5px;line-height:1.55;max-width:42ch}'
    + '#akademi-demo .ak-tabs{display:flex;gap:8px}'
    + '#akademi-demo .ak-tab{flex:1;cursor:pointer;border:1px solid rgba(193,154,82,.28);background:rgba(193,154,82,.04);color:#cdd2dc;font-family:\'Special Elite\',monospace;font-size:12px;letter-spacing:.06em;padding:13px 12px;transition:all .18s}'
    + '#akademi-demo .ak-tab:hover{border-color:rgba(193,154,82,.55)}'
    + '#akademi-demo .ak-tab.on{background:linear-gradient(110deg,#a77d35,#d8b26a 55%,#c19a52);color:#171207;border-color:transparent;font-weight:700}'
    + '#akademi-demo .ak-ghost{align-self:flex-start;display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:#e6c478;font-family:\'Special Elite\',monospace;font-weight:700;font-size:12px;letter-spacing:.1em;border-bottom:1px solid rgba(193,154,82,.4);padding-bottom:2px}'
    + '#akademi-demo .ak-ghost:hover{color:#fff0b1}'
    + '#akademi-demo .ak-stage{position:relative;border:1px solid rgba(193,154,82,.3);background:linear-gradient(168deg,#0e0f18,#0a0b12 60%,#08090e);box-shadow:0 40px 90px -56px #000;overflow:hidden;min-height:340px;display:flex;flex-direction:column}'
    + '#akademi-demo .ak-stage::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#c19a52,transparent 70%);opacity:.8}'
    // ── YOL HARİTASI ──
    + '#akademi-demo .road{padding:26px clamp(18px,2.4vw,32px) 8px;position:relative}'
    + '#akademi-demo .rtrack{position:relative;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:22px}'
    + '#akademi-demo .rline{position:absolute;top:17px;left:7%;right:7%;height:2px;background:rgba(193,154,82,.22);z-index:0}'
    + '#akademi-demo .rline i{position:absolute;inset:0;width:0;background:linear-gradient(90deg,#a77d35,#e6c478);transition:width .5s ease;box-shadow:0 0 10px rgba(230,196,120,.5)}'
    + '#akademi-demo .rnode{position:relative;z-index:1;display:grid;justify-items:center;gap:8px;background:transparent;border:0;padding:0;cursor:pointer}'
    + '#akademi-demo .rnode .rd{width:36px;height:36px;border-radius:50%;border:1px solid rgba(193,154,82,.4);background:#0b0c14;display:grid;place-items:center;font-family:\'Special Elite\',monospace;font-size:12px;color:#c19a52;transition:all .3s}'
    + '#akademi-demo .rnode.on .rd{background:linear-gradient(150deg,#c19a52,#e6c478);color:#171207;border-color:transparent;transform:scale(1.12);box-shadow:0 0 16px -2px rgba(230,196,120,.6)}'
    + '#akademi-demo .rnode.last.on .rd{background:linear-gradient(150deg,#6f9b4a,#a7c67e);color:#0a120a;box-shadow:0 0 22px -2px rgba(111,155,74,.7)}'
    + '#akademi-demo .rnode .rk{font-family:\'Special Elite\',monospace;font-size:8.5px;letter-spacing:.08em;color:#8b93a1;text-align:center}'
    + '#akademi-demo .rnode.on .rk{color:#f2ecd9}'
    + '#akademi-demo .rcard{margin:0 clamp(18px,2.4vw,32px) 22px;border:1px solid rgba(193,154,82,.22);background:rgba(3,4,9,.5);padding:18px 20px;min-height:112px;position:relative;overflow:hidden}'
    + '#akademi-demo .rcard::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--rc,#c19a52)}'
    + '#akademi-demo .rcard .rn{font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.16em;color:#c19a52;margin-bottom:7px}'
    + '#akademi-demo .rcard h4{font-family:\'Playfair Display\',serif;font-weight:800;font-size:22px;color:#f4ecd8;margin:0 0 6px}'
    + '#akademi-demo .rcard p{margin:0 0 12px;color:#b9c0cc;font-size:13.5px;line-height:1.5}'
    + '#akademi-demo .rcard .rm{display:inline-flex;align-items:center;gap:7px;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.04em;color:#7ba05a;border:1px solid rgba(111,155,74,.4);padding:6px 11px;background:rgba(111,155,74,.08)}'
    + '#akademi-demo .rfoot{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:0 clamp(18px,2.4vw,32px) 20px;margin-top:auto}'
    + '#akademi-demo .ak-btn{cursor:pointer;border:0;display:inline-flex;align-items:center;gap:9px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:12.5px;letter-spacing:.13em;padding:13px 22px;transition:transform .18s,box-shadow .18s}'
    + '#akademi-demo .ak-btn:hover{transform:translateY(-2px);box-shadow:0 12px 34px -12px rgba(230,196,120,.5)}'
    + '#akademi-demo .ak-btn.ghost{background:transparent;border:1px solid rgba(193,154,82,.5);color:#e6c478}'
    + '#akademi-demo .ak-btn.ghost:hover{background:rgba(193,154,82,.12);box-shadow:none}'
    // ── DERSİ ÖN İZLE (fragman) ──
    + '#akademi-demo .trailer{flex:1;display:flex;flex-direction:column}'
    + '#akademi-demo .tframe{position:relative;flex:1;min-height:300px;overflow:hidden;background:#05060b}'
    + '#akademi-demo .tframe .sc{position:absolute;inset:0;opacity:0;transition:opacity .6s ease;transform:scale(1.04)}'
    + '#akademi-demo .tframe .sc.on{opacity:1;animation:ak-ken 5s linear forwards}'
    + '@keyframes ak-ken{from{transform:scale(1.02)}to{transform:scale(1.12)}}'
    + '#akademi-demo .tframe .sc img{width:100%;height:100%;object-fit:cover;opacity:.5}'
    + '#akademi-demo .tframe .vig{position:absolute;inset:0;background:radial-gradient(circle at 50% 40%,transparent 40%,rgba(4,5,10,.85)),linear-gradient(0deg,rgba(4,5,10,.9),transparent 45%)}'
    + '#akademi-demo .tbar{position:absolute;left:0;right:0;height:34px;background:#04050a;z-index:3}'
    + '#akademi-demo .tbar.t{top:0}#akademi-demo .tbar.b{bottom:0}'
    + '#akademi-demo .tmeta{position:absolute;top:9px;left:14px;right:14px;z-index:4;display:flex;justify-content:space-between;font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:.1em;color:#c8b78e}'
    + '#akademi-demo .tmeta .rec{display:inline-flex;align-items:center;gap:6px;color:#f2ecd9}'
    + '#akademi-demo .tmeta .rec .dt{width:7px;height:7px;border-radius:50%;background:#e11d1d;animation:ak-pulse 1.4s infinite}'
    + '#akademi-demo .tcap{position:absolute;left:0;right:0;bottom:52px;z-index:4;text-align:center;padding:0 24px;font-family:\'Playfair Display\',serif;font-weight:800;font-size:clamp(20px,2.6vw,30px);color:#f6efe0;text-shadow:0 3px 18px rgba(0,0,0,.7);opacity:0;transition:opacity .5s}'
    + '#akademi-demo .tcap.on{opacity:1}'
    + '#akademi-demo .tplay{position:absolute;inset:0;z-index:5;display:grid;place-items:center;background:rgba(5,6,11,.35)}'
    + '#akademi-demo .tplay button{cursor:pointer;border:0;display:inline-flex;align-items:center;gap:10px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:13px;letter-spacing:.14em;padding:15px 28px}'
    + '#akademi-demo .tplay button:hover{transform:translateY(-2px);box-shadow:0 12px 40px -12px rgba(230,196,120,.55)}'
    + '#akademi-demo .tpbar{position:absolute;left:0;right:0;bottom:34px;height:3px;background:rgba(193,154,82,.2);z-index:4}'
    + '#akademi-demo .tpbar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#a77d35,#e6c478)}'
    + '#akademi-demo .tend{position:absolute;inset:0;z-index:6;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;background:rgba(6,7,13,.72);padding:24px}'
    + '#akademi-demo .tend.on{display:flex}'
    + '#akademi-demo .tend .th{font-family:\'Playfair Display\',serif;font-weight:800;font-size:24px;color:#f4ecd8}'
    + '#akademi-demo .tend .ts{font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.1em;color:#a7adba}'
    + '@media(max-width:820px){#akademi-demo .ak-work{grid-template-columns:1fr}#akademi-demo .rnode .rk{font-size:7.5px}}'
    + '@media(prefers-reduced-motion:reduce){#akademi-demo .tframe .sc.on{animation:none}}';

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function render(mount){
    var RM=matchMedia('(prefers-reduced-motion:reduce)').matches;

    mount.innerHTML=
      '<div class="ak-glow"></div><div class="ak-wrap"><div class="ak-work">'
      + '<div class="ak-panel">'
      +   '<div class="ak-live"><span class="d"></span>AKADEMİ · CANLI DEMO</div>'
      +   '<h2>Sıfırdan kanala, <span class="g">adım adım.</span></h2>'
      +   '<p class="ak-sub">Yolun tamamını gör ya da programın fragmanını izle — kanalını nasıl kuracağını burada tanı.</p>'
      +   '<div class="ak-tabs"><button class="ak-tab on" data-t="0">◈ Yol Haritası</button><button class="ak-tab" data-t="1">▸ Dersi Ön İzle</button></div>'
      +   '<a class="ak-ghost" href="/egitim">9 derslik Akademi’ye Git →</a>'
      + '</div>'
      + '<div class="ak-stage" id="ak-stage"></div>'
      + '</div></div>';

    var stage=mount.querySelector('#ak-stage'), tabs=mount.querySelector('.ak-tabs');
    var roadT=null, trailT=null;

    /* ---- Yol Haritası ---- */
    function mountRoad(){
      clearTimeout(trailT);
      stage.innerHTML=
        '<div class="road"><div class="rtrack"><div class="rline"><i id="ak-line"></i></div>'
        + STEPS.map(function(s,i){return '<button class="rnode'+(i===STEPS.length-1?' last':'')+'" data-i="'+i+'"><span class="rd">'+(i+1)+'</span><span class="rk">'+esc(s.k)+'</span></button>';}).join('')
        + '</div></div>'
        + '<div class="rcard" id="ak-rcard"></div>'
        + '<div class="rfoot"><button class="ak-btn ghost" id="ak-replay">↻ Yolu tekrar göster</button><span style="font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.06em;color:#7a8090">Fikir → Kazanç · 6 durak</span></div>';
      var line=stage.querySelector('#ak-line'), card=stage.querySelector('#ak-rcard'),
          nodes=stage.querySelectorAll('.rnode');
      function sel(i){
        [].forEach.call(nodes,function(n,j){n.classList.toggle('on',j<=i);});
        line.style.width=(i/(STEPS.length-1)*100)+'%';
        var s=STEPS[i], last=(i===STEPS.length-1);
        card.style.setProperty('--rc',last?'#6f9b4a':'#c19a52');
        card.innerHTML='<div class="rn">DURAK '+(i+1)+' / '+STEPS.length+'</div><h4>'+esc(s.k)+'</h4><p>'+esc(s.d)+'</p><span class="rm" style="'+(last?'color:#a7c67e':'')+'">◎ '+esc(s.m)+'</span>';
      }
      var i=0; sel(0);
      function run(){ clearTimeout(roadT); i=0; sel(0); (function step(){ if(i<STEPS.length-1){i++;sel(i);roadT=setTimeout(step,760);} })(); }
      stage.querySelector('#ak-replay').addEventListener('click',run);
      [].forEach.call(nodes,function(n){n.addEventListener('click',function(){clearTimeout(roadT);sel(+n.dataset.i);});});
      if(!RM) roadT=setTimeout(run,350); else sel(STEPS.length-1);
    }

    /* ---- Dersi Ön İzle (fragman) ---- */
    function mountTrailer(){
      clearTimeout(roadT);
      stage.innerHTML=
        '<div class="trailer"><div class="tframe" id="ak-tframe">'
        + TRAILER.map(function(t,i){return '<div class="sc" id="asc'+i+'"><img src="/assets/haber/'+t.img+'.jpg" alt="" loading="lazy"></div>';}).join('')
        + '<div class="vig"></div>'
        + '<div class="tbar t"></div><div class="tbar b"></div>'
        + '<div class="tmeta"><span class="rec"><span class="dt"></span>FRAGMAN</span><span id="ak-tc">00:00</span></div>'
        + '<div class="tcap" id="ak-tcap"></div>'
        + '<div class="tpbar"><i id="ak-tp"></i></div>'
        + '<div class="tplay" id="ak-tplay"><button>▶ FRAGMANI İZLE</button></div>'
        + '<div class="tend" id="ak-tend"><div class="th">9 derslik program</div><div class="ts">Kanalını kur, büyüt ve kazan.</div><a class="ak-btn" href="/egitim" style="text-decoration:none">Akademi’ye Git →</a><button class="ak-btn ghost" id="ak-tre">↻ Tekrar izle</button></div>'
        + '</div></div>';
      var scs=[],i2; for(i2=0;i2<TRAILER.length;i2++)scs.push(stage.querySelector('#asc'+i2));
      var cap=stage.querySelector('#ak-tcap'), tp=stage.querySelector('#ak-tp'), tc=stage.querySelector('#ak-tc'),
          play=stage.querySelector('#ak-tplay'), end=stage.querySelector('#ak-tend');
      var timers=[];
      function clearAll(){timers.forEach(clearTimeout);timers=[];}
      function playTrailer(){
        clearAll(); end.classList.remove('on'); play.style.display='none';
        var per=RM?300:1500, total=TRAILER.length*per, t0=performance.now();
        TRAILER.forEach(function(t,k){
          timers.push(setTimeout(function(){
            scs.forEach(function(s,j){s.classList.toggle('on',j===k);});
            cap.textContent=t.cap; cap.classList.remove('on'); void cap.offsetWidth; cap.classList.add('on');
          }, k*per));
        });
        (function tick(now){var p=Math.min(1,(now-t0)/total);tp.style.width=(p*100)+'%';var sec=Math.floor(p*42);tc.textContent='00:'+(sec<10?'0':'')+sec;if(p<1)timers.push(requestAnimationFrame(tick));})(t0);
        timers.push(setTimeout(function(){end.classList.add('on');},total+ (RM?0:200)));
      }
      play.querySelector('button').addEventListener('click',playTrailer);
      stage.querySelector('#ak-tre').addEventListener('click',playTrailer);
      scs[0].classList.add('on');
    }

    var cur=-1;
    function show(t){
      if(cur===t)return; cur=t;
      [].forEach.call(tabs.children,function(b,j){b.classList.toggle('on',j===t);});
      if(t===0) mountRoad(); else mountTrailer();
    }
    tabs.addEventListener('click',function(e){var b=e.target.closest('.ak-tab');if(b)show(+b.dataset.t);});
    show(0);
  }

  function injectStyle(){ if(document.getElementById('ak-style'))return; var s=document.createElement('style'); s.id='ak-style'; s.textContent=CSS; document.head.appendChild(s); }
  function ensure(){ var m=document.getElementById('akademi-demo-mount'); if(!m)return; if(m.__akDone&&m.querySelector('.ak-wrap'))return; injectStyle(); m.__akDone=true; render(m); }
  window.__akInit=true; ensure(); document.addEventListener('DOMContentLoaded',ensure);
  var t=0,iv=setInterval(function(){ensure();if(++t>40)clearInterval(iv);},500);
  if(window.MutationObserver){var mt=null;new MutationObserver(function(){clearTimeout(mt);mt=setTimeout(ensure,150);}).observe(document.documentElement,{childList:true,subtree:true});}
})();

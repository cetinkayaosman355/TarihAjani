/* Tarih Ajanı — Ana sayfa "Arşiv Canlı Demo" (sinematik / tam-genişlik).
   Arka plan: çekilen dosyanın görseli karartılmış, sinematik zeminde.
   Sol: gizli dosya çekmecesi — düğmeye basınca dosyalar karışır, biri çekilir.
   Sağ: çekilen dosya karartma efektiyle açılır (künye + alıntı + senaryoya hazır).
   #arsiv-demo-mount içine kendi kendine yerleşir (dc bağımsız). */
(function () {
  if (window.__adInit) return;

  var CASES = [
    {slug:'istanbul-fethi',cat:'SAVAŞ',c:'#9E2B23',yr:'1453',yer:'KONSTANTİNOPOLİS',kisi:'II. Mehmed · XI. Konstantin',
     t:'Konstantinopolis düştü',hook:'Elli üç günlük kuşatmanın ardından surlar şafakta yarıldı; bir çağ kapandı.',q:'Surlar bin yıl dayandı; elli üç günde düştü.'},
    {slug:'sezar-suikasti',cat:'SIR DOSYASI',c:'#7c5cab',yr:'MÖ 44',yer:'ROMA SENATOSU',kisi:'Julius Caesar · Brutus',
     t:'Sezar senatoda öldürüldü',hook:'Yirmi üç hançer darbesi; en güvendiği dostu da oradaydı.',q:'Cumhuriyeti kurtarmak istediler; imparatorluğu doğurdular.'},
    {slug:'vezuv-pompeii',cat:'FELAKET',c:'#b5731f',yr:'MS 79',yer:'POMPEII',kisi:'Yaşlı Plinius',
     t:'Vezüv patladı, Pompeii kül altında',hook:'Otuz kilometrelik kül sütunu kenti bir gölge gibi yuttu.',q:'Öğleden sonra gökyüzü karardı; gece kent yok oldu.'},
    {slug:'malazgirt',cat:'SAVAŞ',c:'#9E2B23',yr:'1071',yer:'MALAZGİRT',kisi:'Alp Arslan · Romen Diyojen',
     t:'İmparator esir düştü',hook:'Sahte çekilme; sonra çember kapandı. Anadolu’nun kapısı açıldı.',q:'Bir imparator esir; bir kıtanın kapısı aralandı.'},
    {slug:'bagdat-1258',cat:'FELAKET',c:'#b5731f',yr:'1258',yer:'BAĞDAT',kisi:'Hülagü Han',
     t:'Bağdat yıkıldı, Bilgelik Evi Dicle’ye döküldü',hook:'Yüzyılların kitabı nehre atıldı; bir çağın ilmi bir haftada dağıldı.',q:'Nehir, günlerce mürekkepten aktı.'},
    {slug:'otzi',cat:'SIR DOSYASI',c:'#7c5cab',yr:'MÖ 3300',yer:'ÖTZTAL ALPLERİ',kisi:'“Ötzi”',
     t:'5300 yıllık cinayet: Buz Adam',hook:'Sırtına saplanan ok ucu, kazayı bir cinayete çevirdi.',q:'Beş bin yıllık en eski soğuk vaka.'},
    {slug:'ea-nasir',cat:'EKONOMİ',c:'#a5762f',yr:'MÖ 1750',yer:'UR',kisi:'Nanni · Ea-Nasir',
     t:'Tarihin ilk şikâyeti',hook:'Kötü bakır ve kötü muamele üzerine, kile kazınmış bir sitem.',q:'Beni ne sanıyorsun sen?'},
    {slug:'fatih-olumu',cat:'SIR DOSYASI',c:'#7c5cab',yr:'1481',yer:'GEBZE',kisi:'II. Mehmed',
     t:'Fatih ani öldü: zehir şüphesi',hook:'Hedefi gizli tutulan bir sefer yolda durdu; ölümün nedeni hâlâ tartışmalı.',q:'Hedefi gizli sefer, sultanla birlikte durdu.'},
    {slug:'grek-atesi',cat:'KEŞİF',c:'#3f7d78',yr:'672',yer:'İSTANBUL',kisi:'Kallinikos',
     t:'Suda bile sönmeyen ateş',hook:'Tunç borulardan fışkıran, su üstünde yanan gizli bir silah başkenti kurtardı.',q:'Su döktükçe daha çok yandı.'},
    {slug:'kartaca',cat:'SAVAŞ',c:'#9E2B23',yr:'MÖ 146',yer:'KARTACA',kisi:'Scipio Aemilianus',
     t:'Kartaca yerle bir edildi',hook:'Üç Pön Savaşı’nın sonunda bir dünya kenti haritadan silindi.',q:'Akdeniz’in en zengin limanı, günlerce yandı.'}
  ];
  var NF = 5; // çekmecedeki görünür dosya sayısı

  var CSS = ''
    + '#arsiv-demo{position:relative;background:#06070d;overflow:hidden;isolation:isolate}'
    // sinematik arka plan — çekilen dosyanın görseli (çift katman, çapraz geçiş)
    + '#arsiv-demo .ad-bg{position:absolute;inset:0;z-index:0;opacity:0;transform:scale(1.12);transition:opacity 1.1s ease,transform 12s linear;background-size:cover;background-position:center;filter:saturate(.62) contrast(1.02)}'
    + '#arsiv-demo .ad-bg.on{opacity:.3;transform:scale(1.0)}'
    + '#arsiv-demo .ad-scrim{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,rgba(5,6,9,.96) 30%,rgba(5,6,9,.62) 62%,rgba(5,6,9,.9)),radial-gradient(120% 130% at 50% 0%,transparent 40%,rgba(0,0,0,.78))}'
    + '#arsiv-demo .ad-grain{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.5;mix-blend-mode:overlay;background-image:radial-gradient(rgba(255,255,255,.05) .5px,transparent .5px);background-size:3px 3px}'
    + '#arsiv-demo .ad-glow{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(circle 640px at 8% 8%,rgba(158,43,35,.13),transparent 60%),radial-gradient(circle 620px at 94% 96%,rgba(230,196,120,.10),transparent 58%)}'
    + '#arsiv-demo .ad-wrap{position:relative;z-index:2;width:min(1740px,96vw);margin:0 auto;padding:clamp(36px,4vw,64px) clamp(22px,3vw,48px)}'
    + '#arsiv-demo .ad-work{display:grid;grid-template-columns:.86fr 1.14fr;gap:clamp(30px,3.4vw,60px);align-items:center}'
    + '#arsiv-demo .ad-panel{display:flex;flex-direction:column;gap:16px;min-width:0}'
    // ayırt edici başlık — sınıflandırma bandı
    + '#arsiv-demo .ad-live{display:inline-flex;align-items:center;gap:10px;align-self:flex-start;color:#e6c478;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.24em;border:1px solid rgba(193,154,82,.4);padding:8px 15px;background:rgba(12,10,6,.5);backdrop-filter:blur(2px)}'
    + '#arsiv-demo .ad-live .d{width:9px;height:9px;border-radius:50%;background:#e11d1d;box-shadow:0 0 0 0 rgba(225,29,29,.6);animation:ad-pulse 1.4s ease-out infinite}'
    + '@keyframes ad-pulse{0%{box-shadow:0 0 0 0 rgba(225,29,29,.55)}70%{box-shadow:0 0 0 10px rgba(225,29,29,0)}100%{box-shadow:0 0 0 0 rgba(225,29,29,0)}}'
    + '#arsiv-demo h2{margin:8px 0 4px;font-family:\'Playfair Display\',serif;font-size:clamp(34px,4.1vw,58px);font-weight:800;line-height:1.0;letter-spacing:-.015em;color:#f6efe0;text-shadow:0 2px 30px rgba(0,0,0,.6)}'
    + '#arsiv-demo h2 .g{background:linear-gradient(102deg,#b18742,#e6c478 42%,#fff0b1 52%,#a5762f);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '#arsiv-demo .ad-sub{margin:0;color:#b3b9c6;font-size:15px;line-height:1.6;max-width:44ch}'
    + '#arsiv-demo .ad-btn{cursor:pointer;border:0;display:inline-flex;align-items:center;justify-content:center;gap:12px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:15px;letter-spacing:.16em;padding:19px 34px;transition:transform .18s,box-shadow .18s}'
    + '#arsiv-demo .ad-btn:hover{transform:translateY(-2px);box-shadow:0 16px 50px -14px rgba(230,196,120,.6)}'
    + '#arsiv-demo .ad-btn:disabled{opacity:.75;cursor:default;transform:none;box-shadow:none}'
    + '#arsiv-demo .ad-btn.ghost{background:rgba(12,10,6,.4);border:1px solid rgba(193,154,82,.5);color:#e6c478;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-weight:700;font-size:13.5px;letter-spacing:.03em;padding:14px 24px;backdrop-filter:blur(2px)}'
    + '#arsiv-demo .ad-btn.ghost:hover{background:rgba(193,154,82,.14);box-shadow:none}'
    + '#arsiv-demo .ad-count{font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.16em;color:#9aa2b0}'
    // çekmece — gizli dosyalar (daha büyük)
    + '#arsiv-demo .ad-drawer{position:relative;height:252px;margin:2px 0}'
    + '#arsiv-demo .folder{position:absolute;left:50%;bottom:8px;width:182px;height:230px;margin-left:-91px;transform-origin:50% 118%;border:1px solid rgba(193,154,82,.36);border-radius:4px;background:linear-gradient(158deg,#26211544,#14100a 60%,#0d0a06);box-shadow:0 22px 40px -20px rgba(0,0,0,.95),inset 0 1px 0 rgba(230,196,120,.07);transition:transform .3s cubic-bezier(.34,.9,.3,1),opacity .3s;overflow:hidden;will-change:transform;backdrop-filter:blur(3px)}'
    + '#arsiv-demo .folder::before{content:"";position:absolute;top:-13px;left:20px;width:66px;height:15px;background:linear-gradient(158deg,#221d13,#161009);border:1px solid rgba(193,154,82,.34);border-bottom:0;border-radius:6px 6px 0 0}'
    + '#arsiv-demo .folder::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,rgba(230,196,120,.06),transparent 40%);pointer-events:none}'
    + '#arsiv-demo .folder .cg{position:absolute;top:15px;right:12px;font-family:\'Special Elite\',monospace;font-size:8px;letter-spacing:.12em;color:#c0463b;border:1px solid rgba(192,70,59,.5);padding:3px 6px;transform:rotate(5deg)}'
    + '#arsiv-demo .folder .no{position:absolute;top:17px;left:15px;font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:.08em;color:#8a7a55}'
    + '#arsiv-demo .folder .seal{position:absolute;top:50px;left:50%;margin-left:-20px;width:40px;height:40px;border-radius:50%;background:radial-gradient(circle at 40% 32%,#d24b38,#a62f22 46%,#7c1f16 82%);display:grid;place-items:center;font-family:\'Playfair Display\',serif;font-weight:800;font-size:18px;color:#f4d9c9;box-shadow:inset 0 -2px 4px rgba(0,0,0,.4),0 3px 9px -3px rgba(166,47,34,.6)}'
    + '#arsiv-demo .folder .bars{position:absolute;left:18px;right:18px;bottom:18px;height:74px;background:repeating-linear-gradient(0deg,rgba(193,154,82,.15) 0 6px,transparent 6px 14px)}'
    + '#arsiv-demo .folder .bars::after{content:"GİZLİ";position:absolute;left:0;top:-16px;font-family:\'Special Elite\',monospace;font-size:8px;letter-spacing:.16em;color:#6b6146}'
    + '#arsiv-demo .folder.pull{transition:transform .42s cubic-bezier(.4,.8,.3,1),opacity .42s}'
    // dosya (dossier) — daha büyük
    + '#arsiv-demo .ad-doss{position:relative;border:1px solid rgba(193,154,82,.4);background:rgba(9,10,17,.82);backdrop-filter:blur(6px);overflow:hidden;display:flex;min-height:340px;box-shadow:0 40px 90px -40px rgba(0,0,0,.9)}'
    + '#arsiv-demo .ad-doss .art{position:relative;flex:0 0 42%;overflow:hidden;border-right:1px solid rgba(193,154,82,.22)}'
    + '#arsiv-demo .ad-doss .art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.06);transition:opacity .9s,transform 7s}'
    + '#arsiv-demo .ad-doss.open .art img{opacity:.94;transform:scale(1)}'
    + '#arsiv-demo .ad-doss .art::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 58%,rgba(9,10,17,.9))}'
    + '#arsiv-demo .ad-doss .body{flex:1;position:relative;padding:30px 32px;min-width:0}'
    + '#arsiv-demo .ad-doss .stamp{position:absolute;top:20px;right:20px;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.18em;color:#c0463b;border:2px solid rgba(192,70,59,.6);padding:6px 11px;transform:rotate(6deg);transition:opacity .4s}'
    + '#arsiv-demo .ad-doss.open .stamp{opacity:0}'
    + '#arsiv-demo .ad-doss .dh{font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.22em;color:#c19a52;margin-bottom:14px}'
    + '#arsiv-demo .ad-doss h3{font-family:\'Playfair Display\',serif;font-weight:800;font-size:clamp(24px,2.6vw,34px);line-height:1.06;color:#f4ecd8;margin:0 0 18px;max-width:22ch}'
    + '#arsiv-demo .ad-meta{display:flex;flex-wrap:wrap;gap:10px 30px;margin-bottom:18px}'
    + '#arsiv-demo .ad-meta span{display:block;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.1em;color:#666d7c;margin-bottom:3px}'
    + '#arsiv-demo .ad-meta b{color:#cdd2dc;font-weight:600;font-size:13.5px}'
    + '#arsiv-demo .ad-redact{position:relative;color:#bcc3cf;font-size:15px;line-height:1.72;margin:0 0 18px;max-width:52ch;overflow:hidden}'
    + '#arsiv-demo .ad-redact::after{content:"";position:absolute;inset:-2px -4px;background:repeating-linear-gradient(90deg,#1a1206 0 46px,#241a0a 46px 50px);transform-origin:left;transform:scaleX(1);transition:transform .75s cubic-bezier(.7,0,.3,1)}'
    + '#arsiv-demo .ad-doss.open .ad-redact::after{transform:scaleX(0)}'
    + '#arsiv-demo .ad-quote{border-left:3px solid rgba(193,154,82,.5);padding-left:16px;font-family:\'Playfair Display\',serif;font-style:italic;font-size:19px;color:#e6c478;opacity:0;transform:translateY(6px);transition:opacity .5s .35s,transform .5s .35s;margin:0 0 20px}'
    + '#arsiv-demo .ad-doss.open .ad-quote{opacity:1;transform:none}'
    + '#arsiv-demo .ad-ready{display:flex;flex-wrap:wrap;gap:12px 18px;align-items:center;opacity:0;transition:opacity .5s .5s}'
    + '#arsiv-demo .ad-doss.open .ad-ready{opacity:1}'
    + '#arsiv-demo .ad-ready .tag{font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.05em;color:#7ba05a}'
    + '#arsiv-demo .ad-ready a{margin-left:auto}'
    + '@media(max-width:900px){#arsiv-demo .ad-work{grid-template-columns:1fr}#arsiv-demo .ad-scrim{background:linear-gradient(180deg,rgba(5,6,9,.9),rgba(5,6,9,.72) 50%,rgba(5,6,9,.94))}#arsiv-demo .ad-doss{flex-direction:column}#arsiv-demo .ad-doss .art{flex:0 0 180px;border-right:0;border-bottom:1px solid rgba(193,154,82,.2)}#arsiv-demo .ad-doss .art::after{background:linear-gradient(0deg,rgba(9,10,17,.9),transparent 60%)}}'
    + '@media(prefers-reduced-motion:reduce){#arsiv-demo .folder,#arsiv-demo .ad-bg{transition:opacity .4s}}';

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function rnd(a,b){return a+Math.random()*(b-a);}

  function render(mount) {
    var RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
    var last=-1, n=0;

    mount.innerHTML =
      '<div class="ad-bg" id="ad-bg0"></div><div class="ad-bg" id="ad-bg1"></div>'
      + '<div class="ad-scrim"></div><div class="ad-grain"></div><div class="ad-glow"></div>'
      + '<div class="ad-wrap"><div class="ad-work">'
      + '<div class="ad-panel">'
      + '<div class="ad-live"><span class="d"></span>GİZLİ ARŞİV · 42 DOSYA</div>'
      + '<h2>Arşivi karıştır, <span class="g">bir dosya seç.</span></h2>'
      + '<p class="ad-sub">Düğmeye bas; dosyalar karışsın, rastgele biri çekilsin — künyesi, alıntısı ve senaryosuyla yanda açılsın.</p>'
      + '<div class="ad-drawer" id="ad-drawer"></div>'
      + '<button class="ad-btn" id="ad-draw">⚁ ARŞİVİ KARIŞTIR</button>'
      + '<div class="ad-count" id="ad-count"></div>'
      + '<a class="ad-btn ghost" href="/arsiv" style="align-self:flex-start">Tüm Arşivi İncele · 42 Dosya →</a>'
      + '</div>'
      + '<div class="ad-doss" id="ad-doss"><div class="art" id="ad-art"></div><div class="body" id="ad-body"></div></div>'
      + '</div></div>';

    var drawer=mount.querySelector('#ad-drawer'), doss=mount.querySelector('#ad-doss'),
        art=mount.querySelector('#ad-art'), body=mount.querySelector('#ad-body'),
        count=mount.querySelector('#ad-count'), btn=mount.querySelector('#ad-draw'),
        bgs=[mount.querySelector('#ad-bg0'),mount.querySelector('#ad-bg1')], bga=0;

    function setBg(slug){
      var nxt=bgs[bga^1], cur=bgs[bga];
      nxt.style.backgroundImage='url(/assets/haber/'+slug+'.jpg)';
      requestAnimationFrame(function(){ nxt.classList.add('on'); cur.classList.remove('on'); });
      bga^=1;
    }

    // gizli dosyaları kur (yelpaze)
    var folders=[];
    for(var i=0;i<NF;i++){
      var f=document.createElement('div'); f.className='folder';
      var code=String(100+Math.floor(Math.random()*899));
      f.innerHTML='<span class="cg">ÇOK GİZLİ</span><span class="no">DOSYA · '+code+'</span><span class="seal">A</span><div class="bars"></div>';
      drawer.appendChild(f); folders.push(f);
    }
    function base(i){var mid=(NF-1)/2; return 'rotate('+((i-mid)*9)+'deg)';}
    function fan(){folders.forEach(function(f,i){f.style.zIndex=i;f.style.opacity='';f.style.transform=base(i);});}
    fan();

    function riffle(times,cb){
      if(RM){cb();return;}
      var t=0;
      (function spread(){
        folders.forEach(function(f){f.style.transform='rotate('+rnd(-22,22)+'deg) translateX('+rnd(-34,34)+'px) translateY('+rnd(-14,4)+'px)';});
        setTimeout(function(){ fan(); if(++t<times) setTimeout(spread,150); else setTimeout(cb,190); },170);
      })();
    }

    function paintDoss(x){
      doss.classList.remove('open');
      setBg(x.slug);
      art.innerHTML='<img src="/assets/haber/'+x.slug+'.jpg" alt="'+esc(x.t)+'">';
      body.innerHTML=
        '<div class="stamp">ÇÖZÜLDÜ</div>'
        +'<div class="dh">◈ VAKA DOSYASI · '+esc(x.yr)+'</div>'
        +'<h3>'+esc(x.t)+'</h3>'
        +'<div class="ad-meta"><div><span>YER</span><b>'+esc(x.yer)+'</b></div><div><span>KİŞİLER</span><b>'+esc(x.kisi)+'</b></div></div>'
        +'<p class="ad-redact">'+esc(x.hook)+' Dosyanın tamamı senaryo, kaynakça ve sahne planıyla arşivde hazır.</p>'
        +'<blockquote class="ad-quote">“'+esc(x.q)+'”</blockquote>'
        +'<div class="ad-ready"><span class="tag">✓ Senaryoya hazır</span><span class="tag">✓ 3 dk okunur</span><a class="ad-btn ghost" href="/arsiv">Dosyayı Aç →</a></div>';
      requestAnimationFrame(function(){requestAnimationFrame(function(){doss.classList.add('open');});});
    }

    var busy=false;
    function draw(){
      if(busy)return; busy=true; btn.disabled=true;
      var i; do{i=Math.floor(Math.random()*CASES.length);}while(i===last&&CASES.length>1); last=i;
      var x=CASES[i]; n++;
      count.textContent='ÇEKİLEN · '+String(n).padStart(2,'0')+' / 42 DOSYA';
      riffle(2,function(){
        // en öndeki dosyayı çek (sağa doğru)
        var top=folders[NF-1]; top.classList.add('pull'); top.style.zIndex=99;
        top.style.transform='translateX(150%) rotate(11deg)'; top.style.opacity='0';
        paintDoss(x);
        setTimeout(function(){ top.classList.remove('pull'); fan(); busy=false; btn.disabled=false; }, 460);
      });
    }
    btn.addEventListener('click',draw);
    // ilk dosya açık gelsin
    last=0; n=1; count.textContent='ÇEKİLEN · 01 / 42 DOSYA'; paintDoss(CASES[0]);
  }

  function injectStyle(){ if(document.getElementById('ad-style'))return; var s=document.createElement('style'); s.id='ad-style'; s.textContent=CSS; document.head.appendChild(s); }
  function ensure(){ var m=document.getElementById('arsiv-demo-mount'); if(!m)return; if(m.__adDone&&m.querySelector('.ad-wrap'))return; injectStyle(); m.__adDone=true; render(m); }
  window.__adInit=true; ensure(); document.addEventListener('DOMContentLoaded',ensure);
  var t=0,iv=setInterval(function(){ensure();if(++t>40)clearInterval(iv);},500);
  if(window.MutationObserver){var mt=null;new MutationObserver(function(){clearTimeout(mt);mt=setTimeout(ensure,150);}).observe(document.documentElement,{childList:true,subtree:true});}
})();

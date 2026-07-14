/* Tarih Ajanı — Ana sayfa "Arşiv Canlı Demo" (Dosya Çek + Aç).
   Sol: DOSYA ÇEK + karışan deste. Sağ: seçilen dosya karartma efektiyle açılır.
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

  var CSS = ''
    + '#arsiv-demo{position:relative;background:#080910;border-top:1px solid rgba(193,154,82,.15);border-bottom:1px solid rgba(193,154,82,.15);overflow:hidden}'
    + '#arsiv-demo .ad-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle 560px at 10% 6%,rgba(158,43,35,.10),transparent 60%),radial-gradient(circle 520px at 92% 96%,rgba(230,196,120,.09),transparent 58%)}'
    + '#arsiv-demo .ad-wrap{position:relative;width:min(1720px,95vw);margin:0 auto;padding:clamp(40px,4.4vw,64px) clamp(20px,3vw,40px)}'
    + '#arsiv-demo .ad-work{display:grid;grid-template-columns:.82fr 1.18fr;gap:clamp(24px,2.8vw,44px);align-items:stretch}'
    + '#arsiv-demo .ad-panel{display:flex;flex-direction:column;gap:16px;min-width:0;padding-top:clamp(6px,1.4vw,18px)}'
    + '#arsiv-demo .ad-live{display:inline-flex;align-items:center;gap:8px;color:#e08a80;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.22em}'
    + '#arsiv-demo .ad-live .d{width:9px;height:9px;border-radius:50%;background:#e11d1d;box-shadow:0 0 0 0 rgba(225,29,29,.6);animation:ad-pulse 1.4s ease-out infinite}'
    + '@keyframes ad-pulse{0%{box-shadow:0 0 0 0 rgba(225,29,29,.55)}70%{box-shadow:0 0 0 9px rgba(225,29,29,0)}100%{box-shadow:0 0 0 0 rgba(225,29,29,0)}}'
    + '#arsiv-demo h2{margin:6px 0 4px;font-family:\'Playfair Display\',serif;font-size:clamp(27px,3.1vw,42px);font-weight:800;line-height:1.03;letter-spacing:-.01em;color:#f6efe0}'
    + '#arsiv-demo h2 .g{background:linear-gradient(102deg,#b18742,#e6c478 42%,#fff0b1 52%,#a5762f);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '#arsiv-demo .ad-sub{margin:0;color:#a7adba;font-size:13.5px;line-height:1.55;max-width:44ch}'
    + '#arsiv-demo .ad-btn{cursor:pointer;border:0;display:inline-flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:14px;letter-spacing:.15em;padding:17px 30px;transition:transform .18s,box-shadow .18s;margin-top:2px}'
    + '#arsiv-demo .ad-btn:hover{transform:translateY(-2px);box-shadow:0 14px 44px -14px rgba(230,196,120,.55)}'
    + '#arsiv-demo .ad-btn.ghost{background:transparent;border:1px solid rgba(193,154,82,.5);color:#e6c478;font-size:12px;padding:13px 22px}'
    + '#arsiv-demo .ad-btn.ghost:hover{background:rgba(193,154,82,.12);box-shadow:none}'
    + '#arsiv-demo .ad-count{font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.14em;color:#8b93a1}'
    // deste
    + '#arsiv-demo .ad-deck{position:relative;height:210px;margin-top:2px}'
    + '#arsiv-demo .ad-deck .stub{position:absolute;top:0;left:0;width:150px;height:200px;border:1px solid rgba(193,154,82,.34);background:linear-gradient(160deg,#141019,#0a0710);box-shadow:0 24px 40px -28px #000;transition:transform .35s}'
    + '#arsiv-demo .ad-deck .s1{transform:translate(14px,12px) rotate(4deg);opacity:.45}'
    + '#arsiv-demo .ad-deck .s2{transform:translate(7px,6px) rotate(2deg);opacity:.72}'
    + '#arsiv-demo .ad-deck.shuf .s1{transform:translate(24px,8px) rotate(9deg)}'
    + '#arsiv-demo .ad-deck.shuf .s2{transform:translate(-6px,10px) rotate(-5deg)}'
    + '#arsiv-demo .ad-card{position:absolute;top:0;left:0;width:150px;height:200px;border:1px solid rgba(193,154,82,.5);overflow:hidden;background:#0b0c14}'
    + '#arsiv-demo .ad-card.deal{animation:ad-deal .5s cubic-bezier(.3,.8,.3,1)}'
    + '@keyframes ad-deal{0%{transform:translateY(20px) rotate(-4deg) scale(.94);opacity:.2}100%{transform:none;opacity:1}}'
    + '#arsiv-demo .ad-card .cov{position:absolute;inset:0}'
    + '#arsiv-demo .ad-card .cov img{width:100%;height:100%;object-fit:cover;opacity:.85}'
    + '#arsiv-demo .ad-card .cat{position:absolute;top:9px;left:9px;font-family:\'Special Elite\',monospace;font-size:8px;letter-spacing:.12em;color:#fff;padding:4px 7px}'
    + '#arsiv-demo .ad-card .seal{position:absolute;top:8px;right:8px;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 40% 32%,#d24b38,#a62f22 46%,#7c1f16 82%);display:grid;place-items:center;font-family:\'Playfair Display\',serif;font-weight:800;font-size:14px;color:#f4d9c9;box-shadow:inset 0 -2px 4px rgba(0,0,0,.4)}'
    + '#arsiv-demo .ad-card .lbl{position:absolute;left:0;right:0;bottom:0;padding:24px 11px 11px;background:linear-gradient(to top,rgba(4,5,10,.96),transparent);font-family:\'Playfair Display\',serif;font-weight:700;font-size:13px;line-height:1.15;color:#f2ecd9}'
    // dosya (dossier)
    + '#arsiv-demo .ad-doss{position:relative;border:1px solid rgba(193,154,82,.34);background:#0a0b12;overflow:hidden;display:flex}'
    + '#arsiv-demo .ad-doss .art{position:relative;flex:0 0 40%;min-height:100%;overflow:hidden;border-right:1px solid rgba(193,154,82,.2)}'
    + '#arsiv-demo .ad-doss .art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transform:scale(1.06);transition:opacity .9s,transform 7s}'
    + '#arsiv-demo .ad-doss.open .art img{opacity:.9;transform:scale(1)}'
    + '#arsiv-demo .ad-doss .art::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent 60%,#0a0b12)}'
    + '#arsiv-demo .ad-doss .body{flex:1;position:relative;padding:22px 24px;min-width:0}'
    + '#arsiv-demo .ad-doss .stamp{position:absolute;top:16px;right:16px;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.18em;color:#c0463b;border:2px solid rgba(192,70,59,.6);padding:5px 9px;transform:rotate(6deg);transition:opacity .4s}'
    + '#arsiv-demo .ad-doss.open .stamp{opacity:0}'
    + '#arsiv-demo .ad-doss .dh{font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.2em;color:#c19a52;margin-bottom:11px}'
    + '#arsiv-demo .ad-doss h3{font-family:\'Playfair Display\',serif;font-weight:800;font-size:clamp(20px,2.2vw,27px);line-height:1.08;color:#f4ecd8;margin:0 0 14px;max-width:22ch}'
    + '#arsiv-demo .ad-meta{display:flex;flex-wrap:wrap;gap:8px 24px;margin-bottom:15px}'
    + '#arsiv-demo .ad-meta span{display:block;font-family:\'Special Elite\',monospace;font-size:9.5px;letter-spacing:.1em;color:#666d7c;margin-bottom:2px}'
    + '#arsiv-demo .ad-meta b{color:#cdd2dc;font-weight:600;font-size:12.5px}'
    + '#arsiv-demo .ad-redact{position:relative;color:#b9c0cc;font-size:13.5px;line-height:1.7;margin:0 0 14px;max-width:52ch;overflow:hidden}'
    + '#arsiv-demo .ad-redact::after{content:"";position:absolute;inset:-2px -4px;background:repeating-linear-gradient(90deg,#1a1206 0 42px,#241a0a 42px 46px);transform-origin:left;transform:scaleX(1);transition:transform .75s cubic-bezier(.7,0,.3,1)}'
    + '#arsiv-demo .ad-doss.open .ad-redact::after{transform:scaleX(0)}'
    + '#arsiv-demo .ad-quote{border-left:3px solid rgba(193,154,82,.5);padding-left:14px;font-family:\'Playfair Display\',serif;font-style:italic;font-size:17px;color:#e6c478;opacity:0;transform:translateY(6px);transition:opacity .5s .35s,transform .5s .35s;margin:0 0 16px}'
    + '#arsiv-demo .ad-doss.open .ad-quote{opacity:1;transform:none}'
    + '#arsiv-demo .ad-ready{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;opacity:0;transition:opacity .5s .5s}'
    + '#arsiv-demo .ad-doss.open .ad-ready{opacity:1}'
    + '#arsiv-demo .ad-ready .tag{font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.05em;color:#7ba05a}'
    + '#arsiv-demo .ad-ready a{margin-left:auto}'
    + '@media(max-width:820px){#arsiv-demo .ad-work{grid-template-columns:1fr}#arsiv-demo .ad-doss{flex-direction:column}#arsiv-demo .ad-doss .art{flex:0 0 150px;border-right:0;border-bottom:1px solid rgba(193,154,82,.2)}#arsiv-demo .ad-doss .art::after{background:linear-gradient(0deg,#0a0b12,transparent 60%)}}';

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function render(mount) {
    var RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
    var last=-1, n=0;

    mount.innerHTML =
      '<div class="ad-glow"></div><div class="ad-wrap"><div class="ad-work">'
      + '<div class="ad-panel">'
      + '<div class="ad-live"><span class="d"></span>ARŞİV · CANLI DEMO</div>'
      + '<h2>Bir dosya çek, <span class="g">kilidini aç.</span></h2>'
      + '<p class="ad-sub">42 hazır vaka dosyası. Birini çek; künyesi, alıntısı ve senaryosuyla anında açılsın.</p>'
      + '<button class="ad-btn" id="ad-draw">⚁ DOSYA ÇEK</button>'
      + '<div class="ad-count" id="ad-count"></div>'
      + '<div class="ad-deck" id="ad-deck"><div class="stub s1"></div><div class="stub s2"></div><div class="ad-card" id="ad-card"></div></div>'
      + '<a class="ad-btn ghost" href="/arsiv" style="align-self:flex-start">Tüm Arşiv · 42 Dosya →</a>'
      + '</div>'
      + '<div class="ad-doss" id="ad-doss"><div class="art" id="ad-art"></div><div class="body" id="ad-body"></div></div>'
      + '</div></div>';

    var deck=mount.querySelector('#ad-deck'), card=mount.querySelector('#ad-card'),
        doss=mount.querySelector('#ad-doss'), art=mount.querySelector('#ad-art'),
        body=mount.querySelector('#ad-body'), count=mount.querySelector('#ad-count');

    function paintCard(x){
      card.innerHTML='<div class="cov"><img src="/assets/haber/'+x.slug+'.jpg" alt="" loading="lazy"></div>'
        +'<span class="cat" style="background:'+x.c+'">'+esc(x.cat)+'</span><span class="seal">A</span>'
        +'<span class="lbl">'+esc(x.t)+'</span>';
      if(!RM){card.classList.remove('deal');void card.offsetWidth;card.classList.add('deal');}
    }
    function paintDoss(x){
      doss.classList.remove('open');
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
    function draw(){
      var i; do{i=Math.floor(Math.random()*CASES.length);}while(i===last&&CASES.length>1); last=i;
      var x=CASES[i]; n++;
      count.textContent='ÇEKİLEN · '+String(n).padStart(2,'0')+' / 42 DOSYA';
      if(!RM){deck.classList.add('shuf');setTimeout(function(){deck.classList.remove('shuf');paintCard(x);},240);}
      else paintCard(x);
      paintDoss(x);
    }
    mount.querySelector('#ad-draw').addEventListener('click',draw);
    // ilk dosya açık gelsin
    last=0; n=1; var x0=CASES[0]; count.textContent='ÇEKİLEN · 01 / 42 DOSYA'; paintCard(x0); paintDoss(x0);
  }

  function injectStyle(){ if(document.getElementById('ad-style'))return; var s=document.createElement('style'); s.id='ad-style'; s.textContent=CSS; document.head.appendChild(s); }
  function ensure(){ var m=document.getElementById('arsiv-demo-mount'); if(!m)return; if(m.__adDone&&m.querySelector('.ad-wrap'))return; injectStyle(); m.__adDone=true; render(m); }
  window.__adInit=true; ensure(); document.addEventListener('DOMContentLoaded',ensure);
  var t=0,iv=setInterval(function(){ensure();if(++t>40)clearInterval(iv);},500);
  if(window.MutationObserver){var mt=null;new MutationObserver(function(){clearTimeout(mt);mt=setTimeout(ensure,150);}).observe(document.documentElement,{childList:true,subtree:true});}
})();

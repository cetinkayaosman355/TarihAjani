/* Tarih Ajanı — Ana sayfa "Arşiv" bölümü (çerçeveli Vaka Dosyası kartları).
   Sol: başlık + açıklama + "Başka dosyalar" (karıştır) + "Tüm Arşivi İncele".
   Sağ: 4 çerçeveli Vaka Dosyası kartı (yıl · başlık · yer · kişiler · kategori);
   "karıştır" düğmesi kartları gerçek arşivden yeniden seçer. Uydurma sayı YOK.
   #arsiv-demo-mount içine kendi kendine yerleşir (dc bağımsız, güvenli montaj). */
(function () {
  if (window.__adInit) return;

  var CASES = [
    {slug:'istanbul-fethi',cat:'SAVAŞ',c:'#a6392c',yr:'1453',yer:'Konstantinopolis',kisi:'II. Mehmed · XI. Konstantin',
     t:'Konstantinopolis düştü'},
    {slug:'sezar-suikasti',cat:'SIR DOSYASI',c:'#7c5cab',yr:'MÖ 44',yer:'Roma Senatosu',kisi:'Julius Caesar · Brutus',
     t:'Sezar senatoda öldürüldü'},
    {slug:'vezuv-pompeii',cat:'FELAKET',c:'#b5731f',yr:'MS 79',yer:'Pompeii',kisi:'Yaşlı Plinius',
     t:'Vezüv patladı, Pompeii kül altında'},
    {slug:'malazgirt',cat:'SAVAŞ',c:'#a6392c',yr:'1071',yer:'Malazgirt',kisi:'Alp Arslan · Romen Diyojen',
     t:'İmparator esir düştü'},
    {slug:'bagdat-1258',cat:'FELAKET',c:'#b5731f',yr:'1258',yer:'Bağdat',kisi:'Hülagü Han',
     t:'Bağdat yıkıldı, Bilgelik Evi döküldü'},
    {slug:'otzi',cat:'SIR DOSYASI',c:'#7c5cab',yr:'MÖ 3300',yer:'Ötztal Alpleri',kisi:'“Ötzi”',
     t:'5300 yıllık cinayet: Buz Adam'},
    {slug:'fatih-olumu',cat:'SIR DOSYASI',c:'#7c5cab',yr:'1481',yer:'Gebze',kisi:'II. Mehmed',
     t:'Fatih ani öldü: zehir şüphesi'},
    {slug:'grek-atesi',cat:'KEŞİF',c:'#3f7d78',yr:'672',yer:'İstanbul',kisi:'Kallinikos',
     t:'Suda bile sönmeyen ateş'},
    {slug:'kartaca',cat:'SAVAŞ',c:'#a6392c',yr:'MÖ 146',yer:'Kartaca',kisi:'Scipio Aemilianus',
     t:'Kartaca yerle bir edildi'},
    {slug:'ea-nasir',cat:'EKONOMİ',c:'#a5762f',yr:'MÖ 1750',yer:'Ur',kisi:'Nanni · Ea-Nasir',
     t:'Tarihin ilk şikâyeti'}
  ];
  var SHOW = 4; // aynı anda gösterilen kart sayısı

  var CSS = ''
    + '#arsiv-demo{position:relative;background:linear-gradient(180deg,#040509,#0b0805 42%,#0b0805 58%,#040509);overflow:hidden;isolation:isolate}'
    // sinematik doku — sepya arşiv zemini + film grain (sağ kenara sızan sıcak doku)
    + '#arsiv-demo .ad-scrim{position:absolute;inset:0;z-index:0;pointer-events:none;background:radial-gradient(90% 120% at 88% 20%,rgba(150,96,40,.10),transparent 55%),radial-gradient(120% 130% at 50% 0%,transparent 44%,rgba(0,0,0,.6))}'
    + '#arsiv-demo .ad-grain{position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.45;mix-blend-mode:overlay;background-image:radial-gradient(rgba(255,255,255,.05) .5px,transparent .5px);background-size:3px 3px}'
    + '#arsiv-demo .ad-wrap{position:relative;z-index:2;width:min(1740px,96vw);margin:0 auto;padding:clamp(48px,5vw,64px) clamp(22px,3vw,48px)}'
    + '#arsiv-demo .ad-work{display:grid;grid-template-columns:.82fr 1.18fr;gap:clamp(30px,3.4vw,60px);align-items:center}'
    + '#arsiv-demo .ad-panel{display:flex;flex-direction:column;gap:16px;min-width:0}'
    + '#arsiv-demo .ad-live{display:inline-flex;align-items:center;gap:10px;align-self:flex-start;color:#e6c478;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.24em;border:1px solid rgba(193,154,82,.4);padding:8px 15px;background:rgba(12,10,6,.5)}'
    + '#arsiv-demo .ad-live .d{width:9px;height:9px;border-radius:50%;background:#c0463b;box-shadow:0 0 0 0 rgba(192,70,59,.6);animation:ad-pulse 1.6s ease-out infinite}'
    + '@keyframes ad-pulse{0%{box-shadow:0 0 0 0 rgba(192,70,59,.5)}70%{box-shadow:0 0 0 10px rgba(192,70,59,0)}100%{box-shadow:0 0 0 0 rgba(192,70,59,0)}}'
    + '#arsiv-demo h2{margin:8px 0 4px;font-family:\'Playfair Display\',serif;font-size:clamp(32px,3.9vw,54px);font-weight:800;line-height:1.02;letter-spacing:-.015em;color:#f6efe0}'
    + '#arsiv-demo h2 .g{background:linear-gradient(102deg,#b18742,#e6c478 42%,#fff0b1 52%,#a5762f);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '#arsiv-demo .ad-sub{margin:0;color:#b3b9c6;font-size:15px;line-height:1.62;max-width:42ch}'
    + '#arsiv-demo .ad-btn{cursor:pointer;border:0;display:inline-flex;align-items:center;justify-content:center;gap:12px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:15px;letter-spacing:.16em;padding:18px 32px;transition:transform .18s,box-shadow .18s}'
    + '#arsiv-demo .ad-btn:hover{transform:translateY(-2px);box-shadow:0 16px 50px -14px rgba(230,196,120,.6)}'
    + '#arsiv-demo .ad-btn:disabled{opacity:.7;cursor:default;transform:none;box-shadow:none}'
    + '#arsiv-demo .ad-btn.ghost{background:rgba(12,10,6,.4);border:1px solid rgba(193,154,82,.5);color:#e6c478;font-family:\'Hanken Grotesk\',system-ui,sans-serif;font-weight:700;font-size:13.5px;letter-spacing:.03em;padding:14px 24px}'
    + '#arsiv-demo .ad-btn.ghost:hover{background:rgba(193,154,82,.14);box-shadow:none}'
    + '#arsiv-demo .ad-count{font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.14em;color:#9aa2b0}'
    // KART IZGARASI — çerçeveli Vaka Dosyaları
    + '#arsiv-demo .ad-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:15px}'
    + '#arsiv-demo .ad-card{position:relative;display:block;min-height:214px;border:1px solid rgba(193,154,82,.32);background:linear-gradient(160deg,#15110a,#0c0906);overflow:hidden;text-decoration:none;transition:transform .22s,border-color .22s,box-shadow .22s;opacity:0;transform:translateY(10px)}'
    + '#arsiv-demo .ad-card.in{opacity:1;transform:none}'
    + '#arsiv-demo .ad-card:hover{transform:translateY(-4px);border-color:rgba(230,196,120,.62);box-shadow:0 26px 54px -30px rgba(0,0,0,.92)}'
    + '#arsiv-demo .ad-card .cimg{position:absolute;inset:0;background-size:cover;background-position:center;filter:brightness(.36) saturate(.82) sepia(.16);transition:filter .35s,transform 6s ease}'
    + '#arsiv-demo .ad-card:hover .cimg{filter:brightness(.5) saturate(.95);transform:scale(1.05)}'
    + '#arsiv-demo .ad-card .cscrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,6,4,.42),rgba(8,6,4,.72) 52%,rgba(7,5,3,.93))}'
    // köşe çerçeve süsleri (elit dosya çerçevesi)
    + '#arsiv-demo .ad-card .cnr{position:absolute;width:14px;height:14px;z-index:3;pointer-events:none;border-color:rgba(230,196,120,.65)}'
    + '#arsiv-demo .ad-card .cnr.tl{top:8px;left:8px;border-top:1px solid;border-left:1px solid}'
    + '#arsiv-demo .ad-card .cnr.tr{top:8px;right:8px;border-top:1px solid;border-right:1px solid}'
    + '#arsiv-demo .ad-card .cnr.bl{bottom:8px;left:8px;border-bottom:1px solid;border-left:1px solid}'
    + '#arsiv-demo .ad-card .cnr.br{bottom:8px;right:8px;border-bottom:1px solid;border-right:1px solid}'
    + '#arsiv-demo .ad-card .ctag{position:absolute;top:12px;left:12px;z-index:3;font-family:\'Special Elite\',monospace;font-size:8.5px;letter-spacing:.14em;color:#f4e6d9;padding:3px 7px;border:1px solid;background:rgba(8,6,4,.55)}'
    + '#arsiv-demo .ad-card .cseal{position:absolute;top:11px;right:11px;z-index:3;width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 40% 32%,#d24b38,#a62f22 46%,#7c1f16 82%);display:grid;place-items:center;font-family:\'Playfair Display\',serif;font-weight:800;font-size:12px;color:#f4d9c9;box-shadow:inset 0 -1px 3px rgba(0,0,0,.4),0 2px 7px -2px rgba(166,47,34,.6)}'
    + '#arsiv-demo .ad-card .cbody{position:relative;z-index:2;height:100%;padding:16px 16px 15px;display:flex;flex-direction:column;justify-content:flex-end}'
    + '#arsiv-demo .ad-card .cdh{font-family:\'Special Elite\',monospace;font-size:9.5px;letter-spacing:.16em;color:#d0a75f;margin-bottom:7px}'
    + '#arsiv-demo .ad-card h4{font-family:\'Playfair Display\',serif;font-weight:800;font-size:clamp(17px,1.5vw,21px);line-height:1.08;color:#f4ecd8;margin:0 0 11px;max-width:20ch}'
    + '#arsiv-demo .ad-card .cmeta{display:flex;flex-wrap:wrap;gap:6px 20px;margin-bottom:12px}'
    + '#arsiv-demo .ad-card .cmeta span{display:block;font-family:\'Special Elite\',monospace;font-size:8px;letter-spacing:.12em;color:#928776;margin-bottom:2px}'
    + '#arsiv-demo .ad-card .cmeta b{color:#cdd2dc;font-weight:600;font-size:11.5px;letter-spacing:.01em}'
    + '#arsiv-demo .ad-card .cfoot{display:flex;align-items:center;justify-content:space-between;padding-top:11px;border-top:1px solid rgba(193,154,82,.16);font-family:\'Special Elite\',monospace;font-size:9.5px;letter-spacing:.12em;color:#c19a52}'
    + '#arsiv-demo .ad-card .cfoot .go{color:#e6c478;transition:transform .2s}'
    + '#arsiv-demo .ad-card:hover .cfoot .go{transform:translateX(4px)}'
    + '@media(max-width:1000px){#arsiv-demo .ad-work{grid-template-columns:1fr}}'
    + '@media(max-width:560px){#arsiv-demo .ad-cards{grid-template-columns:1fr}#arsiv-demo .ad-wrap{padding:clamp(40px,9vw,52px) 14px}#arsiv-demo h2{font-size:clamp(28px,8vw,40px)}#arsiv-demo .ad-btn{width:100%}}'
    + '@media(prefers-reduced-motion:reduce){#arsiv-demo .ad-card{transition:opacity .3s}#arsiv-demo .ad-card .cimg{transition:none}}';

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function cardHTML(x){
    var initial = esc((x.kisi||'A').trim().charAt(0));
    return '<a class="ad-card" href="/arsiv" data-slug="'+esc(x.slug)+'">'
      + '<span class="cimg" style="background-image:url(/assets/haber/'+esc(x.slug)+'.jpg)"></span>'
      + '<span class="cscrim"></span>'
      + '<span class="cnr tl"></span><span class="cnr tr"></span><span class="cnr bl"></span><span class="cnr br"></span>'
      + '<span class="ctag" style="color:'+x.c+';border-color:'+x.c+'88">'+esc(x.cat)+'</span>'
      + '<span class="cseal" aria-hidden="true">'+initial+'</span>'
      + '<span class="cbody">'
        + '<span class="cdh">◈ VAKA DOSYASI · '+esc(x.yr)+'</span>'
        + '<h4>'+esc(x.t)+'</h4>'
        + '<span class="cmeta"><span style="display:block"><span>YER</span><b>'+esc(x.yer)+'</b></span><span style="display:block"><span>KİŞİLER</span><b>'+esc(x.kisi)+'</b></span></span>'
        + '<span class="cfoot"><span>DOSYA · '+esc(x.slug.toUpperCase().slice(0,10))+'</span><span class="go">Dosyayı aç →</span></span>'
      + '</span>'
    + '</a>';
  }

  function render(mount) {
    var RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
    var order = CASES.map(function(_,i){return i;});
    var start = 0; // gösterilen ilk kartın indeksi (döngüsel)

    mount.innerHTML =
      '<div class="ad-scrim"></div><div class="ad-grain"></div>'
      + '<div class="ad-wrap"><div class="ad-work">'
      + '<div class="ad-panel">'
      + '<div class="ad-live"><span class="d"></span>GİZLİ ARŞİV · 42 DOSYA</div>'
      + '<h2>Arşivi karıştır, <span class="g">bir dosya seç.</span></h2>'
      + '<p class="ad-sub">Olayların, kişilerin ve yerlerin izini sür; her dosya senaryo, kaynakça ve sahne planıyla arşivde hazır bekliyor.</p>'
      + '<button class="ad-btn" id="ad-shuffle">⚁ BAŞKA DOSYALAR GÖSTER</button>'
      + '<div class="ad-count" id="ad-count"></div>'
      + '<a class="ad-btn ghost" href="/arsiv" style="align-self:flex-start">Tüm Arşivi İncele · 42 Dosya →</a>'
      + '</div>'
      + '<div class="ad-cards" id="ad-cards"></div>'
      + '</div></div>';

    var wrap=mount.querySelector('#ad-cards'), btn=mount.querySelector('#ad-shuffle'), count=mount.querySelector('#ad-count');

    function paint(anim){
      var html='';
      for(var k=0;k<SHOW;k++){ html += cardHTML(CASES[order[(start+k)%CASES.length]]); }
      wrap.innerHTML=html;
      count.textContent='GÖSTERİLEN · '+SHOW+' / '+CASES.length+' ÖNE ÇIKAN DOSYA';
      var cards=[].slice.call(wrap.querySelectorAll('.ad-card'));
      if(anim && !RM){ cards.forEach(function(c,i){ setTimeout(function(){c.classList.add('in');}, 60+i*70); }); }
      else { cards.forEach(function(c){c.classList.add('in');}); }
    }

    function shuffle(){
      // Fisher-Yates ile sırayı karıştır, farklı dört dosya öne çıksın
      for(var i=order.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var tmp=order[i];order[i]=order[j];order[j]=tmp; }
      start=0; paint(true);
    }

    btn.addEventListener('click', shuffle);
    paint(true);
  }

  /* GÜVENLİ MONTAJ: dc'yi kıran senkron document-level MutationObserver YOK.
     DOMContentLoaded + sınırlı aralık + .ad-wrap varlık kontrolü; sonra seyrek bekçi. */
  function injectStyle(){ if(document.getElementById('ad-style'))return; var s=document.createElement('style'); s.id='ad-style'; s.textContent=CSS; document.head.appendChild(s); }
  function ensure(){ var m=document.getElementById('arsiv-demo-mount'); if(!m)return; if(m.querySelector('.ad-wrap'))return; injectStyle(); render(m); }
  window.__adInit=true;
  function start(){ ensure(); var t=0,iv=setInterval(function(){ ensure(); if(++t>40){ clearInterval(iv); setInterval(ensure,4000); } },500); }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',start); } else { start(); }
})();

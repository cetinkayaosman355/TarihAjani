/* Tarih Ajanı — Ana sayfa "Kanalını Kur, Para Kazan" demosu.
   Üç araç sekmesi: 1) Eğitim  2) Arşiv  3) Studio. Tuşa basınca ilgili
   ürünün önizlemesi (sayfası) sağda görünür ve gerçek sayfaya bağlanır.
   #egitim-demo-mount içine kendi kendine yerleşir (dc bağımsız). */
(function () {
  if (window.__edInit) return;

  var TABS = [
    {key:'EĞİTİM', ico:'🎓', href:'/egitim', d:'9 derslik program · sertifika'},
    {key:'ARŞİV',  ico:'🗂', href:'/arsiv',  d:'42 hazır vaka dosyası'},
    {key:'STUDIO', ico:'◉', href:'/studio', d:'senaryo · ses · sahne tek tıkla'}
  ];
  var LESSONS = ['Kanal DNA’sı: konum & ton','Senaryo iskeleti: kanca → doruk','Yayın, kapak & algoritma','Büyüme ve gelir modelleri'];

  var CSS = ''
    + '#egitim-demo{position:relative;background:#080910;border-top:1px solid rgba(193,154,82,.15);border-bottom:1px solid rgba(193,154,82,.15);overflow:hidden}'
    + '#egitim-demo .ed-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle 560px at 90% 6%,rgba(230,196,120,.11),transparent 60%),radial-gradient(circle 520px at 6% 96%,rgba(158,43,35,.08),transparent 58%)}'
    + '#egitim-demo .ed-wrap{position:relative;width:min(1660px,94vw);margin:0 auto;padding:clamp(28px,3vw,44px) clamp(20px,3vw,40px)}'
    + '#egitim-demo .ed-work{display:grid;grid-template-columns:.82fr 1.18fr;gap:clamp(24px,2.8vw,44px);align-items:stretch}'
    + '#egitim-demo .ed-panel{display:flex;flex-direction:column;gap:12px;min-width:0}'
    + '#egitim-demo .ed-live{display:inline-flex;align-items:center;gap:8px;color:#e08a80;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.2em}'
    + '#egitim-demo .ed-live .d{width:9px;height:9px;border-radius:50%;background:#e11d1d;box-shadow:0 0 0 0 rgba(225,29,29,.6);animation:ed-pulse 1.4s ease-out infinite}'
    + '@keyframes ed-pulse{0%{box-shadow:0 0 0 0 rgba(225,29,29,.55)}70%{box-shadow:0 0 0 9px rgba(225,29,29,0)}100%{box-shadow:0 0 0 0 rgba(225,29,29,0)}}'
    + '#egitim-demo h2{margin:6px 0 3px;font-family:\'Playfair Display\',serif;font-size:clamp(27px,3.1vw,42px);font-weight:800;line-height:1.03;letter-spacing:-.01em;color:#f6efe0}'
    + '#egitim-demo h2 .g{background:linear-gradient(102deg,#b18742,#e6c478 42%,#fff0b1 52%,#a5762f);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '#egitim-demo .ed-sub{margin:0 0 6px;color:#a7adba;font-size:13.5px;line-height:1.55;max-width:44ch}'
    // sekme tuşları
    + '#egitim-demo .tabs{display:flex;flex-direction:column;gap:9px}'
    + '#egitim-demo .tab{cursor:pointer;display:flex;align-items:center;gap:13px;text-align:left;border:1px solid rgba(193,154,82,.24);background:rgba(193,154,82,.03);color:#cdd2dc;padding:13px 15px;transition:all .18s;width:100%}'
    + '#egitim-demo .tab:hover{border-color:rgba(193,154,82,.55);background:rgba(193,154,82,.07)}'
    + '#egitim-demo .tab.on{border-color:transparent;background:linear-gradient(110deg,rgba(167,125,53,.25),rgba(193,154,82,.14));box-shadow:inset 3px 0 0 #e6c478}'
    + '#egitim-demo .tab .n{flex-shrink:0;width:26px;height:26px;border-radius:50%;border:1px solid rgba(193,154,82,.45);display:grid;place-items:center;font-family:\'Special Elite\',monospace;font-size:12px;color:#c19a52}'
    + '#egitim-demo .tab.on .n{background:#9E2B23;border-color:transparent;color:#fff}'
    + '#egitim-demo .tab .ic{font-size:15px;filter:grayscale(.15)}'
    + '#egitim-demo .tab .tx{flex:1;min-width:0}'
    + '#egitim-demo .tab .tx b{display:block;font-family:\'Special Elite\',monospace;font-size:12.5px;letter-spacing:.1em;color:#f2ecd9}'
    + '#egitim-demo .tab .tx span{display:block;font-size:11.5px;color:#8b93a1;margin-top:2px}'
    + '#egitim-demo .tab .ar{color:#c19a52;font-size:14px;opacity:.5;transition:opacity .18s,transform .18s}'
    + '#egitim-demo .tab.on .ar,#egitim-demo .tab:hover .ar{opacity:1;transform:translateX(2px)}'
    + '#egitim-demo .ed-flow{font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.08em;color:#7a8090;margin-top:4px}'
    + '#egitim-demo .ed-flow b{color:#c19a52}'
    // önizleme paneli
    + '#egitim-demo .pv{border:1px solid rgba(193,154,82,.3);background:#0a0b12;overflow:hidden;display:flex;flex-direction:column;min-height:290px}'
    + '#egitim-demo .pv-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 18px;border-bottom:1px solid rgba(193,154,82,.16);background:rgba(3,4,9,.5)}'
    + '#egitim-demo .pv-bar .pt{font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.16em;color:#e6c478}'
    + '#egitim-demo .pv-bar a{font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.08em;color:#c19a52;text-decoration:none;white-space:nowrap}'
    + '#egitim-demo .pv-bar a:hover{color:#fff0b1}'
    + '#egitim-demo .pv-body{flex:1;padding:18px 20px;animation:ed-fade .4s ease}'
    + '@keyframes ed-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'
    // eğitim önizleme
    + '#egitim-demo .les{display:flex;align-items:center;gap:11px;padding:10px 0;border-bottom:1px solid rgba(193,154,82,.12);font-size:13px;color:#cdd2dc}'
    + '#egitim-demo .les:last-of-type{border-bottom:0}'
    + '#egitim-demo .les .ln{flex-shrink:0;width:22px;height:22px;border-radius:50%;border:1px solid rgba(193,154,82,.4);display:grid;place-items:center;font-family:\'Special Elite\',monospace;font-size:10px;color:#c19a52}'
    + '#egitim-demo .les:nth-of-type(-n+2) .ln{background:rgba(111,155,74,.16);border-color:rgba(111,155,74,.5);color:#7ba05a}'
    + '#egitim-demo .badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}'
    + '#egitim-demo .badge{font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.06em;color:#cdb98a;border:1px solid rgba(193,154,82,.28);padding:6px 11px;background:rgba(193,154,82,.04)}'
    + '#egitim-demo .more{font-family:\'Special Elite\',monospace;font-size:10.5px;color:#7a8090;margin-top:12px}'
    // arşiv & studio ortak medya
    + '#egitim-demo .pv-media{display:grid;grid-template-columns:.9fr 1.1fr;gap:16px;align-items:start}'
    + '#egitim-demo .pv-media .img{position:relative;aspect-ratio:4/3;overflow:hidden;border:1px solid rgba(193,154,82,.22)}'
    + '#egitim-demo .pv-media .img img{width:100%;height:100%;object-fit:cover;opacity:.9}'
    + '#egitim-demo .pv-media .img .cat{position:absolute;top:0;left:0;font-family:\'Special Elite\',monospace;font-size:8px;letter-spacing:.12em;color:#fff;background:#9E2B23;padding:4px 8px}'
    + '#egitim-demo .pv-h{font-family:\'Playfair Display\',serif;font-weight:800;font-size:20px;line-height:1.1;color:#f4ecd8;margin:0 0 10px}'
    + '#egitim-demo .pv-meta{font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.06em;color:#8b93a1;margin-bottom:10px;line-height:1.7}'
    + '#egitim-demo .pv-meta b{color:#cdd2dc}'
    + '#egitim-demo .chips{display:flex;flex-direction:column;gap:8px}'
    + '#egitim-demo .chip{display:flex;align-items:center;gap:9px;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.04em;color:#cdd2dc;border:1px solid rgba(193,154,82,.2);background:#070a12;padding:9px 12px}'
    + '#egitim-demo .chip .ck{color:#7ba05a}'
    + '#egitim-demo .pv-note{font-family:\'Special Elite\',monospace;font-size:10.5px;color:#7a8090;margin-top:12px}'
    + '#egitim-demo .pv-note b{color:#c19a52}'
    + '@media(max-width:820px){#egitim-demo .ed-work{grid-template-columns:1fr}#egitim-demo .pv-media{grid-template-columns:1fr}}';

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function render(mount){
    mount.innerHTML=
      '<div class="ed-glow"></div><div class="ed-wrap"><div class="ed-work">'
      + '<div class="ed-panel">'
      +   '<div class="ed-live"><span class="d"></span>ARAÇ KUTUSU · CANLI DEMO</div>'
      +   '<h2>Kanalını Kur, <span class="g">Para Kazan.</span></h2>'
      +   '<p class="ed-sub">Üç araç, tek yol: öğren, dosyanı seç, üret. Bir tuşa bas — ilgili sayfa yanda açılsın.</p>'
      +   '<div class="tabs" id="ed-tabs">'
      +     TABS.map(function(t,i){return '<button class="tab'+(i===0?' on':'')+'" data-i="'+i+'"><span class="n">'+(i+1)+'</span><span class="ic">'+t.ico+'</span><span class="tx"><b>'+esc(t.key)+'</b><span>'+esc(t.d)+'</span></span><span class="ar">→</span></button>';}).join('')
      +   '</div>'
      +   '<div class="ed-flow"><b>Öğren</b> → <b>Seç</b> → <b>Üret</b> → yayınla → <b>kazan</b></div>'
      + '</div>'
      + '<div class="pv" id="ed-pv"></div>'
      + '</div></div>';

    var pv=mount.querySelector('#ed-pv'), tabs=mount.querySelector('#ed-tabs');

    function bar(title,href,label){return '<div class="pv-bar"><span class="pt">'+title+'</span><a href="'+href+'">'+label+' →</a></div>';}

    function viewEgitim(){
      return bar('AKADEMİ · 9 DERS','/egitim','Akademi’ye Git')
        +'<div class="pv-body">'
        + LESSONS.map(function(l,i){return '<div class="les"><span class="ln">'+(i<2?'✓':(i+1))+'</span>'+esc(l)+'</div>';}).join('')
        +'<div class="more">…toplam 9 ders</div>'
        +'<div class="badges"><span class="badge">◆ Sertifika</span><span class="badge">◆ Topluluk</span><span class="badge">◆ Canlı destek</span><span class="badge">◆ Gelir modelleri</span></div>'
        +'<div class="pv-note">Kanalını <b>sıfırdan kurmayı ve büyütmeyi</b> adım adım öğren.</div>'
        +'</div>';
    }
    function viewArsiv(){
      return bar('ARŞİV · 42 DOSYA','/arsiv','Arşive Git')
        +'<div class="pv-body"><div class="pv-media">'
        +'<div class="img"><img src="/assets/haber/istanbul-fethi.jpg" alt="" loading="lazy"><span class="cat">SAVAŞ</span></div>'
        +'<div><div class="pv-meta">VAKA DOSYASI · 1453</div><h3 class="pv-h">Konstantinopolis düştü</h3>'
        +'<div class="pv-meta">YER · <b>KONSTANTİNOPOLİS</b><br>KİŞİLER · <b>II. Mehmed · XI. Konstantin</b></div>'
        +'<div class="chips"><span class="chip"><span class="ck">✓</span>Hazır senaryo</span><span class="chip"><span class="ck">✓</span>Kaynakça &amp; zaman çizelgesi</span><span class="chip"><span class="ck">✓</span>Sahne planı</span></div>'
        +'</div></div><div class="pv-note">42 hazır vakadan birini seç; <b>saatlerce araştırma yerine</b> dakikalar.</div></div>';
    }
    function viewStudio(){
      return bar('STUDIO · ÜRETİM','/studio','Studio’ya Git')
        +'<div class="pv-body"><div class="pv-media">'
        +'<div class="img" style="aspect-ratio:16/10"><img src="/assets/haber/vezuv-pompeii.jpg" alt="" loading="lazy"><span class="cat">SAHNE</span></div>'
        +'<div><h3 class="pv-h">Tek konudan tam paket</h3>'
        +'<div class="chips"><span class="chip"><span class="ck">✓</span>Senaryo</span><span class="chip"><span class="ck">✓</span>Seslendirme yönergesi</span><span class="chip"><span class="ck">✓</span>Sinematik görsel</span><span class="chip"><span class="ck">✓</span>Kapak &amp; başlık</span></div>'
        +'</div></div><div class="pv-note">Konunu yaz; <b>senaryo, ses ve sahneyi tek dosyada</b> üret — yayına hazır.</div></div>';
    }
    var VIEWS=[viewEgitim,viewArsiv,viewStudio];

    function show(i){
      [].forEach.call(tabs.children,function(b,j){b.classList.toggle('on',j===i);});
      pv.innerHTML=VIEWS[i]();
    }
    tabs.addEventListener('click',function(e){var b=e.target.closest('.tab');if(b)show(+b.dataset.i);});
    show(0);
  }

  function injectStyle(){ if(document.getElementById('ed-style'))return; var s=document.createElement('style'); s.id='ed-style'; s.textContent=CSS; document.head.appendChild(s); }
  function ensure(){ var m=document.getElementById('egitim-demo-mount'); if(!m)return; if(m.__edDone&&m.querySelector('.ed-wrap'))return; injectStyle(); m.__edDone=true; render(m); }
  window.__edInit=true; ensure(); document.addEventListener('DOMContentLoaded',ensure);
  var t=0,iv=setInterval(function(){ensure();if(++t>40)clearInterval(iv);},500);
  if(window.MutationObserver){var mt=null;new MutationObserver(function(){clearTimeout(mt);mt=setTimeout(ensure,150);}).observe(document.documentElement,{childList:true,subtree:true});}
})();

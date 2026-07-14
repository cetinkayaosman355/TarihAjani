/* Tarih Ajanı — Ana sayfa "Kanalını Kur, Para Kazan" demosu.
   Üç araç sekmesi: 1) Eğitim  2) Arşiv  3) Studio. Tuşa basınca ilgili
   ürünün ZENGİN önizlemesi sağda açılır ve gerçek sayfaya bağlanır.
   #egitim-demo-mount içine kendi kendine yerleşir (dc bağımsız). */
(function () {
  if (window.__edInit) return;

  var TABS = [
    {key:'EĞİTİM', ico:'🎓', href:'/egitim', d:'9 derslik program · sertifika', acc:'#6f9b4a'},
    {key:'ARŞİV',  ico:'🗂', href:'/arsiv',  d:'42 hazır vaka dosyası',          acc:'#9E2B23'},
    {key:'STUDIO', ico:'◉', href:'/studio', d:'senaryo · ses · sahne tek tıkla', acc:'#c19a52'}
  ];
  var LESSONS = ['Kanal DNA’sı: konum & ton','Senaryo iskeleti: kanca → doruk','Yayın, kapak & algoritma','Büyüme ve gelir modelleri'];

  var CSS = ''
    + '#egitim-demo{position:relative;background:#080910;border-top:1px solid rgba(193,154,82,.15);border-bottom:1px solid rgba(193,154,82,.15);overflow:hidden}'
    + '#egitim-demo .ed-glow{position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle 560px at 90% 6%,rgba(230,196,120,.11),transparent 60%),radial-gradient(circle 520px at 6% 96%,rgba(158,43,35,.08),transparent 58%)}'
    + '#egitim-demo .ed-wrap{position:relative;width:min(1660px,94vw);margin:0 auto;padding:clamp(28px,3vw,44px) clamp(20px,3vw,40px)}'
    + '#egitim-demo .ed-work{display:grid;grid-template-columns:.8fr 1.2fr;gap:clamp(24px,2.8vw,44px);align-items:stretch}'
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
    + '#egitim-demo .tab.on{border-color:transparent;background:linear-gradient(110deg,rgba(167,125,53,.25),rgba(193,154,82,.14));box-shadow:inset 3px 0 0 var(--tacc,#e6c478)}'
    + '#egitim-demo .tab .n{flex-shrink:0;width:26px;height:26px;border-radius:50%;border:1px solid rgba(193,154,82,.45);display:grid;place-items:center;font-family:\'Special Elite\',monospace;font-size:12px;color:#c19a52}'
    + '#egitim-demo .tab.on .n{background:var(--tacc,#9E2B23);border-color:transparent;color:#fff}'
    + '#egitim-demo .tab .ic{font-size:15px;filter:grayscale(.15)}'
    + '#egitim-demo .tab .tx{flex:1;min-width:0}'
    + '#egitim-demo .tab .tx b{display:block;font-family:\'Special Elite\',monospace;font-size:12.5px;letter-spacing:.1em;color:#f2ecd9}'
    + '#egitim-demo .tab .tx span{display:block;font-size:11.5px;color:#8b93a1;margin-top:2px}'
    + '#egitim-demo .tab .ar{color:#c19a52;font-size:14px;opacity:.5;transition:opacity .18s,transform .18s}'
    + '#egitim-demo .tab.on .ar,#egitim-demo .tab:hover .ar{opacity:1;transform:translateX(2px)}'
    + '#egitim-demo .ed-flow{font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.08em;color:#7a8090;margin-top:4px}'
    + '#egitim-demo .ed-flow b{color:#c19a52}'
    // önizleme paneli (ortak, çerçeve + doku)
    + '#egitim-demo .pv{position:relative;border:1px solid rgba(193,154,82,.32);background:linear-gradient(168deg,#0e0f18,#0a0b12 60%,#08090e);overflow:hidden;display:flex;flex-direction:column;min-height:310px;box-shadow:0 40px 90px -56px #000,inset 0 1px 0 rgba(230,196,120,.05)}'
    + '#egitim-demo .pv::before{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--acc,#c19a52),transparent 70%);opacity:.8}'
    + '#egitim-demo .pv-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 18px;border-bottom:1px solid rgba(193,154,82,.16);background:rgba(3,4,9,.55)}'
    + '#egitim-demo .pv-bar .pt{display:inline-flex;align-items:center;gap:9px;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.16em;color:#e6c478}'
    + '#egitim-demo .pv-bar .pt::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--acc,#c19a52);box-shadow:0 0 8px var(--acc,#c19a52)}'
    + '#egitim-demo .pv-bar a{display:inline-flex;align-items:center;gap:6px;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.08em;color:#171207;background:linear-gradient(110deg,#a77d35,#e6c478 55%,#c19a52);padding:8px 13px;text-decoration:none;white-space:nowrap;transition:box-shadow .18s,transform .18s}'
    + '#egitim-demo .pv-bar a:hover{transform:translateY(-1px);box-shadow:0 8px 22px -8px rgba(230,196,120,.6)}'
    + '#egitim-demo .pv-body{flex:1;padding:20px 22px;animation:ed-fade .4s ease}'
    + '@keyframes ed-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'
    // ── EĞİTİM ──
    + '#egitim-demo .eg{display:grid;grid-template-columns:150px 1fr;gap:20px;align-items:start}'
    + '#egitim-demo .eg-cover{position:relative;border:1px solid rgba(111,155,74,.4);background:radial-gradient(circle at 50% 26%,rgba(111,155,74,.14),#0a0f0a);padding:18px 12px;text-align:center;overflow:hidden}'
    + '#egitim-demo .eg-cover::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(-45deg,transparent 0 9px,rgba(111,155,74,.05) 9px 10px)}'
    + '#egitim-demo .eg-seal{position:relative;width:70px;height:70px;margin:2px auto 0;border-radius:50%;border:2px solid rgba(230,196,120,.6);display:grid;place-items:center;background:radial-gradient(circle at 42% 34%,#20301a,#0b120a);box-shadow:0 6px 18px -8px rgba(111,155,74,.6),inset 0 0 0 4px rgba(230,196,120,.12)}'
    + '#egitim-demo .eg-seal b{font-family:\'Playfair Display\',serif;font-weight:800;font-size:24px;color:#e6c478;line-height:1}'
    + '#egitim-demo .eg-cover .ct{position:relative;font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:.14em;color:#b9c9a8;margin-top:11px;line-height:1.5}'
    + '#egitim-demo .eg-cover .cs{position:relative;font-family:\'Playfair Display\',serif;font-style:italic;font-size:13px;color:#e6c478;margin-top:8px}'
    + '#egitim-demo .eg-prog{position:relative;margin-top:13px}'
    + '#egitim-demo .eg-pl{font-family:\'Special Elite\',monospace;font-size:8.5px;letter-spacing:.12em;color:#8b93a1;display:flex;justify-content:space-between;margin-bottom:5px}'
    + '#egitim-demo .eg-bar{height:5px;background:rgba(193,154,82,.16);overflow:hidden}'
    + '#egitim-demo .eg-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#6f9b4a,#a7c67e);transition:width 1s ease}'
    + '#egitim-demo .eg-list{position:relative;margin:0}'
    + '#egitim-demo .eg-list::before{content:"";position:absolute;left:11px;top:12px;bottom:34px;width:1px;background:rgba(193,154,82,.25)}'
    + '#egitim-demo .les{position:relative;display:flex;align-items:center;gap:13px;padding:9px 0;font-size:13px;color:#cdd2dc}'
    + '#egitim-demo .les .ln{position:relative;z-index:1;flex-shrink:0;width:23px;height:23px;border-radius:50%;border:1px solid rgba(193,154,82,.4);display:grid;place-items:center;font-family:\'Special Elite\',monospace;font-size:10px;color:#c19a52;background:#0c0d15}'
    + '#egitim-demo .les:nth-of-type(-n+2) .ln{background:linear-gradient(150deg,#6f9b4a,#557a38);border-color:transparent;color:#fff}'
    + '#egitim-demo .les:nth-of-type(-n+2){color:#eef2ea}'
    + '#egitim-demo .more{font-family:\'Special Elite\',monospace;font-size:10.5px;color:#7a8090;margin:2px 0 0 36px}'
    + '#egitim-demo .badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}'
    + '#egitim-demo .badge{display:inline-flex;align-items:center;gap:6px;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.05em;color:#cfe0be;border:1px solid rgba(111,155,74,.35);padding:6px 11px;background:rgba(111,155,74,.07)}'
    + '#egitim-demo .badge::before{content:"◆";color:#6f9b4a;font-size:8px}'
    // ── ortak medya (arşiv+studio) ──
    + '#egitim-demo .pv-media{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:stretch}'
    + '#egitim-demo .frame{position:relative;overflow:hidden;border:1px solid rgba(193,154,82,.28);box-shadow:0 22px 44px -30px #000}'
    + '#egitim-demo .frame img{width:100%;height:100%;object-fit:cover;display:block}'
    + '#egitim-demo .frame::after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 60px 8px rgba(4,5,10,.6);pointer-events:none}'
    + '#egitim-demo .pv-h{font-family:\'Playfair Display\',serif;font-weight:800;font-size:21px;line-height:1.1;color:#f4ecd8;margin:0 0 12px}'
    + '#egitim-demo .chips{display:flex;flex-direction:column;gap:8px}'
    + '#egitim-demo .chip{display:flex;align-items:center;gap:10px;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.04em;color:#dfe4ee;border:1px solid rgba(193,154,82,.22);background:linear-gradient(100deg,rgba(193,154,82,.06),transparent);padding:10px 13px;position:relative;overflow:hidden}'
    + '#egitim-demo .chip::before{content:"";position:absolute;left:0;top:0;bottom:0;width:2px;background:var(--acc,#c19a52)}'
    + '#egitim-demo .chip .ck{width:17px;height:17px;border-radius:50%;background:rgba(111,155,74,.18);border:1px solid rgba(111,155,74,.5);display:grid;place-items:center;color:#8ec06a;font-size:9px;flex-shrink:0}'
    + '#egitim-demo .pv-note{font-family:\'Special Elite\',monospace;font-size:10.5px;color:#8b93a1;margin-top:14px;line-height:1.6}'
    + '#egitim-demo .pv-note b{color:#c19a52}'
    // ── ARŞİV özel ──
    + '#egitim-demo .ar-tab{position:absolute;top:-1px;left:26px;font-family:\'Special Elite\',monospace;font-size:8.5px;letter-spacing:.14em;color:#c19a52;background:#0e0f18;border:1px solid rgba(193,154,82,.32);border-top:0;padding:4px 12px}'
    + '#egitim-demo .ar-stamp{position:absolute;top:12px;right:10px;z-index:2;font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.16em;color:#e06a5e;border:2px solid rgba(224,106,94,.65);padding:5px 9px;transform:rotate(7deg);background:rgba(10,8,8,.4)}'
    + '#egitim-demo .ar-seal{position:absolute;bottom:10px;left:10px;z-index:2;width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 40% 32%,#d24b38,#a62f22 46%,#7c1f16 82%);display:grid;place-items:center;font-family:\'Playfair Display\',serif;font-weight:800;font-size:16px;color:#f4d9c9;box-shadow:inset 0 -2px 4px rgba(0,0,0,.4)}'
    + '#egitim-demo .ar-meta{font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:.14em;color:#c19a52;margin-bottom:9px}'
    + '#egitim-demo .kv{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;border:1px solid rgba(193,154,82,.2);padding:11px 13px;margin-bottom:12px;background:rgba(3,4,9,.4)}'
    + '#egitim-demo .kv .k{font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:.1em;color:#7a8090;align-self:center}'
    + '#egitim-demo .kv .v{font-size:12px;color:#e4e7ee;font-weight:600}'
    // ── STUDIO özel ──
    + '#egitim-demo .st-frame{position:relative}'
    + '#egitim-demo .st-frame .bar{position:absolute;left:0;right:0;height:16px;background:#04050a;z-index:2}'
    + '#egitim-demo .st-frame .bar.t{top:0}#egitim-demo .st-frame .bar.b{bottom:0}'
    + '#egitim-demo .st-rec{position:absolute;top:22px;left:12px;z-index:3;display:inline-flex;align-items:center;gap:6px;font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:.12em;color:#f2ecd9}'
    + '#egitim-demo .st-rec .dot{width:7px;height:7px;border-radius:50%;background:#e11d1d;animation:ed-pulse 1.4s ease-out infinite}'
    + '#egitim-demo .st-tc{position:absolute;top:22px;right:12px;z-index:3;font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:.06em;color:#e6c478}'
    + '#egitim-demo .st-scene{position:absolute;bottom:22px;left:12px;z-index:3;font-family:\'Special Elite\',monospace;font-size:9px;letter-spacing:.12em;color:#cdd2dc}'
    + '#egitim-demo .st-wave{display:flex;align-items:flex-end;gap:2px;height:22px;margin-top:9px}'
    + '#egitim-demo .st-wave i{flex:1;background:linear-gradient(180deg,#e6c478,#a77d35);opacity:.75;animation:ed-wave 1.1s ease-in-out infinite}'
    + '@keyframes ed-wave{0%,100%{height:20%}50%{height:100%}}'
    + '@media(max-width:820px){#egitim-demo .ed-work{grid-template-columns:1fr}#egitim-demo .pv-media,#egitim-demo .eg{grid-template-columns:1fr}}'
    + '@media(prefers-reduced-motion:reduce){#egitim-demo .st-wave i{animation:none;height:60%}}';

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}

  function render(mount){
    mount.innerHTML=
      '<div class="ed-glow"></div><div class="ed-wrap"><div class="ed-work">'
      + '<div class="ed-panel">'
      +   '<div class="ed-live"><span class="d"></span>ARAÇ KUTUSU · CANLI DEMO</div>'
      +   '<h2>Kanalını Kur, <span class="g">Para Kazan.</span></h2>'
      +   '<p class="ed-sub">Üç araç, tek yol: öğren, dosyanı seç, üret. Bir tuşa bas — ilgili sayfa yanda açılsın.</p>'
      +   '<div class="tabs" id="ed-tabs">'
      +     TABS.map(function(t,i){return '<button class="tab'+(i===0?' on':'')+'" data-i="'+i+'" style="--tacc:'+t.acc+'"><span class="n">'+(i+1)+'</span><span class="ic">'+t.ico+'</span><span class="tx"><b>'+esc(t.key)+'</b><span>'+esc(t.d)+'</span></span><span class="ar">→</span></button>';}).join('')
      +   '</div>'
      +   '<div class="ed-flow"><b>Öğren</b> → <b>Seç</b> → <b>Üret</b> → yayınla → <b>kazan</b></div>'
      + '</div>'
      + '<div class="pv" id="ed-pv"></div>'
      + '</div></div>';

    var pv=mount.querySelector('#ed-pv'), tabs=mount.querySelector('#ed-tabs');

    function bar(title,href,label){return '<div class="pv-bar"><span class="pt">'+title+'</span><a href="'+href+'">'+label+' →</a></div>';}

    function viewEgitim(){
      return bar('AKADEMİ · 9 DERS','/egitim','Akademi’ye Git')
        +'<div class="pv-body"><div class="eg">'
        +'<div class="eg-cover"><div class="eg-seal"><b>IX</b></div><div class="ct">TARİH AJANI<br>AKADEMİSİ</div><div class="cs">9 Ders · Sertifika</div>'
        +'<div class="eg-prog"><div class="eg-pl"><span>İLERLEME</span><span>2 / 9</span></div><div class="eg-bar"><i></i></div></div></div>'
        +'<div class="eg-main"><div class="eg-list">'
        + LESSONS.map(function(l,i){return '<div class="les"><span class="ln">'+(i<2?'✓':(i+1))+'</span>'+esc(l)+'</div>';}).join('')
        +'</div><div class="more">…toplam 9 ders</div>'
        +'<div class="badges"><span class="badge">Sertifika</span><span class="badge">Topluluk</span><span class="badge">Canlı destek</span><span class="badge">Gelir modelleri</span></div>'
        +'<div class="pv-note">Kanalını <b>sıfırdan kurmayı ve büyütmeyi</b> adım adım öğren.</div>'
        +'</div></div></div>';
    }
    function viewArsiv(){
      return bar('ARŞİV · 42 DOSYA','/arsiv','Arşive Git')
        +'<div class="pv-body"><div class="ar-tab">DOSYA · 1453</div><div class="pv-media">'
        +'<div class="frame"><span class="ar-stamp">ÇOK GİZLİ</span><span class="ar-seal">A</span><img src="/assets/haber/istanbul-fethi.jpg" alt="" loading="lazy"></div>'
        +'<div><div class="ar-meta">◈ VAKA DOSYASI</div><h3 class="pv-h">Konstantinopolis düştü</h3>'
        +'<div class="kv"><span class="k">YER</span><span class="v">KONSTANTİNOPOLİS</span><span class="k">KİŞİLER</span><span class="v">II. Mehmed · XI. Konstantin</span></div>'
        +'<div class="chips"><span class="chip"><span class="ck">✓</span>Hazır senaryo</span><span class="chip"><span class="ck">✓</span>Kaynakça &amp; zaman çizelgesi</span><span class="chip"><span class="ck">✓</span>Sahne planı</span></div>'
        +'</div></div><div class="pv-note">42 hazır vakadan birini seç; <b>saatlerce araştırma yerine</b> dakikalar.</div></div>';
    }
    function viewStudio(){
      var wave=''; for(var i=0;i<34;i++){wave+='<i style="animation-delay:'+(i*0.05).toFixed(2)+'s"></i>';}
      return bar('STUDIO · ÜRETİM','/studio','Studio’ya Git')
        +'<div class="pv-body"><div class="pv-media">'
        +'<div><div class="frame st-frame"><span class="bar t"></span><span class="bar b"></span><span class="st-rec"><span class="dot"></span>REC</span><span class="st-tc">00:14 / 00:42</span><span class="st-scene">SAHNE 01 · VEZÜV</span><img src="/assets/haber/vezuv-pompeii.jpg" alt="" loading="lazy" style="aspect-ratio:16/10"></div>'
        +'<div class="st-wave">'+wave+'</div></div>'
        +'<div><h3 class="pv-h">Tek konudan tam paket</h3>'
        +'<div class="chips"><span class="chip"><span class="ck">✓</span>Senaryo</span><span class="chip"><span class="ck">✓</span>Seslendirme yönergesi</span><span class="chip"><span class="ck">✓</span>Sinematik görsel</span><span class="chip"><span class="ck">✓</span>Kapak &amp; başlık</span></div>'
        +'</div></div><div class="pv-note">Konunu yaz; <b>senaryo, ses ve sahneyi tek dosyada</b> üret — yayına hazır.</div></div>';
    }
    var VIEWS=[viewEgitim,viewArsiv,viewStudio];

    function show(i){
      [].forEach.call(tabs.children,function(b,j){b.classList.toggle('on',j===i);});
      pv.style.setProperty('--acc',TABS[i].acc);
      pv.innerHTML=VIEWS[i]();
      if(i===0){var bar2=pv.querySelector('.eg-bar i');if(bar2)requestAnimationFrame(function(){requestAnimationFrame(function(){bar2.style.width='22%';});});}
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

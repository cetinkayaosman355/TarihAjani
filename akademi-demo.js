/* Tarih Ajanı — Ana sayfa "Ajan Akademisi" canlı demosu (mini kurs oynatıcı).
   Sol: 9 derslik eğitim sicili (3 modül) — ilk ders açık, gerisi kilitli.
   Sağ: "video" karesi — DERSİ BAŞLAT → bölümler dolar, altyazı yazılır,
   ders tamamlanır ve bir sonraki dersin kilidi açılır.
   #akademi-demo-mount içine kendi kendine yerleşir (dc bağımsız). */
(function () {
  if (window.__akInit) return;

  var MODS = ['KANIT TOPLAMA', 'ANLATI KURGUSU', 'STÜDYO VE YAYIN'];
  var LESSONS = [
    {m:0,t:'Söylenti ile kaydı ayırmak'},
    {m:0,t:'Arşiv taraması: nereden başlanır?'},
    {m:0,t:'Çelişen kaynakları yüzleştirmek'},
    {m:1,t:'Vaka yapısı: açılış, ipucu, hüküm'},
    {m:1,t:'Senaryo yazımı ve hook'},
    {m:1,t:'Kaynak göstererek anlatmak'},
    {m:2,t:'Ses kaydı ve seslendirme'},
    {m:2,t:'Görsel üretim ve kapak'},
    {m:2,t:'Yayın paketi ve kanal büyütme'}
  ];
  // Demoda oynatılabilen dersler ve altyazıları (bölüm başına bir satır)
  var CAPS = [
    ['Bir ajan söylentiyle çalışmaz; kayıtla çalışır.',
     'İddia kimden geliyor? Kaydı kim, ne zaman tutmuş?',
     'Üç soruluk süzgeç: kaynak, tarih, tanık.',
     'Kayıt yoksa hüküm yok — dosya açık kalır.'],
    ['Arşive rastgele dalınmaz; iz sürülür.',
     'Önce kronikler, sonra defterler, en son rivayet.',
     'Tarih Ajanı arşivi: 42 dosya, künyeli ve kaynaklı.',
     'Doğru rafı bilen, yarım günde bulur.']
  ];
  var PLAYABLE = CAPS.length; // ilk 2 ders demoda izlenebilir

  var CSS = ''
    + '#akademi-demo{position:relative;background:linear-gradient(180deg,#040509,#080407 42%,#080407 58%,#040509);overflow:hidden;isolation:isolate}'
    + '#akademi-demo .ak-bgfx{display:none}'
    + '#akademi-demo .ak-vin{position:absolute;inset:0;z-index:0;pointer-events:none;background:radial-gradient(120% 130% at 50% 20%,transparent 46%,rgba(0,0,0,.55))}'
    + '#akademi-demo .ak-wrap{position:relative;z-index:1;width:min(1580px,92vw);margin:0 auto;padding:clamp(48px,5vw,64px) clamp(22px,3vw,48px)}'
    + '#akademi-demo .ak-head{max-width:960px;margin-bottom:clamp(18px,2vw,28px);padding-bottom:16px;border-bottom:1px solid rgba(193,154,82,.18);display:flex;gap:20px;align-items:center}'
    + '#akademi-demo .ak-head-tx{min-width:0}'
    // akademi arması (elit okul mührü)
    + '#akademi-demo .ak-crest{position:relative;flex:0 0 auto;width:70px;height:70px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 50% 32%,rgba(230,196,120,.16),rgba(8,9,14,.7));border:1px solid rgba(193,154,82,.55);box-shadow:inset 0 0 0 3px rgba(4,5,9,.85),inset 0 0 0 4px rgba(193,154,82,.28),0 10px 26px -12px rgba(0,0,0,.85)}'
    + '#akademi-demo .ak-crest b{font-family:\'Playfair Display\',serif;font-weight:800;font-size:23px;color:#e6c478;line-height:1;text-shadow:0 1px 3px rgba(0,0,0,.6)}'
    + '#akademi-demo .ak-crest i{position:absolute;bottom:9px;font-family:\'Special Elite\',monospace;font-style:normal;font-size:5px;letter-spacing:.24em;color:#c19a52}'
    + '#akademi-demo .ak-crest::before{content:"";position:absolute;top:7px;font-size:8px;color:#c19a52;line-height:1}'
    + '#akademi-demo .ak-live{display:inline-flex;align-items:center;gap:10px;color:#e6c478;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.24em;border:1px solid rgba(193,154,82,.4);padding:7px 14px;background:rgba(12,10,6,.5)}'
    + '#akademi-demo .ak-live .d{width:9px;height:9px;border-radius:50%;background:#e11d1d;box-shadow:0 0 0 0 rgba(225,29,29,.6);animation:ak-pulse 1.6s ease-out infinite}'
    + '@keyframes ak-pulse{0%{box-shadow:0 0 0 0 rgba(225,29,29,.55)}70%{box-shadow:0 0 0 10px rgba(225,29,29,0)}100%{box-shadow:0 0 0 0 rgba(225,29,29,0)}}'
    + '#akademi-demo h2{margin:14px 0 8px;font-family:\'Playfair Display\',serif;font-size:clamp(26px,3vw,41px);font-weight:800;line-height:1.04;letter-spacing:-.015em;color:#f6efe0}'
    + '#akademi-demo h2 .g{background:linear-gradient(102deg,#b18742,#e6c478 42%,#fff0b1 52%,#a5762f);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '#akademi-demo .ak-sub{margin:0;color:#b3b9c6;font-size:14.5px;line-height:1.6;max-width:62ch}'
    + '#akademi-demo .ak-work{display:grid;grid-template-columns:.88fr 1.12fr;gap:clamp(26px,3vw,54px);align-items:start}'
    // SOL — eğitim sicili
    + '#akademi-demo .ak-prog{position:relative;border:1px solid rgba(193,154,82,.3);background:rgba(10,10,15,.68);backdrop-filter:blur(4px)}'
    + '#akademi-demo .ak-prog::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(193,154,82,.7) 20%,rgba(230,196,120,.9) 50%,rgba(193,154,82,.7) 80%,transparent)}'
    + '#akademi-demo .ak-ptop{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;border-bottom:1px solid rgba(193,154,82,.24)}'
    + '#akademi-demo .ak-ptop b{font-family:\'Special Elite\',monospace;font-weight:400;font-size:11px;letter-spacing:.2em;color:#c19a52}'
    + '#akademi-demo .ak-ptop span{font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.14em;color:#e6c478}'
    + '#akademi-demo .ak-mod{padding:9px 18px 3px;font-family:\'Special Elite\',monospace;font-size:9.5px;letter-spacing:.22em;color:#948c72}'
    + '#akademi-demo .ak-les{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:none;border:0;border-top:1px solid rgba(230,220,196,.05);padding:8px 18px;cursor:pointer;transition:background .2s}'
    + '#akademi-demo .ak-les:hover{background:rgba(193,154,82,.07)}'
    + '#akademi-demo .ak-les .n{flex:0 0 23px;height:23px;border-radius:50%;display:grid;place-items:center;font-family:\'Special Elite\',monospace;font-size:10.5px;color:#93907f;border:1px solid rgba(230,220,196,.22);transition:background .3s,border-color .3s}'
    + '#akademi-demo .ak-les .t{flex:1;color:#c9cdd6;font-size:13.5px;min-width:0}'
    + '#akademi-demo .ak-les .s{flex:0 0 auto;font-size:11px;color:#8a846a;font-family:\'Special Elite\',monospace;letter-spacing:.06em}'
    + '#akademi-demo .ak-les.lock{cursor:default}'
    + '#akademi-demo .ak-les.lock .t{color:#7d8089}'
    + '#akademi-demo .ak-les.open .n{background:#9E2B23;border-color:#9E2B23;color:#f4d9c9}'
    + '#akademi-demo .ak-les.act{background:rgba(193,154,82,.1)}'
    + '#akademi-demo .ak-les.act .t{color:#f4ecd8}'
    + '#akademi-demo .ak-les.done .n{background:#4d6b34;border-color:#6f9b4a;color:#e8f2dc}'
    + '#akademi-demo .ak-les.done .t{color:#8f9686}'
    + '#akademi-demo .ak-les.pop .n{animation:ak-unlock .7s ease}'
    + '@keyframes ak-unlock{0%{transform:scale(1)}40%{transform:scale(1.45);box-shadow:0 0 0 8px rgba(230,196,120,.25)}100%{transform:scale(1)}}'
    + '#akademi-demo .ak-les.deny{animation:ak-deny .4s ease}'
    + '@keyframes ak-deny{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}65%{transform:translateX(5px)}}'
    + '#akademi-demo .ak-note{padding:9px 18px;border-top:1px solid rgba(230,220,196,.06);font-family:\'Special Elite\',monospace;font-size:10px;letter-spacing:.06em;color:#948c72;min-height:14px}'
    + '#akademi-demo .ak-cta{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;margin-top:14px}'
    + '#akademi-demo .ak-btn{cursor:pointer;border:0;display:inline-flex;align-items:center;gap:10px;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:13px;letter-spacing:.14em;padding:14px 26px;text-decoration:none;transition:transform .18s,box-shadow .18s}'
    + '#akademi-demo .ak-btn:hover{transform:translateY(-2px);box-shadow:0 16px 46px -14px rgba(230,196,120,.55)}'
    + '#akademi-demo .ak-cta .tag{font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.05em;color:#7ba05a}'
    // SAĞ — video karesi
    + '#akademi-demo .ak-frame{position:relative;border:1px solid rgba(193,154,82,.34);background:linear-gradient(165deg,#0c0d14,#080910 60%,#0a0b12);aspect-ratio:16/9;min-height:320px;overflow:hidden;box-shadow:0 40px 90px -40px rgba(0,0,0,.9)}'
    + '#akademi-demo .ak-frame::after{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(0,0,0,.12) 3px 4px);opacity:.5}'
    // köşe süsleri (elit "gizli gösterim" çerçevesi)
    + '#akademi-demo .ak-frame .cnr{position:absolute;width:16px;height:16px;z-index:3;pointer-events:none;border-color:rgba(230,196,120,.7)}'
    + '#akademi-demo .ak-frame .cnr.tl{top:9px;left:9px;border-top:1px solid;border-left:1px solid}'
    + '#akademi-demo .ak-frame .cnr.tr{top:9px;right:9px;border-top:1px solid;border-right:1px solid}'
    + '#akademi-demo .ak-frame .cnr.bl{bottom:9px;left:9px;border-bottom:1px solid;border-left:1px solid}'
    + '#akademi-demo .ak-frame .cnr.br{bottom:9px;right:9px;border-bottom:1px solid;border-right:1px solid}'
    + '#akademi-demo .ak-ch{position:absolute;top:18px;left:22px;right:22px;display:flex;gap:8px;z-index:2}'
    + '#akademi-demo .ak-ch b{flex:1;height:4px;background:rgba(214,226,204,.14);overflow:hidden;position:relative}'
    + '#akademi-demo .ak-ch b i{position:absolute;inset:0;background:linear-gradient(90deg,#a77d35,#e6c478);transform-origin:left;transform:scaleX(0)}'
    + '#akademi-demo .ak-ch b.fill i{transform:scaleX(1);transition:transform var(--chd,2.6s) linear}'
    + '#akademi-demo .ak-ch b.full i{transform:scaleX(1)}'
    + '#akademi-demo .ak-meta{position:absolute;top:34px;left:22px;right:22px;display:flex;justify-content:space-between;font-family:\'Special Elite\',monospace;font-size:10.5px;letter-spacing:.18em;color:#9aa2b0;z-index:2}'
    + '#akademi-demo .ak-wm{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}'
    + '#akademi-demo .ak-wm span{font-family:\'Playfair Display\',serif;font-weight:800;font-size:clamp(54px,6vw,92px);color:rgba(193,154,82,.09);transform:rotate(-14deg);white-space:nowrap;user-select:none}'
    + '#akademi-demo .ak-play{position:absolute;inset:0;display:grid;place-items:center;z-index:3}'
    + '#akademi-demo .ak-play button{cursor:pointer;border:0;background:linear-gradient(110deg,#a77d35,#d8b26a 50%,#c19a52);color:#171207;font-family:\'Special Elite\',monospace;font-weight:700;font-size:16px;letter-spacing:.2em;padding:20px 38px;transition:transform .18s,box-shadow .18s}'
    + '#akademi-demo .ak-play button:hover{transform:scale(1.04);box-shadow:0 18px 60px -16px rgba(230,196,120,.6)}'
    + '#akademi-demo .ak-cap{position:absolute;left:22px;right:22px;bottom:22px;text-align:center;font-family:\'Playfair Display\',serif;font-style:italic;font-size:clamp(17px,1.6vw,23px);line-height:1.45;color:#efe6cf;text-shadow:0 2px 14px rgba(0,0,0,.85);min-height:1.5em;z-index:2}'
    + '#akademi-demo .ak-cap .cur{border-right:2px solid rgba(230,196,120,.8);padding-right:2px}'
    // ders sonu kartı
    + '#akademi-demo .ak-end{position:absolute;inset:0;display:grid;place-items:center;background:rgba(8,9,16,.82);backdrop-filter:blur(3px);opacity:0;pointer-events:none;transition:opacity .5s;z-index:4}'
    + '#akademi-demo .ak-end.on{opacity:1;pointer-events:auto}'
    + '#akademi-demo .ak-end .in{text-align:center;padding:20px}'
    + '#akademi-demo .ak-end .ok{width:58px;height:58px;margin:0 auto 14px;border-radius:50%;border:2px solid #6f9b4a;display:grid;place-items:center;color:#a9c68b;font-size:26px;background:rgba(111,155,74,.12)}'
    + '#akademi-demo .ak-end h4{margin:0 0 6px;font-family:\'Playfair Display\',serif;font-size:clamp(22px,2.2vw,30px);font-weight:800;color:#f4ecd8}'
    + '#akademi-demo .ak-end p{margin:0 0 18px;font-family:\'Special Elite\',monospace;font-size:12px;letter-spacing:.12em;color:#c19a52}'
    + '#akademi-demo .ak-end .row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}'
    + '#akademi-demo .ak-end .ghost{cursor:pointer;background:rgba(10,14,9,.5);border:1px solid rgba(193,154,82,.5);color:#e6c478;font-family:\'Special Elite\',monospace;font-size:12.5px;letter-spacing:.14em;padding:14px 24px;text-decoration:none;transition:background .2s}'
    + '#akademi-demo .ak-end .ghost:hover{background:rgba(193,154,82,.14)}'
    + '#akademi-demo .ak-under{display:flex;justify-content:space-between;gap:14px;margin-top:10px;font-family:\'Special Elite\',monospace;font-size:11px;letter-spacing:.12em;color:#948c72}'
    + '@media(max-width:900px){#akademi-demo .ak-work{grid-template-columns:1fr}#akademi-demo .ak-work>div{min-width:0}#akademi-demo .ak-frame{min-height:300px}}'
    + '@media(max-width:640px){'
      + '#akademi-demo .ak-wrap{width:min(1660px,92vw);padding:clamp(40px,9vw,52px) 14px}'
      + '#akademi-demo h2{font-size:clamp(24px,7.4vw,34px)}'
      + '#akademi-demo .ak-sub{font-size:13.5px}'
      + '#akademi-demo .ak-ptop{padding:10px 13px}#akademi-demo .ak-ptop b,#akademi-demo .ak-ptop span{font-size:9.5px;letter-spacing:.12em}'
      + '#akademi-demo .ak-mod{padding:8px 13px 3px}'
      + '#akademi-demo .ak-les{padding:9px 13px;gap:10px}#akademi-demo .ak-les .t{font-size:13px}'
      + '#akademi-demo .ak-note{padding:8px 13px}'
      + '#akademi-demo .ak-cta{gap:8px 12px}#akademi-demo .ak-btn{width:100%;font-size:12px;padding:14px 16px;letter-spacing:.08em}'
      + '#akademi-demo .ak-frame{aspect-ratio:auto;height:238px;min-height:0}'
      + '#akademi-demo .ak-play button{font-size:13px;padding:15px 20px;letter-spacing:.12em}'
      + '#akademi-demo .ak-ch{left:14px;right:14px;top:14px}#akademi-demo .ak-meta{left:14px;right:14px;top:28px;font-size:9px;letter-spacing:.08em}'
      + '#akademi-demo .ak-cap{left:14px;right:14px;bottom:14px;font-size:15px}'
      + '#akademi-demo .ak-under{font-size:9px;letter-spacing:.06em;gap:8px}'
      + '#akademi-demo .ak-end h4{font-size:22px}#akademi-demo .ak-end .row{flex-direction:column}#akademi-demo .ak-end .ghost{width:100%;text-align:center}'
      + '}'
    + '@media(prefers-reduced-motion:reduce){#akademi-demo .ak-ch b.fill i{transition:none;transform:scaleX(1)}}';

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function pad(n){return String(n).padStart(2,'0');}

  function render(mount) {
    var RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
    var CH = 4;                 // bölüm sayısı (altyazı satırı başına bir bölüm)
    var CHD = RM ? 200 : 2600;  // bölüm süresi ms

    var lesHtml='', lastMod=-1;
    LESSONS.forEach(function(L,i){
      if(L.m!==lastMod){ lastMod=L.m; lesHtml+='<div class="ak-mod">MODÜL '+(L.m+1)+' · '+MODS[L.m]+'</div>'; }
      lesHtml+='<button class="ak-les '+(i===0?'open':'lock')+'" data-i="'+i+'"><span class="n">'+(i===0?'1':'🔒')+'</span><span class="t">'+esc(L.t)+'</span><span class="s">'+(i===0?'▶':'')+'</span></button>';
    });

    var chHtml=''; for(var c=0;c<CH;c++) chHtml+='<b><i></i></b>';

    mount.innerHTML =
      '<div class="ak-bgfx"></div><div class="ak-vin"></div>'
      + '<div class="ak-wrap">'
      + '<div class="ak-head">'
      + '<div class="ak-crest" aria-hidden="true"><b>IX</b><i>AKADEMİ</i></div>'
      + '<div class="ak-head-tx">'
      + '<div class="ak-live"><span class="d"></span>KAPALI PROGRAM · 9 DERS · SERTİFİKALI</div>'
      + '<h2>Ajan <span class="g">Akademisi</span></h2>'
      + '<p class="ak-sub">Tarih araştırmacılığının kapalı okulu: kaynak doğrulama, anlatı kurgusu, stüdyo ve yayın. İlk ders açık — gerisi eğitim sicilinle birlikte açılır.</p>'
      + '</div>'
      + '</div>'
      + '<div class="ak-work">'
      + '<div>'
      + '<div class="ak-prog"><div class="ak-ptop"><b>EĞİTİM SİCİLİ</b><span id="ak-score">0 / 9 DERS</span></div>'
      + lesHtml
      + '<div class="ak-note" id="ak-note">İlk ders izlenmeye hazır.</div></div>'
      + '<div class="ak-cta"><a class="ak-btn" href="/egitim">Akademi’ye Katıl · 9 Ders →</a><span class="tag">✓ Sertifikalı</span><span class="tag">✓ Kendi hızında</span></div>'
      + '</div>'
      + '<div>'
      + '<div class="ak-frame">'
      + '<span class="cnr tl"></span><span class="cnr tr"></span><span class="cnr bl"></span><span class="cnr br"></span>'
      + '<div class="ak-ch" id="ak-ch">'+chHtml+'</div>'
      + '<div class="ak-meta"><span id="ak-rec">EĞİTİM KAYDI · DERS 01</span><span id="ak-tc">00:00 / 00:40</span></div>'
      + '<div class="ak-wm"><span>Tarih Ajanı</span></div>'
      + '<div class="ak-cap" id="ak-cap"></div>'
      + '<div class="ak-play" id="ak-play"><button id="ak-start">▶ DERSİ BAŞLAT</button></div>'
      + '<div class="ak-end" id="ak-end"><div class="in"><div class="ok">✓</div><h4 id="ak-eh"></h4><p id="ak-ep"></p><div class="row" id="ak-er"></div></div></div>'
      + '</div>'
      + '<div class="ak-under"><span id="ak-cur">DERS 01 · SÖYLENTİ İLE KAYDI AYIRMAK</span><span>◉ ÖN İZLEME</span></div>'
      + '</div>'
      + '</div></div>';

    var $=function(id){return mount.querySelector('#'+id);};
    var chs=[].slice.call(mount.querySelectorAll('#ak-ch b')),
        cap=$('ak-cap'), play=$('ak-play'), end=$('ak-end'), tc=$('ak-tc'),
        note=$('ak-note'), score=$('ak-score'), lesBtns=[].slice.call(mount.querySelectorAll('.ak-les'));

    var done=0, playing=false, timers=[];
    function T(fn,ms){ timers.push(setTimeout(fn,ms)); }
    function clearT(){ timers.forEach(clearTimeout); timers=[]; }

    function typeCap(txt,dur){
      cap.innerHTML='<span class="cur"></span>';
      var el=cap.querySelector('.cur'), n=0, step=RM?1:Math.max(18,Math.floor((dur*.6)/txt.length));
      (function tick(){ if(!el.isConnected)return; n=RM?txt.length:n+1; el.textContent=txt.slice(0,n); if(n<txt.length)T(tick,step); })();
    }

    function setLesson(i,cls){
      var b=lesBtns[i]; if(!b)return;
      b.className='ak-les '+cls;
      var n=b.querySelector('.n'), s=b.querySelector('.s');
      if(/done/.test(cls)){n.textContent='✓';s.textContent='TAMAM';}
      else if(/open/.test(cls)){n.textContent=String(i+1);s.textContent='▶';}
      else {n.textContent='🔒';s.textContent='';}
    }

    function playLesson(i){
      if(playing)return; playing=true; clearT();
      end.classList.remove('on'); play.style.display='none';
      $('ak-rec').textContent='EĞİTİM KAYDI · DERS '+pad(i+1);
      $('ak-cur').textContent='DERS '+pad(i+1)+' · '+LESSONS[i].t.toUpperCase();
      lesBtns.forEach(function(b,k){ if(k===i)b.classList.add('act'); else b.classList.remove('act'); });
      chs.forEach(function(b){b.classList.remove('fill','full');var el=b.querySelector('i');el.style.transition='none';void el.offsetWidth;el.style.transition='';});
      note.textContent='Ders '+pad(i+1)+' oynatılıyor…';
      var caps=CAPS[i], total=CH*CHD, t0=Date.now();
      (function tick(){ if(playing){var s=Math.min(40,Math.round((Date.now()-t0)/total*40)); tc.textContent='00:'+pad(s)+' / 00:40'; if(s<40)T(tick,300);} })();
      caps.forEach(function(txt,c){
        T(function(){
          chs[c].style.setProperty('--chd',CHD+'ms'); chs[c].classList.add('fill');
          for(var k=0;k<c;k++)chs[k].classList.add('full');
          typeCap(txt,CHD);
        }, c*CHD);
      });
      T(function(){ finish(i); }, CH*CHD+300);
    }

    function finish(i){
      playing=false; chs.forEach(function(b){b.classList.add('full');});
      tc.textContent='00:40 / 00:40'; cap.textContent='';
      done=Math.max(done,i+1); score.textContent=done+' / 9 DERS';
      setLesson(i,'done');
      var nxt=i+1;
      if(nxt<LESSONS.length && nxt>=done){ setLesson(nxt,'open pop'); }
      if(nxt<LESSONS.length){ note.textContent='Ders '+pad(nxt+1)+' kilidi açıldı ✓'; }
      $('ak-eh').textContent='Ders '+pad(i+1)+' tamamlandı';
      $('ak-ep').textContent = nxt<LESSONS.length ? ('SIRADAKİ · '+LESSONS[nxt].t.toUpperCase()+' · SERTİFİKAYA '+(9-done)+' DERS') : 'SERTİFİKA HAZIR';
      var row=$('ak-er'); row.innerHTML='';
      if(nxt<PLAYABLE){
        var b=document.createElement('button'); b.className='ghost'; b.textContent='▶ Sıradaki Dersi İzle';
        b.addEventListener('click',function(){ playLesson(nxt); }); row.appendChild(b);
      }
      var a=document.createElement('a'); a.className='ghost'; a.href='/egitim'; a.textContent='Kalan '+(9-done)+' Ders Akademi’de →'; row.appendChild(a);
      end.classList.add('on');
    }

    $('ak-start').addEventListener('click',function(){ playLesson(0); });
    lesBtns.forEach(function(b,i){
      b.addEventListener('click',function(){
        if(playing)return;
        if(i<=done){ if(i<PLAYABLE){playLesson(i);} else {location.href='/egitim';} return; }
        b.classList.remove('deny'); void b.offsetWidth; b.classList.add('deny');
        note.textContent='Önce üstteki dersi tamamla — ya da Akademi’de tümünü aç.';
      });
    });
  }

  function injectStyle(){ if(document.getElementById('ak-style'))return; var s=document.createElement('style'); s.id='ak-style'; s.textContent=CSS; document.head.appendChild(s); }
  function ensure(){ var m=document.getElementById('akademi-demo-mount'); if(!m)return; if(m.__akDone&&m.querySelector('.ak-wrap'))return; injectStyle(); m.__akDone=true; render(m); }
  window.__akInit=true; ensure(); document.addEventListener('DOMContentLoaded',ensure);
  var t=0,iv=setInterval(function(){ensure();if(++t>40)clearInterval(iv);},500);
  if(window.MutationObserver){var mt=null;new MutationObserver(function(){clearTimeout(mt);mt=setTimeout(ensure,150);}).observe(document.documentElement,{childList:true,subtree:true});}
})();

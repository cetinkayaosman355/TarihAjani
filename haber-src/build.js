/* Tarih Ajanı Haber — derleyici.
   Girdi: haber-content.js (+ fonts.css). Çıktı: repoda haber/ altında
   haber.css, index.html ve her haber için <slug>/index.html. */
const fs = require('fs');
const path = require('path');
const SCR = __dirname;
const REPO = '/home/user/TarihAjani';
const OUTDIR = path.join(REPO, 'haber');
const C = require(path.join(SCR, 'haber-content.js'));
const { CATS, HABER, P2, GRUPLAR } = C;

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function catAd(cat){return (CATS[cat]||{}).ad||'DOSYA';}
function ph(cat,label){var c=CATS[cat]||{ico:'📁',ad:'DOSYA'};return '<div class="ph"><div class="pin"><div class="ico">'+c.ico+'</div><div class="t">'+(label||'GÖRSEL')+'</div></div></div>';}
function media(h){return h.img?'<img src="'+esc(h.img)+'" alt="'+esc(h.baslik)+'" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">':ph(h.cat,'GÖRSEL');}

/* ─────────── ORTAK CSS ─────────── */
const FONTS = fs.readFileSync(path.join(SCR,'fonts.css'),'utf8');
const CSS = `${FONTS}
:root{
  --paper:#F6F1E6; --paper2:#EFE8D8; --card:#FCFAF3; --ink:#211A0F; --ink2:#5A4F38;
  --mut:#9a8f76; --line:#E2D8C1; --line2:#D3C7AA;
  --kirmizi:#9E2B23; --kirmizi-d:#7d201a; --koyu:#241B10;
  --yesil:#5A7A3E; --gold:#9c7a2e; --gold2:#c19a52; --gold3:#e0c384;
  --serif:'Fraunces',Georgia,'Times New Roman',serif;
  --sans:'Archivo',system-ui,-apple-system,Segoe UI,sans-serif;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--paper);color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden;
  background-image:radial-gradient(circle 1000px at 88% -8%,rgba(193,154,82,.09),transparent 58%),
                   radial-gradient(circle 800px at -8% 24%,rgba(158,43,35,.035),transparent 55%)}
a{color:inherit;text-decoration:none}
img{display:block;max-width:100%}
.wrap{width:min(1220px,92vw);margin:0 auto}
::selection{background:var(--gold2);color:#241b0c}

/* ── ÜST İNCE ÇUBUK ── */
.util{background:var(--koyu);color:#d9cfb8}
.util .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:8px 0;font-family:var(--sans);font-size:11.5px;font-weight:500;letter-spacing:.03em}
.util .l{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.util .canli{display:inline-flex;align-items:center;gap:7px;color:var(--gold3);font-weight:700;letter-spacing:.16em}
.util .dot{width:7px;height:7px;border-radius:50%;background:var(--kirmizi);box-shadow:0 0 0 0 rgba(158,43,35,.6);animation:pulse 1.9s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(158,43,35,.55)}70%{box-shadow:0 0 0 7px rgba(158,43,35,0)}100%{box-shadow:0 0 0 0 rgba(158,43,35,0)}}
.util .clock{font-variant-numeric:tabular-nums;color:#efe6d2;font-weight:700;letter-spacing:.06em}
.util .r{display:flex;gap:18px;color:#b0a68f}
.util .r a:hover{color:var(--gold3)}

/* ── MASTHEAD ── */
.mast{background:transparent;text-align:center;position:relative;padding:6px 0 0}
.mast .rule{height:0;border-top:1px solid var(--gold2)}
.mast .rule.d{box-shadow:0 3px 0 -2px var(--gold2)}
.mast .inner{position:relative;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;padding:22px 0 20px}
.mast .side{font-family:var(--sans);font-size:11px;color:var(--ink2);line-height:1.6}
.mast .side.l{text-align:left}.mast .side.r{text-align:right;display:flex;justify-content:flex-end;align-items:center;gap:12px}
.mast .side b{display:block;font-weight:800;letter-spacing:.06em;color:var(--ink);font-size:11.5px}
.wordmark{font-family:var(--serif);font-weight:900;font-size:clamp(30px,5.4vw,60px);letter-spacing:-.012em;line-height:.9;color:var(--ink);white-space:nowrap}
.wordmark .h{color:var(--kirmizi)}
.mast .tagline{font-family:var(--sans);font-weight:700;font-size:10.5px;letter-spacing:.34em;color:var(--gold);margin-top:11px;text-transform:uppercase}
.searchbtn{width:40px;height:40px;border:1px solid var(--line2);background:var(--card);display:grid;place-items:center;cursor:pointer}
.searchbtn:hover{border-color:var(--gold2)}

/* ── KATEGORİ NAV ── */
.catnav{border-top:1px solid var(--gold2);border-bottom:1px solid var(--line);background:rgba(246,241,230,.9);backdrop-filter:blur(6px);position:sticky;top:0;z-index:40}
.catnav .wrap{display:flex;align-items:center;justify-content:center;gap:2px;overflow-x:auto;scrollbar-width:none}
.catnav .wrap::-webkit-scrollbar{display:none}
.catnav a{position:relative;font-family:var(--sans);font-weight:700;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink2);padding:15px 17px;white-space:nowrap}
.catnav a:hover{color:var(--kirmizi)}
.catnav a.on{color:var(--ink)}
.catnav a.on::after{content:'';position:absolute;left:17px;right:17px;bottom:8px;height:2px;background:var(--kirmizi)}
.catnav .sep{width:1px;height:14px;background:var(--line2);flex-shrink:0}
.catnav .live{color:var(--kirmizi);font-weight:800;display:inline-flex;align-items:center;gap:7px}
.catnav .live .dot{width:6px;height:6px;border-radius:50%;background:var(--kirmizi);animation:pulse2 1.5s infinite}
@keyframes pulse2{0%,100%{opacity:1}50%{opacity:.25}}

/* ── SON DAKİKA ── */
.flash{display:flex;align-items:stretch;background:var(--paper2);border-bottom:1px solid var(--line);overflow:hidden}
.flash .tag{position:relative;z-index:2;flex-shrink:0;background:var(--kirmizi);color:#fff;display:flex;align-items:center;gap:8px;padding:10px 18px;font-family:var(--sans);font-weight:800;font-size:11px;letter-spacing:.14em;text-transform:uppercase;box-shadow:6px 0 10px -4px rgba(158,43,35,.5)}
.flash .tag .dot{width:7px;height:7px;border-radius:50%;background:#fff;animation:pulse2 1.4s infinite}
.flash .track{white-space:nowrap;padding:10px 0;font-family:var(--serif);font-size:14px;font-weight:500;color:var(--koyu);animation:mars 52s linear infinite}
.flash:hover .track{animation-play-state:paused}
.flash .track span{margin:0 30px} .flash .track b{font-family:var(--sans);font-weight:800;font-size:10px;letter-spacing:.1em;color:var(--kirmizi);text-transform:uppercase;margin-right:8px}
@keyframes mars{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* ── FRONT PAGE ── */
.front{padding:40px 0 12px}
.front .grid{display:grid;grid-template-columns:2fr 1fr;gap:46px;align-items:start}
.kick{display:inline-flex;align-items:center;gap:9px;font-family:var(--sans);font-weight:800;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--kirmizi);margin-bottom:15px}
.kick .dot{width:6px;height:6px;border-radius:50%;background:var(--kirmizi);animation:pulse2 1.5s infinite}
.lead{display:block;cursor:pointer}
.lead .media{position:relative;aspect-ratio:16/9;overflow:hidden;background:var(--paper2);border:1px solid var(--line2);box-shadow:0 1px 0 rgba(193,154,82,.4),0 24px 50px -30px rgba(33,26,15,.4)}
.lead h1{font-family:var(--serif);font-weight:900;font-size:clamp(32px,4.7vw,60px);line-height:1;letter-spacing:-.018em;margin:22px 0 14px;text-wrap:balance;color:var(--ink);transition:color .2s}
.lead:hover h1{color:var(--kirmizi)}
.lead .sf{font-family:var(--serif);font-weight:400;font-size:18.5px;line-height:1.55;color:#3d3524;max-width:62ch;margin:0 0 18px}
.lead .by{font-family:var(--sans);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink2);display:flex;gap:10px;flex-wrap:wrap;align-items:center;border-top:1px solid var(--line);padding-top:14px}
.lead .by .c{color:var(--kirmizi)} .lead .by i{font-style:normal;color:var(--line2)}

/* lead altı ek manşetler (sol sütunu dengeler) */
.leadmore{margin-top:26px;border-top:3px double var(--gold2);padding-top:20px;display:grid;gap:16px}
.leadmore .lm-h{font-family:var(--sans);font-weight:800;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:2px}
.lmrow{display:grid;grid-template-columns:132px 1fr;gap:16px;align-items:center;padding-bottom:16px;border-bottom:1px solid var(--line)}
.lmrow:last-child{border-bottom:0;padding-bottom:0}
.lmrow .media{position:relative;aspect-ratio:16/11;overflow:hidden;background:var(--paper2);border:1px solid var(--line2)}
.lmrow .c{font-family:var(--sans);font-weight:800;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--kirmizi)}
.lmrow h4{margin:5px 0 0;font-family:var(--serif);font-weight:700;font-size:19px;line-height:1.15;color:var(--ink);text-wrap:balance}
.lmrow:hover h4{color:var(--kirmizi)}

/* sidebar paneller */
.panel + .panel{margin-top:26px}
.phead{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--ink);padding-bottom:9px;margin-bottom:4px}
.phead h3{font-family:var(--serif);font-weight:900;font-size:16px;margin:0;letter-spacing:-.01em}
.phead .mini{font-family:var(--sans);font-weight:800;font-size:9.5px;letter-spacing:.14em;color:var(--kirmizi);text-transform:uppercase;display:inline-flex;align-items:center;gap:6px}
.phead .mini .dot{width:6px;height:6px;border-radius:50%;background:var(--kirmizi);animation:pulse2 1.5s infinite}
.rlist{display:flex;flex-direction:column}
.rrow{display:flex;gap:13px;padding:15px 0;border-bottom:1px solid var(--line);cursor:pointer;transition:background .15s}
.rrow:hover{background:rgba(193,154,82,.07)}
.rrow.act{background:rgba(158,43,35,.06)}
.rrow:hover h4,.rrow.act h4{color:var(--kirmizi)}
.rrow .t{flex-shrink:0;font-family:var(--serif);font-weight:900;font-size:14px;color:var(--gold);width:52px;font-variant-numeric:tabular-nums;letter-spacing:-.01em}
.rrow h4{margin:0;font-family:var(--serif);font-weight:600;font-size:16px;line-height:1.22;color:var(--ink)}
.rrow .m{font-family:var(--sans);font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);margin-top:6px}

/* TARİH BORSASI */
.borsa .bwrap{border:1px solid var(--line2);background:var(--card)}
.brow{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}
.brow:last-child{border-bottom:0}
.brow .nm{font-family:var(--sans);font-size:12px;font-weight:600;color:var(--ink)}
.brow .nm span{display:block;font-size:9.5px;font-weight:700;letter-spacing:.06em;color:var(--mut);text-transform:uppercase;margin-top:2px}
.brow .vl{font-family:var(--sans);font-weight:800;font-size:13px;display:inline-flex;align-items:center;gap:6px}
.brow .up{color:var(--yesil)} .brow .dn{color:var(--kirmizi)}
.brow.top{background:linear-gradient(100deg,rgba(224,195,132,.28),rgba(193,154,82,.12));border-left:3px solid var(--gold2)}
.brow.top .nm{font-weight:800}
.brow.top .nm .star{color:var(--gold);font-weight:800;margin-right:5px}
.brow.top .vl{font-size:14px;color:#8a6a1e}
.borsa .note{font-family:var(--sans);font-size:9.5px;letter-spacing:.04em;color:var(--mut);margin-top:8px;text-align:right}

/* BUGÜN TARİHTE kart */
.otd .obox{display:block;border:1px solid var(--gold2);background:linear-gradient(165deg,#fff,var(--paper2));cursor:pointer}
.otd .obar{background:var(--koyu);color:var(--gold3);padding:10px 14px;font-family:var(--sans);font-weight:800;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;display:flex;justify-content:space-between;align-items:center}
.otd .obar .d{color:#c9bfa8;font-weight:600;letter-spacing:.04em}
.otd .ob{padding:16px 16px 18px}
.otd .ob .y{font-family:var(--serif);font-weight:900;font-size:32px;color:var(--kirmizi);line-height:.9}
.otd .ob h4{font-family:var(--serif);font-weight:700;font-size:18px;line-height:1.18;margin:9px 0 7px;color:var(--ink)}
.otd .ob p{margin:0;font-family:var(--sans);font-size:12.5px;color:var(--ink2);line-height:1.5}

/* ── İKİNCİL MANŞETLER ── */
.secondary{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;padding:34px 0 10px;margin-top:34px;border-top:3px double var(--gold2)}
.mcard{display:block;cursor:pointer}
.mcard .media{position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--paper2);border:1px solid var(--line2);margin-bottom:14px}
.mcard .c{font-family:var(--sans);font-weight:800;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--kirmizi)}
.mcard h3{font-family:var(--serif);font-weight:700;font-size:22px;line-height:1.1;margin:8px 0 9px;color:var(--ink);text-wrap:balance}
.mcard:hover h3{color:var(--kirmizi)}
.mcard p{font-family:var(--serif);font-size:14.5px;line-height:1.5;color:var(--ink2);margin:0}

/* ── KATEGORİ BÖLÜMLERİ ── */
.section{padding:42px 0 6px}
.section .bar{display:flex;align-items:baseline;gap:18px;border-bottom:1px solid var(--gold2);padding-bottom:12px;margin-bottom:26px}
.section .bar h2{font-family:var(--serif);font-weight:900;font-size:clamp(24px,2.8vw,34px);margin:0;letter-spacing:-.015em}
.section .bar h2 span{color:var(--kirmizi)}
.section .bar .fill{flex:1}
.section .bar .more{font-family:var(--sans);font-weight:800;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.cards{display:flex;flex-wrap:wrap;gap:30px}
.ncard{flex:1 1 340px;display:flex;flex-direction:column;cursor:pointer}
.ncard .media{position:relative;aspect-ratio:16/10;overflow:hidden;background:var(--paper2);border:1px solid var(--line2);margin-bottom:13px;transition:box-shadow .25s}
.ncard:hover .media{box-shadow:0 20px 44px -26px rgba(33,26,15,.55)}
.ncard .c{position:absolute;top:0;left:0;font-family:var(--sans);font-weight:800;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:#fff;background:var(--kirmizi);padding:6px 11px}
.ncard .m{font-family:var(--sans);font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);margin-bottom:6px}
.ncard h3{font-family:var(--serif);font-weight:700;font-size:20px;line-height:1.14;margin:0 0 8px;color:var(--ink);text-wrap:balance}
.ncard:hover h3{color:var(--kirmizi)}
.ncard p{font-family:var(--serif);font-size:14px;line-height:1.5;color:var(--ink2);margin:0}

/* görsel yer tutucu */
.ph{position:absolute;inset:0;display:grid;place-items:center;background:
   radial-gradient(circle 180px at 32% 26%,rgba(156,122,46,.1),transparent 62%),
   linear-gradient(155deg,#ece3d0,#e0d6bf)}
.ph .pin{text-align:center}
.ph .pin .ico{font-size:24px;opacity:.42;filter:grayscale(.35)}
.ph .pin .t{font-family:var(--sans);font-size:8.5px;font-weight:800;letter-spacing:.2em;color:#ad9f83;margin-top:8px}

/* ── HABER SAYFASI (makale) ── */
.story{padding:34px 0 10px}
.story .back{display:inline-flex;align-items:center;gap:8px;font-family:var(--sans);font-weight:800;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink2);margin-bottom:22px}
.story .back:hover{color:var(--kirmizi)}
.story .hero{position:relative;aspect-ratio:16/7;overflow:hidden;background:var(--paper2);border:1px solid var(--line2);box-shadow:0 1px 0 rgba(193,154,82,.4),0 26px 54px -32px rgba(33,26,15,.42)}
.story .hero .hc{position:absolute;left:0;bottom:0;font-family:var(--sans);font-weight:800;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:#fff;background:var(--kirmizi);padding:8px 15px}
.story .col{max-width:760px;margin:0 auto}
.story h1{font-family:var(--serif);font-weight:900;font-size:clamp(30px,4.4vw,50px);line-height:1.02;letter-spacing:-.018em;margin:30px 0 8px;text-wrap:balance;color:var(--ink)}
.story .spot{font-family:var(--serif);font-weight:400;font-size:20px;line-height:1.5;color:#3d3524;margin:0 0 18px}
.story .byline{display:flex;align-items:center;gap:12px;font-family:var(--sans);font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink2);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:13px 0;margin-bottom:26px}
.story .byline .src{color:var(--kirmizi)} .story .byline i{width:4px;height:4px;border-radius:50%;background:var(--line2)}
.story .art p{font-family:var(--serif);font-size:18px;line-height:1.82;color:#332c1d;margin:0 0 19px}
.story .art p.lede{font-weight:500;font-size:20px;line-height:1.62;color:var(--ink)}
.story .art .dl{font-family:var(--sans);font-weight:800;font-size:12.5px;letter-spacing:.05em;text-transform:uppercase;color:var(--kirmizi);margin-right:3px}
.story .art blockquote{margin:30px 0;padding:8px 0 8px 24px;border-left:3px solid var(--gold2);font-family:var(--serif);font-style:italic;font-weight:600;font-size:25px;line-height:1.3;color:var(--ink);letter-spacing:-.01em}
.story .rel{margin-top:34px;border-top:1px solid var(--line);padding-top:18px}
.story .rel .rh{font-family:var(--sans);font-weight:800;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:4px}
.story .rel .ri{display:flex;gap:12px;align-items:baseline;padding:13px 0;border-bottom:1px solid var(--line)}
.story .rel .ri:last-child{border-bottom:0}
.story .rel .ri:hover span:last-child{color:var(--kirmizi)}
.story .rel .ri .y{flex-shrink:0;font-family:var(--serif);font-weight:900;font-size:14px;color:var(--gold);width:60px}
.story .rel .ri span:last-child{font-family:var(--serif);font-weight:600;font-size:17px;line-height:1.2;color:var(--ink)}
.story .foot{margin-top:30px;border-top:3px double var(--gold2);padding-top:24px;display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.abtn{display:inline-flex;align-items:center;gap:8px;font-family:var(--sans);font-weight:800;font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:14px 24px;background:var(--kirmizi);color:#fff}
.abtn:hover{background:var(--kirmizi-d)}
.abtn.g{background:transparent;border:1px solid var(--ink);color:var(--ink)}
.abtn.g:hover{background:var(--ink);color:var(--paper)}
.story .n{font-family:var(--sans);font-size:10px;font-weight:600;color:var(--mut)}

/* ── FOOTER ── */
footer{margin-top:52px;background:var(--koyu);color:#cfc5ad;border-top:4px solid var(--gold2)}
footer .wrap{padding:40px 0 30px}
footer .row{display:flex;flex-wrap:wrap;justify-content:space-between;gap:30px}
footer .fw{font-family:var(--serif);font-weight:900;font-size:26px;letter-spacing:-.01em;color:var(--paper)}
footer .fw .h{color:var(--gold3)}
footer .ft{font-family:var(--sans);font-size:12px;color:#988d76;margin-top:10px;max-width:34ch;line-height:1.6}
footer .cols{display:flex;gap:40px;flex-wrap:wrap}
footer .col{display:flex;flex-direction:column;gap:10px}
footer .col b{font-family:var(--sans);font-weight:800;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold3);margin-bottom:3px}
footer .col a{font-family:var(--sans);font-size:13px;color:#c0b69e}
footer .col a:hover{color:var(--paper)}
footer .cc{border-top:1px solid #3a3226;margin-top:30px;padding-top:20px;font-family:var(--sans);font-size:11px;color:#8b8069;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}

.rise{opacity:0;transform:translateY(18px);transition:opacity .6s cubic-bezier(.2,.7,.2,1),transform .6s cubic-bezier(.2,.7,.2,1)}
.rise.in{opacity:1;transform:none}

@media(max-width:900px){
  .front .grid{grid-template-columns:1fr;gap:36px}
  .secondary{grid-template-columns:1fr;gap:30px}
  .mast .inner{grid-template-columns:1fr}.mast .side{display:none}
  .lmrow{grid-template-columns:110px 1fr;gap:13px}
  .lmrow h4{font-size:17px}
}
@media(prefers-reduced-motion:reduce){.rise{opacity:1;transform:none}.flash .track{animation:none}.util .dot,.flash .tag .dot,.catnav .live .dot,.phead .mini .dot{animation:none}}
`;

/* ─────────── ORTAK PARÇALAR ─────────── */
function head(title, desc, extra){
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="stylesheet" href="/haber/haber.css">
${extra||''}</head>
<body>`;
}
function util(){
  return `<div class="util"><div class="wrap">
  <div class="l"><span class="canli"><span class="dot"></span>CANLI YAYIN</span><span class="clock" id="clock">--:--:--</span><span id="tarih"></span></div>
  <div class="r"><a href="/arsiv">Arşiv</a><a href="/studio">Studio</a><a href="/bulten">Bülten</a><a href="/iletisim">Künye</a></div>
</div></div>`;
}
function masthead(){
  return `<header class="mast">
  <div class="rule d"></div>
  <div class="wrap"><div class="inner">
    <div class="side l"><b id="baski">BASKI</b><span id="edate"></span></div>
    <a href="/haber" style="display:block">
      <div class="wordmark">Tarih Ajanı <span class="h">Haber</span></div>
      <div class="tagline">Tarihin Canlı Yayını · Kronik Servisi</div>
    </a>
    <div class="side r">
      <span style="text-align:right">Bağımsız<br><b>Tarih Kroniği</b></span>
      <a href="/" class="searchbtn" aria-label="Tarih Ajanı ana sayfa" title="Tarih Ajanı"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5A4F38" stroke-width="2.2" stroke-linecap="round"><path d="M3 12l9-8 9 8"/><path d="M5 10v10h14V10"/></svg></a>
    </div>
  </div></div>
  <div class="rule d"></div>
</header>`;
}
function catnav(){
  return `<nav class="catnav"><div class="wrap" id="catnav">
  <a href="/haber" class="on" data-f="hepsi">Gündem</a><span class="sep"></span>
  <a href="/haber#savas" data-f="savas">Savaş</a><span class="sep"></span>
  <a href="/haber#siyaset" data-f="siyaset">Siyaset</a><span class="sep"></span>
  <a href="/haber#sir" data-f="sir">Sır Dosyaları</a><span class="sep"></span>
  <a href="/haber#bilim" data-f="bilim">Keşif &amp; Bilim</a><span class="sep"></span>
  <a href="/haber#felaket" data-f="felaket">Felaket</a><span class="sep"></span>
  <a href="/haber#ekonomi" data-f="ekonomi">Ekonomi</a><span class="sep"></span>
  <a href="/studio" class="live"><span class="dot"></span>Canlı Üret</a>
</div></nav>`;
}
function footer(){
  return `<footer>
  <div class="wrap">
    <div class="row">
      <div><div class="fw">Tarih Ajanı <span class="h">Haber</span></div>
        <div class="ft">Tarihin dönüm noktalarını, sanki bugün oluyormuş gibi haber diliyle veren bağımsız kronik yayın.</div></div>
      <div class="cols">
        <div class="col"><b>Bölümler</b><a href="/haber#savas" data-f="savas">Savaş</a><a href="/haber#siyaset" data-f="siyaset">Siyaset</a><a href="/haber#sir" data-f="sir">Sır Dosyaları</a><a href="/haber#bilim" data-f="bilim">Keşif &amp; Bilim</a></div>
        <div class="col"><b>Tarih Ajanı</b><a href="/">Ana Sayfa</a><a href="/arsiv">Hikâye Arşivi</a><a href="/studio">Studio</a><a href="/iletisim">Künye</a></div>
        <div class="col"><b>Takip</b><a href="https://www.youtube.com/@TarihAjani">YouTube</a><a href="https://www.instagram.com/tarih.ajani">Instagram</a><a href="/bulten">Bülten</a></div>
      </div>
    </div>
    <div class="cc"><span>© <span id="yr"></span> Tarih Ajanı Haber · Tarih Ajanı Yayın Ağı</span><span>Piyasa verileri temsilîdir · Rivayet/tartışmalı ayrıntılar metinde belirtilir.</span></div>
  </div>
</footer>`;
}
/* saat + tarih + son dakika + borsa (statik) — ortak inline script */
function commonScript(){
  const flashItems = HABER.slice(0,10).map(h=>'<span><b>'+esc(catAd(h.cat))+'</b> · '+esc(h.baslik)+'</span>').join('');
  const borsaRows = P2.map(function(x){
    var dir=x[2]>0?'up':'dn', ar=x[2]>0?'▲':'▼';
    var p=x[0].split(' ('), nm=p[0], unit=p[1]?p[1].replace(')',''):'';
    var top=x[3]?' top':'';
    var star=x[3]?'<span class="star">★</span>':'';
    return '<div class="brow'+top+'"><div class="nm">'+star+esc(nm)+(unit?'<span>'+esc(unit)+'</span>':'')+'</div>'+
      '<div class="vl '+dir+'">'+esc(x[1])+' '+ar+'</div></div>';
  }).join('');
  return `<script>
(function(){
  var aylar=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  var gunler=['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  function pad(n){return (n<10?'0':'')+n;}
  function tick(){var d=new Date();var cl=document.getElementById('clock');if(cl)cl.textContent=pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());}
  tick();setInterval(tick,1000);
  var d=new Date();
  var t=document.getElementById('tarih');if(t)t.textContent='· '+gunler[d.getDay()]+', '+d.getDate()+' '+aylar[d.getMonth()]+' '+d.getFullYear()+' · İSTANBUL';
  var e=document.getElementById('edate');if(e)e.textContent=d.getDate()+' '+aylar[d.getMonth()]+' '+d.getFullYear();
  var b=document.getElementById('baski');if(b)b.textContent='BASKI No. '+Math.floor((d-new Date(d.getFullYear(),0,0))/864e5);
  var y=document.getElementById('yr');if(y)y.textContent=d.getFullYear();
  var fl=document.getElementById('flash');if(fl)fl.innerHTML=${JSON.stringify(flashItems+flashItems)};
  var bo=document.getElementById('borsa');if(bo)bo.innerHTML=${JSON.stringify(borsaRows)};
})();
</script>`;
}

/* ─────────── ÖN SAYFA ─────────── */
function buildFront(){
  // içerik modülünü (export satırı olmadan) sayfaya göm
  var contentSrc = fs.readFileSync(path.join(SCR,'haber-content.js'),'utf8')
    .replace(/if \(typeof module[\s\S]*$/,'');
  var body = `${util()}
${masthead()}
${catnav()}
<div class="flash"><span class="tag"><span class="dot"></span>Son Dakika</span><div class="track" id="flash"></div></div>

<main class="wrap">
  <section class="front"><div class="grid">
    <div>
      <a class="lead" id="lead" href="#"></a>
      <div class="leadmore" id="leadmore"></div>
    </div>
    <aside>
      <div class="panel">
        <div class="phead"><h3>Son Dakika Akışı</h3><span class="mini"><span class="dot"></span>Canlı</span></div>
        <div class="rlist" id="raillist"></div>
      </div>
      <div class="panel borsa">
        <div class="phead"><h3>Tarih Borsası</h3><span class="mini">Dönem Fiyatları</span></div>
        <div class="bwrap" id="borsa"></div>
        <div class="note">Temsilî — antik piyasa değerleri</div>
      </div>
      <div class="panel otd" id="otd"></div>
    </aside>
  </div></section>

  <section class="secondary" id="secondary"></section>
  <div id="sections"></div>
</main>

${footer()}
${commonScript()}
<script>
${contentSrc}
/* ── yardımcılar ── */
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function catAd(cat){return (CATS[cat]||{}).ad||'DOSYA';}
function ph(cat,label){var c=CATS[cat]||{ico:'📁',ad:'DOSYA'};return '<div class="ph"><div class="pin"><div class="ico">'+c.ico+'</div><div class="t">'+(label||'GÖRSEL')+'</div></div></div>';}
function media(h){return h.img?'<img src="'+esc(h.img)+'" alt="'+esc(h.baslik)+'" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">':ph(h.cat,'GÖRSEL');}
function url(h){return '/haber/'+h.slug+'/';}
function bySlug(s){return HABER.filter(function(x){return x.slug===s;})[0];}

/* bugün tarihte */
var BUGUN=(function(){var d=new Date();var p=function(n){return (n<10?'0':'')+n;};var md=p(d.getMonth()+1)+'-'+p(d.getDate());
  var m=HABER.filter(function(h){return h.md===md;});
  if(m.length){m[0].__otd=true;return m[0];}
  var w=HABER.filter(function(h){return h.md;});var cur=d.getMonth()*31+d.getDate();
  w.sort(function(a,b){function dist(x){var q=x.md.split('-');var v=(+q[0]-1)*31+(+q[1]);var g=Math.abs(v-cur);return Math.min(g,372-g);}return dist(a)-dist(b);});
  return w[0]||HABER[0];})();

var LEAD=BUGUN;
var REST=HABER.filter(function(h){return h!==LEAD;});

/* lead render (hover ile önizleme) */
function renderLead(h,preview){
  var el=document.getElementById('lead');
  el.href=url(h);
  el.innerHTML=
    '<div class="media">'+media(h)+'</div>'+
    (h.__otd&&!preview?'<span class="kick"><span class="dot"></span>Bugün Tarihte · Son Dakika</span>':(preview?'<span class="kick"><span class="dot"></span>Öne Çıkan Dosya</span>':'<span class="kick"><span class="dot"></span>Günün Manşeti</span>'))+
    '<h1>'+esc(h.baslik)+'</h1>'+
    '<p class="sf">'+esc(h.spot)+'</p>'+
    '<div class="by"><span class="c">'+esc(catAd(h.cat))+'</span><i>·</i><span>'+esc(h.tarih)+'</span><i>·</i><span>'+esc(h.yer)+'</span><i>·</i><span>Tarih Ajanı Haber Merkezi</span></div>';
}
renderLead(LEAD);

/* rail — hover ile soldaki lead değişir, tıklayınca sayfaya gider */
document.getElementById('raillist').innerHTML=REST.slice(0,5).map(function(h){
  return '<a class="rrow" href="'+url(h)+'" data-slug="'+h.slug+'"><div class="t">'+esc(h.yil)+'</div>'+
    '<div><h4>'+esc(h.baslik)+'</h4><div class="m">'+esc(catAd(h.cat))+' · '+esc(h.yer)+'</div></div></a>';
}).join('');
/* hover görsellerini önceden yükle — geçişlerde titreme/flaş olmasın */
[LEAD].concat(REST.slice(0,5)).forEach(function(h){if(h.img){var im=new Image();im.src=h.img;}});
(function(){
  var host=document.getElementById('raillist');
  var curSlug=LEAD.slug;
  function show(h,preview){ if(!h||h.slug===curSlug)return; curSlug=h.slug; renderLead(h,preview); }
  host.addEventListener('mouseover',function(e){
    var row=e.target.closest('.rrow'); if(!row)return;
    var h=bySlug(row.getAttribute('data-slug')); if(!h)return;
    [].forEach.call(host.querySelectorAll('.rrow'),function(r){r.classList.toggle('act',r===row);});
    show(h,true);
  });
  host.addEventListener('mouseleave',function(){
    [].forEach.call(host.querySelectorAll('.rrow'),function(r){r.classList.remove('act');});
    show(LEAD,false);
  });
})();

/* lead altı ek manşetler (sol sütunu doldurur) — 3 manşet */
document.getElementById('leadmore').innerHTML=
  '<div class="lm-h">Daha Fazla Manşet</div>'+
  REST.slice(5,8).map(function(h){
    return '<a class="lmrow" href="'+url(h)+'"><div class="media">'+media(h)+'</div>'+
      '<div><div class="c">'+esc(catAd(h.cat))+'</div><h4>'+esc(h.baslik)+'</h4></div></a>';
  }).join('');

/* bugün tarihte kartı */
(function(){var o=BUGUN;var d=new Date();var aylar=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  document.getElementById('otd').innerHTML=
    '<a class="obox" href="'+url(o)+'"><div class="obar"><span>Bugün Tarihte</span><span class="d">'+d.getDate()+' '+aylar[d.getMonth()]+'</span></div>'+
    '<div class="ob"><div class="y">'+esc(o.yil)+'</div><h4>'+esc(o.baslik)+'</h4><p>'+esc(o.spot)+'</p></div></a>';
})();

/* ikincil manşetler (3) */
(function(){
  document.getElementById('secondary').innerHTML=REST.slice(8,11).map(function(h){
    return '<a class="mcard" href="'+url(h)+'"><div class="media">'+media(h)+'</div>'+
      '<div class="c">'+esc(catAd(h.cat))+'</div><h3>'+esc(h.baslik)+'</h3><p>'+esc(h.spot)+'</p></a>';
  }).join('');
})();

/* kategori bölümleri + filtre */
function card(h){
  return '<a class="ncard rise" href="'+url(h)+'"><div class="media">'+media(h)+'<span class="c">'+esc(catAd(h.cat))+'</span></div>'+
    '<div class="m">'+esc(h.tarih)+' · '+esc(h.yer)+'</div><h3>'+esc(h.baslik)+'</h3><p>'+esc(h.spot)+'</p></a>';
}
function secBar(ad,n){return '<div class="bar"><h2>'+ad+'</h2><span class="fill"></span><span class="more">'+n+' Haber</span></div>';}
function renderSections(filter){
  var host=document.getElementById('sections');
  if(filter && filter!=='hepsi'){
    var list=HABER.filter(function(h){return h.cat===filter;});
    host.innerHTML='<section class="section" id="sec-'+filter+'">'+secBar(esc(catAd(filter)),list.length)+'<div class="cards">'+list.map(card).join('')+'</div></section>';
  } else {
    host.innerHTML=GRUPLAR.map(function(g){
      var list=HABER.filter(function(h){return g.cats.indexOf(h.cat)>=0;});
      if(!list.length)return '';
      var t=esc(g.ad).replace(' &amp; ',' <span>&amp;</span> ');
      return '<section class="section" id="sec-'+g.cats[0]+'">'+secBar(t,list.length)+'<div class="cards">'+list.map(card).join('')+'</div></section>';
    }).join('');
  }
  reveal();
}
renderSections('hepsi');

/* kategori tıklaması: filtre değil, ilgili bölüme yumuşak kaydırma */
var SECMAP=(function(){var m={};GRUPLAR.forEach(function(g){g.cats.forEach(function(c){m[c]='sec-'+g.cats[0];});});return m;})();
function scrollToSec(id){
  var el=id?document.getElementById(id):document.getElementById('sections');
  if(!el)el=document.getElementById('sections');
  if(!el)return;
  var nav=document.querySelector('.catnav');
  var off=(nav?nav.offsetHeight:0)+16;
  var y=el.getBoundingClientRect().top+window.pageYOffset-off;
  window.scrollTo({top:Math.max(0,y),behavior:'smooth'});
}
document.addEventListener('click',function(e){
  var a=e.target.closest('[data-f]'); if(!a)return; e.preventDefault();
  var f=a.getAttribute('data-f');
  [].forEach.call(document.querySelectorAll('#catnav a'),function(x){x.classList.toggle('on', x.getAttribute('data-f')===f);});
  scrollToSec(f==='hepsi'?null:SECMAP[f]);
});
/* başka sayfadan #kategori ile gelindiyse o bölüme in */
(function(){var h=(location.hash||'').replace('#','');if(h&&SECMAP[h]){setTimeout(function(){scrollToSec(SECMAP[h]);},220);}})();

/* kaydırınca beliren kartlar */
var _io;
function reveal(){
  if(!('IntersectionObserver' in window)){[].forEach.call(document.querySelectorAll('.rise'),function(e){e.classList.add('in');});return;}
  if(!_io)_io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');_io.unobserve(e.target);}});},{threshold:.08,rootMargin:'0px 0px -4% 0px'});
  [].forEach.call(document.querySelectorAll('.rise:not(.in)'),function(e){_io.observe(e);});
}
reveal();
</script>
</body>
</html>`;
  return head('Tarih Ajanı Haber · Tarihin Canlı Yayını',
    'Tarih Ajanı Haber — tarihin dönüm noktalarını canlı haber diliyle veren kronik. Son dakika, tarih borsası, bugün tarihte ve derin dosyalar.') + '\n' + body;
}

/* ─────────── HABER SAYFASI ─────────── */
function buildStory(h){
  var g=h.govde||[];
  var mid=Math.min(g.length, Math.max(1, Math.floor(g.length/2)));
  var body='';
  g.forEach(function(p,i){
    if(i===0) body+='<p class="lede"><span class="dl">'+esc(h.yer)+', '+esc(h.tarih)+' —</span> '+esc(p)+'</p>';
    else body+='<p>'+esc(p)+'</p>';
    if(h.pull && i===mid-1) body+='<blockquote>“'+esc(h.pull)+'”</blockquote>';
  });
  var rel=HABER.filter(function(x){return x.cat===h.cat && x!==h;}).slice(0,3);
  if(rel.length<3){ HABER.forEach(function(x){ if(rel.length<3 && x!==h && rel.indexOf(x)<0) rel.push(x); }); }
  var relHtml=rel.length?('<div class="rel"><div class="rh">İlgili Dosyalar</div>'+rel.map(function(r){
    return '<a class="ri" href="/haber/'+r.slug+'/"><span class="y">'+esc(r.yil)+'</span><span>'+esc(r.baslik)+'</span></a>';}).join('')+'</div>'):'';

  var main = `${util()}
${masthead()}
${catnav()}
<div class="flash"><span class="tag"><span class="dot"></span>Son Dakika</span><div class="track" id="flash"></div></div>

<main class="wrap">
  <article class="story">
    <a class="back" href="/haber">← Tüm Manşetler</a>
    <div class="hero">${media(h)}<span class="hc">${esc(catAd(h.cat))}</span></div>
    <div class="col">
      <h1>${esc(h.baslik)}</h1>
      <p class="spot">${esc(h.spot)}</p>
      <div class="byline"><span class="src">Tarih Ajanı Haber Merkezi</span><i></i><span>${esc(h.yer)} · ${esc(h.tarih)}</span></div>
      <div class="art">${body}</div>
      ${relHtml}
      <div class="foot"><a class="abtn" href="/studio">◉ Bu Haberi Video Yap</a><a class="abtn g" href="/arsiv">Dosyayı Arşivde Oku</a><span class="n">Rivayet ve tartışmalı ayrıntılar metinde belirtilmiştir.</span></div>
    </div>
  </article>
</main>

${footer()}
${commonScript()}
</body>
</html>`;
  return head(h.baslik+' · Tarih Ajanı Haber', h.spot) + '\n' + main;
}

/* ─────────── YAZ ─────────── */
if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR,{recursive:true});
fs.writeFileSync(path.join(OUTDIR,'haber.css'), CSS);
fs.writeFileSync(path.join(OUTDIR,'index.html'), buildFront());
var n=0;
HABER.forEach(function(h){
  var dir=path.join(OUTDIR,h.slug);
  if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'), buildStory(h));
  n++;
});
console.log('haber.css + index.html + '+n+' haber sayfası yazıldı → '+OUTDIR);

#!/usr/bin/env node
// Arşiv SEO sayfaları üretici — arsiv-data.js'ten 44 tanıtım sayfası
// (arsiv/<slug>/index.html) + katalog (arsiv/katalog/index.html) üretir
// ve sitemap.xml'e eksik URL'leri ekler.
// Tanıtım sayfaları TAM İÇERİK VERMEZ: özet + kısa fragman + bölüm listesi
// + üyelik CTA'sı. Tam dosya /arsiv'de, Gözlemci+ üyelikte kalır.
// Çalıştır: node tools/gen-arsiv-seo.js   (repo kökünde)
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://tarihajani.com';

/* ── veri ── */
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'arsiv-data.js'), 'utf8'), ctx);
const STORIES = ctx.window.__ARSIV__;
if (!Array.isArray(STORIES) || !STORIES.length) { console.error('arsiv-data okunamadı'); process.exit(1); }

/* ── yardımcılar ── */
const TR = { 'ç':'c','Ç':'c','ğ':'g','Ğ':'g','ı':'i','I':'i','İ':'i','ö':'o','Ö':'o','ş':'s','Ş':'s','ü':'u','Ü':'u','â':'a','Â':'a','î':'i','Î':'i','û':'u','Û':'u' };
function slugify(s) {
  let t = String(s).split('').map(c => TR[c] != null ? TR[c] : c).join('').toLowerCase();
  t = t.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (t.length > 60) t = t.slice(0, 60).replace(/-[^-]*$/, '');
  return t || 'dosya';
}
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
// cümle sınırından kısalt
function clip(s, max) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  let cut = t.lastIndexOf('. ', max);
  if (cut < max * 0.5) cut = t.lastIndexOf(' ', max);
  return t.slice(0, cut > 0 ? cut + 1 : max).trim() + '…';
}
function voiceExcerpt(story) {
  const ses = (story.sections || []).find(x => /SESLENDİRME/i.test(x.ad));
  const b = ses && ses.bloklar && ses.bloklar[0];
  return b ? clip(b.t, 460) : '';
}
function sectionList(story) {
  return (story.sections || []).map(x => ({
    ad: x.ad,
    adet: (x.bloklar || []).length
  }));
}

/* ── slug tablosu (çakışma güvenli) ── */
const seen = new Set();
const items = STORIES.map(s => {
  let slug = slugify(s.baslik);
  let i = 2;
  while (seen.has(slug)) slug = slugify(s.baslik) + '-' + (i++);
  seen.add(slug);
  return { ...s, slug };
});

/* ── sayfa iskeleti ── */
function shell(title, desc, canonPath, bodyHtml, jsonld) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png?v=3">
<link rel="icon" type="image/png" sizes="64x64" href="/assets/favicon-64.png?v=3">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png?v=3">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${canonPath}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Tarih Ajanı">
<meta property="og:locale" content="tr_TR">
<meta property="og:url" content="${SITE}${canonPath}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}/assets/dossier-bundle.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..900&family=Hanken+Grotesk:wght@300..800&family=Special+Elite&display=swap" rel="stylesheet">
${jsonld ? '<script type="application/ld+json">' + jsonld + '</script>' : ''}
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #03050b; }
  body { font-family: 'Hanken Grotesk', system-ui, sans-serif; color: #e9dfc8; line-height: 1.7; }
  a { color: #e6c478; }
  .mono { font-family: 'Special Elite', monospace; letter-spacing: .14em; }
  .wrap { width: min(860px, 100%); margin: 0 auto; padding: 0 clamp(18px, 4vw, 40px); }
  header.site { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px clamp(18px, 4vw, 48px); background: rgba(3,5,11,.92); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(193,154,82,.18); }
  header.site nav { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
  header.site nav a { color: #d6d0c2; font-weight: 600; font-size: 12px; letter-spacing: .08em; text-decoration: none; padding: 9px 12px; }
  header.site nav a:hover { color: #f2ecd9; }
  header.site nav a.cta { color: #e6c478; border: 1px solid rgba(193,154,82,.55); }
  .kicker { color: #c19a52; font-size: 10.5px; }
  h1 { font-family: 'Playfair Display', serif; font-weight: 800; font-size: clamp(26px, 5vw, 42px); line-height: 1.15; margin: 10px 0 14px; }
  .box { border: 1px solid rgba(193,154,82,.28); background: #070a12; padding: clamp(18px, 3vw, 28px); margin: 18px 0; }
  .quote { border-left: 3px solid #c19a52; padding-left: 16px; color: #cfc8b4; white-space: pre-line; font-size: 15px; }
  .cta { display: inline-block; background: linear-gradient(110deg, #a77d35, #d8b26a 50%, #c19a52); color: #171207; font-family: 'Special Elite', monospace; font-weight: 800; font-size: 12.5px; letter-spacing: .12em; padding: 15px 26px; text-decoration: none; }
  .ghost { display: inline-block; color: #e6c478; border: 1px solid rgba(193,154,82,.5); font-family: 'Special Elite', monospace; font-size: 12px; letter-spacing: .1em; padding: 14px 22px; text-decoration: none; }
  ul.sec { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  ul.sec li { display: flex; justify-content: space-between; gap: 12px; border-bottom: 1px dashed rgba(129,135,151,.2); padding-bottom: 8px; font-size: 14px; }
  ul.sec li span:last-child { color: #818797; white-space: nowrap; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 14px; }
  .card { border: 1px solid rgba(129,135,151,.22); background: #070a12; padding: 18px; text-decoration: none; color: inherit; display: block; }
  .card:hover { border-color: rgba(193,154,82,.5); }
  .card h3 { font-family: 'Playfair Display', serif; font-size: 16.5px; margin: 8px 0 6px; color: #e9dfc8; line-height: 1.3; }
  .card p { margin: 0; color: #a4a9b5; font-size: 12.5px; line-height: 1.55; }
  footer.site { margin-top: 44px; padding: 24px clamp(18px, 4vw, 40px); border-top: 1px solid rgba(193,154,82,.15); text-align: center; color: #676d7c; font-size: 12px; }
  .pn { display: flex; justify-content: space-between; gap: 12px; margin: 26px 0 0; font-size: 12.5px; }
  .pn a { text-decoration: none; }
</style>
</head>
<body>
<header class="site">
  <a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
    <img src="/assets/logo.webp" alt="Tarih Ajanı" style="height:30px;width:auto;">
  </a>
  <nav>
    <a href="/">ANA SAYFA</a>
    <a href="/arsiv/katalog/">DOSYA KATALOĞU</a>
    <a href="/arsiv">ARŞİV</a>
    <a href="/uyelik" class="cta">ÜYELİK</a>
  </nav>
</header>
${bodyHtml}
<footer class="site">© 2026 Tarih Ajanı · TARİH SAKLAR, AJAN BULUR · <a href="/">tarihajani.com</a></footer>
<script src="/uye-nav.js" defer></script>
<script src="/canli-sohbet.js" defer></script>
<script src="/mobil-nav.js" defer></script>
<script src="/ara.js" defer></script>
<script src="/tema.js" defer></script>
<script src="/alt-bilgi.js" defer></script>
<script src="/analytics.js" defer></script>
</body>
</html>
`;
}

/* ── tanıtım sayfaları ── */
let written = 0;
items.forEach((s, i) => {
  const canon = '/arsiv/' + s.slug + '/';
  const title = s.baslik.replace(/\s+/g, ' ') + ' · Vaka Dosyası · Tarih Ajanı';
  const desc = clip(s.ozet || s.teaser || s.baslik, 158);
  const excerpt = voiceExcerpt(s);
  const secs = sectionList(s);
  const prev = items[(i - 1 + items.length) % items.length];
  const next = items[(i + 1) % items.length];
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article',
    headline: s.baslik, description: desc,
    inLanguage: 'tr', mainEntityOfPage: SITE + canon,
    publisher: { '@type': 'Organization', name: 'Tarih Ajanı', url: SITE },
    isAccessibleForFree: false
  });

  const body = `
<main class="wrap" style="padding-top: clamp(28px, 5vw, 56px);">
  <div class="mono kicker">${esc(s.no)} · ${esc(s.era)} · ${esc(s.fileNo)}</div>
  <h1>${esc(s.baslik)}</h1>
  <p style="color:#a9adba;font-size:16px;max-width:62ch;">${esc(s.ozet || s.teaser || '')}</p>

  ${excerpt ? `<div class="box">
    <div class="mono kicker" style="margin-bottom:12px;">DOSYADAN — SESLENDİRME FRAGMANI</div>
    <div class="quote">${esc(excerpt)}</div>
  </div>` : ''}

  <div class="box">
    <div class="mono kicker" style="margin-bottom:12px;">TAM DOSYADA NELER VAR</div>
    <ul class="sec">
      ${secs.map(x => `<li><span>${esc(x.ad)}</span><span>${x.adet} blok</span></li>`).join('\n      ')}
    </ul>
    <p style="margin:16px 0 0;color:#818797;font-size:13px;">Eksiksiz üretim dosyası: seslendirme metni, sahne &amp; görsel promptları, video promptları, kapak &amp; thumbnail, YouTube ve Instagram yayın paketi, üretim notları.</p>
  </div>

  <div class="box" style="border-color: rgba(193,154,82,.5); background: rgba(193,154,82,.06); text-align:center;">
    <p class="mono kicker" style="margin:0 0 10px;">TAM DOSYA ÜYELERE AÇIK</p>
    <p style="margin:0 0 18px;color:#cfc8b4;font-size:15px;">Bu vaka dosyasının tamamı — ve ${items.length} dosyalık arşiv — <strong style="color:#e6c478;">Gözlemci</strong> ve üzeri üyelikle açılır. Ücretsiz üyelik 30 deneme kredisiyle Studio'yu da denemeni sağlar.</p>
    <a class="cta" href="/uyelik">ÜYELİKLE AÇ →</a>
    <a class="ghost" href="/arsiv" style="margin-left:10px;">ARŞİVE GİT</a>
  </div>

  <div class="pn">
    <a href="/arsiv/${prev.slug}/">← ${esc(clip(prev.baslik, 40))}</a>
    <a href="/arsiv/${next.slug}/">${esc(clip(next.baslik, 40))} →</a>
  </div>
</main>`;

  const dir = path.join(ROOT, 'arsiv', s.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), shell(title, desc, canon, body, jsonld));
  written++;
});

/* ── katalog ── */
const katBody = `
<main class="wrap" style="padding-top: clamp(28px, 5vw, 56px);">
  <div class="mono kicker">GİZLİ ARŞİV · ${items.length} VAKA DOSYASI</div>
  <h1>Vaka Dosyası Kataloğu</h1>
  <p style="color:#a9adba;font-size:16px;max-width:66ch;">Yayınladığımız tarih vakalarının eksiksiz üretim dosyaları: senaryo, seslendirme, sahne &amp; görsel promptları ve yayın paketi. Her dosyanın tanıtımını incele; tamamı <a href="/uyelik">Gözlemci üyelikle</a> açılır.</p>
  <div class="grid" style="margin-top:26px;">
    ${items.map(s => `<a class="card" href="/arsiv/${s.slug}/">
      <span class="mono kicker">${esc(s.era)}</span>
      <h3>${esc(s.baslik)}</h3>
      <p>${esc(clip(s.ozet || s.teaser || '', 110))}</p>
    </a>`).join('\n    ')}
  </div>
</main>`;
fs.mkdirSync(path.join(ROOT, 'arsiv', 'katalog'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, 'arsiv', 'katalog', 'index.html'),
  shell('Vaka Dosyası Kataloğu · ' + items.length + ' Tarih Dosyası · Tarih Ajanı',
    items.length + ' tarih vakasının eksiksiz üretim dosyaları: senaryo, seslendirme, görsel promptları ve yayın paketi. Kataloğu incele.',
    '/arsiv/katalog/', katBody, '')
);

/* ── sitemap ── */
const smPath = path.join(ROOT, 'sitemap.xml');
let sm = fs.readFileSync(smPath, 'utf8');
const today = new Date().toISOString().slice(0, 10);
const urls = ['/arsiv/katalog/'].concat(items.map(s => '/arsiv/' + s.slug + '/'));
let added = 0;
const entries = urls.filter(u => sm.indexOf('<loc>' + SITE + u + '</loc>') === -1)
  .map(u => `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`);
if (entries.length) {
  sm = sm.replace('</urlset>', entries.join('\n') + '\n</urlset>');
  fs.writeFileSync(smPath, sm);
  added = entries.length;
}

console.log('✓ ' + written + ' tanıtım sayfası + katalog üretildi; sitemap +' + added + ' URL');
console.log(items.map(s => s.slug).join('\n'));

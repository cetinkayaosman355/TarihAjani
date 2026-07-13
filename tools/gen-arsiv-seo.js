#!/usr/bin/env node
// Arşiv SEO sayfaları üretici — arsiv-data.js'ten 44 tanıtım sayfası
// (arsiv/<slug>/index.html) + katalog (arsiv/katalog/index.html) üretir
// ve sitemap.xml'e eksik URL'leri ekler.
// "Vaka Günlüğü" blog makaleleri: okunur hikâye (anlatım metni) + özet;
// üretim jargonu YOK. Üretim dosyaları (promptlar vb.) /arsiv uygulamasında.
// Çalıştır: node tools/gen-arsiv-seo.js   (repo kökünde)
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://tarihajani.com';
const TODAY = new Date().toISOString().slice(0, 10);

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
// TÜMÜ BÜYÜK kelimeleri Başlık Düzeni'ne çevir (okunur başlıklar)
function dispTitle(s) {
  return String(s || '').split(/(\s+)/).map(w => {
    const letters = w.replace(/[^A-Za-zÇĞİıÖŞÜçğıöşü]/g, '');
    if (letters.length > 1 && w === w.toLocaleUpperCase('tr') && /[A-ZÇĞİÖŞÜ]/.test(w)) {
      const lc = w.toLocaleLowerCase('tr');
      return lc.replace(/[A-Za-zÇĞİıÖŞÜçğıöşü]/, c => c.toLocaleUpperCase('tr'));
    }
    return w;
  }).join('');
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
// Okunur hikâye gövdesi (anlatım metni → paragraf/bölüm). Üretim jargonu YOK.
function storyHtml(story) {
  const ses = (story.sections || []).find(x => /SESLENDİRME/i.test(x.ad));
  const blk = (ses && ses.bloklar) || [];
  if (!blk.length) return '';
  const multi = blk.length > 1;
  return blk.map(b => {
    const paras = String(b.t || '').split(/\n+/).map(p => p.trim()).filter(Boolean)
      .map(p => `<p>${esc(p)}</p>`).join('\n    ');
    // çok bölümlü (perde) hikâyelerde bölüm başlığı göster; tek blokta gösterme
    const kk = String(b.k || '').replace(/\s*\([^)]*\)\s*$/, '').trim();   // "(0:00–1:30)" gibi zaman damgasını at
    const head = (multi && kk && !/^SESLEND/i.test(kk)) ? `<h2>${esc(kk)}</h2>\n    ` : '';
    return '    ' + head + paras;
  }).join('\n');
}
// hikâye kaç dakikalık okuma (≈200 kelime/dk)
function readMin(story) {
  const ses = (story.sections || []).find(x => /SESLENDİRME/i.test(x.ad));
  const words = ((ses && ses.bloklar) || []).map(b => String(b.t || '').split(/\s+/).length).reduce((a, c) => a + c, 0);
  return Math.max(1, Math.round(words / 200));
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
  .lede { color: #d3d8e2; font-size: 18px; line-height: 1.75; max-width: 64ch; margin: 6px 0 26px; font-family: 'Playfair Display', serif; font-style: italic; }
  .story { max-width: 68ch; }
  .story p { font-size: 17px; line-height: 1.85; color: #d8dbe2; margin: 0 0 20px; }
  .story h2 { font-family: 'Playfair Display', serif; font-weight: 700; font-size: clamp(20px, 3vw, 27px); color: #f2ecd9; margin: 34px 0 12px; }
  .story p:first-of-type::first-letter { font-family: 'Playfair Display', serif; font-size: 3.4em; line-height: .8; float: left; margin: 6px 12px 0 0; color: #e6c478; }
  .endcta { border-color: rgba(193,154,82,.45); background: rgba(193,154,82,.06); text-align: center; margin-top: 34px; }
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
    <a href="/arsiv/katalog/">VAKA GÜNLÜĞÜ</a>
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
  const bt = dispTitle(s.baslik.replace(/\s+/g, ' '));
  const title = bt + ' · Vaka Günlüğü · Tarih Ajanı';
  const desc = clip(s.ozet || s.teaser || s.baslik, 158);
  const excerpt = voiceExcerpt(s);
  const secs = sectionList(s);
  const prev = items[(i - 1 + items.length) % items.length];
  const next = items[(i + 1) % items.length];
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org', '@graph': [
      {
        '@type': 'BlogPosting',
        headline: bt, description: desc, inLanguage: 'tr',
        mainEntityOfPage: SITE + canon, url: SITE + canon,
        image: SITE + '/assets/dossier-bundle.jpg',
        datePublished: TODAY, dateModified: TODAY,
        articleSection: 'Vaka Günlüğü', keywords: (s.era || '') + ', tarih, vaka dosyası, belgesel',
        author: { '@type': 'Organization', name: 'Tarih Ajanı', url: SITE },
        publisher: { '@type': 'Organization', name: 'Tarih Ajanı', url: SITE, logo: { '@type': 'ImageObject', url: SITE + '/assets/logo-mark.png' } },
        isAccessibleForFree: true
      },
      {
        '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: 'Vaka Günlüğü', item: SITE + '/arsiv/katalog/' },
          { '@type': 'ListItem', position: 3, name: bt, item: SITE + canon }
        ]
      }
    ]
  });

  const body = `
<main class="wrap" style="padding-top: clamp(28px, 5vw, 56px);">
  <nav class="mono" style="font-size:11px;color:#818797;margin-bottom:14px;"><a href="/" style="color:#818797;text-decoration:none;">Ana Sayfa</a> › <a href="/arsiv/katalog/" style="color:#c19a52;text-decoration:none;">Vaka Günlüğü</a></nav>
  <div class="mono kicker">VAKA GÜNLÜĞÜ · ${esc(s.era)} · ${readMin(s)} DK OKUMA</div>
  <h1>${esc(bt)}</h1>
  <p class="lede">${esc(s.ozet || s.teaser || '')}</p>

  <article class="story">
${storyHtml(s)}
  </article>

  <div class="box endcta">
    <p style="margin:0 0 16px;color:#cfc8b4;font-size:15px;">Bu tarihi kendi videon olarak üretmek ister misin? <strong style="color:#e6c478;">Studio</strong>; senaryo, seslendirme ve sahne promptlarını dakikalar içinde hazırlar.</p>
    <a class="cta" href="/studio">STUDIO'DA ÜRET →</a>
    <a class="ghost" href="/arsiv/katalog/" style="margin-left:10px;">DAHA FAZLA VAKA →</a>
  </div>

  <div class="pn">
    <a href="/arsiv/${prev.slug}/">← ${esc(dispTitle(clip(prev.baslik, 40)))}</a>
    <a href="/arsiv/${next.slug}/">${esc(dispTitle(clip(next.baslik, 40)))} →</a>
  </div>
</main>`;

  const dir = path.join(ROOT, 'arsiv', s.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), shell(title, desc, canon, body, jsonld));
  written++;
});

/* ── katalog ── */
const katJsonld = JSON.stringify({
  '@context': 'https://schema.org', '@type': 'Blog', name: 'Tarih Ajanı — Vaka Günlüğü',
  description: items.length + ' tarih vakası; çözülmemiş sırların hikâyeleri.', url: SITE + '/arsiv/katalog/', inLanguage: 'tr',
  publisher: { '@type': 'Organization', name: 'Tarih Ajanı', url: SITE },
  blogPost: items.map(s => ({ '@type': 'BlogPosting', headline: dispTitle(s.baslik), url: SITE + '/arsiv/' + s.slug + '/', datePublished: TODAY }))
});
const katBody = `
<main class="wrap" style="padding-top: clamp(28px, 5vw, 56px);">
  <nav class="mono" style="font-size:11px;color:#818797;margin-bottom:14px;"><a href="/" style="color:#818797;text-decoration:none;">Ana Sayfa</a> › <span style="color:#c19a52;">Vaka Günlüğü</span></nav>
  <div class="mono kicker">VAKA GÜNLÜĞÜ · BLOG · ${items.length} HİKÂYE</div>
  <h1>Vaka Günlüğü</h1>
  <p style="color:#a9adba;font-size:16px;max-width:66ch;">Asur'dan Roma'ya, Mısır'dan Bizans'a — çözülmemiş tarih sırlarının hikâyeleri. Ücretsiz oku, keşfet; dilersen <a href="/studio">Studio</a>'da kendi videona dönüştür. Bir dijital hikâye arşivi.</p>
  <div class="grid" style="margin-top:26px;">
    ${items.map(s => `<a class="card" href="/arsiv/${s.slug}/">
      <span class="mono kicker">${esc(s.era)}</span>
      <h3>${esc(dispTitle(s.baslik))}</h3>
      <p>${esc(clip(s.ozet || s.teaser || '', 110))}</p>
    </a>`).join('\n    ')}
  </div>
</main>`;
fs.mkdirSync(path.join(ROOT, 'arsiv', 'katalog'), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, 'arsiv', 'katalog', 'index.html'),
  shell('Vaka Günlüğü · Tarih Blog · ' + items.length + ' Hikâye · Tarih Ajanı',
    items.length + ' tarih vakası; çözülmemiş sırların hikâyeleri. Oku, keşfet; istersen Studio\'da videoya dönüştür.',
    '/arsiv/katalog/', katBody, katJsonld)
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

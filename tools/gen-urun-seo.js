#!/usr/bin/env node
// Ürün SEO satış sayfaları üretici — Satis.dc.html'deki catalog()'tan
// her ürüne ayrı statik /urun/<slug> sayfası + Product JSON-LD + sitemap.
// Kart/modal yerine indekslenebilir gerçek URL (analiz raporu 2.5).
// Çalıştır: node tools/gen-urun-seo.js
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SITE = 'https://tarihajani.com';

/* ── catalog()'u Satis.dc.html'den çek ── */
const satis = fs.readFileSync(path.join(ROOT, 'Satis.dc.html'), 'utf8');
const ci = satis.indexOf('catalog() {');
const ri = satis.indexOf('return {', ci);
let depth = 0, j = ri + 7, end = -1;
for (; j < satis.length; j++) {
  if (satis[j] === '{') depth++;
  else if (satis[j] === '}') { depth--; if (depth === 0) { end = j; break; } }
}
// eslint-disable-next-line no-eval
const CAT = eval('(' + satis.slice(ri + 7, end + 1) + ')');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function clip(s, n) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length <= n ? t : t.slice(0, n).replace(/[\s,.;:]+\S*$/, '') + '…';
}

function shell(title, desc, canonPath, jsonld, bodyHtml) {
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
<meta property="og:type" content="product">
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
<script type="application/ld+json">${jsonld}</script>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #03050b; -webkit-text-size-adjust: 100%; }
  body { font-family: 'Hanken Grotesk', system-ui, sans-serif; color: #e9dfc8; line-height: 1.7; }
  a { color: #e6c478; }
  .mono { font-family: 'Special Elite', monospace; letter-spacing: .14em; }
  header.site { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px clamp(18px, 4vw, 48px); background: rgba(3,5,11,.92); backdrop-filter: blur(8px); border-bottom: 1px solid rgba(193,154,82,.18); }
  header.site nav { display: flex; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
  header.site nav a { color: #d6d0c2; font-weight: 600; font-size: 12px; letter-spacing: .08em; text-decoration: none; padding: 9px 12px; }
  header.site nav a.cta { color: #e6c478; border: 1px solid rgba(193,154,82,.55); }
  .wrap { width: min(1140px, 100%); margin: 0 auto; padding: clamp(24px, 4vw, 48px) clamp(18px, 4vw, 40px) 40px; }
  .kicker { color: #c19a52; font-size: 10.5px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: clamp(24px, 4vw, 52px); align-items: start; }
  @media (max-width: 820px) { .grid { grid-template-columns: 1fr; } }
  .imgbox { position: relative; border: 1px solid rgba(193,154,82,.3); overflow: hidden; background: #070a12; aspect-ratio: 4/5; }
  .imgbox img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .imgbox .tag { position: absolute; top: 14px; left: 14px; font-size: 9.5px; letter-spacing: .16em; color: #e6c478; background: rgba(3,5,11,.82); border: 1px solid rgba(193,154,82,.4); padding: 6px 11px; }
  h1 { font-family: 'Playfair Display', serif; font-weight: 800; font-size: clamp(26px, 3.6vw, 40px); color: #f2ecd9; line-height: 1.15; margin: 8px 0 12px; }
  .price { font-family: 'Playfair Display', serif; font-size: 34px; font-weight: 800; color: #e6c478; }
  .buy { display: inline-flex; align-items: center; gap: 10px; margin-top: 4px; background: linear-gradient(110deg, #a77d35, #d8b26a 50%, #c19a52); color: #171207; font-family: 'Special Elite', monospace; font-weight: 800; font-size: 13px; letter-spacing: .1em; padding: 16px 30px; text-decoration: none; }
  ul.feat { list-style: none; padding: 0; margin: 20px 0; display: grid; gap: 10px; }
  ul.feat li { display: flex; gap: 10px; color: #cfd3de; font-size: 14.5px; }
  ul.feat li:before { content: "◆"; color: #c19a52; font-size: 11px; margin-top: 4px; }
  .badges { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
  .badges div { border: 1px solid rgba(129,135,151,.2); padding: 12px; text-align: center; }
  .badges .b { font-family: 'Special Elite', monospace; font-size: 12px; color: #c19a52; }
  .badges .s { font-size: 10.5px; color: #7c8393; margin-top: 4px; }
  .trust { border: 1px solid rgba(193,154,82,.25); background: #070a12; padding: 16px 18px; margin-top: 20px; font-size: 12.5px; color: #a9adba; line-height: 1.6; }
  .related { margin-top: 48px; }
  .rgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; margin-top: 14px; }
  .rcard { border: 1px solid rgba(129,135,151,.22); background: #070a12; padding: 16px; text-decoration: none; color: inherit; display: block; }
  .rcard:hover { border-color: rgba(193,154,82,.5); }
  .rcard h3 { font-family: 'Playfair Display', serif; font-size: 15px; margin: 6px 0 4px; color: #e9dfc8; }
  .rcard .p { color: #e6c478; font-size: 13px; }
  footer.site { margin-top: 44px; padding: 24px clamp(18px, 4vw, 40px); border-top: 1px solid rgba(193,154,82,.15); text-align: center; color: #676d7c; font-size: 12px; }
  footer.site a { color: #8f8a7d; }
</style>
</head>
<body>
<header class="site">
  <a href="/" style="display:flex;align-items:center;gap:10px;text-decoration:none;"><img src="/assets/logo.webp" alt="Tarih Ajanı" style="height:30px;width:auto;"></a>
  <nav>
    <a href="/urunler">ÜRÜNLER</a>
    <a href="/uyelik">ÜYELİK</a>
    <a href="/studio">STUDIO</a>
    <a href="/uyelik" class="cta">AJAN GİRİŞİ</a>
  </nav>
</header>
${bodyHtml}
<footer class="site">
  <a href="/gizlilik/">Gizlilik &amp; KVKK</a> · <a href="/mesafeli-satis/">Mesafeli Satış</a> · <a href="/iade/">İade &amp; Cayma</a><br>
  © 2026 Tarih Ajanı · <a href="/">tarihajani.com</a>
</footer>
<script src="/analytics.js" defer></script>
</body>
</html>
`;
}

const slugs = Object.keys(CAT).filter((s) => !/^uyelik-/.test(s));
const CATLABEL = { 'EĞİTİM': 'Eğitim', 'E-KİTAP': 'E-Kitap', 'REHBER': 'Rehber', 'ARŞİV': 'Hazır Arşiv', 'FİZİKİ': 'Fiziki Ürün', 'STUDIO KREDİ': 'Studio Kredisi' };

let written = 0;
const smUrls = [];
slugs.forEach((slug, idx) => {
  const p = CAT[slug];
  const canon = '/urun/' + slug + '/';
  const title = p.title + ' · ' + (CATLABEL[p.cat] || 'Ürün') + ' · Tarih Ajanı';
  const desc = clip(p.detail || p.title, 155);
  const priceNum = parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0;
  // ilgili ürünler (aynı değil, 3 tane)
  const related = slugs.filter((s) => s !== slug).slice(idx % 2, (idx % 2) + 3).concat(slugs.filter((s) => s !== slug)).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Product',
    name: p.title, description: desc, image: SITE + '/' + p.img,
    category: CATLABEL[p.cat] || p.cat,
    brand: { '@type': 'Brand', name: 'Tarih Ajanı' },
    offers: {
      '@type': 'Offer', url: SITE + canon, priceCurrency: 'TRY', price: priceNum,
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Tarih Ajanı' }
    }
  });

  const body = `
<main class="wrap">
  <div class="mono kicker" style="margin-bottom:16px;"><a href="/" style="color:#676d7c;text-decoration:none;">Ana Sayfa</a> · <a href="/urunler" style="color:#676d7c;text-decoration:none;">Ürünler</a> · <span style="color:#c19a52;">${esc(p.cat)}</span></div>
  <div class="grid">
    <div>
      <div class="imgbox"><img src="/${esc(p.img)}" alt="${esc(p.title)}"><span class="tag mono">${esc(p.cat)}</span></div>
      <div class="badges">
        ${(p.badges || []).map((b) => `<div><div class="b">${esc(b[0])}</div><div class="s">${esc(b[1])}</div></div>`).join('\n        ')}
      </div>
    </div>
    <div>
      <div class="mono kicker">${esc(p.kicker || '')}</div>
      <h1>${esc(p.title)}</h1>
      <p style="color:#a9adba;font-size:15.5px;max-width:56ch;">${esc(p.detail || '')}</p>
      <ul class="feat">
        ${(p.features || []).map((f) => `<li>${esc(f)}</li>`).join('\n        ')}
      </ul>
      <div class="price">${esc(p.price)} TL <span style="font-size:13px;color:#818797;font-family:'Special Elite',monospace;">· ${esc(p.priceKind || '')}</span></div>
      <p style="margin:16px 0 8px;"><a class="buy" href="/satis#${slug}">SATIN AL →</a></p>
      <div class="trust">
        🔒 Güvenli ödeme · Kredi kartı (Shopier) veya havale/EFT. Dijital ürünlerde erişim onay sonrası açılır.<br>
        Sorularınız için <a href="/urunler">Ürünler</a> sayfasındaki Ajan Asistan'a yazabilir veya <a href="mailto:iletisim@tarihajani.com">iletisim@tarihajani.com</a> ile ulaşabilirsiniz.
      </div>
    </div>
  </div>

  <div class="related">
    <div class="mono kicker">BUNLAR DA İLGİNİ ÇEKEBİLİR</div>
    <div class="rgrid">
      ${related.map((s) => { const r = CAT[s]; return `<a class="rcard" href="/urun/${s}/"><span class="mono kicker">${esc(r.cat)}</span><h3>${esc(r.title)}</h3><span class="p">${esc(r.price)} TL</span></a>`; }).join('\n      ')}
    </div>
  </div>
</main>`;

  const dir = path.join(ROOT, 'urun', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), shell(title, desc, canon, jsonld, body));
  smUrls.push(canon);
  written++;
});

/* sitemap */
const smPath = path.join(ROOT, 'sitemap.xml');
let sm = fs.readFileSync(smPath, 'utf8');
const today = new Date().toISOString().slice(0, 10);
let added = 0;
smUrls.forEach((u) => {
  if (sm.indexOf('<loc>' + SITE + u + '</loc>') === -1) {
    sm = sm.replace('</urlset>', `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>`);
    added++;
  }
});
if (added) fs.writeFileSync(smPath, sm);
console.log('✓ ' + written + ' ürün satış sayfası; sitemap +' + added);
console.log(smUrls.join('\n'));

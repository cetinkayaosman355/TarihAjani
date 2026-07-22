// ============================================================================
// FAZ D — SOHBETLE ÜRETİM: kullanıcı ajanla KONUŞARAK üretim yaptırır.
// "3. sahnenin görselini üret", "seslendir", "videosunu çıkar", "bu konuyu üret".
// Ajan niyeti anlar, yanıtına gizli [[DO:...]] direktifi ekler; sistem yürütür.
// Kredi/ücret onayı ilgili metotların (startGenerate/makeImage/makeTts) içinde.
// Çalıştır: node --test supabase/functions/studio-generate/sohbet_uretim.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("Sohbet promptu ÜRETİM KOMUTLARI + [[DO:...]] direktif sözlüğü içerir", () => {
  assert.ok(src.includes("SEN AYNI ZAMANDA BİR ÜRETİM AJANISIN"), "üretim ajanı personası");
  for (const d of ["[[DO:uret]]", "[[DO:konu:", "[[DO:gorseller]]", "[[DO:gorsel:N]]", "[[DO:seslendir]]", "[[DO:video:N]]"]) {
    assert.ok(src.includes(d), "direktif tanımı: " + d);
  }
  assert.ok(src.includes("belirsizse direktif EKLEME, tek net soru sor"), "eksik bilgide soru sorma kuralı");
});

test("sendChat: [[DO:...]] direktifini ayrıştırır, gizler ve yürütür", () => {
  assert.ok(src.includes("const act = raw.match(/\\[\\[DO:\\s*([a-zçğıöşü]+)\\s*(?::\\s*([^\\]]*))?\\]\\]/i)"), "DO direktif regex (boşluk toleranslı)");
  assert.ok(src.includes(".replace(/\\[\\[DO:[^\\]]*\\]\\]/g, '')"), "direktif kullanıcıdan gizlenir");
  assert.ok(src.includes("if (act) this._chatAction(act[1].toLocaleLowerCase('tr'), (act[2] || '').trim())"), "aksiyon dispatch");
});

test("_chatAction: her direktif doğru metoda bağlanır + ön koşul korumaları", () => {
  assert.ok(src.includes("_chatAction(kind, arg)"), "dispatcher");
  assert.ok(src.includes("if (kind === 'uret')") && src.includes("this.startGenerate()"), "uret → startGenerate");
  assert.ok(src.includes("if (kind === 'gorseller' || (kind === 'gorsel' && !sceneNo()))") && src.includes("this.genAllScenes()"), "gorseller/belirsiz sahne → genAllScenes");
  assert.ok(src.includes("this.makeImage(gp.prompt, n - 1, 'gp' + (n - 1))"), "gorsel:N → makeImage");
  assert.ok(src.includes("if (kind === 'seslendir')") && src.includes("this.makeTts()"), "seslendir → makeTts");
  assert.ok(src.includes("this.openVideoModal({ kind: 'scene', key, url: img.url })"), "video:N → openVideoModal");
  // ön koşullar
  assert.ok(src.includes("if (!this.looksLikeTopic(s.idea || ''))"), "uret: geçerli konu koşulu");
  assert.ok(src.includes("Video, sahnenin GÖRSELİNDEN üretilir"), "video: görsel ön koşulu");
  assert.ok(src.includes("Seslendirilecek metin yok"), "seslendir: metin ön koşulu");
});

test("_studioCtx: ajana canlı durum (sahne sayısı, üretilen görsel, seslendirme, ayarlar)", () => {
  assert.ok(src.includes("_studioCtx()"), "durum özeti helper'ı");
  assert.ok(src.includes("Sahne sayısı=' + nGor + ' · üretilen görsel=' + imgDone"), "sahne + görsel sayısı");
  assert.ok(src.includes("seslendirme=' + (hasSes ? 'hazır' : 'yok')"), "seslendirme durumu");
  assert.ok(src.includes("const ctx = this._studioCtx();"), "sendChat durum özetini kullanır");
});

test("Sohbetten BELGESEL montajı: [[DO:belgesel]] → startDocVideo (≥2 görsel şartı)", () => {
  assert.ok(src.includes("[[DO:belgesel]]"), "belgesel direktif tanımı");
  assert.ok(src.includes("if (kind === 'belgesel')") && src.includes("this.startDocVideo()"), "belgesel → startDocVideo");
  assert.ok(src.includes("if (!this._docReady())") && src.includes("en az 2 üretilmiş sahne görseli gerekli"), "hazırlık ön koşulu sohbette söylenir");
});

test("Sohbetten DÜZENLEME: [[DO:duzenle:HEDEF:istek]] → editTarget + onaylı uygulama", () => {
  assert.ok(src.includes("[[DO:duzenle:HEDEF:kullanıcının isteği]]"), "duzenle direktif tanımı");
  assert.ok(src.includes("if (kind === 'duzenle')"), "duzenle aksiyonu");
  assert.ok(src.includes("this.startEdit(t.type, t.i, t.label)"), "düzenleme hedefi kurulur");
  assert.ok(src.includes("async _chatEditRun(instr)"), "istekli düzenlemede yeni metin hemen üretilir");
  assert.ok(src.includes("kullanıcı şeritteki SON YANITI UYGULA ile onaylar — onaysız hiçbir şey değişmez"), "onaysız uygulanmaz");
  // hedef çözümleme: ses / bölüm N / youtube / instagram
  assert.ok(src.includes("if (/^ses/.test(tspec))"), "ses hedefi");
  assert.ok(src.includes("Bölüm ' + (i + 1) + ' yok"), "geçersiz bölüm no yakalanır");
});

test("Karakter LAKAP eşleşmesi: takma_adlar şemada + _charsOfScene tarar", () => {
  assert.ok(src.includes('"takma_adlar": ["bu kişinin metinde geçebilecek DİĞER ad/lakap/unvanları'), "şemada takma_adlar");
  assert.ok(src.includes("(Array.isArray(c.takma_adlar) ? c.takma_adlar.join(' ') : '')"), "_charsOfScene lakapları tarar");
});

test("expandActs: diğer bölümlerin özetleri SINIR olarak verilir (tekrar yasağı)", () => {
  assert.ok(src.includes("const digerOzet = (si) => secs"), "diğer özetler hesaplanır");
  assert.ok(src.includes("DİĞER BÖLÜMLERİN ÖZETLERİ (SINIR ÇİZGİSİ"), "sınır kuralı promptta");
  assert.ok(src.includes("olaylarını/kanıtlarını TEKRAR ANLATMA"), "tekrar yasağı açık");
  assert.ok(src.includes("this.runPool(secs, (secItem, si) =>"), "worker bölüm indeksini alır");
});

test("_studioCtx: belgesel montaj hazırlığı ajana bildirilir", () => {
  assert.ok(src.includes("belgesel montajı=' + (this._docReady() ? 'hazır (montajlanabilir)'"), "belgesel durumu");
});

test("Boş sohbet çipleri dosya varken üretim komutlarına döner", () => {
  assert.ok(src.includes("quickChips: (s.result"), "çipler duruma göre");
  assert.ok(src.includes("🎨 Tüm sahne görsellerini üret"), "görsel üret çipi");
  assert.ok(src.includes("🎙 Seslendirmeyi üret"), "seslendir çipi");
});

test("Konsept seç + sen öner: sohbet çipleri fikir ekranındaki akışı taşır", () => {
  assert.ok(src.includes("GİZEM konsepti seçtim — sen öner"), "gizem konsept çipi");
  assert.ok(src.includes("KİŞİ konsepti seçtim — sen öner"), "kişi konsept çipi");
  assert.ok(src.includes("OLAY/DÖNEM konsepti seçtim — sen öner"), "olay/dönem konsept çipi");
  assert.ok(src.includes("KONSEPT → ÖNERİ AKIŞI"), "ajan konseptte 3 vaka önerir");
  assert.ok(src.includes("[[DO:konu:seçilen konu]] ile konu kutusuna yaz"), "beğenilen öneri konuya yazılır");
});

test("Aydınlık tema: sohbet paneli okunur (koyu balon → sıcak kâğıt)", () => {
  assert.ok(src.includes('html[data-theme="light"] .ta-cbub-a'), "ajan balonu light kuralı");
  assert.ok(src.includes('html[data-theme="light"] .ta-cbub-u'), "kullanıcı balonu light kuralı");
  assert.ok(src.includes('html[data-theme="light"] .ta-chatpanel'), "panel zemini light kuralı");
  assert.ok(src.includes('html[data-theme="light"] .ta-chatin input'), "giriş kutusu light kuralı");
  assert.ok(src.includes("bubbleClass: m.role === 'user' ? 'ta-cbub-u' : 'ta-cbub-a'"), "balonlar sınıf taşır");
});

test("Ana ekran sohbeti: 'Ajanla bulalım' geniş sohbete açılır, yan panel basit kalır", () => {
  assert.ok(src.includes("isSohbet: s.mode === 'sohbet'"), "sohbet modu");
  assert.ok(src.includes('sc-if value="{{ isSohbet }}"'), "ana ekran sohbet görünümü");
  assert.ok(src.includes('id="ta-mainchatlog"'), "ana sohbet günlüğü");
  assert.ok(src.includes("mode: 'sohbet',\n      chatOpen: false"), "findTopic ana sohbete açar (panel değil)");
  assert.ok(src.includes("const stay = this.state.mode === 'sohbet'"), "sohbetteyse aksiyonda SOHBETTE KALIR (YouMind akışı)");
  assert.ok(src.includes("← STÜDYOYA DÖN"), "geri dönüş düğmesi");
  assert.ok(src.includes(".ta-mchip") && src.includes('html[data-theme="light"] .ta-mchip'), "çipler iki temada da stilli");
});

test("YouMind tarzı ÜRETİM TAHTASI: sohbetin yanında canlı üretim durumu", () => {
  assert.ok(src.includes("ÜRETİM TAHTASI · CANLI"), "tahta başlığı");
  assert.ok(src.includes("sbHasFile") && src.includes("sbImgs") && src.includes("sbProg"), "tahta VM alanları");
  assert.ok(src.includes('sc-if value="{{ sbHasDoc }}"') && src.includes('sc-if value="{{ sbHasAudio }}"'), "video + ses tahtada");
  assert.ok(src.includes("s.generating ? ((s.genMsg || 'ÜRETİLİYOR…')"), "dosya üretimi ilerlemesi tahtada");
});

test("Fikir ekranı: DİREKT KONUŞMA kutusu + TARZ çipleri (SEN ÖNER tarza uyar)", () => {
  assert.ok(src.includes('class="ta-ideachat"'), "direkt konuşma kutusu");
  assert.ok(src.includes("_ideaChatGo()"), "yaz → sohbet başlar");
  assert.ok(src.includes("chatInput: t }, () => this.sendChat())"), "ilk mesaj olarak gönderilir");
  assert.ok(src.includes("ideaFormatChips"), "tarz çipleri");
  assert.ok(src.includes("if (fmt !== 'belgesel') return this._suggestForFormat(fmt)"), "tarz seçiliyse öneri o tarzda");
  assert.ok(src.includes("_suggestForFormat(f)"), "tarza özel öneri üretici");
  assert.ok(src.includes("👁 Kendi gözünden"), "POV çipi");
});

test("Montaj Masası ayrı sayfa: düzenle + ses seviyeleri + render", () => {
  assert.ok(src.includes("isMontaj: s.mode === 'montaj'") && src.includes('sc-if value="{{ isMontaj }}"'), "ayrı montaj sayfası");
  assert.ok(src.includes("Montaj Masası"), "sayfa başlığı");
  assert.ok(src.includes("_docEditSave(gi)") && src.includes("ALTYAZI / ANLATIM"), "sahne altyazı/anlatım düzenleme");
  assert.ok(src.includes("onVoiceVol") && src.includes("onMusicVol"), "ses seviyesi kaydırıcıları");
  assert.ok(src.includes("const vGain = ctx.createGain()") && src.includes("s.connect(vGain)"), "seslendirme gain'i render'a işlenir");
  assert.ok(src.includes("if (withMusic && mGain.gain.value > 0) this._musicBed(ctx, mGain"), "müzik gain'den geçer");
  assert.ok(src.includes("voiceVol: (this.state.docVoiceVol == null ? 100 : this.state.docVoiceVol) / 100"), "seviye render opts'a gider");
});

test("Sol menü ÜRET: Video / Ses / Montaj aktif çalışma alanlarına gider", () => {
  assert.ok(src.includes('onClick="{{ modeVideo }}"') && src.includes('onClick="{{ modeSes }}"') && src.includes('onClick="{{ modeMontaj }}"'), "üç öğe tıklanır");
  assert.ok(src.includes("? this.setState({ mode: 'montaj' }"), "montaj kendi sayfasını açar");
  assert.ok(src.includes("sideMontajActive"), "montaj aktif-durum vurgusu");
});

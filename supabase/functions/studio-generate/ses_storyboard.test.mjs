// ============================================================================
// SES ÖNCELİĞİ + SES DEĞİŞTİR/TEKRAR ÜRET + AJANLA KARŞILIKLI DÜZENLEME +
// BAŞTAN REFERANS GÖRSEL + STORYBOARD MODU
// Çalıştır: node --test supabase/functions/studio-generate/ses_storyboard.test.mjs
// ============================================================================
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..", "..");
const src = readFileSync(join(REPO, "Studio.dc.html"), "utf8");

test("Seslendirme EN ÖNEMLİ seçim: İnce Ayar dışında her zaman görünür", () => {
  assert.ok(src.includes("optionGroups: groups.filter(g => !g.isVoice)"), "ses İnce Ayar grubundan çıkarıldı");
  assert.ok(src.includes("voiceCats:"), "ayrı ses paneli verisi");
  assert.ok(src.includes('list="{{ voiceCats }}"'), "Adım 2'de bağımsız ses paneli");
});

test("Adım 4: ses DEĞİŞTİRİLEBİLİR → farklı sesle tekrar üret + ücretsiz önizleme", () => {
  assert.ok(src.includes("sesSwitchOpts:"), "ses seçim çipleri");
  assert.ok(src.includes("sesSwitchPreview:"), "seçili sesi dinle");
  assert.ok(src.includes('list="{{ sesSwitchOpts }}"'), "Seslendirme sekmesinde ses çipleri");
  // seçim voice durumuna yazar → makeTts yeni sesle üretir (mevcut buton)
  assert.ok(src.includes("pick: () => this.setState({ voice: o.id }, () => this.persist())"), "seçim kalıcı");
});

test("Karşılıklı düzenleme: seslendirme metni AJANLA chat'te düzenlenir + geri uygulanır", () => {
  assert.ok(src.includes("editVoiceStart:") && src.includes("startEdit('ses', 0"), "AJANLA DÜZENLE girişi");
  assert.ok(src.includes("if (t.type === 'ses') return this.voiceText()"), "chat mevcut metni okur");
  assert.ok(src.includes("else if (t.type === 'ses' && r.senaryo)"), "düzenleme sonuca geri yazılır");
  assert.ok(src.includes("parts.length === secs.length"), "bölüm yapısı eşleşince korunur");
});

test("Adım 1: baştan referans görsel yükleme (karakter tutarlılığı)", () => {
  assert.ok(src.includes("📷 Referans görsel ekle"), "yükleme girişi ilk ekranda");
  assert.ok(src.includes("clearCharRef:"), "referans kaldırılabilir");
  assert.ok(src.includes("Tüm sahnelerde karakter referansı olarak kullanılacak"), "ne işe yaradığı açık");
});

test("Storyboard modu: ucuz taslak kareler; sağlayıcı kararı MERKEZİ çözümleyiciden", () => {
  assert.ok(src.includes("toggleSbMode:") && src.includes("sbBtnLabel:"), "aç/kapa düğmesi");
  assert.ok(src.includes("const sbOn = !!this.state.sbMode && /^gp\\d+$/.test(sceneKey || '')"), "yalnız sahne karelerinde");
  assert.ok(src.includes("provider: sbOn ? 'gpt1' :"), "ucuz motor merkezi çözümleyici ÜZERİNDEN");
  assert.ok(src.includes("const prov = gen.resolvedProvider"), "mimari kural korunur (bypass yok)");
  assert.ok(src.includes("Rough storyboard sketch panel"), "taslak çizim üslubu prompta");
  assert.ok(src.includes("Storyboard modu açık"), "kullanıcıya açık bilgi");
});

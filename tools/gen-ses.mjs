#!/usr/bin/env node
/**
 * Tarih Ajanı — /ornek deneme sayfası için Türkçe seslendirme üretici
 * =====================================================================
 * ElevenLabs ile 6 vaka anlatımını üretir ve assets/ses/<id>.mp3 olarak
 * kaydeder. Site (ornek.html) bu dosyaları otomatik çalar.
 *
 * KULLANIM (kendi makinende — Node 18+):
 *   1) Anahtarını ortam değişkenine koy (script'e GÖMME):
 *        export ELEVEN_API_KEY="esk_..."      # ElevenLabs API anahtarın
 *   2) Sesleri listele, beğendiğin erkek anlatıcının voice_id'sini al:
 *        node tools/gen-ses.mjs --list
 *   3) O voice_id ile üret:
 *        VOICE_ID="<voice_id>" node tools/gen-ses.mjs
 *      (VOICE_ID vermezsen aşağıdaki DEFAULT_VOICE_ID kullanılır.)
 *   4) Oluşan assets/ses/*.mp3 dosyalarını commit'le → yayınla.
 *
 * Not: eleven_multilingual_v2 modeli Türkçeyi doğru telaffuz eder.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const API_KEY = process.env.ELEVEN_API_KEY || process.env.XI_API_KEY || '';
// İyi, derin bir çok-dilli erkek ses (istersen --list ile kendi sesini seç):
const DEFAULT_VOICE_ID = 'onwK4e9ZLuTAKqWW03F9'; // "Daniel" — derin, otoriter
const VOICE_ID = process.env.VOICE_ID || DEFAULT_VOICE_ID;
const MODEL_ID = process.env.MODEL_ID || 'eleven_multilingual_v2';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'assets', 'ses');

// ornek.html içindeki DOSSIERS[].ses ile birebir aynı metinler:
const SCRIPTS = [
  { id: 'fetih', text: 'Yıl, 1453. Elli üç gündür surların dibinde bekleyen ordunun sabrı tükenmek üzere. Şafak sökerken devasa topun gürleyişiyle Topkapı surlarında ilk gedik açılır. İçeride bin yıllık bir imparatorluk, dışarıda yirmi bir yaşında bir sultan. O sabah bir şehir değil, koca bir çağ el değiştirir.' },
  { id: 'vezuv', text: 'MS 79, sıradan bir sonbahar öğleni. Pompeii’nin çarşısı her günkü gibi kalabalık. Derken Vezüv uyanır; gökyüzünü otuz kilometrelik bir kül sütunu yarar ve öğle vakti geceye döner. Kaçmaya çalışanların üstüne kül yağar. Şehir, tam da o an, on yedi yüzyıl boyunca zamanın içinde donup kalır.' },
  { id: 'sezar', text: 'Mart’ın on beşi, MÖ 44. Roma’nın en güçlü adamı, kâhinin uyarısına aldırmadan senatoya girer. Önce togasını kavrayan bir el, ardından parlayan ilk hançer. Yirmi üç darbe iner. En güvendiği dostunu karşısında görünce fısıldar: Sen de mi? O mermer zeminde yalnızca Sezar değil, bir cumhuriyet can verir.' },
  { id: 'termopil', text: 'MÖ 480, Termopylai’nin dar geçidi. Bir yanda tarihin gördüğü en büyük ordu, diğer yanda yalnızca üç yüz Spartalı. Persler haber yollar: Silahlarınızı bırakın. Kral Leonidas gülümser ve yanıtı efsane olur: Gelin, alın. Üç gün boyunca imkânsızı savunurlar; hepsi ölür ama bıraktıkları söz tarihe kazınır.' },
  { id: 'bagdat', text: '1258. Dünyanın bilgi başkenti Bağdat, Moğol ordusunun önünde diz çöker. Şehir yanarken Bilgelik Evi’nin binlerce el yazması Dicle’ye atılır. Anlatılır ki nehir günlerce mürekkepten simsiyah, kandan kızıl akar. Bir gecede yalnızca bir şehir değil, yüzyılların biriktirdiği akıl sulara karışır.' },
  { id: 'otzi', text: 'Alp Dağları, beş bin üç yüz yıl önce. Bir adam karların arasında sırtından okla vurulur ve buzun içinde kaybolur. 1991’de eriyen bir buzulda yeniden ortaya çıkar; midesindeki son yemek, damarındaki kan hâlâ oradadır. Tarihin en eski cinayet dosyası, elli üç yüzyıl sonra yeniden açılır.' }
];

function die(msg) { console.error('HATA: ' + msg); process.exit(1); }

if (!API_KEY) die('ELEVEN_API_KEY ortam değişkeni yok. Örn: export ELEVEN_API_KEY="esk_..."');

async function listVoices() {
  const r = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': API_KEY } });
  if (!r.ok) die('Sesler alınamadı (HTTP ' + r.status + '). Anahtarı kontrol et.');
  const d = await r.json();
  console.log('\nMevcut sesler (voice_id · isim · cinsiyet):\n');
  for (const v of d.voices || []) {
    const g = (v.labels && v.labels.gender) || '';
    console.log('  ' + v.voice_id + '  ·  ' + v.name + (g ? '  · ' + g : ''));
  }
  console.log('\nBeğendiğin erkek sesin voice_id\'sini kopyala ve şöyle çalıştır:\n  VOICE_ID="<voice_id>" node tools/gen-ses.mjs\n');
}

async function tts(text) {
  const url = 'https://api.elevenlabs.io/v1/text-to-speech/' + VOICE_ID + '?output_format=mp3_44100_128';
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true }
    })
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error('HTTP ' + r.status + ' ' + t.slice(0, 200));
  }
  return Buffer.from(await r.arrayBuffer());
}

async function main() {
  if (process.argv.includes('--list')) { await listVoices(); return; }
  await mkdir(OUT_DIR, { recursive: true });
  console.log('Ses: ' + VOICE_ID + ' · Model: ' + MODEL_ID + '\n');
  for (const s of SCRIPTS) {
    process.stdout.write('  ' + s.id + '.mp3 … ');
    try {
      const buf = await tts(s.text);
      await writeFile(join(OUT_DIR, s.id + '.mp3'), buf);
      console.log('tamam (' + Math.round(buf.length / 1024) + ' KB)');
    } catch (e) {
      console.log('BAŞARISIZ — ' + e.message);
    }
  }
  console.log('\nBitti. assets/ses/*.mp3 dosyalarını commit\'leyip yayınla.');
}

main().catch(e => die(e.message));

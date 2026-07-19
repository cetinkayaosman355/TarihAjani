# Tarih Ajanı Studio Stabilizasyonu

> Bu dosya bir **kontrol belgesidir**. Üretim kodu, tasarım, prompt, fiyat veya
> yeni özellik İÇERMEZ. Amaç: canlı sistemi envanterlemek, kredi güvenliğini
> kanıtlamak ve test edilmemiş hiçbir değişikliğin `main`'e girmemesini sağlamak.
>
> **Durum kodları:** ✅ doğrulandı · ⛔ eksik/başarısız · ⬜ HENÜZ DOĞRULANMADI (canlı
> erişim gerekiyor). Bu belge açılırken tüm canlı maddeler ⬜'dir; kanıt (canlı test
> + log/ekran görüntüsü) eklendikçe işaretlenir.

---

## Çalışma kuralları

- Yeni özellik eklenmeyecek.
- Aynı dosya iki farklı AI tarafından eşzamanlı değiştirilmeyecek.
- Netlify deploy, Supabase Edge Function deploy ve SQL migration birbirinden ayrı takip edilecek.
- "Kod yazıldı" tamamlandı sayılmayacak; canlı test ve log kanıtı gerekecek.
- Test edilmemiş değişiklik `main`'e merge edilmeyecek.

### Süreç kuralları (bu stabilizasyon dalı için)
- `main`'e doğrudan commit/push YOK. Force push YOK. Otomatik merge YOK.
- STORIA PR #245 DONDURULMUŞ — merge edilmeyecek, dokunulmayacak.
- Bu dalda yalnızca bu belge (`STABILIZATION.md`) değişir.

---

## Faz 1 — Canlı kurulum envanteri

> Not: Bu ortam canlı Supabase/Netlify'a erişemiyor; aşağıdaki canlı maddeler
> **kullanıcı tarafından doğrulanacaktır**. Her maddenin yanında "nasıl doğrulanır"
> yazılıdır. "Repo'da" sütunu, kaynakta ilgili tanımın bulunup bulunmadığını gösterir
> (deploy edilmişse canlıda da olması beklenir).

| # | Kontrol | Repo'da | Canlı durum | Nasıl doğrulanır |
|---|---|---|---|---|
| 1 | `studio-generate` canlı sürümü GitHub `main` ile aynı mı? | — | ⬜ | Supabase → Edge Functions → studio-generate → son deploy zamanı & sürümü `main` son commit'iyle kıyasla |
| 2 | `credit_reservations` tablosu var mı? | ✅ `20260718d_kredi_rezervasyon.sql` | ⬜ | SQL: `select to_regclass('public.credit_reservations');` |
| 3 | `reserve_credits` RPC var mı? | ✅ `20260718d` + `20260719a` | ⬜ | `select proname from pg_proc where proname='reserve_credits';` |
| 4 | `finalize_reservation` RPC var mı? | ✅ `20260718d` | ⬜ | `select proname from pg_proc where proname='finalize_reservation';` |
| 5 | `refund_reservation` RPC var mı? | ✅ `20260718d` | ⬜ | `select proname from pg_proc where proname='refund_reservation';` |
| 6 | `video_jobs` tablosu var mı? | ✅ `20260718e_video_jobs.sql` | ⬜ | `select to_regclass('public.video_jobs');` |
| 7 | `op_locks` tablosu var mı? | ⬜ (önceki migration — repoda ayrı) | ⬜ | `select to_regclass('public.op_locks');` |
| 8 | `rate_hits` tablosu ve `rl_hit` RPC var mı? | ✅ `20260718f_dagitik_rate_limit.sql` | ⬜ | `select to_regclass('public.rate_hits');` + `select proname from pg_proc where proname='rl_hit';` |
| 9 | `uretim_log` tablosu var mı? | ⬜ (kod `logRun` ile yazıyor; migration ayrı) | ⬜ | `select to_regclass('public.uretim_log');` |
| 10 | `studio-ses` Storage bucket var mı? | — | ⬜ | Supabase → Storage → bucket listesi |
| 11 | `20260719a` asılı rezervasyon düzeltmesi çalıştırılmış mı? | ✅ dosya mevcut | ⬜ | `reserve_credits` gövdesinde "15 minutes" asılı-iade bloğu var mı: `select prosrc from pg_proc where proname='reserve_credits';` |
| 12 | Secret durumları: OpenAI / Anthropic / ElevenLabs / xAI / Kling / **FAL** | — | ⬜ | Supabase → Edge Functions → Secrets: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`/`ELEVEN_API_KEY`, `XAI_API_KEY`, `KLING_ACCESS_KEY`+`KLING_SECRET_KEY`, `FAL_KEY` var mı? |

**Faz 1 çıkışı:** Tüm satırlar ⬜ → ✅/⛔ olana kadar Faz 2'ye geçilmez.

---

## Faz 2 — Kredi güvenliği

- [ ] Güvenli rezervasyon altyapısı (reserve→finalize|refund) YOKSA ücretli işlem çalışmasın (fail-closed).
- [ ] Aynı işlemin tekrar denemeleri **aynı `opId`**'yi kullansın (idempotent tek rezervasyon).
- [ ] Başarısız işlemde kredi **otomatik iade** edilsin.
- [ ] Çift tıklamada **çift ücret alınmasın**.
- [ ] Asılı rezervasyonlar (15 dk+) **otomatik temizlensin**.

**Kanıt gereği:** `credit_log`'ta bir üretim için `reserve:` → (`finalize` yok = kayıt kalır) veya `refund:` çiftinin göründüğü ekran görüntüsü.

---

## Faz 3 — Görsel üretimi

- [ ] **Tek birincil model** belirlensin (zincir yerine tek model + net yedek).
- [ ] En fazla **bir kontrollü tekrar** kullanılsın.
- [ ] Hata sınıfları AYRI gösterilsin: **429** (hız), **400** (istek reddi), **401/403** (yetki/anahtar), **5xx** (sağlayıcı), **timeout**.
- [ ] İlk testlerde toplu üretim **tek paralel iş** çalıştırsın (concurrency = 1).
- [ ] **50 ardışık testte açıklanamayan kredi kaybı = 0.**

**Kanıt gereği:** 50 üretimlik test tablosu (opId, sonuç, hata sınıfı, kredi öncesi/sonrası).

---

## Faz 4 — Ses ve video

- [ ] ElevenLabs → OpenAI **fallback'i kullanıcıya AÇIKÇA gösterilsin** (sessiz düşme yok).
- [ ] Video başarısızlığında **rezervasyon iade** edilsin.
- [ ] Video işleri **sayfa yenilemesinde kaybolmasın** (job kimliği kalıcı, açılışta poll sürsün).
- [ ] "8–10 dakikalık HAZIR MP4 üretilmiyor" gerçeği ürün metninde **doğru anlatılsın** (yanlış beklenti yaratma).

**Kanıt gereği:** başarısız video sonrası kredi geri döndü ekran görüntüsü + fallback uyarısının göründüğü ekran.

---

## Faz 5 — Test modu

- [ ] **API çağırmayan ve kredi düşürmeyen** demo/test modu olsun.
- [ ] Gerçek üretim önce **yalnız yönetici hesabına** açık olsun (kademeli açılış).
- [ ] **Sağlayıcı başına harcama limitleri** bulunsun (OpenAI/xAI/Kling/fal/ElevenLabs).

---

## Onay kaydı (imzalar)

| Faz | Sorumlu | Kanıt bağlantısı | Tarih | Durum |
|---|---|---|---|---|
| 1 | | | | ⬜ |
| 2 | | | | ⬜ |
| 3 | | | | ⬜ |
| 4 | | | | ⬜ |
| 5 | | | | ⬜ |

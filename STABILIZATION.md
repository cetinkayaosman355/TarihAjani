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
| 7 | `op_locks` tablosu var mı? | ✅ `20260718_kredi_iki_kova_odeme.sql` / `20260718b` | ⬜ | `select to_regclass('public.op_locks');` |
| 8 | `rate_hits` tablosu ve `rl_hit` RPC var mı? | ✅ `20260718f_dagitik_rate_limit.sql` | ⬜ | `select to_regclass('public.rate_hits');` + `select proname from pg_proc where proname='rl_hit';` |
| 9 | `uretim_log` tablosu var mı? | ✅ `20260716_uretim_log.sql` | ⬜ | `select to_regclass('public.uretim_log');` |
| 10 | `studio-ses` Storage bucket var mı? | ✅ `20260712_studio_ses.sql` | ⬜ | Supabase → Storage → bucket listesi (ya da `select id from storage.buckets where id='studio-ses';`) |
| 11 | `20260719a` asılı rezervasyon düzeltmesi çalıştırılmış mı? | ✅ dosya mevcut | ⬜ | `reserve_credits` gövdesinde "15 minutes" asılı-iade bloğu var mı: `select prosrc from pg_proc where proname='reserve_credits';` |
| 12 | Secret durumları: OpenAI / Anthropic / ElevenLabs / xAI / Kling / **FAL** | — | ⬜ | Supabase → Edge Functions → Secrets: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`/`ELEVEN_API_KEY`, `XAI_API_KEY`, `KLING_ACCESS_KEY`+`KLING_SECRET_KEY`, `FAL_KEY` var mı? |

**Faz 1 çıkışı:** Tüm satırlar ⬜ → ✅/⛔ olana kadar Faz 2'ye geçilmez.

### Faz 1 — Canlı doğrulama (TEK SEFERDE ÇALIŞTIR)

> Aşağıdaki blok **yalnız okur, hiçbir şey değiştirmez**. Supabase → SQL Editor'e
> yapıştır, çalıştır, çıktının tamamını raporla. Envanteri ben ✅/⛔ olarak
> güncelleyeceğim.

```sql
-- TARİH AJANI — Faz 1 canlı envanter (salt-okunur)
select 'credit_reservations' as ad, to_regclass('public.credit_reservations')::text as var_mi
union all select 'video_jobs',   to_regclass('public.video_jobs')::text
union all select 'op_locks',     to_regclass('public.op_locks')::text
union all select 'rate_hits',    to_regclass('public.rate_hits')::text
union all select 'uretim_log',   to_regclass('public.uretim_log')::text
union all select 'credit_log',   to_regclass('public.credit_log')::text
union all select 'profiles',     to_regclass('public.profiles')::text;

-- RPC'ler (var = 1 satır döner)
select proname as rpc from pg_proc
where proname in ('reserve_credits','finalize_reservation','refund_reservation','rl_hit','spend_credits','refresh_profile_credits')
order by proname;

-- reserve_credits gövdesinde ASILI-İADE (15 dk) bloğu var mı? (20260719a çalıştı mı)
select case when prosrc ilike '%15 minutes%' then 'ASILI-IADE VAR (20260719a uygulanmis)'
            else 'ASILI-IADE YOK (20260719a UYGULANMAMIS)' end as asili_iade
from pg_proc where proname='reserve_credits';

-- studio-ses Storage bucket
select coalesce((select 'VAR' from storage.buckets where id='studio-ses'), 'YOK') as studio_ses_bucket;

-- Halen ASILI (reserved, 15 dk+) rezervasyon var mı? (kredi kaçağı göstergesi)
select count(*) as asili_rezervasyon_sayisi
from public.credit_reservations
where status='reserved' and created_at < now() - interval '15 minutes';
```

### Faz 1 — Dashboard kontrolleri (SQL dışı)

1. **Edge Function sürümü:** Supabase → Edge Functions → `studio-generate` → son deploy zamanı. GitHub `main` son commit'inden ESKİYSE canlı ≠ repo (madde 1 ⛔).
2. **Secrets:** Edge Functions → Secrets/Environment. Şunları TEK TEK gör (değerini paylaşma, sadece VAR/YOK):
   `OPENAI_API_KEY` · `ANTHROPIC_API_KEY` · `ELEVENLABS_API_KEY` (veya `ELEVEN_API_KEY`) · `XAI_API_KEY` · `KLING_ACCESS_KEY` + `KLING_SECRET_KEY` · `FAL_KEY`
3. **Storage:** Storage sekmesinde `studio-ses` bucket'ı ve `gorsel/ video/ ses/` klasörleri görünüyor mu.

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

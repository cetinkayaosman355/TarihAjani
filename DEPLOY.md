# Tarih Ajanı — Deploy Rehberi (tek doğru yol)

## Canlıda hangi sürüm var? (30 saniyede kesin cevap)
Tarayıcıda **herhangi bir sekmede** F12 → Console'a yapıştır:

```js
fetch('https://ddyuopqcvpzaysnfavqc.supabase.co/functions/v1/studio-generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXVvcHFjdnB6YXlzbmZhdnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzAxMjAsImV4cCI6MjA5ODkwNjEyMH0.0nTnXFFrPNlxWC_MIeRwqBCqgdYX_tG7WVUbsj0B6Cc' },
  body: JSON.stringify({ action: 'version' })
}).then(r => r.json()).then(console.log)
```

- `{ ok: true, build: "sg-2026-07-21-r2", ... }` → **güncel sürüm canlıda** ✅
- `{ ok: false, error: "Geçersiz işlem." }` → **canlıda ESKİ sürüm var** ❌ → aşağıdaki deploy'u yap
- Yanıt gelmiyor → fonksiyon çökmüş/ağ sorunu → Supabase Logs'a bak

Repodaki beklenen damga: `supabase/functions/studio-generate/index.ts` içindeki `const BUILD = "..."` satırı.

## Otomatik deploy (önerilen — bir kez kur, unut)
`main`'e `supabase/functions/**` dokunan her push, GitHub Actions ile fonksiyonları
otomatik yükler ve canlı build damgasını doğrular (`.github/workflows/supabase-deploy.yml`).

**Tek seferlik kurulum** — GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Değer |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens → "Generate new token" |
| `SUPABASE_PROJECT_REF` | `ddyuopqcvpzaysnfavqc` |

Kurulunca: Actions sekmesi → "Supabase Deploy" → **Run workflow** ile elle de tetiklenir.

## Elle deploy (secrets kurulana kadar)
Supabase Dashboard → Edge Functions → fonksiyon → Code:
1. Editördeki HER ŞEYİ sil (Cmd+A → Delete). Yarım yapıştırma = sessiz bozulma.
2. Repodaki `supabase/functions/<ad>/index.ts` içeriğinin TAMAMINI yapıştır.
3. **Deploy updates** → sonra yukarıdaki **sürüm kontrolünü** çalıştır; damga uyuşmalı.

Fonksiyonlar: `studio-generate`, `posta`.

## Migration'lar (SQL Editor — elle, sırayla)
Yeni migration çıktığında `supabase/migrations/` içindeki dosyayı SQL Editor'de çalıştır.
Kurulum kontrolü:

```sql
select
  to_regclass('public.problem_reports')                           as problem_reports,
  to_regprocedure('public.settle_reservation(uuid,text,int)')     as settle_fn,
  to_regprocedure('public.goodwill_grant(uuid,text,int,int,int)') as goodwill_fn;
```
Üçü de dolu (null değil) olmalı.

## Acil stabilizasyon (görsel üretimi güvence altına al)
GPT Image 2 hesabında yavaş/erişilemez ise **kod değiştirmeden** birincil modeli değiştir:
Supabase → Edge Functions → Secrets → `TA_IMAGE_PRIMARY_MODEL` = `gpt-image-1`
→ üretim anında stabilleşir (fiyat otomatik 8 KR olur). Sorun çözülünce secret'ı sil.

## Sorun anında log okuma
Supabase → Edge Functions → studio-generate → Logs:
- `img_ok … model=X` → üretildi (X = gerçek model)
- `img_fail … class=TIMEOUT` → o deneme zaman aşımı (zincir devam eder)
- `img_tail_reserve` → yavaş kademe atlandı, güvenilir son modele geçildi (normal)
- `img_budget_stop` → tüm bütçe bitti, iade edildi
- `INVALID_IMAGE_PROVIDER:gpt1` → **canlıda eski sürüm var** (yukarıdaki version kontrolü)

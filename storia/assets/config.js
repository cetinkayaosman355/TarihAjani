/* STORIA — runtime configuration
   Kurulumdan sonra buradaki iki değeri kendi Supabase projenle doldur:
     1) supabaseUrl      → Supabase → Project Settings → API → Project URL
     2) supabaseAnonKey  → aynı sayfada "anon public" anahtarı
   Bu değerler boş kaldığı sürece Studio "DEMO MODU"nda çalışır:
   arayüzün tamamı denenebilir, üretimler örnek verilerle gösterilir,
   gerçek yapay zekâ çağrısı yapılmaz ve kredi düşmez.
   Ayrıntı için: storia/STORIA-KURULUM.md */
window.STORIA_CONFIG = {
  supabaseUrl: "",       // örn: https://xxxx.supabase.co
  supabaseAnonKey: "",   // örn: eyJhbGciOiJIUzI1NiIsInR5cCI6...
  functionName: "storia-generate",
  brand: "Storia"
};

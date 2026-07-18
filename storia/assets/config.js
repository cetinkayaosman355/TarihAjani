/* STORIA — runtime configuration
   Kurulumdan sonra buradaki iki değeri kendi Supabase projenle doldur:
     1) supabaseUrl      → Supabase → Project Settings → API → Project URL
     2) supabaseAnonKey  → aynı sayfada "anon public" anahtarı
   Bu değerler boş kaldığı sürece Studio "DEMO MODU"nda çalışır:
   arayüzün tamamı denenebilir, üretimler örnek verilerle gösterilir,
   gerçek yapay zekâ çağrısı yapılmaz ve kredi düşmez.
   Ayrıntı için: storia/STORIA-KURULUM.md */
window.STORIA_CONFIG = {
  // Bağımsız STORIA Supabase projesi (kendi anahtarları/tabloları/kredisi).
  // anon key herkese açıktır (istemcide kullanılmak üzere tasarlıdır) — repoda güvenli.
  supabaseUrl: "https://kszbdnussvdzmbkuilso.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzemJkbnVzc3Zkem1ia3VpbHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNzQyMzYsImV4cCI6MjA5OTk1MDIzNn0.ZHuLmhIAMPFIfTwp8CDJ60-OtfUyFEYHTwrbRfrfDTw",
  functionName: "storia-generate",
  brand: "Storia",
  // İsteğe bağlı: iyzico/Stripe "ödeme linki" URL'lerini buraya yapıştırınca
  // "Planı yükselt" butonu doğrudan ödemeye götürür (API entegrasyonu gerekmez).
  checkout: {
    yaratici: "",
    profesyonel: "",
    studio: ""
  }
};

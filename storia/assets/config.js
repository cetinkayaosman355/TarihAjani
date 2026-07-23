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
  // Ödeme: şimdilik Havale/EFT (IBAN). Kullanıcı planı seçince IBAN + alıcı
  // gösterilir; dekont iletince kredi elle yüklenir. İstersen bu değerleri değiştir.
  iban: "TR06 0004 6002 6388 8000 0717 57",
  ibanName: "Osman Çetinkaya",
  contactEmail: "cetinkayaosman355@gmail.com",
  // İsteğe bağlı: iyzico/Stripe "ödeme linki" URL'lerini buraya koyarsan
  // IBAN yerine doğrudan karta yönlendirir (API gerekmez).
  checkout: {
    yaratici: "",
    profesyonel: "",
    studio: ""
  }
};

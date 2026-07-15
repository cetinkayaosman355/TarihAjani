TARİH AJANI · /ornek deneme sayfası — hazır seslendirme (stüdyo anlatımı)
========================================================================

Bu klasöre bırakılan ses dosyaları, /ornek sayfasındaki "▶ dinle"
butonunda tarayıcı sesi yerine OTOMATİK olarak çalınır. Dosya yoksa
sayfa sessizce tarayıcı seslendirmesine (Web Speech) düşer — yani hiçbir
dosya olmadan da sayfa çalışır.

Beklenen dosya adları (her vaka için, .mp3 tercih edilir, .wav de olur):

  fetih.mp3      → İstanbul'un Fethi (1453)
  vezuv.mp3      → Vezüv Patladı / Pompeii (MS 79)
  sezar.mp3      → Sezar Suikastı (MÖ 44)
  termopil.mp3   → 300 Spartalı / Termopylai (MÖ 480)
  bagdat.mp3     → Bağdat'ın Yağması (1258)
  otzi.mp3       → Buz Adam Ötzi (MÖ 3300)

Seslendirme metinleri ornek.html içindeki DOSSIERS[].ses alanlarındadır
(her biri ~15-20 sn'lik açılış anlatımı). Aynı metinleri iyi bir Türkçe
TTS ile (ör. ElevenLabs, Higgsfield seed_audio, Azure "Emel/Ahmet")
seslendirip buraya bu adlarla koymak yeterlidir.

Not: Bu ortamın ağ politikası harici ses CDN'lerinden indirmeye izin
vermediği için dosyalar buraya otomatik konulamadı; bu yüzden sayfa
"dosya varsa çal, yoksa tarayıcı sesine düş" olacak şekilde kuruldu.

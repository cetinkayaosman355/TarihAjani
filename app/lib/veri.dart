// ═══════════════════════════════════════════════════════════════════════════
// İÇERİK VERİSİ — vakalar, oyun soruları, kredi paketleri.
// Web'deki arşiv/mağaza içeriğinin native çekirdeği; canlı eşitleme yol haritada.
// ═══════════════════════════════════════════════════════════════════════════
import 'package:flutter/foundation.dart';

/// Vaka detayından "Studio'da üret"e konu taşıma (Üret sekmesi dinler).
final seciliKonu = ValueNotifier<String?>(null);

class Vaka {
  const Vaka(this.no, this.baslik, this.donem, this.ozet, this.konu);
  final String no, baslik, donem, ozet, konu;
}

const vakalar = [
  Vaka('TA-ARSIV-021', 'Ötzi — Tarihin En Eski Cinayeti', 'MÖ 3300 · Alpler',
      'Buzulda 5300 yıl saklanan adamın sırtındaki ok ucu, tarihin en eski faili meçhulünü açtı. Son yemeği, yaraları ve kaçış rotası bir cinayet dosyası gibi okunuyor.',
      'Ötzi: buzul adamın sırtındaki ok ucu — tarihin en eski faili meçhul cinayeti'),
  Vaka('TA-ARSIV-022', 'Mısır\'ın 3500 Yıllık Gebelik Testi', 'MÖ 1500 · Mısır',
      'Papirüslerdeki tarif: buğday ve arpa torbalarına... Modern deneyler yöntemin şaşırtıcı isabetini doğruladı.',
      'Antik Mısır\'ın buğday-arpa gebelik testi: 3500 yıl önceki tıbbın şaşırtan isabeti'),
  Vaka('TA-ARSIV-023', 'Derinkuyu — Tavukların Bulduğu Yeraltı Şehri', '1963 · Kapadokya',
      'Duvarı yıkan bir adam, kayıp tavuklarının ardından 18 kat derinliğinde, 20 bin kişilik bir yeraltı şehrine girdi.',
      'Derinkuyu: kayıp tavukların ortaya çıkardığı 18 katlı yeraltı şehri'),
  Vaka('TA-ARSIV-024', 'Loulan Güzeli — Çölün 3800 Yıllık Sırrı', 'MÖ 1800 · Taklamakan',
      'Çölün kumunda neredeyse bozulmadan bekleyen kadın; İpek Yolu\'ndan çok önce oraya kimler gelmişti?',
      'Loulan Güzeli: Taklamakan\'ın 3800 yıllık mumyası ve kayıp halkı'),
  Vaka('TA-ARSIV-025', 'Piri Reis Haritasının Kayıp Kaynağı', '1513 · Osmanlı',
      'Kolomb\'un kayıp haritasından kopyalandığı yazan dünya haritası — kaynak harita nerede?',
      'Piri Reis 1513 haritasının kayıp kaynağı: Kolomb\'un kaybolan haritası'),
  Vaka('TA-ARSIV-026', 'Varang Muhafızları — Bizans\'ın Viking Ordusu', '988 · Konstantinopolis',
      'İmparatoru koruyan baltalı kuzeyliler: Vikingler İstanbul surlarında nasıl maaşlı muhafız oldu?',
      'Varang Muhafızları: Bizans sarayını koruyan Vikingler'),
];

class Soru {
  const Soru(this.metin, this.secenekler, this.dogru);
  final String metin;
  final List<String> secenekler;
  final int dogru;
}

/// ZAMAN GÖREVİ — native mini oyun (PWA'daki Oyun Tüneli'nin ilk native üyesi).
const zamanGorevi = [
  Soru('İstanbul\'un fethi hangi yıldadır?', ['1453', '1461', '1444', '1439'], 0),
  Soru('Ötzi\'nin bulunduğu yer?', ['Alpler', 'Pireneler', 'Kafkaslar', 'And Dağları'], 0),
  Soru('Piri Reis haritası hangi yıla tarihlenir?', ['1513', '1571', '1453', '1520'], 0),
  Soru('Derinkuyu yeraltı şehri hangi bölgededir?', ['Kapadokya', 'Frigya', 'Likya', 'Karya'], 0),
  Soru('Varang Muhafızları kimi korurdu?', ['Bizans imparatorunu', 'Papa\'yı', 'Abbasi halifesini', 'Kiev knezini'], 0),
  Soru('Enigma şifresi hangi savaşta kırıldı?', ['2. Dünya Savaşı', '1. Dünya Savaşı', 'Soğuk Savaş', 'Kırım Savaşı'], 0),
  Soru('Kanuni Sultan Süleyman kaç yıl tahtta kaldı?', ['46', '31', '20', '61'], 0),
  Soru('Göbekli Tepe hangi çağa aittir?', ['Neolitik', 'Tunç Çağı', 'Demir Çağı', 'Antik Yunan'], 0),
];

class Paket {
  const Paket(this.ad, this.kredi, this.fiyat, this.rozet);
  final String ad, rozet;
  final int kredi;
  final String fiyat;
}

const paketler = [
  Paket('Gözlemci', 600, '399 TL', ''),
  Paket('Ajan', 1500, '899 TL', 'EN POPÜLER'),
  Paket('Başmüfettiş', 3000, '1699 TL', 'EN AVANTAJLI'),
];

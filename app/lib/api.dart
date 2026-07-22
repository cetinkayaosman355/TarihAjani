// ═══════════════════════════════════════════════════════════════════════════
// STUDIO API — web ile AYNI Supabase backend'i (studio-generate edge function).
// WebView yok: native uygulama doğrudan aynı hesap/kredi/üretim hattını kullanır.
// Aksiyonlar sunucudakiyle birebir: generate / scenes / tts / video_list …
// ═══════════════════════════════════════════════════════════════════════════
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Bilinen son kredi bakiyesi — sunucu yanıtlarından yakalanır (web ile aynı
/// kaynak: her ücretli işlem güncel bakiyeyi döndürür). null = henüz bilinmiyor.
final sonKredi = ValueNotifier<int?>(null);

const sbUrl = 'https://ddyuopqcvpzaysnfavqc.supabase.co';
const sbAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkeXVvcHFjdnB6YXlzbmZhdnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzAxMjAsImV4cCI6MjA5ODkwNjEyMH0.0nTnXFFrPNlxWC_MIeRwqBCqgdYX_tG7WVUbsj0B6Cc';

class StudioApi {
  StudioApi(this._sb);
  final SupabaseClient _sb;

  bool get girisli => _sb.auth.currentSession != null;
  String? get eposta => _sb.auth.currentUser?.email;

  Future<void> girisYap(String eposta, String sifre) =>
      _sb.auth.signInWithPassword(email: eposta, password: sifre);

  Future<void> kayitOl(String eposta, String sifre) =>
      _sb.auth.signUp(email: eposta, password: sifre);

  Future<void> googleIleGir() => _sb.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'com.tarihajani.studio://giris', // iOS/Android URL şeması (README)
      );

  Future<void> cikis() => _sb.auth.signOut();

  /// studio-generate edge function çağrısı — web istemcisiyle birebir aynı gövde.
  Future<Map<String, dynamic>> _cagri(Map<String, dynamic> govde) async {
    final res = await _sb.functions.invoke('studio-generate', body: govde);
    final data = res.data;
    Map<String, dynamic> d;
    if (data is Map<String, dynamic>) {
      d = data;
    } else if (data is String) {
      d = jsonDecode(data) as Map<String, dynamic>;
    } else {
      d = {'ok': false, 'error': 'Beklenmeyen yanıt'};
    }
    final k = d['credits'];
    if (k is num) sonKredi.value = k.round();
    return d;
  }

  /// Ücretsiz ses önizlemesi (~4 sn) — web'in preview akışıyla aynı; url döner.
  Future<String> sesOnizle(String voice) async {
    final d = await _cagri({'action': 'tts', 'preview': true, 'voice': voice});
    if (d['ok'] == true && d['url'] != null) return d['url'] as String;
    throw Exception(d['error'] ?? 'Önizleme üretilemedi');
  }

  /// Tam dosya üretimi (kredi sunucuda düşer; web ile aynı 'generate' aksiyonu).
  Future<Map<String, dynamic>> dosyaUret({
    required String konu,
    required String prompt,
    int maxTokens = 5000,
  }) =>
      _cagri({'action': 'generate', 'prompt': prompt, 'topic': konu, 'max_tokens': maxTokens});

  /// Ücretsiz ajan sohbeti (aksiyonsuz genel metin — kredi düşmez).
  Future<String> sohbet(String prompt) async {
    final d = await _cagri({'prompt': prompt, 'max_tokens': 4000});
    return (d['text'] ?? d['result'] ?? '').toString();
  }

  /// Seslendirme (TTS) — web ile aynı 'tts' aksiyonu; url döner.
  Future<String> seslendir(String metin, {String ses = 'onyx'}) async {
    final d = await _cagri({'action': 'tts', 'text': metin, 'voice': ses});
    if (d['ok'] == true && d['url'] != null) return d['url'] as String;
    throw Exception(d['error'] ?? 'Ses üretilemedi');
  }

  /// Hesaba bağlı videolar (web'in video_list aksiyonu — cihazlar arası ortak arşiv).
  Future<List<Map<String, dynamic>>> videolarim() async {
    final d = await _cagri({'action': 'video_list'});
    final list = (d['videos'] ?? d['list'] ?? []) as List;
    return list.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
  }
}

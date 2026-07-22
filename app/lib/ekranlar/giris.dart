import 'package:flutter/material.dart';
import '../api.dart';
import '../tema.dart';

/// GİRİŞ — web'deki üyelik akışının native karşılığı (e-posta + Google).
/// Simetri: tüm alanlar aynı yükseklik, dikey ritim 4pt ızgarada.
class GirisEkrani extends StatefulWidget {
  const GirisEkrani({super.key, required this.api});
  final StudioApi api;

  @override
  State<GirisEkrani> createState() => _GirisEkraniState();
}

class _GirisEkraniState extends State<GirisEkrani> {
  final _eposta = TextEditingController();
  final _sifre = TextEditingController();
  bool _kayit = false, _mesgul = false;
  String _hata = '';

  Future<void> _gonder() async {
    setState(() { _mesgul = true; _hata = ''; });
    try {
      if (_kayit) {
        await widget.api.kayitOl(_eposta.text.trim(), _sifre.text);
      } else {
        await widget.api.girisYap(_eposta.text.trim(), _sifre.text);
      }
    } catch (e) {
      setState(() => _hata = 'Olmadı: ${e.toString().replaceFirst('AuthException: ', '')}');
    } finally {
      if (mounted) setState(() => _mesgul = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(Bosluk.xl),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Amblem — web'deki pusula/ajan yıldızı kimliği
                  Icon(Icons.explore, size: 64, color: tema.colorScheme.primary),
                  const SizedBox(height: Bosluk.l),
                  Text('Ajan Studio',
                      textAlign: TextAlign.center,
                      style: tema.textTheme.headlineMedium),
                  const SizedBox(height: Bosluk.xs),
                  Text('TARİH AJANI · ÜRETİM STÜDYOSU',
                      textAlign: TextAlign.center,
                      style: tema.textTheme.labelSmall?.copyWith(letterSpacing: 2)),
                  const SizedBox(height: Bosluk.xxl),
                  TextField(
                    controller: _eposta,
                    keyboardType: TextInputType.emailAddress,
                    autocorrect: false,
                    decoration: const InputDecoration(labelText: 'E-posta'),
                  ),
                  const SizedBox(height: Bosluk.m),
                  TextField(
                    controller: _sifre,
                    obscureText: true,
                    decoration: const InputDecoration(labelText: 'Şifre'),
                    onSubmitted: (_) => _gonder(),
                  ),
                  if (_hata.isNotEmpty) ...[
                    const SizedBox(height: Bosluk.m),
                    Text(_hata, style: TextStyle(color: tema.colorScheme.error)),
                  ],
                  const SizedBox(height: Bosluk.xl),
                  FilledButton(
                    onPressed: _mesgul ? null : _gonder,
                    child: Text(_mesgul ? 'Bekle…' : (_kayit ? 'KAYIT OL' : 'GİRİŞ YAP')),
                  ),
                  const SizedBox(height: Bosluk.m),
                  OutlinedButton.icon(
                    onPressed: _mesgul ? null : widget.api.googleIleGir,
                    style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                    icon: const Icon(Icons.g_mobiledata, size: 28),
                    label: const Text('Google ile devam et'),
                  ),
                  const SizedBox(height: Bosluk.l),
                  TextButton(
                    onPressed: () => setState(() => _kayit = !_kayit),
                    child: Text(_kayit
                        ? 'Hesabın var mı? Giriş yap'
                        : 'Hesabın yok mu? Kayıt ol (30 kredi hediye)'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

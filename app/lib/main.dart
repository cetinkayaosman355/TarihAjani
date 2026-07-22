import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'api.dart';
import 'tema.dart';
import 'ekranlar/giris.dart';
import 'ekranlar/kabuk.dart';

/// Uygulama içi tema seçimi (Profil ekranından): Sistem / Aydınlık / Karanlık.
final temaModu = ValueNotifier<ThemeMode>(ThemeMode.system);

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(url: sbUrl, anonKey: sbAnonKey);
  runApp(const TarihAjaniApp());
}

class TarihAjaniApp extends StatelessWidget {
  const TarihAjaniApp({super.key});

  @override
  Widget build(BuildContext context) {
    final api = StudioApi(Supabase.instance.client);
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: temaModu,
      builder: (context, mod, _) => MaterialApp(
        title: 'Tarih Ajanı',
        debugShowCheckedModeBanner: false,
        theme: ajanTema(Brightness.light),
        darkTheme: ajanTema(Brightness.dark),
        themeMode: mod,
        home: StreamBuilder<AuthState>(
          stream: Supabase.instance.client.auth.onAuthStateChange,
          builder: (context, _) =>
              api.girisli ? KabukEkrani(api: api) : GirisEkrani(api: api),
        ),
      ),
    );
  }
}

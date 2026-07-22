import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'api.dart';
import 'tema.dart';
import 'ekranlar/giris.dart';
import 'ekranlar/kabuk.dart';

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
    return MaterialApp(
      title: 'Tarih Ajanı',
      debugShowCheckedModeBanner: false,
      theme: ajanTema(Brightness.light),
      darkTheme: ajanTema(Brightness.dark),
      themeMode: ThemeMode.system,
      home: StreamBuilder<AuthState>(
        // Oturum değişince otomatik yönlendir (giriş ↔ ana kabuk)
        stream: Supabase.instance.client.auth.onAuthStateChange,
        builder: (context, _) =>
            api.girisli ? KabukEkrani(api: api) : GirisEkrani(api: api),
      ),
    );
  }
}

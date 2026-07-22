import 'package:flutter/material.dart';
import '../api.dart';
import '../main.dart' show temaModu;
import '../tema.dart';

/// PROFİL — hesap, tema seçimi (Sistem/Aydınlık/Karanlık), kredi ve çıkış.
class ProfilEkrani extends StatelessWidget {
  const ProfilEkrani({super.key, required this.api});
  final StudioApi api;

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(Bosluk.kenar),
        children: [
          const SizedBox(height: Bosluk.s),
          Text('Profil', style: tema.textTheme.headlineMedium),
          const SizedBox(height: Bosluk.xl),
          Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(Bosluk.l),
              leading: Container(
                width: 46,
                height: 46,
                decoration: const BoxDecoration(gradient: altinGradyan, shape: BoxShape.circle),
                child: const Icon(Icons.person, color: Color(0xFF171207)),
              ),
              title: Text(api.eposta ?? 'Ajan',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              subtitle: const Text('Tarih Ajanı hesabı — web ile ortak'),
            ),
          ),
          const SizedBox(height: Bosluk.m),
          Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(Bosluk.l),
              leading: Icon(Icons.toll, color: context.vurgu),
              title: const Text('Kredi', style: TextStyle(fontWeight: FontWeight.w600)),
              subtitle: const Text('Bakiye ve paketler web üzerinden: tarihajani.com/uyelik'),
            ),
          ),
          const SizedBox(height: Bosluk.xl),

          const BolumEtiketi('GÖRÜNÜM'),
          const SizedBox(height: Bosluk.m),
          ValueListenableBuilder<ThemeMode>(
            valueListenable: temaModu,
            builder: (context, mod, _) => Card(
              child: Column(
                children: [
                  RadioListTile<ThemeMode>(
                    value: ThemeMode.system,
                    groupValue: mod,
                    onChanged: (v) => temaModu.value = v ?? ThemeMode.system,
                    title: const Text('Sistemle aynı'),
                  ),
                  RadioListTile<ThemeMode>(
                    value: ThemeMode.light,
                    groupValue: mod,
                    onChanged: (v) => temaModu.value = v ?? ThemeMode.light,
                    title: const Text('Aydınlık — fildişi & altın'),
                  ),
                  RadioListTile<ThemeMode>(
                    value: ThemeMode.dark,
                    groupValue: mod,
                    onChanged: (v) => temaModu.value = v ?? ThemeMode.dark,
                    title: const Text('Karanlık — gece & altın'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: Bosluk.xl),

          OutlinedButton.icon(
            onPressed: api.cikis,
            icon: const Icon(Icons.logout, size: 18),
            label: const Text('Çıkış yap'),
          ),
        ],
      ),
    );
  }
}

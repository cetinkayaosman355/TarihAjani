import 'package:flutter/material.dart';
import '../api.dart';
import 'uret.dart';
import 'sohbet.dart';
import 'dosyalar.dart';
import 'profil.dart';

/// ANA KABUK — 4 sekmeli simetrik alt gezinme (web sol menüsünün mobil karşılığı):
/// Üret · Ajan (sohbet) · Dosyalar · Profil. Her sekme kendi Navigator durumunu korur.
class KabukEkrani extends StatefulWidget {
  const KabukEkrani({super.key, required this.api});
  final StudioApi api;

  @override
  State<KabukEkrani> createState() => _KabukEkraniState();
}

class _KabukEkraniState extends State<KabukEkrani> {
  int _sekme = 0;

  @override
  Widget build(BuildContext context) {
    final ekranlar = [
      UretEkrani(api: widget.api),
      SohbetEkrani(api: widget.api),
      DosyalarEkrani(api: widget.api),
      ProfilEkrani(api: widget.api),
    ];
    return Scaffold(
      body: IndexedStack(index: _sekme, children: ekranlar),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _sekme,
        onDestinationSelected: (i) => setState(() => _sekme = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.auto_stories_outlined), selectedIcon: Icon(Icons.auto_stories), label: 'Üret'),
          NavigationDestination(icon: Icon(Icons.forum_outlined), selectedIcon: Icon(Icons.forum), label: 'Ajan'),
          NavigationDestination(icon: Icon(Icons.folder_open_outlined), selectedIcon: Icon(Icons.folder), label: 'Dosyalar'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
    );
  }
}

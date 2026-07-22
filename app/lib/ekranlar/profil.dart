import 'package:flutter/material.dart';
import '../api.dart';
import '../tema.dart';

/// PROFİL — hesap + çıkış. Kredi bakiyesi backend'in kredi ucu bağlanınca
/// buraya işlenecek (README yol haritası).
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
          const SizedBox(height: Bosluk.l),
          Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(Bosluk.l),
              leading: CircleAvatar(
                backgroundColor: tema.colorScheme.primary.withValues(alpha: .16),
                child: Icon(Icons.person, color: tema.colorScheme.primary),
              ),
              title: Text(api.eposta ?? 'Ajan'),
              subtitle: const Text('Tarih Ajanı hesabı — web ile ortak'),
            ),
          ),
          const SizedBox(height: Bosluk.m),
          Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(Bosluk.l),
              leading: Icon(Icons.toll, color: tema.colorScheme.primary),
              title: const Text('Kredi'),
              subtitle: const Text('Bakiye ve satın alma web üzerinden (tarihajani.com/uyelik)'),
            ),
          ),
          const SizedBox(height: Bosluk.xl),
          OutlinedButton.icon(
            onPressed: api.cikis,
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            icon: const Icon(Icons.logout),
            label: const Text('Çıkış yap'),
          ),
        ],
      ),
    );
  }
}

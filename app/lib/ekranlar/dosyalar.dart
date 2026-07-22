import 'package:flutter/material.dart';
import '../api.dart';
import '../tema.dart';

/// DOSYALAR — hesaba bağlı üretimler (web ile ortak arşiv: video_list).
/// Görseller/dosyalar için de aynı desen genişletilecek (README yol haritası).
class DosyalarEkrani extends StatefulWidget {
  const DosyalarEkrani({super.key, required this.api});
  final StudioApi api;

  @override
  State<DosyalarEkrani> createState() => _DosyalarEkraniState();
}

class _DosyalarEkraniState extends State<DosyalarEkrani> {
  late Future<List<Map<String, dynamic>>> _videolar;

  @override
  void initState() {
    super.initState();
    _videolar = widget.api.videolarim();
  }

  @override
  Widget build(BuildContext context) {
    final tema = Theme.of(context);
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async => setState(() => _videolar = widget.api.videolarim()),
        child: FutureBuilder<List<Map<String, dynamic>>>(
          future: _videolar,
          builder: (context, snap) {
            final liste = snap.data ?? const [];
            return ListView(
              padding: const EdgeInsets.all(Bosluk.kenar),
              children: [
                const SizedBox(height: Bosluk.s),
                Text('Çalışmalarım', style: tema.textTheme.headlineMedium),
                const SizedBox(height: Bosluk.l),
                if (snap.connectionState == ConnectionState.waiting)
                  const Center(child: Padding(
                    padding: EdgeInsets.all(Bosluk.xxl),
                    child: CircularProgressIndicator(),
                  ))
                else if (liste.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(Bosluk.xl),
                      child: Text(
                        'Henüz hesabına bağlı video üretimi yok.\nÜret sekmesinden ilk dosyanı çıkar — web ve uygulama aynı arşivi paylaşır.',
                        textAlign: TextAlign.center,
                        style: tema.textTheme.bodyMedium,
                      ),
                    ),
                  )
                else
                  for (final v in liste) ...[
                    Card(
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: Bosluk.l, vertical: Bosluk.s),
                        leading: Icon(Icons.movie_outlined, color: tema.colorScheme.primary),
                        title: Text((v['title'] ?? v['prompt'] ?? 'Video').toString(),
                            maxLines: 2, overflow: TextOverflow.ellipsis),
                        subtitle: Text((v['status'] ?? '').toString()),
                      ),
                    ),
                    const SizedBox(height: Bosluk.m),
                  ],
              ],
            );
          },
        ),
      ),
    );
  }
}

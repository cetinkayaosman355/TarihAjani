import 'package:flutter/material.dart';
import '../api.dart';
import '../tema.dart';

/// ARŞİV — hesaba bağlı üretimler (web ile ortak: video_list) + hazır dosyalar.
class ArsivEkrani extends StatefulWidget {
  const ArsivEkrani({super.key, required this.api});
  final StudioApi api;

  @override
  State<ArsivEkrani> createState() => _ArsivEkraniState();
}

class _ArsivEkraniState extends State<ArsivEkrani> {
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
                Text('Arşiv', style: tema.textTheme.headlineMedium),
                const SizedBox(height: Bosluk.xs),
                Text('ÇALIŞMALARIN — WEB İLE ORTAK', style: tema.textTheme.labelSmall),
                const SizedBox(height: Bosluk.xl),
                if (snap.connectionState == ConnectionState.waiting)
                  const Center(
                      child: Padding(
                          padding: EdgeInsets.all(Bosluk.xxl),
                          child: CircularProgressIndicator()))
                else if (liste.isEmpty)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(Bosluk.xl),
                      child: Column(
                        children: [
                          Icon(Icons.inventory_2_outlined,
                              size: 34, color: context.vurgu),
                          const SizedBox(height: Bosluk.m),
                          const Text(
                            'Henüz hesabına bağlı video yok.\nÜret sekmesinden ilk dosyanı çıkar — webde ürettiklerin de burada görünür.',
                            textAlign: TextAlign.center,
                            style: TextStyle(height: 1.55),
                          ),
                        ],
                      ),
                    ),
                  )
                else
                  for (final v in liste) ...[
                    Card(
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: Bosluk.l, vertical: Bosluk.s),
                        leading: Icon(Icons.movie_outlined, color: context.vurgu),
                        title: Text((v['title'] ?? v['prompt'] ?? 'Video').toString(),
                            maxLines: 2, overflow: TextOverflow.ellipsis,
                            style: const TextStyle(fontWeight: FontWeight.w600)),
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

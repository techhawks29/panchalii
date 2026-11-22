import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:hive_flutter/hive_flutter.dart';

import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'core/widgets/entry_curtain.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();

  // Fonts ship in assets/google_fonts; runtime downloads caused startup errors on slow networks
  GoogleFonts.config.allowRuntimeFetching = false;

  runApp(const ProviderScope(child: PanchaliiApp()));
}

class PanchaliiApp extends ConsumerWidget {
  const PanchaliiApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Panchalii',
      theme: buildAppTheme(),
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) =>
          EntryCurtain(child: child ?? const SizedBox.shrink()),
    );
  }
}

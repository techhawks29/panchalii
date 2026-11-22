import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:panchalii_app/features/auth/providers/auth_provider.dart';
import 'package:panchalii_app/features/home/providers/home_provider.dart';
import 'package:panchalii_app/main.dart';

import 'test_helpers.dart';

void main() {
  useBundledFonts();

  testWidgets(
    'app boots to the home screen with the hero and bottom navigation',
    (tester) async {
      usePhoneSurface(tester);
      disableAnimations(tester);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authStateProvider.overrideWith((ref) async => null),
            settingsProvider.overrideWith(
              (ref) async => {
                'banners': <dynamic>[],
                'categories': <dynamic>[],
              },
            ),
            featuredProductsProvider.overrideWith((ref) async => <dynamic>[]),
            newArrivalsProvider.overrideWith((ref) async => <dynamic>[]),
          ],
          child: const PanchaliiApp(),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('More Than\nFashion'), findsOneWidget);
      expect(find.text('New Arrivals'), findsOneWidget);
      expect(find.text('Featured Sarees'), findsOneWidget);
      for (final tab in ['Home', 'Shop', 'Cart', 'Account']) {
        expect(
          find.text(tab),
          findsOneWidget,
          reason: '$tab tab should be in the bottom navigation',
        );
      }
    },
  );
}

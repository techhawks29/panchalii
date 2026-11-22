import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

/// Loads the bundled fonts once, before any test runs. Otherwise a font finishing mid-test announces a
/// "system fonts changed" frame after the test ends, which fails it. Never hits the network (mirrors main()).
void useBundledFonts() {
  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    GoogleFonts.config.allowRuntimeFetching = false;
    for (final weight in [
      FontWeight.w300,
      FontWeight.w400,
      FontWeight.w500,
      FontWeight.w600,
    ]) {
      GoogleFonts.cormorantGaramond(fontWeight: weight);
      GoogleFonts.instrumentSans(fontWeight: weight);
    }
    GoogleFonts.cormorantGaramond(fontStyle: FontStyle.italic);
    await GoogleFonts.pendingFonts();
  });
}

/// Simulates the device setting that turns system animations off (skips the entry curtain).
void disableAnimations(WidgetTester tester) {
  tester.platformDispatcher.accessibilityFeaturesTestValue =
      const FakeAccessibilityFeatures(disableAnimations: true);
  addTearDown(tester.platformDispatcher.clearAccessibilityFeaturesTestValue);
}

/// Phone-sized test surface so tall screens lay out like they do on a device.
void usePhoneSurface(WidgetTester tester) {
  tester.view.physicalSize = const Size(1080, 2400);
  tester.view.devicePixelRatio = 2.625;
  addTearDown(tester.view.reset);
}

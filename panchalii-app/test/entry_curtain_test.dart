import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:panchalii_app/core/widgets/entry_curtain.dart';

import 'test_helpers.dart';

Widget _app() => MaterialApp(
  builder: (context, child) => EntryCurtain(child: child!),
  home: const Scaffold(body: Center(child: Text('Revealed'))),
);

/// The curtain overlay is the only GestureDetector EntryCurtain adds above its child.
Finder get _curtain => find.descendant(
  of: find.byType(EntryCurtain),
  matching: find.byType(GestureDetector),
);

/// The curtain advances at most 50ms per frame, so drive it with real frame-sized pumps.
Future<void> _runFrames(WidgetTester tester, Duration total) async {
  const frame = Duration(milliseconds: 16);
  for (var t = Duration.zero; t < total; t += frame) {
    await tester.pump(frame);
  }
}

void main() {
  useBundledFonts();

  testWidgets('covers the app, then parts to reveal it', (tester) async {
    await tester.pumpWidget(_app());
    await tester.pump();

    expect(_curtain, findsOneWidget);
    expect(
      find.text('Revealed'),
      findsOneWidget,
      reason: 'the app is built underneath the curtain',
    );

    await _runFrames(tester, const Duration(milliseconds: 1500));
    expect(_curtain, findsOneWidget, reason: 'still mid-animation at 1.5s');

    await _runFrames(tester, const Duration(milliseconds: 2000));
    expect(_curtain, findsNothing);
    expect(find.text('Revealed'), findsOneWidget);
  });

  testWidgets('a tap skips the intro', (tester) async {
    await tester.pumpWidget(_app());
    await tester.pump();
    await _runFrames(tester, const Duration(milliseconds: 300));

    await tester.tap(_curtain);
    await tester.pump();

    expect(_curtain, findsNothing);
  });

  testWidgets('does not play when the device has animations turned off', (
    tester,
  ) async {
    disableAnimations(tester);

    await tester.pumpWidget(_app());
    await tester.pump();

    expect(_curtain, findsNothing);
    expect(find.text('Revealed'), findsOneWidget);
  });
}

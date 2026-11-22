import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Aspect ratio of the mark (matches the website's 300x210 SVG viewBox).
const brandMarkAspect = 300 / 210;

/// Marks the home header logo so the entry curtain can fly its logo onto it.
final entryLogoTargetKey = GlobalKey(debugLabel: 'entryLogoTarget');

/// Panchalii monogram + wordmark, drawn to match the website's BrandMark.
class BrandMark extends StatelessWidget {
  final double height;
  const BrandMark({super.key, required this.height});

  @override
  Widget build(BuildContext context) => SizedBox(
    height: height,
    width: height * brandMarkAspect,
    child: const CustomPaint(painter: BrandMarkPainter()),
  );
}

class BrandMarkPainter extends CustomPainter {
  /// Position of the light sweep across the mark, 0..1; null for no sweep.
  final double? shine;
  const BrandMarkPainter({this.shine});

  static const _goldLight = Color(0xFFE9D29B);
  static const _gold = Color(0xFFC9A96E);
  static const _goldDark = Color(0xFF957546);

  @override
  void paint(Canvas canvas, Size size) {
    final s = size.height / 210;
    final gold = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [_goldLight, _gold, _goldDark],
        stops: [0, 0.45, 1],
      ).createShader(Offset.zero & size);

    final sweep = shine;
    if (sweep != null) canvas.saveLayer(Offset.zero & size, Paint());
    _drawShapes(canvas, s, gold);
    if (sweep != null) {
      // Bright band drawn only where the mark already has paint
      final x = (-0.4 + sweep * 1.8) * size.width;
      final band = Rect.fromLTWH(x, 0, size.width * 0.36, size.height);
      canvas.save();
      canvas.skew(-0.32, 0);
      canvas.drawRect(
        band.translate(size.height * 0.32, 0),
        Paint()
          ..blendMode = BlendMode.srcATop
          ..shader = LinearGradient(
            colors: [
              const Color(0xFFFFF6DC).withOpacity(0),
              const Color(0xFFFFF6DC).withOpacity(0.95),
              const Color(0xFFFFF6DC).withOpacity(0),
            ],
          ).createShader(band.translate(size.height * 0.32, 0)),
      );
      canvas.restore();
      canvas.restore();
    }
  }

  void _drawShapes(Canvas canvas, double s, Paint gold) {
    // Monogram: drawn in a 200-unit space, placed at (150, 70) scaled 0.62 like the SVG
    canvas.save();
    canvas.scale(s);
    canvas.translate(150, 70);
    canvas.scale(0.62);
    canvas.translate(-100, -100);
    const c = Offset(100, 100);
    final stroke = Paint()
      ..shader = gold.shader
      ..style = PaintingStyle.stroke;
    canvas.drawCircle(c, 72, stroke..strokeWidth = 2);
    canvas.drawCircle(c, 63, stroke..strokeWidth = 1);
    for (var i = 0; i < 24; i++) {
      final a = i * 2 * math.pi / 24;
      canvas.drawCircle(
        c + Offset(math.sin(a), -math.cos(a)) * 67.5,
        1.8,
        gold,
      );
    }
    for (var i = 0; i < 4; i++) {
      final a = i * math.pi / 2;
      final p = c + Offset(math.sin(a), -math.cos(a)) * 78;
      canvas.save();
      canvas.translate(p.dx, p.dy);
      canvas.rotate(math.pi / 4);
      canvas.drawRect(
        Rect.fromCenter(center: Offset.zero, width: 12, height: 12),
        gold,
      );
      canvas.restore();
    }
    _text(
      canvas,
      'P',
      GoogleFonts.cormorantGaramond(fontSize: 86, foreground: gold),
      centerX: 100,
      baseline: 129,
    );
    canvas.restore();

    canvas.save();
    canvas.scale(s);
    _text(
      canvas,
      'PANCHALII',
      GoogleFonts.cormorantGaramond(
        fontSize: 34,
        fontWeight: FontWeight.w600,
        foreground: gold,
      ),
      centerX: 150,
      baseline: 168,
      width: 250,
    );
    canvas.drawRect(const Rect.fromLTWH(62, 190, 54, 1.2), gold);
    canvas.drawRect(const Rect.fromLTWH(184, 190, 54, 1.2), gold);
    _text(
      canvas,
      'SELECT',
      GoogleFonts.instrumentSans(fontSize: 12, foreground: gold),
      centerX: 150,
      baseline: 195,
      width: 56,
    );
    canvas.restore();
  }

  /// Draws [text] centred on [centerX] at [baseline]; spreads letters to fill [width] like SVG textLength.
  void _text(
    Canvas canvas,
    String text,
    TextStyle style, {
    required double centerX,
    required double baseline,
    double? width,
  }) {
    var tp = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: TextDirection.ltr,
    )..layout();
    if (width != null && text.length > 1) {
      final spacing = (width - tp.width) / (text.length - 1);
      tp = TextPainter(
        text: TextSpan(
          text: text,
          style: style.copyWith(letterSpacing: spacing),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      // letterSpacing also trails the last glyph; drop it so the text stays centred
      final visible = tp.width - spacing;
      final top =
          baseline -
          tp.computeDistanceToActualBaseline(TextBaseline.alphabetic);
      tp.paint(canvas, Offset(centerX - visible / 2, top));
      return;
    }
    final top =
        baseline - tp.computeDistanceToActualBaseline(TextBaseline.alphabetic);
    tp.paint(canvas, Offset(centerX - tp.width / 2, top));
  }

  @override
  bool shouldRepaint(covariant BrandMarkPainter old) => old.shine != shine;
}

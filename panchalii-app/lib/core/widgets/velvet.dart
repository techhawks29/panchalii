import 'package:flutter/material.dart';

/// Wine velvet fold colours shared by the entry curtain and the sign-in backdrop.
const velvetFoldColors = [
  Color(0xFF1C080B),
  Color(0xFF34121A),
  Color(0xFF4F1F27),
  Color(0xFF5B2A30),
  Color(0xFF46191F),
  Color(0xFF2A0D13),
  Color(0xFF18070A),
];
const velvetFoldStops = [0.0, 0.14, 0.38, 0.5, 0.66, 0.86, 1.0];

/// Static closed-curtain backdrop (same folds as the entry curtain, without animation).
class VelvetBackground extends StatelessWidget {
  final int folds;
  const VelvetBackground({super.key, this.folds = 7});

  @override
  Widget build(BuildContext context) =>
      CustomPaint(painter: _VelvetPainter(folds), size: Size.infinite);
}

class _VelvetPainter extends CustomPainter {
  final int folds;
  const _VelvetPainter(this.folds);

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width / folds;
    for (var i = 0; i < folds; i++) {
      final rect = Rect.fromLTWH(i * w, 0, w + 1, size.height);
      canvas.drawRect(
        rect,
        Paint()
          ..shader = const LinearGradient(
            colors: velvetFoldColors,
            stops: velvetFoldStops,
          ).createShader(rect),
      );
    }
    final full = Offset.zero & size;
    canvas.drawRect(
      full,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.black.withOpacity(0.35),
            Colors.transparent,
            Colors.transparent,
            Colors.black.withOpacity(0.65),
          ],
          stops: const [0, 0.25, 0.65, 1],
        ).createShader(full),
    );
  }

  @override
  bool shouldRepaint(covariant _VelvetPainter old) => old.folds != folds;
}

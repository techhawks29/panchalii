import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

import 'brand_mark.dart';
import 'velvet.dart';

// Timeline (ms), kept in step with the website's EntryCurtain
const _totalMs = 3200.0;
const _logoInMs = 550.0;
const _shineAt = 450.0, _shineMs = 750.0;
const _flyAt = 1150.0, _flyMs = 420.0;
const _openAt = 1300.0, _openMs = 1500.0;
const _folds = 14;

const _openCurve = Cubic(0.7, 0, 0.3, 1);
const _flyCurve = Cubic(0.65, 0, 0.35, 1);

class _Fold {
  final int index;
  final double dx; // fraction of screen width
  final double delayMs;
  final double tone;
  final int z;
  const _Fold(this.index, this.dx, this.delayMs, this.tone, this.z);
}

final List<_Fold> _foldSpecs = () {
  final folds = List.generate(_folds, (i) {
    final center = (i + 0.5) / _folds;
    final left = center < 0.5;
    final fromEdge = left ? center : 1 - center;
    // Small per-fold jitter so the folds separate unevenly, like real fabric
    final jitter = ((i * 53) % 7) / 6;
    final dx = (left ? -1 : 1) * fromEdge * (0.8 + 0.12 * jitter);
    final delay = (0.5 - fromEdge) * 2 * 240 + jitter * 70;
    final tone = 0.92 + (((i * 37) % 11) / 10) * 0.16;
    final z = ((0.5 - fromEdge) * 100).round();
    return _Fold(i, dx, delay, tone, z);
  });
  // Outer folds paint last (on top) so inner folds tuck underneath as the curtain gathers
  return folds..sort((a, b) => a.z.compareTo(b.z));
}();

/// Wine velvet curtain with the Panchalii mark that parts fold by fold to reveal [child] on launch.
class EntryCurtain extends StatefulWidget {
  final Widget child;
  const EntryCurtain({super.key, required this.child});

  @override
  State<EntryCurtain> createState() => _EntryCurtainState();
}

class _EntryCurtainState extends State<EntryCurtain>
    with SingleTickerProviderStateMixin {
  // Cap per-frame progress so startup jank pauses the animation instead of skipping phases.
  static const _maxStepMs = 50.0;

  final _elapsedMs = ValueNotifier<double>(0);
  late final Ticker _ticker = createTicker(_onTick);
  Duration _lastTick = Duration.zero;
  bool _done = false;
  Rect? _flyTarget;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (MediaQuery.of(context).disableAnimations) {
        setState(() => _done = true);
      } else {
        _ticker.start();
      }
    });
  }

  void _onTick(Duration elapsed) {
    final step = math.min(
      (elapsed - _lastTick).inMicroseconds / 1000,
      _maxStepMs,
    );
    _lastTick = elapsed;
    final next = math.min(_totalMs, _elapsedMs.value + step);
    if (_flyTarget == null && next >= _flyAt) _flyTarget = _measureTarget();
    _elapsedMs.value = next;
    if (next >= _totalMs) _skip();
  }

  Rect? _measureTarget() {
    final target =
        entryLogoTargetKey.currentContext?.findRenderObject() as RenderBox?;
    final self = context.findRenderObject() as RenderBox?;
    if (target == null || self == null || !target.hasSize) return null;
    final topLeft = self.globalToLocal(target.localToGlobal(Offset.zero));
    return topLeft & target.size;
  }

  @override
  void dispose() {
    _ticker.dispose();
    _elapsedMs.dispose();
    super.dispose();
  }

  void _skip() {
    if (_done) return;
    _ticker.stop();
    setState(() => _done = true);
  }

  @override
  Widget build(BuildContext context) {
    if (_done) return widget.child;
    return Stack(
      children: [
        widget.child,
        Positioned.fill(
          child: GestureDetector(
            onTap: _skip,
            behavior: HitTestBehavior.opaque,
            child: ValueListenableBuilder<double>(
              valueListenable: _elapsedMs,
              builder: (context, ms, _) {
                final size = MediaQuery.of(context).size;
                return Stack(
                  children: [
                    Positioned.fill(
                      child: CustomPaint(painter: _CurtainPainter(ms)),
                    ),
                    _logo(ms, size),
                  ],
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _logo(double ms, Size screen) {
    final h = math.min(190.0, screen.width * 0.66 / brandMarkAspect);
    final start = Rect.fromCenter(
      center: screen.center(Offset.zero),
      width: h * brandMarkAspect,
      height: h,
    );
    final fly = _flyCurve.transform(((ms - _flyAt) / _flyMs).clamp(0.0, 1.0));
    final fadeIn = Curves.easeOut.transform((ms / _logoInMs).clamp(0.0, 1.0));
    final target = _flyTarget;

    Rect rect;
    double opacity = fadeIn;
    if (target != null) {
      rect = Rect.lerp(start, target, fly)!;
    } else {
      // No header logo on screen (e.g. app opened on a deep link): lift and fade instead
      rect = start.shift(Offset(0, -screen.height * 0.34 * fly));
      rect = Rect.fromCenter(
        center: rect.center,
        width: rect.width * (1 - 0.58 * fly),
        height: rect.height * (1 - 0.58 * fly),
      );
      opacity *= 1 - fly;
    }
    if (ms < _flyAt) {
      final scale = 0.96 + 0.04 * fadeIn;
      rect = Rect.fromCenter(
        center: rect.center,
        width: rect.width * scale,
        height: rect.height * scale,
      );
    }
    final shine = ms < _shineAt
        ? null
        : ((ms - _shineAt) / _shineMs).clamp(0.0, 1.0);

    return Positioned.fromRect(
      rect: rect,
      child: Opacity(
        opacity: opacity.clamp(0.0, 1.0),
        child: CustomPaint(
          painter: BrandMarkPainter(
            shine: shine != null && shine < 1 ? shine : null,
          ),
        ),
      ),
    );
  }
}

class _CurtainPainter extends CustomPainter {
  final double ms;
  const _CurtainPainter(this.ms);

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width / _folds;
    for (final f in _foldSpecs) {
      final local = ((ms - _openAt - f.delayMs) / _openMs).clamp(0.0, 1.0);
      final e = _openCurve.transform(local);
      final opacity = local < 0.85 ? 1.0 : 1 - (local - 0.85) / 0.15;
      if (opacity <= 0) continue;
      final scaleX = 1 - 0.4 * e;
      final centerX = (f.index + 0.5) * w + f.dx * e * size.width;
      final width = (w + 1) * scaleX;
      final rect = Rect.fromCenter(
        center: Offset(centerX, size.height / 2),
        width: width,
        height: size.height,
      );

      canvas.drawRect(
        rect,
        Paint()
          ..shader = LinearGradient(
            colors: [
              for (final c in velvetFoldColors)
                _withTone(c, f.tone).withOpacity(opacity),
            ],
            stops: velvetFoldStops,
          ).createShader(rect),
      );
      canvas.drawRect(
        rect,
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withOpacity(0.3 * opacity),
              Colors.transparent,
              Colors.transparent,
              Colors.black.withOpacity(0.6 * opacity),
            ],
            stops: const [0, 0.22, 0.68, 1],
          ).createShader(rect),
      );
    }
  }

  static Color _withTone(Color c, double tone) => Color.fromARGB(
    255,
    (c.red * tone).round().clamp(0, 255),
    (c.green * tone).round().clamp(0, 255),
    (c.blue * tone).round().clamp(0, 255),
  );

  @override
  bool shouldRepaint(covariant _CurtainPainter old) => old.ms != ms;
}

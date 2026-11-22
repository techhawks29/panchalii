import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/brand_mark.dart';
import '../../../core/widgets/velvet.dart';

/// Shared layout for sign-in and registration: velvet backdrop, Panchalii mark, dark card.
class AuthShell extends StatelessWidget {
  final String eyebrow;
  final String title;
  final Widget child;
  const AuthShell({
    super.key,
    required this.eyebrow,
    required this.title,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgDark,
      body: Stack(
        children: [
          const Positioned.fill(child: VelvetBackground()),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Column(
                    children: [
                      Align(
                        alignment: Alignment.centerLeft,
                        child: _BackButton(
                          onTap: () => context.canPop()
                              ? context.pop()
                              : context.go('/'),
                        ),
                      ),
                      const BrandMark(height: 104),
                      const SizedBox(height: 14),
                      Text(
                        eyebrow,
                        style: GoogleFonts.instrumentSans(
                          fontSize: 10,
                          letterSpacing: 3.5,
                          color: AppColors.gold,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.fromLTRB(26, 30, 26, 28),
                        decoration: BoxDecoration(
                          color: AppColors.bgDark.withOpacity(0.94),
                          border: Border.all(color: AppColors.border),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.45),
                              blurRadius: 40,
                              offset: const Offset(0, 18),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              title,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.cormorantGaramond(
                                fontSize: 32,
                                height: 1.1,
                                color: AppColors.cream,
                              ),
                            ),
                            const SizedBox(height: 12),
                            const _DiamondRule(),
                            const SizedBox(height: 26),
                            child,
                          ],
                        ),
                      ),
                      const SizedBox(height: 26),
                      Text(
                        'TIMELESS · ETHICAL · EXQUISITE',
                        style: GoogleFonts.instrumentSans(
                          fontSize: 9,
                          letterSpacing: 3,
                          color: AppColors.creamMuted.withOpacity(0.5),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Small uppercase gold text link.
class AuthLink extends StatelessWidget {
  final String text;
  final VoidCallback onTap;
  const AuthLink({super.key, required this.text, required this.onTap});

  @override
  Widget build(BuildContext context) => TextButton(
    onPressed: onTap,
    style: TextButton.styleFrom(
      foregroundColor: AppColors.gold,
      shape: const RoundedRectangleBorder(),
    ),
    child: Text(
      text.toUpperCase(),
      textAlign: TextAlign.center,
      style: GoogleFonts.instrumentSans(
        fontSize: 10.5,
        letterSpacing: 2.2,
        fontWeight: FontWeight.w600,
      ),
    ),
  );
}

class _BackButton extends StatelessWidget {
  final VoidCallback onTap;
  const _BackButton({required this.onTap});

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: 'Back',
    child: InkWell(
      onTap: onTap,
      customBorder: const CircleBorder(),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppColors.bgDark.withOpacity(0.6),
          border: Border.all(color: AppColors.gold.withOpacity(0.4)),
        ),
        child: const Icon(Icons.arrow_back, size: 18, color: AppColors.gold),
      ),
    ),
  );
}

class _DiamondRule extends StatelessWidget {
  const _DiamondRule();
  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Container(width: 40, height: 1, color: AppColors.gold.withOpacity(0.5)),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Transform.rotate(
          angle: 0.785,
          child: Container(width: 5, height: 5, color: AppColors.gold),
        ),
      ),
      Container(width: 40, height: 1, color: AppColors.gold.withOpacity(0.5)),
    ],
  );
}

/// Six-digit code entry used by phone sign-in and email verification.
class OtpCodeField extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onCompleted;
  const OtpCodeField({
    super.key,
    required this.controller,
    required this.onCompleted,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '6-DIGIT CODE',
          style: GoogleFonts.instrumentSans(
            fontSize: 10,
            letterSpacing: 2.2,
            color: AppColors.creamMuted,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.done,
          autofillHints: const [AutofillHints.oneTimeCode],
          maxLength: 6,
          textAlign: TextAlign.center,
          cursorColor: AppColors.gold,
          style: GoogleFonts.cormorantGaramond(
            fontSize: 30,
            letterSpacing: 14,
            color: AppColors.cream,
          ),
          decoration: const InputDecoration(
            counterText: '',
            hintText: '••••••',
          ),
          validator: (v) => RegExp(r'^\d{6}$').hasMatch(v ?? '')
              ? null
              : 'Enter the 6-digit code',
          onChanged: (v) {
            if (v.length == 6) onCompleted();
          },
        ),
      ],
    );
  }
}

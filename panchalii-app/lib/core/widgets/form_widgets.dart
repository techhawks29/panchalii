import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_theme.dart';

/// Labelled text field in the Panchalii style; password fields get a show/hide toggle.
class LabeledField extends StatefulWidget {
  final String label;
  final TextEditingController controller;
  final String? hint;
  final TextInputType? keyboardType;
  final TextInputAction textInputAction;
  final Iterable<String>? autofillHints;
  final bool obscure;
  final String? Function(String?)? validator;
  final ValueChanged<String>? onSubmitted;

  const LabeledField({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.keyboardType,
    this.textInputAction = TextInputAction.next,
    this.autofillHints,
    this.obscure = false,
    this.validator,
    this.onSubmitted,
  });

  @override
  State<LabeledField> createState() => _LabeledFieldState();
}

class _LabeledFieldState extends State<LabeledField> {
  late bool _hidden = widget.obscure;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label.toUpperCase(),
          style: GoogleFonts.instrumentSans(
            fontSize: 10,
            letterSpacing: 2.2,
            color: AppColors.creamMuted,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: widget.controller,
          keyboardType: widget.keyboardType,
          textInputAction: widget.textInputAction,
          autofillHints: widget.autofillHints,
          obscureText: _hidden,
          autocorrect: false,
          enableSuggestions: !widget.obscure,
          validator: widget.validator,
          onFieldSubmitted: widget.onSubmitted,
          cursorColor: AppColors.gold,
          style: GoogleFonts.instrumentSans(
            fontSize: 15,
            color: AppColors.cream,
          ),
          decoration: InputDecoration(
            hintText: widget.hint,
            errorStyle: GoogleFonts.instrumentSans(
              fontSize: 11,
              color: const Color(0xFFE5484D),
            ),
            errorBorder: const OutlineInputBorder(
              borderRadius: BorderRadius.zero,
              borderSide: BorderSide(color: Color(0xFFE5484D)),
            ),
            focusedErrorBorder: const OutlineInputBorder(
              borderRadius: BorderRadius.zero,
              borderSide: BorderSide(color: Color(0xFFE5484D)),
            ),
            suffixIcon: widget.obscure
                ? IconButton(
                    tooltip: _hidden ? 'Show password' : 'Hide password',
                    icon: Icon(
                      _hidden
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      size: 18,
                      color: AppColors.creamMuted,
                    ),
                    onPressed: () => setState(() => _hidden = !_hidden),
                  )
                : null,
          ),
        ),
      ],
    );
  }
}

/// Full-width filled gold button with a loading state.
class GoldButton extends StatelessWidget {
  final String label;
  final bool loading;
  final VoidCallback? onPressed;
  const GoldButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.gold.withOpacity(
        onPressed == null && !loading ? 0.5 : 1,
      ),
      child: InkWell(
        onTap: loading ? null : onPressed,
        splashColor: AppColors.goldLight,
        child: SizedBox(
          height: 52,
          child: Center(
            child: loading
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 1.5,
                      color: AppColors.bgDark,
                    ),
                  )
                : Text(
                    label.toUpperCase(),
                    style: GoogleFonts.instrumentSans(
                      fontSize: 12,
                      letterSpacing: 3,
                      fontWeight: FontWeight.w600,
                      color: AppColors.bgDark,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

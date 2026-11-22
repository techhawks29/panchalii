import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../widgets/auth_shell.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/form_widgets.dart';
import '../../../core/utils/messages.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _detailsKey = GlobalKey<FormState>();
  final _codeKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _otpController = TextEditingController();
  bool _verifying = false;
  bool _loading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  String get _email => _emailController.text.trim();

  Future<void> _run(
    GlobalKey<FormState> form,
    Future<void> Function() action,
  ) async {
    if (_loading) return;
    if (!(form.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    setState(() => _loading = true);
    try {
      await action();
    } catch (e) {
      if (mounted) showAppMessage(context, apiErrorMessage(e), isError: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _createAccount() => _run(_detailsKey, () async {
    await ref
        .read(authNotifierProvider.notifier)
        .register(
          _nameController.text.trim(),
          _email,
          _phoneController.text.replaceAll(RegExp(r'\D'), ''),
          _passwordController.text,
        );
    if (!mounted) return;
    setState(() => _verifying = true);
    showAppMessage(context, 'We sent a 6-digit code to $_email');
  });

  Future<void> _verify() => _run(_codeKey, () async {
    await ref
        .read(authNotifierProvider.notifier)
        .verifyRegistration(_email, _otpController.text.trim());
    if (!mounted) return;
    showAppMessage(
      context,
      'Welcome to Panchalii, ${_nameController.text.trim().split(' ').first}',
    );
    context.go('/');
  });

  @override
  Widget build(BuildContext context) {
    return AuthShell(
      eyebrow: _verifying ? 'ONE LAST STEP' : 'JOIN PANCHALII',
      title: _verifying ? 'Verify Email' : 'Create Account',
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: _verifying ? _codeStep() : _detailsStep(),
      ),
    );
  }

  Widget _detailsStep() => Form(
    key: _detailsKey,
    child: AutofillGroup(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          LabeledField(
            label: 'Full name',
            controller: _nameController,
            hint: 'As you would like to be addressed',
            keyboardType: TextInputType.name,
            autofillHints: const [AutofillHints.name],
            validator: (v) =>
                (v?.trim().length ?? 0) < 2 ? 'Enter your name' : null,
          ),
          const SizedBox(height: 18),
          LabeledField(
            label: 'Email',
            controller: _emailController,
            hint: 'you@example.com',
            keyboardType: TextInputType.emailAddress,
            autofillHints: const [AutofillHints.email],
            validator: validateEmail,
          ),
          const SizedBox(height: 18),
          LabeledField(
            label: 'Mobile number',
            controller: _phoneController,
            hint: '10-digit mobile number',
            keyboardType: TextInputType.phone,
            autofillHints: const [AutofillHints.telephoneNumberNational],
            validator: validateIndianPhone,
          ),
          const SizedBox(height: 18),
          LabeledField(
            label: 'Password',
            controller: _passwordController,
            hint: 'At least 8 characters',
            obscure: true,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.newPassword],
            validator: (v) =>
                (v ?? '').length < 8 ? 'Use at least 8 characters' : null,
            onSubmitted: (_) => _createAccount(),
          ),
          const SizedBox(height: 26),
          GoldButton(
            label: 'Create account →',
            loading: _loading,
            onPressed: _createAccount,
          ),
          const SizedBox(height: 22),
          Container(height: 1, color: AppColors.border),
          const SizedBox(height: 10),
          AuthLink(
            text: 'Already have an account? Sign in →',
            onTap: () =>
                context.canPop() ? context.pop() : context.go('/auth/login'),
          ),
        ],
      ),
    ),
  );

  Widget _codeStep() => Form(
    key: _codeKey,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text.rich(
          TextSpan(
            children: [
              const TextSpan(text: 'Enter the code we sent to\n'),
              TextSpan(
                text: _email,
                style: GoogleFonts.instrumentSans(
                  color: AppColors.cream,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          textAlign: TextAlign.center,
          style: GoogleFonts.instrumentSans(
            fontSize: 13,
            height: 1.6,
            color: AppColors.creamMuted,
          ),
        ),
        const SizedBox(height: 22),
        OtpCodeField(controller: _otpController, onCompleted: _verify),
        const SizedBox(height: 26),
        GoldButton(
          label: 'Verify & continue →',
          loading: _loading,
          onPressed: _verify,
        ),
        const SizedBox(height: 22),
        Container(height: 1, color: AppColors.border),
        const SizedBox(height: 10),
        AuthLink(
          text: 'Use a different email',
          onTap: () => setState(() {
            _verifying = false;
            _otpController.clear();
          }),
        ),
      ],
    ),
  );
}

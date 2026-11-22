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

enum _Mode { email, phone }

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  _Mode _mode = _Mode.email;
  bool _otpSent = false;
  bool _loading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _run(Future<void> Function() action) async {
    if (_loading) return;
    if (!(_formKey.currentState?.validate() ?? false)) return;
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

  void _done() => context.canPop() ? context.pop() : context.go('/');

  Future<void> _signInWithEmail() => _run(() async {
    await ref
        .read(authNotifierProvider.notifier)
        .loginEmail(_emailController.text.trim(), _passwordController.text);
    if (mounted) _done();
  });

  Future<void> _sendOtp() => _run(() async {
    await ref.read(authNotifierProvider.notifier).sendOtp(_phone, 'phone');
    if (!mounted) return;
    setState(() => _otpSent = true);
    showAppMessage(context, 'Code sent to +91 $_phone');
  });

  Future<void> _verifyOtp() => _run(() async {
    await ref
        .read(authNotifierProvider.notifier)
        .loginOtp(_phone, _otpController.text.trim());
    if (mounted) _done();
  });

  String get _phone => _phoneController.text.replaceAll(RegExp(r'\D'), '');

  void _switchMode(_Mode mode) {
    if (mode == _mode) return;
    _formKey.currentState?.reset();
    setState(() {
      _mode = mode;
      _otpSent = false;
      _otpController.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    return AuthShell(
      eyebrow: 'WELCOME BACK',
      title: 'Sign In',
      child: Form(
        key: _formKey,
        child: AutofillGroup(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  _ModeTab(
                    label: 'Email',
                    active: _mode == _Mode.email,
                    onTap: () => _switchMode(_Mode.email),
                  ),
                  _ModeTab(
                    label: 'Phone OTP',
                    active: _mode == _Mode.phone,
                    onTap: () => _switchMode(_Mode.phone),
                  ),
                ],
              ),
              const SizedBox(height: 26),
              if (_mode == _Mode.email)
                ..._emailFields()
              else
                ..._phoneFields(),
              const SizedBox(height: 26),
              GoldButton(
                label: _mode == _Mode.email
                    ? 'Sign in →'
                    : (_otpSent ? 'Verify & sign in →' : 'Send code →'),
                loading: _loading,
                onPressed: _mode == _Mode.email
                    ? _signInWithEmail
                    : (_otpSent ? _verifyOtp : _sendOtp),
              ),
              const SizedBox(height: 22),
              Container(height: 1, color: AppColors.border),
              const SizedBox(height: 10),
              AuthLink(
                text: 'New here? Create an account →',
                onTap: () => context.push('/auth/register'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _emailFields() => [
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
      label: 'Password',
      controller: _passwordController,
      obscure: true,
      textInputAction: TextInputAction.done,
      autofillHints: const [AutofillHints.password],
      validator: (v) => (v ?? '').isEmpty ? 'Enter your password' : null,
      onSubmitted: (_) => _signInWithEmail(),
    ),
  ];

  List<Widget> _phoneFields() => [
    LabeledField(
      label: 'Mobile number',
      controller: _phoneController,
      hint: '10-digit mobile number',
      keyboardType: TextInputType.phone,
      textInputAction: _otpSent ? TextInputAction.next : TextInputAction.done,
      autofillHints: const [AutofillHints.telephoneNumberNational],
      validator: validateIndianPhone,
      onSubmitted: (_) => _otpSent ? null : _sendOtp(),
    ),
    if (_otpSent) ...[
      const SizedBox(height: 18),
      OtpCodeField(controller: _otpController, onCompleted: _verifyOtp),
      Align(
        alignment: Alignment.centerRight,
        child: AuthLink(
          text: 'Resend code',
          onTap: _loading ? () {} : _sendOtp,
        ),
      ),
    ],
  ];
}

class _ModeTab extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _ModeTab({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => Expanded(
    child: Semantics(
      selected: active,
      button: true,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: active ? AppColors.gold : AppColors.border,
                width: active ? 1.5 : 1,
              ),
            ),
          ),
          child: Text(
            label.toUpperCase(),
            textAlign: TextAlign.center,
            style: GoogleFonts.instrumentSans(
              fontSize: 11,
              letterSpacing: 2.5,
              fontWeight: FontWeight.w600,
              color: active
                  ? AppColors.gold
                  : AppColors.creamMuted.withOpacity(0.7),
            ),
          ),
        ),
      ),
    ),
  );
}

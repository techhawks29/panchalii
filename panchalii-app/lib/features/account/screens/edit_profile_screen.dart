import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/api/api_client.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../../../core/utils/messages.dart';
import '../../../core/widgets/form_widgets.dart';
import '../../auth/models/user_model.dart';
import '../../auth/providers/auth_provider.dart';

const _supportEmail = 'hello@panchalii.in';

class EditProfileScreen extends ConsumerWidget {
  const EditProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'EDIT PROFILE',
          style: GoogleFonts.instrumentSans(
            fontSize: 11,
            letterSpacing: 3,
            color: AppColors.creamMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      body: auth.when(
        loading: () => const Center(
          child: CircularProgressIndicator(
            color: AppColors.gold,
            strokeWidth: 1.5,
          ),
        ),
        error: (e, _) => Center(
          child: Text(
            apiErrorMessage(e),
            style: GoogleFonts.instrumentSans(color: AppColors.creamMuted),
          ),
        ),
        data: (user) {
          if (user == null) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (context.mounted) context.go('/account/profile');
            });
            return const SizedBox.shrink();
          }
          return _EditProfile(user: user);
        },
      ),
    );
  }
}

class _EditProfile extends ConsumerStatefulWidget {
  final UserModel user;
  const _EditProfile({required this.user});
  @override
  ConsumerState<_EditProfile> createState() => _EditProfileState();
}

class _EditProfileState extends ConsumerState<_EditProfile> {
  final _detailsKey = GlobalKey<FormState>();
  final _passwordKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.user.name);
  final _current = TextEditingController();
  final _new = TextEditingController();
  final _confirm = TextEditingController();
  bool _savingDetails = false;
  bool _savingPassword = false;

  @override
  void initState() {
    super.initState();
    _name.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    for (final c in [_name, _current, _new, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  bool get _nameChanged => _name.text.trim() != widget.user.name;

  Future<void> _saveDetails() async {
    if (_savingDetails ||
        !_nameChanged ||
        !(_detailsKey.currentState?.validate() ?? false))
      return;
    FocusScope.of(context).unfocus();
    setState(() => _savingDetails = true);
    try {
      await ref
          .read(dioProvider)
          .patch('/me/profile', data: {'name': _name.text.trim()});
      ref.invalidate(authStateProvider);
      if (mounted) showAppMessage(context, 'Your details are saved');
    } catch (e) {
      if (mounted) showAppMessage(context, apiErrorMessage(e), isError: true);
    } finally {
      if (mounted) setState(() => _savingDetails = false);
    }
  }

  Future<void> _savePassword() async {
    if (_savingPassword || !(_passwordKey.currentState?.validate() ?? false))
      return;
    FocusScope.of(context).unfocus();
    setState(() => _savingPassword = true);
    try {
      final res = await ref
          .read(dioProvider)
          .patch(
            '/me/change-password',
            data: {
              if (widget.user.hasPassword) 'currentPassword': _current.text,
              'newPassword': _new.text,
            },
          );
      // Other devices are signed out; keep this one signed in with the new tokens
      final tokens = res.data['tokens'];
      if (tokens != null)
        await saveTokens(
          tokens['access']['token'] as String,
          tokens['refresh']['token'] as String,
        );
      _passwordKey.currentState?.reset();
      for (final c in [_current, _new, _confirm]) {
        c.clear();
      }
      ref.invalidate(authStateProvider);
      if (mounted)
        showAppMessage(
          context,
          widget.user.hasPassword
              ? 'Password updated. Other devices have been signed out.'
              : 'Password set. You can now sign in with your email.',
        );
    } catch (e) {
      if (mounted) showAppMessage(context, apiErrorMessage(e), isError: true);
    } finally {
      if (mounted) setState(() => _savingPassword = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final u = widget.user;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 40),
      children: [
        _Header(
          user: u,
          previewName: _name.text.trim().isEmpty ? u.name : _name.text.trim(),
        ),
        const SizedBox(height: 34),

        const _SectionTitle(number: '01', title: 'Personal Details'),
        const SizedBox(height: 18),
        Form(
          key: _detailsKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              LabeledField(
                label: 'Full name',
                controller: _name,
                keyboardType: TextInputType.name,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.name],
                validator: (v) {
                  final n = v?.trim() ?? '';
                  if (n.length < 2) return 'Enter your name';
                  if (n.length > 60) return 'Keep it under 60 characters';
                  return null;
                },
                onSubmitted: (_) => _saveDetails(),
              ),
              const SizedBox(height: 18),
              _LockedField(label: 'Email', value: u.email),
              const SizedBox(height: 18),
              _LockedField(
                label: 'Mobile number',
                value: (u.phone ?? '').isEmpty ? 'Not added' : '+91 ${u.phone}',
              ),
              const SizedBox(height: 10),
              Text.rich(
                TextSpan(
                  children: [
                    const TextSpan(
                      text: 'To change your email or mobile number, write to ',
                    ),
                    WidgetSpan(
                      alignment: PlaceholderAlignment.baseline,
                      baseline: TextBaseline.alphabetic,
                      child: GestureDetector(
                        onTap: () async {
                          await Clipboard.setData(
                            const ClipboardData(text: _supportEmail),
                          );
                          if (context.mounted)
                            showAppMessage(context, 'Email address copied');
                        },
                        child: Text(
                          _supportEmail,
                          style: GoogleFonts.instrumentSans(
                            fontSize: 11.5,
                            color: AppColors.gold,
                            decoration: TextDecoration.underline,
                            decorationColor: AppColors.gold,
                          ),
                        ),
                      ),
                    ),
                    const TextSpan(
                      text: ' — we verify these to keep your account safe.',
                    ),
                  ],
                ),
                style: GoogleFonts.instrumentSans(
                  fontSize: 11.5,
                  height: 1.6,
                  color: AppColors.creamMuted.withOpacity(0.8),
                ),
              ),
              const SizedBox(height: 22),
              GoldButton(
                label: 'Save details →',
                loading: _savingDetails,
                onPressed: _nameChanged ? _saveDetails : null,
              ),
            ],
          ),
        ),

        const SizedBox(height: 44),
        _SectionTitle(
          number: '02',
          title: u.hasPassword ? 'Change Password' : 'Set a Password',
        ),
        const SizedBox(height: 8),
        Text(
          u.hasPassword
              ? 'Changing your password signs you out on your other devices.'
              : 'You signed up with Google. Add a password to also sign in with your email.',
          style: GoogleFonts.instrumentSans(
            fontSize: 12,
            height: 1.5,
            color: AppColors.creamMuted,
          ),
        ),
        const SizedBox(height: 18),
        Form(
          key: _passwordKey,
          child: AutofillGroup(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (u.hasPassword) ...[
                  LabeledField(
                    label: 'Current password',
                    controller: _current,
                    obscure: true,
                    autofillHints: const [AutofillHints.password],
                    validator: (v) => (v ?? '').isEmpty
                        ? 'Enter your current password'
                        : null,
                  ),
                  const SizedBox(height: 18),
                ],
                LabeledField(
                  label: 'New password',
                  controller: _new,
                  hint: 'At least 8 characters',
                  obscure: true,
                  autofillHints: const [AutofillHints.newPassword],
                  validator: (v) {
                    final p = v ?? '';
                    if (p.length < 8) return 'Use at least 8 characters';
                    if (u.hasPassword && p == _current.text)
                      return 'Choose a password different from your current one';
                    return null;
                  },
                ),
                const SizedBox(height: 18),
                LabeledField(
                  label: 'Confirm new password',
                  controller: _confirm,
                  obscure: true,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.newPassword],
                  validator: (v) =>
                      v != _new.text ? "Passwords don't match" : null,
                  onSubmitted: (_) => _savePassword(),
                ),
                const SizedBox(height: 22),
                _OutlineButton(
                  label: u.hasPassword ? 'Update password' : 'Set password',
                  loading: _savingPassword,
                  onPressed: _savePassword,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _Header extends StatelessWidget {
  final UserModel user;
  final String previewName;
  const _Header({required this.user, required this.previewName});

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Container(
        width: 72,
        height: 72,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: AppColors.bgDark,
          border: Border.all(color: AppColors.gold.withOpacity(0.6)),
        ),
        alignment: Alignment.center,
        child: Text(
          previewName.characters.first.toUpperCase(),
          style: GoogleFonts.cormorantGaramond(
            fontSize: 32,
            color: AppColors.gold,
          ),
        ),
      ),
      const SizedBox(width: 18),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'YOUR ACCOUNT',
              style: GoogleFonts.instrumentSans(
                fontSize: 9.5,
                letterSpacing: 3,
                fontWeight: FontWeight.w600,
                color: AppColors.gold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              previewName,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.cormorantGaramond(
                fontSize: 28,
                height: 1.1,
                color: AppColors.cream,
              ),
            ),
            if (user.createdAt != null) ...[
              const SizedBox(height: 4),
              Text(
                'Member since ${dateLabel(user.createdAt!)}',
                style: GoogleFonts.instrumentSans(
                  fontSize: 11.5,
                  color: AppColors.creamMuted,
                ),
              ),
            ],
          ],
        ),
      ),
    ],
  );
}

class _SectionTitle extends StatelessWidget {
  final String number, title;
  const _SectionTitle({required this.number, required this.title});
  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.baseline,
    textBaseline: TextBaseline.alphabetic,
    children: [
      Text(
        number,
        style: GoogleFonts.cormorantGaramond(
          fontSize: 18,
          color: AppColors.gold,
        ),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: Text(
          title,
          style: GoogleFonts.cormorantGaramond(
            fontSize: 26,
            color: AppColors.cream,
          ),
        ),
      ),
    ],
  );
}

class _LockedField extends StatelessWidget {
  final String label, value;
  const _LockedField({required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Semantics(
    label: '$label, $value, cannot be edited here',
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: GoogleFonts.instrumentSans(
            fontSize: 10,
            letterSpacing: 2.2,
            color: AppColors.creamMuted,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
          decoration: BoxDecoration(
            color: AppColors.bgDark.withOpacity(0.6),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  value,
                  style: GoogleFonts.instrumentSans(
                    fontSize: 15,
                    color: AppColors.creamMuted,
                  ),
                ),
              ),
              Icon(
                Icons.lock_outline,
                size: 16,
                color: AppColors.creamMuted.withOpacity(0.6),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

class _OutlineButton extends StatelessWidget {
  final String label;
  final bool loading;
  final VoidCallback onPressed;
  const _OutlineButton({
    required this.label,
    required this.loading,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: loading ? null : onPressed,
    child: Container(
      height: 52,
      alignment: Alignment.center,
      decoration: BoxDecoration(border: Border.all(color: AppColors.gold)),
      child: loading
          ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 1.5,
                color: AppColors.gold,
              ),
            )
          : Text(
              '${label.toUpperCase()} →',
              style: GoogleFonts.instrumentSans(
                fontSize: 12,
                letterSpacing: 3,
                fontWeight: FontWeight.w600,
                color: AppColors.gold,
              ),
            ),
    ),
  );
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/messages.dart';
import '../../../core/widgets/form_widgets.dart';
import '../../auth/providers/auth_provider.dart';
import '../widgets/address_sheet.dart';

final addressesProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
      final user = await ref.watch(authStateProvider.future);
      if (user == null) return const [];
      final res = await ref.read(dioProvider).get('/me/addresses');
      return (res.data['data'] as List)
          .map((a) => Map<String, dynamic>.from(a as Map))
          .toList();
    });

class AddressesScreen extends ConsumerStatefulWidget {
  const AddressesScreen({super.key});
  @override
  ConsumerState<AddressesScreen> createState() => _AddressesScreenState();
}

class _AddressesScreenState extends ConsumerState<AddressesScreen> {
  String? _busyId;

  Future<void> _add() async {
    final name = ref.read(authStateProvider).valueOrNull?.name;
    final saved = await showAddressSheet(context, defaultName: name);
    if (saved != null && mounted) {
      ref.invalidate(addressesProvider);
      showAppMessage(context, 'Address saved');
    }
  }

  Future<void> _edit(Map<String, dynamic> a) async {
    final saved = await showAddressSheet(context, existing: a);
    if (saved != null && mounted) {
      ref.invalidate(addressesProvider);
      showAppMessage(context, 'Address updated');
    }
  }

  Future<void> _makeDefault(Map<String, dynamic> a) async {
    await _run(
      a,
      () => ref
          .read(dioProvider)
          .patch('/me/addresses/${a['_id']}', data: {'isDefault': true}),
      'Default address updated',
    );
  }

  Future<void> _remove(Map<String, dynamic> a) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bgDark,
        shape: const RoundedRectangleBorder(
          side: BorderSide(color: AppColors.border),
        ),
        title: Text(
          'Remove this address?',
          style: GoogleFonts.cormorantGaramond(
            fontSize: 24,
            color: AppColors.cream,
          ),
        ),
        content: Text(
          '${a['label'] ?? 'Address'} · ${a['line1']}, ${a['city']}${a['isDefault'] == true ? '\n\nYour most recent other address will become the default.' : ''}',
          style: GoogleFonts.instrumentSans(
            fontSize: 13,
            height: 1.5,
            color: AppColors.creamMuted,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            style: TextButton.styleFrom(foregroundColor: AppColors.creamMuted),
            child: Text(
              'KEEP',
              style: GoogleFonts.instrumentSans(
                fontSize: 11,
                letterSpacing: 2,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFFE5797D),
            ),
            child: Text(
              'REMOVE',
              style: GoogleFonts.instrumentSans(
                fontSize: 11,
                letterSpacing: 2,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
    if (ok == true)
      await _run(
        a,
        () => ref.read(dioProvider).delete('/me/addresses/${a['_id']}'),
        'Address removed',
      );
  }

  Future<void> _run(
    Map<String, dynamic> a,
    Future<void> Function() call,
    String done,
  ) async {
    if (_busyId != null) return;
    setState(() => _busyId = a['_id'] as String);
    try {
      await call();
      await ref.refresh(addressesProvider.future);
      if (mounted) showAppMessage(context, done);
    } catch (e) {
      if (mounted) showAppMessage(context, apiErrorMessage(e), isError: true);
    } finally {
      if (mounted) setState(() => _busyId = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = ref.watch(authStateProvider).valueOrNull != null;
    final addresses = ref.watch(addressesProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'SAVED ADDRESSES',
          style: GoogleFonts.instrumentSans(
            fontSize: 11,
            letterSpacing: 3,
            color: AppColors.creamMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      body: !signedIn && !addresses.isLoading
          ? _Message(
              title: 'Sign in to manage addresses',
              body: 'Save your delivery addresses for a quicker checkout.',
              action: 'Sign in →',
              onAction: () => context.push('/auth/login'),
            )
          : addresses.when(
              loading: () => const Center(
                child: CircularProgressIndicator(
                  color: AppColors.gold,
                  strokeWidth: 1.5,
                ),
              ),
              error: (e, _) => _Message(
                title: "Couldn't load addresses",
                body: apiErrorMessage(e),
                action: 'Retry',
                onAction: () => ref.invalidate(addressesProvider),
              ),
              data: (list) => list.isEmpty
                  ? _Message(
                      title: 'No saved addresses',
                      body: 'Add an address now and checkout will fill it in for you.',
                      action: 'Add an address →',
                      onAction: _add,
                    )
                  : RefreshIndicator(
                      color: AppColors.gold,
                      backgroundColor: AppColors.bgDark,
                      onRefresh: () => ref.refresh(addressesProvider.future),
                      child: ListView(
                        padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
                        children: [
                          Text(
                            'DELIVERY',
                            style: GoogleFonts.instrumentSans(
                              fontSize: 10,
                              letterSpacing: 3.5,
                              color: AppColors.gold,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Your Addresses',
                            style: GoogleFonts.cormorantGaramond(
                              fontSize: 34,
                              fontWeight: FontWeight.w300,
                              color: AppColors.cream,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Your default address is selected first at checkout.',
                            style: GoogleFonts.instrumentSans(
                              fontSize: 12,
                              color: AppColors.creamMuted,
                            ),
                          ),
                          const SizedBox(height: 22),
                          for (final a in list) ...[
                            _AddressCard(
                              address: a,
                              busy: _busyId == a['_id'],
                              onEdit: () => _edit(a),
                              onRemove: () => _remove(a),
                              onMakeDefault: () => _makeDefault(a),
                            ),
                            const SizedBox(height: 14),
                          ],
                          InkWell(
                            onTap: _add,
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 18),
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: AppColors.gold.withOpacity(0.45),
                                ),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                '+  ADD A NEW ADDRESS',
                                style: GoogleFonts.instrumentSans(
                                  fontSize: 10.5,
                                  letterSpacing: 2.5,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.gold,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
            ),
    );
  }
}

class _AddressCard extends StatelessWidget {
  final Map<String, dynamic> address;
  final bool busy;
  final VoidCallback onEdit, onRemove, onMakeDefault;
  const _AddressCard({
    required this.address,
    required this.busy,
    required this.onEdit,
    required this.onRemove,
    required this.onMakeDefault,
  });

  @override
  Widget build(BuildContext context) {
    final a = address;
    final isDefault = a['isDefault'] == true;
    final lines = [
      a['line1'],
      a['line2'],
    ].where((l) => (l as String?)?.isNotEmpty ?? false).join(', ');
    return AnimatedOpacity(
      duration: const Duration(milliseconds: 150),
      opacity: busy ? 0.5 : 1,
      child: Container(
        decoration: BoxDecoration(
          color: isDefault
              ? AppColors.gold.withOpacity(0.05)
              : AppColors.bgDark,
          border: Border.all(
            color: isDefault
                ? AppColors.gold.withOpacity(0.7)
                : AppColors.border,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 16, 18, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        _labelIcon(a['label'] as String?),
                        size: 15,
                        color: AppColors.gold,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        ((a['label'] as String?) ?? 'Home').toUpperCase(),
                        style: GoogleFonts.instrumentSans(
                          fontSize: 9.5,
                          letterSpacing: 2.2,
                          fontWeight: FontWeight.w600,
                          color: AppColors.gold,
                        ),
                      ),
                      const Spacer(),
                      if (isDefault)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          color: AppColors.gold,
                          child: Text(
                            'DEFAULT',
                            style: GoogleFonts.instrumentSans(
                              fontSize: 8,
                              letterSpacing: 1.8,
                              fontWeight: FontWeight.w700,
                              color: AppColors.bgDark,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    a['name'] as String? ?? '',
                    style: GoogleFonts.cormorantGaramond(
                      fontSize: 20,
                      color: AppColors.cream,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$lines\n${a['city']}, ${a['state']} — ${a['pincode']}',
                    style: GoogleFonts.instrumentSans(
                      fontSize: 12.5,
                      height: 1.55,
                      color: AppColors.creamMuted,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '+91 ${a['phone']}',
                    style: GoogleFonts.instrumentSans(
                      fontSize: 12,
                      color: AppColors.creamMuted.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
            Container(height: 1, color: AppColors.border),
            Row(
              children: [
                _Action(text: 'Edit', onTap: busy ? null : onEdit),
                _divider(),
                if (!isDefault) ...[
                  _Action(
                    text: 'Set as default',
                    onTap: busy ? null : onMakeDefault,
                  ),
                  _divider(),
                ],
                _Action(
                  text: 'Remove',
                  onTap: busy ? null : onRemove,
                  danger: true,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  static Widget _divider() =>
      Container(width: 1, height: 44, color: AppColors.border);

  static IconData _labelIcon(String? label) => switch (label) {
    'Work' => Icons.work_outline,
    'Other' => Icons.place_outlined,
    _ => Icons.home_outlined,
  };
}

class _Action extends StatelessWidget {
  final String text;
  final VoidCallback? onTap;
  final bool danger;
  const _Action({required this.text, required this.onTap, this.danger = false});

  @override
  Widget build(BuildContext context) => Expanded(
    child: InkWell(
      onTap: onTap,
      child: SizedBox(
        height: 44,
        child: Center(
          child: Text(
            text.toUpperCase(),
            style: GoogleFonts.instrumentSans(
              fontSize: 9.5,
              letterSpacing: 2,
              fontWeight: FontWeight.w600,
              color: danger ? const Color(0xFFE5797D) : AppColors.gold,
            ),
          ),
        ),
      ),
    ),
  );
}

class _Message extends StatelessWidget {
  final String title, body, action;
  final VoidCallback onAction;
  const _Message({
    required this.title,
    required this.body,
    required this.action,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) => Center(
    child: SingleChildScrollView(
      padding: const EdgeInsets.all(36),
      child: Column(
        children: [
          Container(
            width: 76,
            height: 76,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.gold.withOpacity(0.35)),
            ),
            child: Icon(
              Icons.place_outlined,
              size: 30,
              color: AppColors.gold.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 26),
          Text(
            'SAVED ADDRESSES',
            style: GoogleFonts.instrumentSans(
              fontSize: 10,
              letterSpacing: 3.5,
              color: AppColors.gold,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            textAlign: TextAlign.center,
            style: GoogleFonts.cormorantGaramond(
              fontSize: 30,
              fontWeight: FontWeight.w300,
              color: AppColors.cream,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            body,
            textAlign: TextAlign.center,
            style: GoogleFonts.instrumentSans(
              fontSize: 13,
              height: 1.6,
              color: AppColors.creamMuted,
            ),
          ),
          const SizedBox(height: 30),
          GoldButton(label: action, onPressed: onAction),
        ],
      ),
    ),
  );
}

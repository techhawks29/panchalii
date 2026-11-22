import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../../../core/utils/messages.dart';
import '../../../core/widgets/form_widgets.dart';
import '../../auth/providers/auth_provider.dart';

final notificationsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
      final user = await ref.watch(authStateProvider.future);
      if (user == null) return const [];
      final res = await ref.read(dioProvider).get('/me/notifications');
      return (res.data['data'] as List)
          .map((n) => Map<String, dynamic>.from(n as Map))
          .toList();
    });

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});
  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  // Marked read locally so the dot clears instantly, before the list reloads
  final _readIds = <String>{};

  bool _isRead(Map n) => n['isRead'] == true || _readIds.contains(n['_id']);

  Future<void> _open(Map<String, dynamic> n) async {
    final id = n['_id'] as String;
    if (!_isRead(n)) {
      setState(() => _readIds.add(id));
      ref
          .read(dioProvider)
          .patch('/me/notifications/$id/read')
          .catchError((_) => null);
    }
    final link = (n['link'] as String?) ?? '';
    if (link.startsWith('/')) context.push(link);
  }

  Future<void> _markAllRead(List<Map<String, dynamic>> items) async {
    setState(() => _readIds.addAll(items.map((n) => n['_id'] as String)));
    try {
      await ref.read(dioProvider).patch('/me/notifications/read-all');
    } catch (e) {
      if (mounted) showAppMessage(context, apiErrorMessage(e), isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final signedIn = ref.watch(authStateProvider).valueOrNull != null;
    final notifications = ref.watch(notificationsProvider);
    final items = notifications.valueOrNull ?? const <Map<String, dynamic>>[];
    final unread = items.where((n) => !_isRead(n)).length;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'NOTIFICATIONS',
          style: GoogleFonts.instrumentSans(
            fontSize: 11,
            letterSpacing: 3,
            color: AppColors.creamMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
        actions: [
          if (unread > 0)
            TextButton(
              onPressed: () => _markAllRead(items),
              style: TextButton.styleFrom(foregroundColor: AppColors.gold),
              child: Text(
                'MARK ALL READ',
                style: GoogleFonts.instrumentSans(
                  fontSize: 9.5,
                  letterSpacing: 1.8,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
      body: !signedIn && !notifications.isLoading
          ? _Message(
              title: 'Sign in for updates',
              body:
                  'Order updates, offers and new collections will appear here.',
              action: 'Sign in →',
              onAction: () => context.push('/auth/login'),
            )
          : notifications.when(
              loading: () => const Center(
                child: CircularProgressIndicator(
                  color: AppColors.gold,
                  strokeWidth: 1.5,
                ),
              ),
              error: (e, _) => _Message(
                title: "Couldn't load notifications",
                body: apiErrorMessage(e),
                action: 'Retry',
                onAction: () => ref.invalidate(notificationsProvider),
              ),
              data: (list) => list.isEmpty
                  ? _Message(
                      title: "You're all caught up",
                      body: 'Order updates, offers and new collections will appear here.',
                      action: 'Explore collections →',
                      onAction: () => context.go('/shop'),
                    )
                  : RefreshIndicator(
                      color: AppColors.gold,
                      backgroundColor: AppColors.bgDark,
                      onRefresh: () async {
                        _readIds.clear();
                        await ref.refresh(notificationsProvider.future);
                      },
                      child: ListView(
                        padding: const EdgeInsets.only(bottom: 32),
                        children: [
                          for (final group in _grouped(list)) ...[
                            _GroupLabel(group.$1),
                            for (final n in group.$2)
                              _NotificationTile(
                                item: n,
                                read: _isRead(n),
                                onTap: () => _open(n),
                              ),
                          ],
                        ],
                      ),
                    ),
            ),
    );
  }

  static List<(String, List<Map<String, dynamic>>)> _grouped(
    List<Map<String, dynamic>> list,
  ) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final groups = <String, List<Map<String, dynamic>>>{};
    for (final n in list) {
      final d = parseDate(n['createdAt']);
      final label = d == null
          ? 'EARLIER'
          : !d.isBefore(today)
          ? 'TODAY'
          : !d.isBefore(today.subtract(const Duration(days: 1)))
          ? 'YESTERDAY'
          : !d.isBefore(today.subtract(const Duration(days: 7)))
          ? 'THIS WEEK'
          : 'EARLIER';
      groups.putIfAbsent(label, () => []).add(n);
    }
    return [for (final e in groups.entries) (e.key, e.value)];
  }
}

class _GroupLabel extends StatelessWidget {
  final String text;
  const _GroupLabel(this.text);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 22, 20, 8),
    child: Text(
      text,
      style: GoogleFonts.instrumentSans(
        fontSize: 9.5,
        letterSpacing: 3,
        fontWeight: FontWeight.w600,
        color: AppColors.gold,
      ),
    ),
  );
}

class _NotificationTile extends StatelessWidget {
  final Map<String, dynamic> item;
  final bool read;
  final VoidCallback onTap;
  const _NotificationTile({
    required this.item,
    required this.read,
    required this.onTap,
  });

  static IconData _icon(String? type) => switch (type) {
    'order' => Icons.inventory_2_outlined,
    'promotion' => Icons.local_offer_outlined,
    'review' => Icons.star_outline,
    'wallet' => Icons.account_balance_wallet_outlined,
    _ => Icons.notifications_none,
  };

  @override
  Widget build(BuildContext context) {
    final when = parseDate(item['createdAt']);
    final hasLink = ((item['link'] as String?) ?? '').startsWith('/');
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 16, 16),
        decoration: BoxDecoration(
          color: read ? Colors.transparent : AppColors.gold.withOpacity(0.05),
          border: const Border(bottom: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: AppColors.gold.withOpacity(read ? 0.25 : 0.6),
                ),
              ),
              child: Icon(
                _icon(item['type'] as String?),
                size: 18,
                color: AppColors.gold.withOpacity(read ? 0.55 : 1),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item['title'] as String? ?? '',
                          style: GoogleFonts.cormorantGaramond(
                            fontSize: 18,
                            height: 1.15,
                            fontWeight: read
                                ? FontWeight.w400
                                : FontWeight.w600,
                            color: AppColors.cream,
                          ),
                        ),
                      ),
                      if (!read) ...[
                        const SizedBox(width: 8),
                        Transform.rotate(
                          angle: 0.785,
                          child: Container(
                            width: 6,
                            height: 6,
                            color: AppColors.gold,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item['body'] as String? ?? '',
                    style: GoogleFonts.instrumentSans(
                      fontSize: 12.5,
                      height: 1.5,
                      color: AppColors.creamMuted.withOpacity(read ? 0.75 : 1),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      if (when != null)
                        Text(
                          dateTimeLabel(when),
                          style: GoogleFonts.instrumentSans(
                            fontSize: 10.5,
                            color: AppColors.creamMuted.withOpacity(0.6),
                          ),
                        ),
                      if (hasLink) ...[
                        const Spacer(),
                        Text(
                          'VIEW',
                          style: GoogleFonts.instrumentSans(
                            fontSize: 9,
                            letterSpacing: 2,
                            color: AppColors.gold,
                          ),
                        ),
                        const Icon(
                          Icons.chevron_right,
                          size: 14,
                          color: AppColors.gold,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
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
              Icons.notifications_none,
              size: 30,
              color: AppColors.gold.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 26),
          Text(
            'NOTIFICATIONS',
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

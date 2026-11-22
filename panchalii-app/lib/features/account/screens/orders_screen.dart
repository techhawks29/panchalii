import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../../../core/utils/messages.dart';
import '../../../core/widgets/form_widgets.dart';
import '../../auth/providers/auth_provider.dart';
import '../widgets/order_status.dart';

final ordersProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((
  ref,
) async {
  final res = await ref
      .read(dioProvider)
      .get('/me/orders', queryParameters: {'limit': 50});
  return (res.data['data'] as List)
      .map((o) => Map<String, dynamic>.from(o as Map))
      .toList();
});

class OrdersScreen extends ConsumerWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(ordersProvider);
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'MY ORDERS',
          style: GoogleFonts.instrumentSans(
            fontSize: 11,
            letterSpacing: 3,
            color: AppColors.creamMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      body: orders.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(20),
          children: List.generate(
            3,
            (_) => Container(
              height: 150,
              margin: const EdgeInsets.only(bottom: 14),
              color: AppColors.bgCard,
            ),
          ),
        ),
        error: (e, _) => _Message(
          eyebrow: 'MY ORDERS',
          title: "Couldn't load orders",
          body: apiErrorMessage(e),
          action: 'Retry',
          onAction: () => ref.invalidate(ordersProvider),
        ),
        data: (list) => list.isEmpty
            ? _Message(
                eyebrow: 'MY ORDERS',
                title: 'No orders yet',
                body: 'When you buy a saree, you can follow it here from our weavers to your door.',
                action: 'Explore collections →',
                onAction: () => context.go('/shop'),
              )
            : RefreshIndicator(
                color: AppColors.gold,
                backgroundColor: AppColors.bgDark,
                onRefresh: () => ref.refresh(ordersProvider.future),
                child: ListView.separated(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (_, i) => _OrderCard(order: list[i]),
                ),
              ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Map<String, dynamic> order;
  const _OrderCard({required this.order});

  @override
  Widget build(BuildContext context) {
    final items = (order['items'] as List? ?? const []).cast<Map>();
    final pieces = items.fold<int>(
      0,
      (n, i) => n + ((i['qty'] as num?)?.toInt() ?? 0),
    );
    final placed = parseDate(order['createdAt']);
    final first = items.isNotEmpty ? items.first : null;
    final more = items.length - 1;

    return InkWell(
      onTap: () => context.push('/account/orders/${order['_id']}'),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.bgDark,
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'ORDER ${order['orderNumber'] ?? ''}',
                          style: GoogleFonts.instrumentSans(
                            fontSize: 9.5,
                            letterSpacing: 2,
                            fontWeight: FontWeight.w600,
                            color: AppColors.gold,
                          ),
                        ),
                        if (placed != null) ...[
                          const SizedBox(height: 3),
                          Text(
                            'Placed ${dateLabel(placed)}',
                            style: GoogleFonts.instrumentSans(
                              fontSize: 11.5,
                              color: AppColors.creamMuted,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  OrderStatusBadge(status: order['status'] as String?),
                ],
              ),
            ),
            Container(height: 1, color: AppColors.border),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  _Thumb(url: first?['image'] as String?),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          first?['name'] as String? ?? '',
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.cormorantGaramond(
                            fontSize: 18,
                            height: 1.15,
                            color: AppColors.cream,
                          ),
                        ),
                        if (more > 0) ...[
                          const SizedBox(height: 3),
                          Text(
                            '+ $more more ${more == 1 ? 'saree' : 'sarees'}',
                            style: GoogleFonts.instrumentSans(
                              fontSize: 11.5,
                              color: AppColors.creamMuted,
                            ),
                          ),
                        ],
                        const SizedBox(height: 8),
                        Text(
                          piecesLabel(pieces),
                          style: GoogleFonts.instrumentSans(
                            fontSize: 9,
                            letterSpacing: 2,
                            color: AppColors.creamMuted.withOpacity(0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        inr((order['total'] as num?) ?? 0),
                        style: GoogleFonts.cormorantGaramond(
                          fontSize: 22,
                          color: AppColors.cream,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Text(
                            'DETAILS',
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
                      ),
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

class _Thumb extends StatelessWidget {
  final String? url;
  const _Thumb({this.url});
  @override
  Widget build(BuildContext context) => Container(
    width: 60,
    height: 78,
    decoration: BoxDecoration(
      color: AppColors.bgCard,
      border: Border.all(color: AppColors.border),
    ),
    child: (url == null || url!.isEmpty)
        ? null
        : CachedNetworkImage(
            imageUrl: url!,
            fit: BoxFit.cover,
            errorWidget: (_, __, ___) => const SizedBox.shrink(),
          ),
  );
}

class _Message extends StatelessWidget {
  final String eyebrow, title, body, action;
  final VoidCallback onAction;
  const _Message({
    required this.eyebrow,
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
              Icons.inventory_2_outlined,
              size: 28,
              color: AppColors.gold.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 26),
          Text(
            eyebrow,
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
              fontSize: 32,
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

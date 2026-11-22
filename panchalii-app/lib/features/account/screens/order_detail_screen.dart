import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../../../core/utils/messages.dart';
import '../../../core/widgets/form_widgets.dart';
import '../../auth/providers/auth_provider.dart';
import '../widgets/order_status.dart';

const _supportEmail = 'hello@panchalii.in';

final orderDetailProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, String>((ref, id) async {
      final res = await ref.read(dioProvider).get('/me/orders/$id');
      return Map<String, dynamic>.from(res.data['data'] as Map);
    });

class OrderDetailScreen extends ConsumerWidget {
  final String id;
  const OrderDetailScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final order = ref.watch(orderDetailProvider(id));
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'ORDER DETAILS',
          style: GoogleFonts.instrumentSans(
            fontSize: 11,
            letterSpacing: 3,
            color: AppColors.creamMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      body: order.when(
        loading: () => const Center(
          child: CircularProgressIndicator(
            color: AppColors.gold,
            strokeWidth: 1.5,
          ),
        ),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(36),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  "Couldn't load this order",
                  style: GoogleFonts.cormorantGaramond(
                    fontSize: 28,
                    color: AppColors.cream,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  apiErrorMessage(e),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.instrumentSans(
                    fontSize: 13,
                    color: AppColors.creamMuted,
                  ),
                ),
                const SizedBox(height: 26),
                GoldButton(
                  label: 'Retry',
                  onPressed: () => ref.invalidate(orderDetailProvider(id)),
                ),
              ],
            ),
          ),
        ),
        data: (o) => RefreshIndicator(
          color: AppColors.gold,
          backgroundColor: AppColors.bgDark,
          onRefresh: () => ref.refresh(orderDetailProvider(id).future),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 36),
            children: [
              _Header(order: o),
              const SizedBox(height: 26),
              _Tracker(order: o),
              if ((o['trackingNumber'] as String?)?.isNotEmpty ?? false) ...[
                const SizedBox(height: 14),
                _TrackingNumber(number: o['trackingNumber'] as String),
              ],
              const SizedBox(height: 34),
              _Section(
                title: 'Items',
                trailing: piecesLabel(_pieces(o)),
                child: Column(
                  children: [
                    for (final item in (o['items'] as List? ?? const []))
                      _ItemRow(item: Map<String, dynamic>.from(item as Map)),
                  ],
                ),
              ),
              const SizedBox(height: 22),
              _PaymentSummary(order: o),
              if (o['address'] is Map) ...[
                const SizedBox(height: 34),
                _Section(
                  title: 'Delivering to',
                  child: _Address(
                    address: Map<String, dynamic>.from(o['address'] as Map),
                  ),
                ),
              ],
              const SizedBox(height: 34),
              _Help(orderNumber: o['orderNumber'] as String? ?? ''),
            ],
          ),
        ),
      ),
    );
  }

  static int _pieces(Map o) => (o['items'] as List? ?? const []).fold<int>(
    0,
    (n, i) => n + (((i as Map)['qty'] as num?)?.toInt() ?? 0),
  );
}

class _Header extends StatelessWidget {
  final Map<String, dynamic> order;
  const _Header({required this.order});

  @override
  Widget build(BuildContext context) {
    final placed = parseDate(order['createdAt']);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'ORDER ${order['orderNumber'] ?? ''}',
                style: GoogleFonts.instrumentSans(
                  fontSize: 10,
                  letterSpacing: 2.5,
                  fontWeight: FontWeight.w600,
                  color: AppColors.gold,
                ),
              ),
            ),
            OrderStatusBadge(status: order['status'] as String?),
          ],
        ),
        const SizedBox(height: 10),
        Text(
          _headline(order['status'] as String?),
          style: GoogleFonts.cormorantGaramond(
            fontSize: 34,
            height: 1.1,
            fontWeight: FontWeight.w300,
            color: AppColors.cream,
          ),
        ),
        if (placed != null) ...[
          const SizedBox(height: 6),
          Text(
            'Placed on ${dateLabel(placed)}',
            style: GoogleFonts.instrumentSans(
              fontSize: 12.5,
              color: AppColors.creamMuted,
            ),
          ),
        ],
      ],
    );
  }

  static String _headline(String? status) => switch (status) {
    'pending' => 'Awaiting payment',
    'confirmed' => 'Your order is confirmed',
    'processing' => 'Being prepared for you',
    'shipped' => 'On its way to you',
    'delivered' => 'Delivered with love',
    'cancelled' => 'This order was cancelled',
    'refunded' => 'This order was refunded',
    _ => 'Your order',
  };
}

/// Placed → Confirmed → Shipped → Delivered, derived from status (timeline entries are optional).
class _Tracker extends StatelessWidget {
  final Map<String, dynamic> order;
  const _Tracker({required this.order});

  static const _steps = [
    ('placed', 'Placed'),
    ('confirmed', 'Confirmed'),
    ('shipped', 'Shipped'),
    ('delivered', 'Delivered'),
  ];

  int get _reached => switch (order['status']) {
    'confirmed' || 'processing' => 1,
    'shipped' => 2,
    'delivered' => 3,
    _ => 0,
  };

  DateTime? _dateFor(String step) {
    if (step == 'placed') return parseDate(order['createdAt']);
    if (step == 'confirmed') {
      final paidAt = parseDate((order['payment'] as Map?)?['paidAt']);
      if (paidAt != null) return paidAt;
    }
    final events = (order['timeline'] as List? ?? const []).cast<Map>().where(
      (e) => e['status'] == step,
    );
    return events.isEmpty ? null : parseDate(events.first['at']);
  }

  @override
  Widget build(BuildContext context) {
    final status = order['status'] as String?;
    if (status == 'cancelled' || status == 'refunded') {
      final s = OrderStatusStyle.of(status);
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: s.color.withOpacity(0.08),
          border: Border.all(color: s.color.withOpacity(0.4)),
        ),
        child: Text(
          status == 'refunded'
              ? 'Your refund has been issued to your original payment method. It can take 5–7 working days to appear.'
              : 'This order was cancelled. If you were charged, the amount will be refunded to your original payment method.',
          style: GoogleFonts.instrumentSans(
            fontSize: 12.5,
            height: 1.55,
            color: AppColors.cream,
          ),
        ),
      );
    }

    final reached = _reached;
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 18, 14, 16),
      decoration: BoxDecoration(
        color: AppColors.bgDark,
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          for (var i = 0; i < _steps.length; i++)
            Expanded(
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 1.5,
                          color: i == 0
                              ? Colors.transparent
                              : (i <= reached
                                    ? AppColors.gold
                                    : AppColors.border),
                        ),
                      ),
                      _StepDot(done: i <= reached, current: i == reached),
                      Expanded(
                        child: Container(
                          height: 1.5,
                          color: i == _steps.length - 1
                              ? Colors.transparent
                              : (i < reached
                                    ? AppColors.gold
                                    : AppColors.border),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _steps[i].$2.toUpperCase(),
                    style: GoogleFonts.instrumentSans(
                      fontSize: 8.5,
                      letterSpacing: 1.6,
                      fontWeight: FontWeight.w600,
                      color: i <= reached
                          ? AppColors.cream
                          : AppColors.creamMuted.withOpacity(0.55),
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    i <= reached
                        ? (() {
                            final d = _dateFor(_steps[i].$1);
                            return d == null ? '' : dateLabel(d);
                          })()
                        : '',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.instrumentSans(
                      fontSize: 9.5,
                      color: AppColors.creamMuted.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _StepDot extends StatelessWidget {
  final bool done, current;
  const _StepDot({required this.done, required this.current});
  @override
  Widget build(BuildContext context) => Transform.rotate(
    angle: 0.785,
    child: Container(
      width: current ? 13 : 10,
      height: current ? 13 : 10,
      decoration: BoxDecoration(
        color: done ? AppColors.gold : AppColors.bgDark,
        border: Border.all(
          color: done ? AppColors.gold : AppColors.border,
          width: 1.2,
        ),
      ),
    ),
  );
}

class _TrackingNumber extends StatelessWidget {
  final String number;
  const _TrackingNumber({required this.number});

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: () async {
      await Clipboard.setData(ClipboardData(text: number));
      if (context.mounted) showAppMessage(context, 'Tracking number copied');
    },
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(border: Border.all(color: AppColors.border)),
      child: Row(
        children: [
          Text(
            'TRACKING NO.',
            style: GoogleFonts.instrumentSans(
              fontSize: 9,
              letterSpacing: 2,
              color: AppColors.creamMuted,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              number,
              style: GoogleFonts.instrumentSans(
                fontSize: 13.5,
                color: AppColors.cream,
              ),
            ),
          ),
          const Icon(Icons.copy_outlined, size: 15, color: AppColors.gold),
        ],
      ),
    ),
  );
}

class _Section extends StatelessWidget {
  final String title;
  final String? trailing;
  final Widget child;
  const _Section({required this.title, required this.child, this.trailing});

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Row(
        crossAxisAlignment: CrossAxisAlignment.baseline,
        textBaseline: TextBaseline.alphabetic,
        children: [
          Expanded(
            child: Text(
              title,
              style: GoogleFonts.cormorantGaramond(
                fontSize: 25,
                color: AppColors.cream,
              ),
            ),
          ),
          if (trailing != null)
            Text(
              trailing!,
              style: GoogleFonts.instrumentSans(
                fontSize: 9,
                letterSpacing: 2,
                color: AppColors.creamMuted,
              ),
            ),
        ],
      ),
      const SizedBox(height: 8),
      child,
    ],
  );
}

class _ItemRow extends StatelessWidget {
  final Map<String, dynamic> item;
  const _ItemRow({required this.item});

  @override
  Widget build(BuildContext context) {
    final product = item['product'];
    final slug = product is Map ? product['slug'] as String? : null;
    final qty = (item['qty'] as num?) ?? 1;
    final price = (item['price'] as num?) ?? 0;
    final line = (item['lineTotal'] as num?) ?? price * qty;
    final image = (item['image'] as String?)?.isNotEmpty == true
        ? item['image'] as String
        : (product is Map && (product['images'] as List?)?.isNotEmpty == true
              ? (product['images'] as List).first as String
              : null);

    return InkWell(
      onTap: slug == null ? null : () => context.push('/product/$slug'),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.border)),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 74,
              decoration: BoxDecoration(
                color: AppColors.bgCard,
                border: Border.all(color: AppColors.border),
              ),
              child: image == null
                  ? null
                  : CachedNetworkImage(
                      imageUrl: image,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => const SizedBox.shrink(),
                    ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['name'] as String? ?? '',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.cormorantGaramond(
                      fontSize: 17.5,
                      height: 1.15,
                      color: AppColors.cream,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'QTY $qty  ·  ${inr(price)} EACH',
                    style: GoogleFonts.instrumentSans(
                      fontSize: 9.5,
                      letterSpacing: 1.6,
                      color: AppColors.creamMuted,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Text(
              inr(line),
              style: GoogleFonts.instrumentSans(
                fontSize: 14,
                color: AppColors.cream,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentSummary extends StatelessWidget {
  final Map<String, dynamic> order;
  const _PaymentSummary({required this.order});

  @override
  Widget build(BuildContext context) {
    num n(String k) => (order[k] as num?) ?? 0;
    final payment = order['payment'] as Map? ?? const {};
    final paid = payment['status'] == 'paid';
    final paidAt = parseDate(payment['paidAt']);

    Widget line(String label, String value, {Color? color}) => Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Text(
            label,
            style: GoogleFonts.instrumentSans(
              fontSize: 10,
              letterSpacing: 2,
              color: AppColors.creamMuted,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.instrumentSans(
              fontSize: 13,
              color: color ?? AppColors.cream,
            ),
          ),
        ],
      ),
    );

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.bgDark,
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          line('SUBTOTAL', inr(n('subtotal'))),
          if (n('couponDiscount') > 0)
            line(
              'COUPON ${(order['couponCode'] as String? ?? '').toUpperCase()}',
              '− ${inr(n('couponDiscount'))}',
              color: AppColors.gold,
            ),
          if (n('walletAmountUsed') > 0)
            line(
              'WALLET',
              '− ${inr(n('walletAmountUsed'))}',
              color: AppColors.gold,
            ),
          if (n('loyaltyPointsUsed') > 0)
            line(
              'LOYALTY POINTS',
              '− ${inr(n('loyaltyPointsUsed'))}',
              color: AppColors.gold,
            ),
          line(
            'SHIPPING',
            n('shippingCharge') == 0
                ? 'Complimentary'
                : inr(n('shippingCharge')),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 10),
            child: Divider(height: 1),
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                paid ? 'TOTAL PAID' : 'TOTAL',
                style: GoogleFonts.instrumentSans(
                  fontSize: 11,
                  letterSpacing: 3,
                  color: AppColors.gold,
                ),
              ),
              const Spacer(),
              Text(
                inr(n('total')),
                style: GoogleFonts.cormorantGaramond(
                  fontSize: 28,
                  height: 1,
                  color: AppColors.cream,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              paid
                  ? 'Paid online${paidAt != null ? ' · ${dateTimeLabel(paidAt)}' : ''}'
                  : 'Payment not completed',
              style: GoogleFonts.instrumentSans(
                fontSize: 10.5,
                color: paid
                    ? AppColors.creamMuted.withOpacity(0.7)
                    : const Color(0xFFE0B354),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Address extends StatelessWidget {
  final Map<String, dynamic> address;
  const _Address({required this.address});

  @override
  Widget build(BuildContext context) {
    final a = address;
    final lines = [
      a['line1'],
      a['line2'],
    ].where((l) => (l as String?)?.isNotEmpty ?? false).join(', ');
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.bgDark,
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            a['name'] as String? ?? '',
            style: GoogleFonts.cormorantGaramond(
              fontSize: 19,
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
          if ((a['phone'] as String?)?.isNotEmpty ?? false) ...[
            const SizedBox(height: 4),
            Text(
              '+91 ${a['phone']}',
              style: GoogleFonts.instrumentSans(
                fontSize: 12,
                color: AppColors.creamMuted.withOpacity(0.8),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Help extends StatelessWidget {
  final String orderNumber;
  const _Help({required this.orderNumber});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      border: Border.all(color: AppColors.gold.withOpacity(0.35)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'NEED HELP WITH THIS ORDER?',
          style: GoogleFonts.instrumentSans(
            fontSize: 9.5,
            letterSpacing: 2.2,
            fontWeight: FontWeight.w600,
            color: AppColors.gold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Write to us at $_supportEmail and mention order $orderNumber. We reply within a day.',
          style: GoogleFonts.instrumentSans(
            fontSize: 12.5,
            height: 1.55,
            color: AppColors.creamMuted,
          ),
        ),
        const SizedBox(height: 6),
        Align(
          alignment: Alignment.centerLeft,
          child: TextButton(
            onPressed: () async {
              await Clipboard.setData(const ClipboardData(text: _supportEmail));
              if (context.mounted)
                showAppMessage(context, 'Email address copied');
            },
            style: TextButton.styleFrom(
              foregroundColor: AppColors.gold,
              padding: EdgeInsets.zero,
              shape: const RoundedRectangleBorder(),
            ),
            child: Text(
              'COPY EMAIL ADDRESS',
              style: GoogleFonts.instrumentSans(
                fontSize: 10,
                letterSpacing: 2,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    ),
  );
}

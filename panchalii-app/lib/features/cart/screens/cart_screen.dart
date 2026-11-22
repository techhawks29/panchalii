import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../providers/cart_provider.dart';

const _freeShippingThreshold = 999.0;
const _shippingFee = 99.0;

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(cartNotifierProvider);
    final notifier = ref.read(cartNotifierProvider.notifier);
    final subtotal = notifier.subtotal;
    final shipping = subtotal >= _freeShippingThreshold ? 0.0 : _shippingFee;
    final pieces = items.fold<int>(0, (n, i) => n + i.qty);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          items.isEmpty ? 'YOUR BAG' : 'YOUR BAG ($pieces)',
          style: GoogleFonts.instrumentSans(
            fontSize: 11,
            letterSpacing: 3,
            color: AppColors.creamMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      body: items.isEmpty
          ? const _EmptyBag()
          : Column(
              children: [
                _ShippingProgress(subtotal: subtotal),
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                    itemCount: items.length,
                    separatorBuilder: (_, __) =>
                        Container(height: 1, color: AppColors.border),
                    itemBuilder: (_, i) => _BagItem(
                      item: items[i],
                      onMinus: () => notifier.updateQty(
                        items[i].productId,
                        items[i].qty - 1,
                      ),
                      onPlus: () => notifier.updateQty(
                        items[i].productId,
                        items[i].qty + 1,
                      ),
                      onRemove: () => notifier.removeItem(items[i].productId),
                    ),
                  ),
                ),
                _Summary(subtotal: subtotal, shipping: shipping),
              ],
            ),
    );
  }
}

class _EmptyBag extends StatelessWidget {
  const _EmptyBag();

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.gold.withOpacity(0.3)),
            ),
            child: Icon(
              Icons.shopping_bag_outlined,
              size: 32,
              color: AppColors.gold.withOpacity(0.5),
            ),
          ),
          const SizedBox(height: 32),
          Text(
            'YOUR BAG',
            style: GoogleFonts.instrumentSans(
              fontSize: 9,
              letterSpacing: 3,
              color: AppColors.gold,
            ),
          ),
          const SizedBox(height: 6),
          Container(width: 40, height: 1, color: AppColors.gold),
          const SizedBox(height: 20),
          Text(
            'Is Empty',
            style: GoogleFonts.cormorantGaramond(
              fontSize: 34,
              fontWeight: FontWeight.w300,
              color: AppColors.cream,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'A story in every drape awaits you.',
            style: GoogleFonts.cormorantGaramond(
              fontSize: 17,
              fontStyle: FontStyle.italic,
              color: AppColors.creamMuted,
            ),
          ),
          const SizedBox(height: 40),
          _GoldButton(
            label: 'EXPLORE COLLECTIONS',
            filled: false,
            onTap: () => context.go('/shop'),
          ),
          const SizedBox(height: 12),
          _GoldButton(
            label: 'SHOP NEW ARRIVALS',
            filled: true,
            onTap: () => context.go('/shop?sort=newest'),
          ),
        ],
      ),
    ),
  );
}

class _ShippingProgress extends StatelessWidget {
  final double subtotal;
  const _ShippingProgress({required this.subtotal});

  @override
  Widget build(BuildContext context) {
    final remaining = _freeShippingThreshold - subtotal;
    final unlocked = remaining <= 0;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      color: AppColors.bgDark,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            unlocked
                ? 'YOU HAVE UNLOCKED FREE SHIPPING'
                : 'ADD ${inr(remaining)} MORE FOR FREE SHIPPING',
            style: GoogleFonts.instrumentSans(
              fontSize: 9,
              letterSpacing: 2,
              color: unlocked ? AppColors.gold : AppColors.creamMuted,
            ),
          ),
          const SizedBox(height: 10),
          Stack(
            children: [
              Container(height: 2, color: AppColors.border),
              FractionallySizedBox(
                widthFactor: (subtotal / _freeShippingThreshold).clamp(
                  0.0,
                  1.0,
                ),
                child: Container(height: 2, color: AppColors.gold),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BagItem extends StatelessWidget {
  final CartItem item;
  final VoidCallback onMinus, onPlus, onRemove;
  const _BagItem({
    required this.item,
    required this.onMinus,
    required this.onPlus,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 18),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 88,
          height: 116,
          decoration: BoxDecoration(
            color: AppColors.bgCard,
            border: Border.all(color: AppColors.border),
          ),
          child: item.image.isEmpty
              ? const _Thumb()
              : CachedNetworkImage(
                  imageUrl: item.image,
                  fit: BoxFit.cover,
                  errorWidget: (_, __, ___) => const _Thumb(),
                ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: SizedBox(
            height: 116,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        item.name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.cormorantGaramond(
                          fontSize: 18,
                          height: 1.15,
                          color: AppColors.cream,
                        ),
                      ),
                    ),
                    InkWell(
                      onTap: onRemove,
                      child: Padding(
                        padding: const EdgeInsets.only(left: 8, bottom: 8),
                        child: Icon(
                          Icons.close,
                          size: 16,
                          color: AppColors.creamMuted.withOpacity(0.6),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  inr(item.price),
                  style: GoogleFonts.instrumentSans(
                    fontSize: 13,
                    color: AppColors.creamMuted,
                  ),
                ),
                const Spacer(),
                Row(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: AppColors.gold.withOpacity(0.5),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _step(Icons.remove, onMinus),
                          SizedBox(
                            width: 32,
                            child: Text(
                              '${item.qty}',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.instrumentSans(
                                fontSize: 13,
                                color: AppColors.cream,
                              ),
                            ),
                          ),
                          _step(Icons.add, onPlus),
                        ],
                      ),
                    ),
                    const Spacer(),
                    Text(
                      inr((item.price * item.qty)),
                      style: GoogleFonts.instrumentSans(
                        fontSize: 15,
                        color: AppColors.cream,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );

  Widget _step(IconData icon, VoidCallback onTap) => InkWell(
    onTap: onTap,
    child: SizedBox(
      width: 34,
      height: 34,
      child: Icon(icon, size: 14, color: AppColors.gold),
    ),
  );
}

class _Summary extends StatelessWidget {
  final double subtotal, shipping;
  const _Summary({required this.subtotal, required this.shipping});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.fromLTRB(24, 20, 24, 20),
    decoration: const BoxDecoration(
      color: AppColors.bgDark,
      border: Border(top: BorderSide(color: AppColors.border)),
    ),
    child: Column(
      children: [
        _line('SUBTOTAL', inr(subtotal)),
        const SizedBox(height: 8),
        _line('SHIPPING', shipping == 0 ? 'Complimentary' : inr(shipping)),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Container(height: 1, color: AppColors.border),
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              'TOTAL',
              style: GoogleFonts.instrumentSans(
                fontSize: 11,
                letterSpacing: 3,
                color: AppColors.gold,
              ),
            ),
            const Spacer(),
            Text(
              inr((subtotal + shipping)),
              style: GoogleFonts.cormorantGaramond(
                fontSize: 28,
                height: 1,
                color: AppColors.cream,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Align(
          alignment: Alignment.centerRight,
          child: Text(
            'Inclusive of all taxes',
            style: GoogleFonts.instrumentSans(
              fontSize: 10,
              color: AppColors.creamMuted.withOpacity(0.6),
            ),
          ),
        ),
        const SizedBox(height: 18),
        _GoldButton(
          label: 'PROCEED TO CHECKOUT  →',
          filled: true,
          onTap: () => context.push('/checkout'),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.lock_outline,
              size: 12,
              color: AppColors.creamMuted.withOpacity(0.6),
            ),
            const SizedBox(width: 6),
            Text(
              'SECURE CHECKOUT VIA RAZORPAY',
              style: GoogleFonts.instrumentSans(
                fontSize: 8,
                letterSpacing: 2,
                color: AppColors.creamMuted.withOpacity(0.6),
              ),
            ),
          ],
        ),
      ],
    ),
  );

  Widget _line(String label, String value) => Row(
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
        style: GoogleFonts.instrumentSans(fontSize: 13, color: AppColors.cream),
      ),
    ],
  );
}

class _GoldButton extends StatelessWidget {
  final String label;
  final bool filled;
  final VoidCallback onTap;
  const _GoldButton({
    required this.label,
    required this.filled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    child: Container(
      width: double.infinity,
      height: 50,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: filled ? AppColors.gold : Colors.transparent,
        border: Border.all(color: AppColors.gold),
      ),
      child: Text(
        label,
        style: GoogleFonts.instrumentSans(
          fontSize: 11,
          letterSpacing: 2.5,
          fontWeight: FontWeight.w600,
          color: filled ? AppColors.bgDark : AppColors.gold,
        ),
      ),
    ),
  );
}

class _Thumb extends StatelessWidget {
  const _Thumb();
  @override
  Widget build(BuildContext context) => Container(
    decoration: const BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF2A3D2A), AppColors.bgDark],
      ),
    ),
    child: Center(
      child: Text(
        'P',
        style: GoogleFonts.cormorantGaramond(
          fontSize: 28,
          color: AppColors.gold.withOpacity(0.3),
        ),
      ),
    ),
  );
}

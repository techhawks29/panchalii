import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/utils/messages.dart';
import '../../account/providers/wishlist_provider.dart';
import '../../cart/providers/cart_provider.dart';

final _productDetailProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, slug) async {
      final dio = ref.read(dioProvider);
      final res = await dio.get('/public/products/$slug');
      return res.data['data'] as Map<String, dynamic>;
    });

class ProductScreen extends ConsumerStatefulWidget {
  final String slug;
  const ProductScreen({super.key, required this.slug});
  @override
  ConsumerState<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends ConsumerState<ProductScreen> {
  int _qty = 1;
  int _imageIdx = 0;
  bool _adding = false;

  Future<void> _add(String id, {bool checkout = false}) async {
    setState(() => _adding = true);
    await ref.read(cartNotifierProvider.notifier).addItem(id, _qty);
    if (!mounted) return;
    setState(() => _adding = false);
    if (checkout) {
      context.push('/checkout');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.bgDark,
          shape: const Border(top: BorderSide(color: AppColors.gold)),
          content: Text(
            'ADDED TO BAG',
            style: GoogleFonts.instrumentSans(
              fontSize: 10,
              letterSpacing: 2.5,
              color: AppColors.gold,
            ),
          ),
          action: SnackBarAction(
            label: 'VIEW',
            textColor: AppColors.cream,
            onPressed: () => context.go('/cart'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final productAsync = ref.watch(_productDetailProvider(widget.slug));

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: productAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(
            color: AppColors.gold,
            strokeWidth: 1,
          ),
        ),
        error: (_, __) => _ErrorView(
          onBack: () => context.pop(),
          onRetry: () => ref.invalidate(_productDetailProvider(widget.slug)),
        ),
        data: (p) {
          final images = (p['images'] as List? ?? []).cast<String>();
          final price = p['price'] as num;
          final mrp = p['mrp'] as num?;
          final discount = mrp != null && mrp > price
              ? (((mrp - price) / mrp) * 100).round()
              : null;
          final occasions =
              (p['occasion'] as List?)?.cast<String>() ?? const [];
          final inStock = p['inStock'] as bool? ?? true;
          final colour = p['colour'] as Map?;

          return Column(
            children: [
              Expanded(
                child: CustomScrollView(
                  slivers: [
                    SliverToBoxAdapter(child: _gallery(p, images, discount)),
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if ((p['fabric'] as String?)?.isNotEmpty == true)
                              Text(
                                (p['fabric'] as String).toUpperCase(),
                                style: GoogleFonts.instrumentSans(
                                  fontSize: 10,
                                  letterSpacing: 3,
                                  color: AppColors.gold,
                                ),
                              ),
                            const SizedBox(height: 10),
                            Text(
                              p['name'] as String,
                              style: GoogleFonts.cormorantGaramond(
                                fontSize: 34,
                                height: 1.1,
                                fontWeight: FontWeight.w300,
                                color: AppColors.cream,
                              ),
                            ),
                            const SizedBox(height: 14),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  inr(price),
                                  style: GoogleFonts.instrumentSans(
                                    fontSize: 22,
                                    color: AppColors.cream,
                                  ),
                                ),
                                if (discount != null) ...[
                                  const SizedBox(width: 10),
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 2),
                                    child: Text(
                                      inr(mrp!),
                                      style: GoogleFonts.instrumentSans(
                                        fontSize: 14,
                                        color: AppColors.creamMuted.withOpacity(
                                          0.6,
                                        ),
                                        decoration: TextDecoration.lineThrough,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Inclusive of all taxes',
                              style: GoogleFonts.instrumentSans(
                                fontSize: 11,
                                color: AppColors.creamMuted.withOpacity(0.7),
                              ),
                            ),
                            const SizedBox(height: 28),
                            const _GoldRule(),
                            const SizedBox(height: 24),

                            _sectionLabel('THE DETAILS'),
                            const SizedBox(height: 14),
                            _SpecRow('Fabric', p['fabric'] as String?),
                            _SpecRow('Weave', p['weave'] as String?),
                            _SpecRow(
                              'Colour',
                              colour?['name'] as String?,
                              swatch: colour?['hex'] as String?,
                            ),
                            _SpecRow(
                              'Occasion',
                              occasions.isEmpty ? null : occasions.join(', '),
                            ),

                            if ((p['description'] as String?)?.isNotEmpty ==
                                true) ...[
                              const SizedBox(height: 24),
                              _sectionLabel('THE STORY'),
                              const SizedBox(height: 12),
                              Text(
                                p['description'] as String,
                                style: GoogleFonts.instrumentSans(
                                  fontSize: 14,
                                  height: 1.7,
                                  color: AppColors.creamMuted,
                                ),
                              ),
                            ],

                            const SizedBox(height: 28),
                            _sectionLabel('QUANTITY'),
                            const SizedBox(height: 12),
                            _QtyStepper(
                              qty: _qty,
                              onMinus: _qty > 1
                                  ? () => setState(() => _qty--)
                                  : null,
                              onPlus: () => setState(() => _qty++),
                            ),

                            const SizedBox(height: 32),
                            const _Promises(),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              _actionBar(p['_id'] as String, inStock),
            ],
          );
        },
      ),
    );
  }

  Widget _gallery(
    Map<String, dynamic> product,
    List<String> images,
    int? discount,
  ) {
    final top = MediaQuery.of(context).padding.top;
    return SizedBox(
      height: 520,
      child: Stack(
        children: [
          Positioned.fill(
            child: images.isEmpty
                ? const _ImageFallback()
                : PageView.builder(
                    itemCount: images.length,
                    onPageChanged: (i) => setState(() => _imageIdx = i),
                    itemBuilder: (_, i) => CachedNetworkImage(
                      imageUrl: images[i],
                      fit: BoxFit.cover,
                      placeholder: (_, __) =>
                          Container(color: AppColors.bgCard),
                      errorWidget: (_, __, ___) => const _ImageFallback(),
                    ),
                  ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: 140,
            child: IgnorePointer(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, AppColors.bg],
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            top: top + 8,
            left: 12,
            child: _CircleIcon(
              icon: Icons.arrow_back,
              onTap: () => context.pop(),
            ),
          ),
          Positioned(
            top: top + 8,
            right: 12,
            child: _WishlistHeart(product: product),
          ),
          if (discount != null)
            Positioned(
              bottom: images.length > 1 ? 36 : 22,
              left: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                color: AppColors.gold,
                child: Text(
                  '$discount% OFF',
                  style: GoogleFonts.instrumentSans(
                    fontSize: 9,
                    letterSpacing: 2,
                    fontWeight: FontWeight.w600,
                    color: AppColors.bgDark,
                  ),
                ),
              ),
            ),
          if (images.length > 1)
            Positioned(
              bottom: 20,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  images.length,
                  (i) => AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: i == _imageIdx ? 24 : 8,
                    height: 1.5,
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    color: i == _imageIdx
                        ? AppColors.gold
                        : AppColors.cream.withOpacity(0.35),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _actionBar(String id, bool inStock) => Container(
    padding: EdgeInsets.fromLTRB(
      20,
      14,
      20,
      14 + MediaQuery.of(context).padding.bottom,
    ),
    decoration: const BoxDecoration(
      color: AppColors.bgDark,
      border: Border(top: BorderSide(color: AppColors.border)),
    ),
    child: inStock
        ? Row(
            children: [
              Expanded(
                child: _BarButton(
                  label: 'ADD TO BAG',
                  filled: false,
                  busy: _adding,
                  onTap: _adding ? null : () => _add(id),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _BarButton(
                  label: 'BUY NOW',
                  filled: true,
                  onTap: _adding ? null : () => _add(id, checkout: true),
                ),
              ),
            ],
          )
        : const _BarButton(label: 'SOLD OUT', filled: false, onTap: null),
  );

  Widget _sectionLabel(String text) => Text(
    text,
    style: GoogleFonts.instrumentSans(
      fontSize: 10,
      letterSpacing: 3,
      color: AppColors.gold,
    ),
  );
}

class _SpecRow extends StatelessWidget {
  final String label;
  final String? value;
  final String? swatch;
  const _SpecRow(this.label, this.value, {this.swatch});

  @override
  Widget build(BuildContext context) {
    if (value == null || value!.isEmpty) return const SizedBox.shrink();
    final swatchColor = _parseHex(swatch);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 96,
            child: Text(
              label.toUpperCase(),
              style: GoogleFonts.instrumentSans(
                fontSize: 10,
                letterSpacing: 2,
                color: AppColors.creamMuted.withOpacity(0.7),
              ),
            ),
          ),
          if (swatchColor != null) ...[
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: swatchColor,
                border: Border.all(color: AppColors.border),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Expanded(
            child: Text(
              value!,
              style: GoogleFonts.cormorantGaramond(
                fontSize: 17,
                color: AppColors.cream,
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Color? _parseHex(String? hex) {
    if (hex == null) return null;
    final v = int.tryParse(hex.replaceFirst('#', ''), radix: 16);
    return v == null ? null : Color(0xFF000000 | v);
  }
}

class _QtyStepper extends StatelessWidget {
  final int qty;
  final VoidCallback? onMinus;
  final VoidCallback onPlus;
  const _QtyStepper({
    required this.qty,
    required this.onMinus,
    required this.onPlus,
  });

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      border: Border.all(color: AppColors.gold.withOpacity(0.5)),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _stepBtn(Icons.remove, onMinus),
        SizedBox(
          width: 44,
          child: Text(
            '$qty',
            textAlign: TextAlign.center,
            style: GoogleFonts.instrumentSans(
              fontSize: 14,
              color: AppColors.cream,
            ),
          ),
        ),
        _stepBtn(Icons.add, onPlus),
      ],
    ),
  );

  Widget _stepBtn(IconData icon, VoidCallback? onTap) => InkWell(
    onTap: onTap,
    child: SizedBox(
      width: 44,
      height: 44,
      child: Icon(
        icon,
        size: 16,
        color: onTap == null
            ? AppColors.creamMuted.withOpacity(0.3)
            : AppColors.gold,
      ),
    ),
  );
}

class _Promises extends StatelessWidget {
  const _Promises();

  @override
  Widget build(BuildContext context) {
    const items = [
      (Icons.local_shipping_outlined, 'Free shipping', 'On orders above ₹999'),
      (
        Icons.verified_outlined,
        'Authentic weave',
        'Sourced directly from weavers',
      ),
      (Icons.replay_outlined, 'Easy returns', '7-day return policy'),
    ];
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.bgDark,
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          for (final (icon, title, sub) in items)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                children: [
                  Icon(icon, size: 18, color: AppColors.gold.withOpacity(0.8)),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title.toUpperCase(),
                          style: GoogleFonts.instrumentSans(
                            fontSize: 10,
                            letterSpacing: 2,
                            color: AppColors.cream,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          sub,
                          style: GoogleFonts.instrumentSans(
                            fontSize: 11,
                            color: AppColors.creamMuted.withOpacity(0.7),
                          ),
                        ),
                      ],
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

class _BarButton extends StatelessWidget {
  final String label;
  final bool filled;
  final bool busy;
  final VoidCallback? onTap;
  const _BarButton({
    required this.label,
    required this.filled,
    required this.onTap,
    this.busy = false,
  });

  @override
  Widget build(BuildContext context) {
    final fg = filled ? AppColors.bgDark : AppColors.gold;
    return Opacity(
      opacity: onTap == null && !busy ? 0.5 : 1,
      child: InkWell(
        onTap: onTap,
        child: Container(
          height: 50,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: filled ? AppColors.gold : Colors.transparent,
            border: Border.all(color: AppColors.gold),
          ),
          child: busy
              ? SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 1, color: fg),
                )
              : Text(
                  label,
                  style: GoogleFonts.instrumentSans(
                    fontSize: 11,
                    letterSpacing: 2.5,
                    fontWeight: FontWeight.w600,
                    color: fg,
                  ),
                ),
        ),
      ),
    );
  }
}

class _WishlistHeart extends ConsumerWidget {
  final Map<String, dynamic> product;
  const _WishlistHeart({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(wishlistProvider);
    final saved = ref
        .read(wishlistProvider.notifier)
        .contains(product['_id'] as String);
    return Semantics(
      button: true,
      label: saved ? 'Remove from wishlist' : 'Save to wishlist',
      child: _CircleIcon(
        icon: saved ? Icons.favorite : Icons.favorite_border,
        onTap: () async {
          if (ref.read(authStateProvider).valueOrNull == null) {
            showAppMessage(context, 'Sign in to save sarees to your wishlist');
            context.push('/auth/login');
            return;
          }
          try {
            await ref.read(wishlistProvider.notifier).toggle(product);
            if (context.mounted)
              showAppMessage(
                context,
                saved ? 'Removed from wishlist' : 'Saved to your wishlist',
              );
          } catch (e) {
            if (context.mounted)
              showAppMessage(context, apiErrorMessage(e), isError: true);
          }
        },
      ),
    );
  }
}

class _CircleIcon extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _CircleIcon({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    customBorder: const CircleBorder(),
    child: Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.bgDark.withOpacity(0.75),
        border: Border.all(color: AppColors.gold.withOpacity(0.4)),
      ),
      child: Icon(icon, size: 18, color: AppColors.gold),
    ),
  );
}

class _GoldRule extends StatelessWidget {
  const _GoldRule();
  @override
  Widget build(BuildContext context) => Row(
    children: [
      Expanded(child: Container(height: 1, color: AppColors.border)),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10),
        child: Transform.rotate(
          angle: 0.785,
          child: Container(width: 5, height: 5, color: AppColors.gold),
        ),
      ),
      Expanded(child: Container(height: 1, color: AppColors.border)),
    ],
  );
}

class _ImageFallback extends StatelessWidget {
  const _ImageFallback();
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
        'PANCHALII',
        style: GoogleFonts.cormorantGaramond(
          fontSize: 24,
          letterSpacing: 8,
          color: AppColors.gold.withOpacity(0.3),
        ),
      ),
    ),
  );
}

class _ErrorView extends StatelessWidget {
  final VoidCallback onBack;
  final VoidCallback onRetry;
  const _ErrorView({required this.onBack, required this.onRetry});

  @override
  Widget build(BuildContext context) => SafeArea(
    child: Stack(
      children: [
        Positioned(
          top: 8,
          left: 12,
          child: _CircleIcon(icon: Icons.arrow_back, onTap: onBack),
        ),
        Center(
          child: Padding(
            padding: const EdgeInsets.all(40),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Saree unavailable',
                  style: GoogleFonts.cormorantGaramond(
                    fontSize: 28,
                    fontWeight: FontWeight.w300,
                    color: AppColors.cream,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Check your connection and try again.',
                  style: GoogleFonts.instrumentSans(
                    fontSize: 12,
                    color: AppColors.creamMuted,
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: 160,
                  child: _BarButton(
                    label: 'RETRY',
                    filled: false,
                    onTap: onRetry,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

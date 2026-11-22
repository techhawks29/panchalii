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
import '../../cart/providers/cart_provider.dart';
import '../providers/wishlist_provider.dart';

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final signedIn = ref.watch(authStateProvider).valueOrNull != null;
    final wishlist = ref.watch(wishlistProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'WISHLIST',
          style: GoogleFonts.instrumentSans(
            fontSize: 11,
            letterSpacing: 3,
            color: AppColors.creamMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      body: !signedIn && !wishlist.isLoading
          ? _Message(
              title: 'Sign in to see your wishlist',
              body: 'Save the sarees you love and come back to them anytime.',
              action: 'Sign in →',
              onAction: () => context.push('/auth/login'),
            )
          : wishlist.when(
              loading: () => const Center(
                child: CircularProgressIndicator(
                  color: AppColors.gold,
                  strokeWidth: 1.5,
                ),
              ),
              error: (e, _) => _Message(
                title: "Couldn't load your wishlist",
                body: apiErrorMessage(e),
                action: 'Retry',
                onAction: () => ref.invalidate(wishlistProvider),
              ),
              data: (items) => items.isEmpty
                  ? _Message(
                      title: 'Nothing saved yet',
                      body: 'Tap the heart on any saree to keep it here for later.',
                      action: 'Explore collections →',
                      onAction: () => context.go('/shop'),
                    )
                  : RefreshIndicator(
                      color: AppColors.gold,
                      backgroundColor: AppColors.bgDark,
                      onRefresh: () => ref.refresh(wishlistProvider.future),
                      child: CustomScrollView(
                        slivers: [
                          SliverToBoxAdapter(
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(20, 24, 20, 4),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'SAVED FOR LATER',
                                    style: GoogleFonts.instrumentSans(
                                      fontSize: 10,
                                      letterSpacing: 3.5,
                                      color: AppColors.gold,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    'Your Wishlist',
                                    style: GoogleFonts.cormorantGaramond(
                                      fontSize: 34,
                                      fontWeight: FontWeight.w300,
                                      color: AppColors.cream,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    items.length == 1
                                        ? '1 saree'
                                        : '${items.length} sarees',
                                    style: GoogleFonts.instrumentSans(
                                      fontSize: 12,
                                      color: AppColors.creamMuted,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          SliverPadding(
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                            sliver: SliverGrid(
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 2,
                                    childAspectRatio: 0.47,
                                    crossAxisSpacing: 14,
                                    mainAxisSpacing: 22,
                                  ),
                              delegate: SliverChildBuilderDelegate(
                                (_, i) => _WishCard(product: items[i]),
                                childCount: items.length,
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

class _WishCard extends ConsumerStatefulWidget {
  final Map<String, dynamic> product;
  const _WishCard({required this.product});
  @override
  ConsumerState<_WishCard> createState() => _WishCardState();
}

class _WishCardState extends ConsumerState<_WishCard> {
  bool _adding = false;

  Map<String, dynamic> get p => widget.product;

  Future<void> _remove() async {
    try {
      await ref.read(wishlistProvider.notifier).toggle(p);
      if (mounted) showAppMessage(context, 'Removed from wishlist');
    } catch (e) {
      if (mounted) showAppMessage(context, apiErrorMessage(e), isError: true);
    }
  }

  Future<void> _addToBag() async {
    if (_adding) return;
    setState(() => _adding = true);
    await ref
        .read(cartNotifierProvider.notifier)
        .addItem(p['_id'] as String, 1);
    if (!mounted) return;
    setState(() => _adding = false);
    showAppMessage(context, 'Added to bag');
  }

  @override
  Widget build(BuildContext context) {
    final images = (p['images'] as List?)?.cast<String>() ?? const [];
    final price = (p['price'] as num?) ?? 0;
    final mrp = p['mrp'] as num?;
    final inStock = p['inStock'] as bool? ?? true;
    final fabric = p['fabric'] as String?;
    final discount = mrp != null && mrp > price
        ? (((mrp - price) / mrp) * 100).round()
        : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: GestureDetector(
            onTap: () => context.push('/product/${p['slug']}'),
            child: Stack(
              fit: StackFit.expand,
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.bgCard,
                    border: Border.all(color: AppColors.border),
                  ),
                  child: images.isEmpty
                      ? null
                      : CachedNetworkImage(
                          imageUrl: images.first,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) => const SizedBox.shrink(),
                        ),
                ),
                if (!inStock)
                  Container(
                    color: AppColors.bgDark.withOpacity(0.55),
                    alignment: Alignment.center,
                    child: Text(
                      'SOLD OUT',
                      style: GoogleFonts.instrumentSans(
                        fontSize: 10,
                        letterSpacing: 3,
                        fontWeight: FontWeight.w600,
                        color: AppColors.cream,
                      ),
                    ),
                  ),
                if (discount != null && inStock)
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      color: AppColors.gold,
                      child: Text(
                        '$discount% OFF',
                        style: GoogleFonts.instrumentSans(
                          fontSize: 8,
                          letterSpacing: 1.5,
                          fontWeight: FontWeight.w600,
                          color: AppColors.bgDark,
                        ),
                      ),
                    ),
                  ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Semantics(
                    button: true,
                    label: 'Remove from wishlist',
                    child: InkWell(
                      onTap: _remove,
                      customBorder: const CircleBorder(),
                      child: Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.bgDark.withOpacity(0.8),
                          border: Border.all(
                            color: AppColors.gold.withOpacity(0.5),
                          ),
                        ),
                        child: const Icon(
                          Icons.favorite,
                          size: 16,
                          color: AppColors.gold,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 10),
        if (fabric != null && fabric.isNotEmpty)
          Text(
            fabric.toUpperCase(),
            style: GoogleFonts.instrumentSans(
              fontSize: 8,
              letterSpacing: 2,
              color: AppColors.gold.withOpacity(0.8),
            ),
          ),
        const SizedBox(height: 3),
        Text(
          p['name'] as String? ?? '',
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: GoogleFonts.cormorantGaramond(
            fontSize: 16,
            height: 1.2,
            color: AppColors.cream,
          ),
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            Text(
              inr(price),
              style: GoogleFonts.instrumentSans(
                fontSize: 13,
                color: AppColors.cream,
              ),
            ),
            if (discount != null) ...[
              const SizedBox(width: 6),
              Text(
                inr(mrp!),
                style: GoogleFonts.instrumentSans(
                  fontSize: 11,
                  color: AppColors.creamMuted.withOpacity(0.6),
                  decoration: TextDecoration.lineThrough,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 10),
        Opacity(
          opacity: inStock ? 1 : 0.45,
          child: InkWell(
            onTap: inStock ? _addToBag : null,
            child: Container(
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.gold),
              ),
              child: _adding
                  ? const SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(
                        strokeWidth: 1.2,
                        color: AppColors.gold,
                      ),
                    )
                  : Text(
                      inStock ? 'ADD TO BAG' : 'SOLD OUT',
                      style: GoogleFonts.instrumentSans(
                        fontSize: 9.5,
                        letterSpacing: 2.2,
                        fontWeight: FontWeight.w600,
                        color: AppColors.gold,
                      ),
                    ),
            ),
          ),
        ),
      ],
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
              Icons.favorite_border,
              size: 28,
              color: AppColors.gold.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 26),
          Text(
            'WISHLIST',
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

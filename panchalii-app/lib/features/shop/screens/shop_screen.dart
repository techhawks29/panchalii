import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shimmer/shimmer.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../providers/shop_provider.dart';

const _sortLabels = {
  'newest': 'New Arrivals',
  'popular': 'Best Sellers',
  'price_asc': 'Price: Low to High',
  'price_desc': 'Price: High to Low',
};

class ShopScreen extends ConsumerStatefulWidget {
  const ShopScreen({super.key});
  @override
  ConsumerState<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends ConsumerState<ShopScreen> {
  final _searchController = TextEditingController();
  String _sort = 'newest';
  String _search = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(
      productsProvider(ShopFilter(search: _search, sort: _sort)),
    );

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'THE COLLECTION',
          style: GoogleFonts.instrumentSans(
            fontSize: 11,
            letterSpacing: 3,
            color: AppColors.creamMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _header()),
          SliverToBoxAdapter(
            child: _toolbar(productsAsync.valueOrNull?.length),
          ),
          productsAsync.when(
            data: (products) => products.isEmpty
                ? SliverFillRemaining(hasScrollBody: false, child: _empty())
                : _grid(
                    products.length,
                    (i) => _ProductCard(product: products[i] as Map),
                  ),
            loading: () => _grid(6, (_) => const _ShimmerCard()),
            error: (_, __) =>
                SliverFillRemaining(hasScrollBody: false, child: _error()),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
    );
  }

  Widget _header() => Container(
    padding: const EdgeInsets.fromLTRB(20, 28, 20, 20),
    color: AppColors.bgDark,
    child: Column(
      children: [
        Text(
          'DISCOVER',
          style: GoogleFonts.instrumentSans(
            fontSize: 10,
            letterSpacing: 4,
            color: AppColors.gold,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Shop Sarees',
          style: GoogleFonts.cormorantGaramond(
            fontSize: 38,
            fontWeight: FontWeight.w300,
            color: AppColors.cream,
          ),
        ),
        const SizedBox(height: 6),
        const _Diamond(),
        const SizedBox(height: 20),
        TextField(
          controller: _searchController,
          style: GoogleFonts.instrumentSans(
            color: AppColors.cream,
            fontSize: 13,
          ),
          cursorColor: AppColors.gold,
          textInputAction: TextInputAction.search,
          decoration: InputDecoration(
            hintText: 'Search silk, banarasi, kanjivaram…',
            prefixIcon: Icon(
              Icons.search,
              size: 18,
              color: AppColors.gold.withOpacity(0.7),
            ),
            suffixIcon: _search.isNotEmpty
                ? IconButton(
                    icon: const Icon(
                      Icons.close,
                      size: 16,
                      color: AppColors.creamMuted,
                    ),
                    onPressed: () => setState(() {
                      _searchController.clear();
                      _search = '';
                    }),
                  )
                : null,
          ),
          onSubmitted: (v) => setState(() => _search = v.trim()),
        ),
      ],
    ),
  );

  Widget _toolbar(int? count) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
    decoration: const BoxDecoration(
      border: Border(bottom: BorderSide(color: AppColors.border)),
    ),
    child: Row(
      children: [
        Text(
          count == null ? '' : (count == 1 ? '1 PIECE' : '$count PIECES'),
          style: GoogleFonts.instrumentSans(
            fontSize: 10,
            letterSpacing: 2,
            color: AppColors.creamMuted,
          ),
        ),
        const Spacer(),
        InkWell(
          onTap: _showSortSheet,
          child: Row(
            children: [
              Text(
                'SORT: ${_sortLabels[_sort]!.toUpperCase()}',
                style: GoogleFonts.instrumentSans(
                  fontSize: 10,
                  letterSpacing: 2,
                  color: AppColors.gold,
                ),
              ),
              const SizedBox(width: 6),
              const Icon(Icons.tune, size: 14, color: AppColors.gold),
            ],
          ),
        ),
      ],
    ),
  );

  Widget _grid(int count, Widget Function(int) builder) => SliverPadding(
    padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
    sliver: SliverGrid(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.52,
        crossAxisSpacing: 14,
        mainAxisSpacing: 22,
      ),
      delegate: SliverChildBuilderDelegate(
        (_, i) => builder(i),
        childCount: count,
      ),
    ),
  );

  Widget _empty() => _Message(
    title: 'No sarees found',
    body: _search.isEmpty
        ? 'New pieces arrive soon.'
        : 'Try a different search.',
  );

  Widget _error() => _Message(
    title: 'Collection unavailable',
    body: 'Check your connection and try again.',
    action: 'RETRY',
    onAction: () => ref.invalidate(
      productsProvider(ShopFilter(search: _search, sort: _sort)),
    ),
  );

  void _showSortSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.bgDark,
      shape: const RoundedRectangleBorder(),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'SORT BY',
                style: GoogleFonts.instrumentSans(
                  fontSize: 10,
                  letterSpacing: 3,
                  color: AppColors.gold,
                ),
              ),
              const SizedBox(height: 8),
              const _Diamond(),
              const SizedBox(height: 12),
              for (final e in _sortLabels.entries)
                InkWell(
                  onTap: () {
                    setState(() => _sort = e.key);
                    Navigator.pop(sheetContext);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: const BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: AppColors.border),
                      ),
                    ),
                    child: Row(
                      children: [
                        Text(
                          e.value,
                          style: GoogleFonts.cormorantGaramond(
                            fontSize: 20,
                            color: _sort == e.key
                                ? AppColors.gold
                                : AppColors.cream,
                          ),
                        ),
                        const Spacer(),
                        if (_sort == e.key)
                          const Icon(
                            Icons.check,
                            size: 16,
                            color: AppColors.gold,
                          ),
                      ],
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

class _ProductCard extends StatelessWidget {
  final Map product;
  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    final images = product['images'] as List? ?? [];
    final price = product['price'] as num;
    final mrp = product['mrp'] as num?;
    final fabric = product['fabric'] as String?;
    final discount = mrp != null && mrp > price
        ? (((mrp - price) / mrp) * 100).round()
        : null;

    return GestureDetector(
      onTap: () => context.push('/product/${product['slug']}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.bgCard,
                    border: Border.all(color: AppColors.border),
                  ),
                  child: images.isEmpty
                      ? const _ImageFallback()
                      : CachedNetworkImage(
                          imageUrl: images.first as String,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => const _ShimmerFill(),
                          errorWidget: (_, __, ___) => const _ImageFallback(),
                        ),
                ),
                if (discount != null)
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
              ],
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
            product['name'] as String,
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
        ],
      ),
    );
  }
}

class _ShimmerCard extends StatelessWidget {
  const _ShimmerCard();
  @override
  Widget build(BuildContext context) => const Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Expanded(child: _ShimmerFill()),
      SizedBox(height: 10),
      SizedBox(height: 10, width: 60, child: _ShimmerFill()),
      SizedBox(height: 6),
      SizedBox(height: 14, width: 120, child: _ShimmerFill()),
    ],
  );
}

class _ShimmerFill extends StatelessWidget {
  const _ShimmerFill();
  @override
  Widget build(BuildContext context) => Shimmer.fromColors(
    baseColor: AppColors.bgCard,
    highlightColor: const Color(0xFF2A3D2A),
    child: Container(color: AppColors.bgCard),
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
        'P',
        style: GoogleFonts.cormorantGaramond(
          fontSize: 40,
          color: AppColors.gold.withOpacity(0.3),
        ),
      ),
    ),
  );
}

class _Diamond extends StatelessWidget {
  const _Diamond();
  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Container(width: 40, height: 1, color: AppColors.gold.withOpacity(0.5)),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8),
        child: Transform.rotate(
          angle: 0.785,
          child: Container(width: 5, height: 5, color: AppColors.gold),
        ),
      ),
      Container(width: 40, height: 1, color: AppColors.gold.withOpacity(0.5)),
    ],
  );
}

class _Message extends StatelessWidget {
  final String title, body;
  final String? action;
  final VoidCallback? onAction;
  const _Message({
    required this.title,
    required this.body,
    this.action,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(40),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          title,
          style: GoogleFonts.cormorantGaramond(
            fontSize: 26,
            fontWeight: FontWeight.w300,
            color: AppColors.cream,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          body,
          textAlign: TextAlign.center,
          style: GoogleFonts.instrumentSans(
            fontSize: 12,
            color: AppColors.creamMuted,
          ),
        ),
        if (action != null) ...[
          const SizedBox(height: 24),
          InkWell(
            onTap: onAction,
            child: Container(
              width: 160,
              height: 44,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.gold),
              ),
              child: Text(
                action!,
                style: GoogleFonts.instrumentSans(
                  fontSize: 11,
                  letterSpacing: 2.5,
                  color: AppColors.gold,
                ),
              ),
            ),
          ),
        ],
      ],
    ),
  );
}

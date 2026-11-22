import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/format.dart';
import '../../../core/widgets/brand_mark.dart';
import '../providers/home_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final settingsAsync = ref.watch(settingsProvider);
    final featuredAsync = ref.watch(featuredProductsProvider);
    final newArrivalsAsync = ref.watch(newArrivalsProvider);

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        toolbarHeight: 68,
        title: BrandMark(key: entryLogoTargetKey, height: 50),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.push('/shop'),
          ),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/notifications'),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          ref.invalidate(settingsProvider);
          ref.invalidate(featuredProductsProvider);
          ref.invalidate(newArrivalsProvider);
        },
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Banners
              settingsAsync.when(
                data: (s) => _Hero(
                  imageUrl: _heroImage(s['banners'] as List? ?? const []),
                ),
                loading: () => const _Hero(),
                error: (_, __) => const _Hero(),
              ),
              const SizedBox(height: 20),

              // Categories
              settingsAsync.when(
                data: (s) =>
                    _CategoryRow(categories: s['categories'] as List? ?? []),
                loading: () => _ShimmerBox(height: 90, width: double.infinity),
                error: (_, __) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 24),

              // New Arrivals
              _SectionHeader(
                title: 'New Arrivals',
                onSeeAll: () => context.push('/shop?sort=newest'),
              ),
              newArrivalsAsync.when(
                data: (products) => _ProductRow(products: products),
                loading: () => _ShimmerRow(),
                error: (_, __) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 24),

              // Featured
              _SectionHeader(
                title: 'Featured Sarees',
                onSeeAll: () => context.push('/shop?featured=true'),
              ),
              featuredAsync.when(
                data: (products) => _ProductRow(products: products),
                loading: () => _ShimmerRow(),
                error: (_, __) => const SizedBox.shrink(),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

String? _heroImage(List banners) {
  final heroes = banners.cast<Map>().where((b) => b['position'] == 'home_hero');
  final banner = heroes.isNotEmpty
      ? heroes.first
      : (banners.isNotEmpty ? banners.first as Map : null);
  final image = banner?['image'] as String?;
  return (image == null || image.isEmpty) ? null : image;
}

class _Hero extends StatelessWidget {
  final String? imageUrl;
  const _Hero({this.imageUrl});

  @override
  Widget build(BuildContext context) {
    final copy = _copy(context);
    final image = imageUrl;
    if (image == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(24, 48, 24, 40),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppColors.bgDark, AppColors.bg],
          ),
          border: Border(bottom: BorderSide(color: AppColors.border)),
        ),
        child: copy,
      );
    }
    return SizedBox(
      width: double.infinity,
      height: 560,
      child: Stack(
        fit: StackFit.expand,
        children: [
          CachedNetworkImage(
            imageUrl: image,
            fit: BoxFit.cover,
            alignment: const Alignment(0.25, 0),
            fadeInDuration: const Duration(milliseconds: 300),
            placeholder: (_, __) => Container(color: AppColors.bgDark),
            errorWidget: (_, __, ___) => Container(color: AppColors.bgDark),
          ),
          // Bottom and left shades keep the headline legible over any photo
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [AppColors.bg, Color(0x990F1A0F), Color(0x000F1A0F)],
                stops: [0, 0.4, 0.75],
              ),
            ),
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xB30F1A0F), Color(0x000F1A0F)],
                stops: [0, 0.7],
              ),
            ),
          ),
          Align(
            alignment: Alignment.bottomLeft,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
              child: copy,
            ),
          ),
        ],
      ),
    );
  }

  Widget _copy(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'TRADITION MEETS TOMORROW',
          style: GoogleFonts.instrumentSans(
            fontSize: 10,
            letterSpacing: 3,
            color: AppColors.gold,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),
        Container(width: 40, height: 1, color: AppColors.gold),
        const SizedBox(height: 20),
        Text(
          'More Than\nFashion',
          style: GoogleFonts.cormorantGaramond(
            fontSize: 52,
            height: 1.05,
            fontWeight: FontWeight.w300,
            color: AppColors.cream,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'A story in every drape.',
          style: GoogleFonts.cormorantGaramond(
            fontSize: 20,
            fontStyle: FontStyle.italic,
            color: AppColors.cream.withOpacity(0.7),
          ),
        ),
        const SizedBox(height: 28),
        Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => context.push('/shop'),
                child: Container(
                  height: 46,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.gold),
                  ),
                  child: Text(
                    'EXPLORE →',
                    style: GoogleFonts.instrumentSans(
                      fontSize: 10,
                      letterSpacing: 2.5,
                      color: AppColors.gold,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: GestureDetector(
                onTap: () => context.push('/shop?sort=newest'),
                child: Container(
                  height: 46,
                  alignment: Alignment.center,
                  color: AppColors.gold,
                  child: Text(
                    'NEW ARRIVALS →',
                    style: GoogleFonts.instrumentSans(
                      fontSize: 10,
                      letterSpacing: 2.5,
                      color: AppColors.bgDark,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _CategoryRow extends StatelessWidget {
  final List categories;
  const _CategoryRow({required this.categories});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 90,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: categories.length,
        itemBuilder: (_, i) {
          final cat = categories[i] as Map;
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: GestureDetector(
              onTap: () => context.push('/shop?category=${cat['_id']}'),
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(40),
                    child: CachedNetworkImage(
                      imageUrl: cat['image'] as String? ?? '',
                      width: 56,
                      height: 56,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => Container(
                        width: 56,
                        height: 56,
                        color: AppColors.muted,
                        child: const Icon(
                          Icons.category_outlined,
                          color: AppColors.tertiary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    cat['name'] as String,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppColors.secondary,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback onSeeAll;
  const _SectionHeader({required this.title, required this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: GoogleFonts.cormorantGaramond(
              fontSize: 26,
              fontWeight: FontWeight.w400,
              color: AppColors.cream,
            ),
          ),
          TextButton(
            onPressed: onSeeAll,
            child: Text(
              'VIEW ALL →',
              style: GoogleFonts.instrumentSans(
                fontSize: 10,
                letterSpacing: 2,
                color: AppColors.gold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProductRow extends StatelessWidget {
  final List products;
  const _ProductRow({required this.products});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 230,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: products.length,
        itemBuilder: (_, i) {
          final p = products[i] as Map;
          return GestureDetector(
            onTap: () => context.push('/product/${p['slug']}'),
            child: Container(
              width: 150,
              margin: const EdgeInsets.only(right: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: CachedNetworkImage(
                      imageUrl: (p['images'] as List).first as String,
                      width: 150,
                      height: 160,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Shimmer.fromColors(
                        baseColor: AppColors.muted,
                        highlightColor: AppColors.border,
                        child: Container(color: AppColors.muted),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    p['name'] as String,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppColors.secondary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    inr((p['price'] as num)),
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.secondary,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ShimmerBox extends StatelessWidget {
  final double height, width;
  const _ShimmerBox({required this.height, required this.width});
  @override
  Widget build(BuildContext context) => Shimmer.fromColors(
    baseColor: AppColors.muted,
    highlightColor: AppColors.border,
    child: Container(height: height, width: width, color: AppColors.muted),
  );
}

class _ShimmerRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) => SizedBox(
    height: 230,
    child: ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: 4,
      itemBuilder: (_, __) => Shimmer.fromColors(
        baseColor: AppColors.muted,
        highlightColor: AppColors.border,
        child: Container(
          width: 150,
          margin: const EdgeInsets.only(right: 12),
          decoration: BoxDecoration(
            color: AppColors.muted,
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    ),
  );
}

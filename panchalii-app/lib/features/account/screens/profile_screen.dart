import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authStateProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: Text(
          'MY ACCOUNT',
          style: GoogleFonts.instrumentSans(
            fontSize: 11,
            letterSpacing: 3.0,
            color: AppColors.creamMuted,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
      body: authAsync.when(
        data: (user) {
          if (user == null) {
            return _UnauthenticatedView(
              onSignIn: () => context.push('/auth/login'),
            );
          }
          return _AuthenticatedView(user: user, ref: ref, context: context);
        },
        loading: () => const Center(
          child: CircularProgressIndicator(
            color: AppColors.gold,
            strokeWidth: 1,
          ),
        ),
        error: (_, __) => const Center(child: Text('Error loading profile')),
      ),
    );
  }
}

class _UnauthenticatedView extends StatelessWidget {
  final VoidCallback onSignIn;
  const _UnauthenticatedView({required this.onSignIn});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.bg,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Gold decorative border circle
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.gold.withOpacity(0.3),
                    width: 1,
                  ),
                ),
                child: Icon(
                  Icons.person_outline,
                  size: 36,
                  color: AppColors.gold.withOpacity(0.4),
                ),
              ),
              const SizedBox(height: 32),

              // Eyebrow label
              Text(
                'PANCHALII SELECT',
                style: GoogleFonts.instrumentSans(
                  fontSize: 9,
                  color: AppColors.gold,
                  letterSpacing: 3.0,
                ),
              ),
              const SizedBox(height: 4),
              const SizedBox(
                width: 40,
                child: Divider(color: AppColors.gold, height: 1, thickness: 1),
              ),
              const SizedBox(height: 20),

              Text(
                'Sign In',
                style: GoogleFonts.cormorantGaramond(
                  fontSize: 32,
                  color: AppColors.cream,
                  fontWeight: FontWeight.w300,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'to view your account',
                style: GoogleFonts.instrumentSans(
                  fontSize: 13,
                  color: AppColors.creamMuted,
                ),
              ),

              const SizedBox(height: 40),

              // Gold outline button
              GestureDetector(
                onTap: onSignIn,
                child: Container(
                  width: double.infinity,
                  height: 48,
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.gold, width: 1),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    'SIGN IN',
                    style: GoogleFonts.instrumentSans(
                      fontSize: 11,
                      color: AppColors.gold,
                      letterSpacing: 3.0,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              GestureDetector(
                onTap: () => context.push('/auth/register'),
                child: Container(
                  width: double.infinity,
                  height: 48,
                  color: AppColors.gold,
                  alignment: Alignment.center,
                  child: Text(
                    'CREATE ACCOUNT',
                    style: GoogleFonts.instrumentSans(
                      fontSize: 11,
                      color: AppColors.bgDark,
                      letterSpacing: 3.0,
                      fontWeight: FontWeight.w600,
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

class _AuthenticatedView extends StatelessWidget {
  final dynamic user;
  final WidgetRef ref;
  final BuildContext context;
  const _AuthenticatedView({
    required this.user,
    required this.ref,
    required this.context,
  });

  @override
  Widget build(BuildContext _) {
    return ListView(
      children: [
        // Profile header
        Container(
          color: AppColors.bgDark,
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.bgCard,
                  border: Border.all(
                    color: AppColors.gold.withOpacity(0.5),
                    width: 1,
                  ),
                ),
                child: Center(
                  child: Text(
                    (user.name as String)[0].toUpperCase(),
                    style: GoogleFonts.cormorantGaramond(
                      fontSize: 28,
                      fontWeight: FontWeight.w500,
                      color: AppColors.gold,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                user.name as String,
                style: GoogleFonts.cormorantGaramond(
                  fontSize: 22,
                  color: AppColors.cream,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                user.email as String,
                style: GoogleFonts.instrumentSans(
                  fontSize: 12,
                  color: AppColors.creamMuted,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 1),

        _MenuItem(
          icon: Icons.shopping_bag_outlined,
          label: 'MY ORDERS',
          onTap: () => context.push('/account/orders'),
        ),
        _MenuItem(
          icon: Icons.favorite_border,
          label: 'WISHLIST',
          onTap: () => context.push('/account/wishlist'),
        ),
        _MenuItem(
          icon: Icons.place_outlined,
          label: 'SAVED ADDRESSES',
          onTap: () => context.push('/account/addresses'),
        ),
        _MenuItem(
          icon: Icons.notifications_outlined,
          label: 'NOTIFICATIONS',
          onTap: () => context.push('/notifications'),
        ),
        _MenuItem(
          icon: Icons.person_outline,
          label: 'EDIT PROFILE',
          onTap: () => context.push('/account/profile/edit'),
        ),

        const SizedBox(height: 8),

        _MenuItem(
          icon: Icons.logout,
          label: 'SIGN OUT',
          isDestructive: true,
          onTap: () async {
            await ref.read(authNotifierProvider.notifier).logout();
            if (context.mounted) context.go('/');
          },
        ),
      ],
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;
  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    child: Container(
      color: AppColors.bgDark,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
      child: Row(
        children: [
          Icon(
            icon,
            size: 18,
            color: isDestructive
                ? AppColors.error.withOpacity(0.7)
                : AppColors.gold.withOpacity(0.6),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              label,
              style: GoogleFonts.instrumentSans(
                fontSize: 10,
                letterSpacing: 2.5,
                fontWeight: FontWeight.w500,
                color: isDestructive
                    ? AppColors.error.withOpacity(0.7)
                    : AppColors.creamMuted,
              ),
            ),
          ),
          if (!isDestructive)
            Icon(
              Icons.chevron_right,
              size: 16,
              color: AppColors.gold.withOpacity(0.3),
            ),
        ],
      ),
    ),
  );
}

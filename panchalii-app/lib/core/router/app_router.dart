import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/shop/screens/shop_screen.dart';
import '../../features/product/screens/product_screen.dart';
import '../../features/cart/screens/cart_screen.dart';
import '../../features/checkout/screens/checkout_screen.dart';
import '../../features/account/screens/orders_screen.dart';
import '../../features/account/screens/order_detail_screen.dart';
import '../../features/account/screens/wishlist_screen.dart';
import '../../features/account/screens/addresses_screen.dart';
import '../../features/account/screens/edit_profile_screen.dart';
import '../../features/account/screens/profile_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../widgets/main_shell.dart';

// Created once: rebuilding the router on sign-in/out reset navigation to Home, so screens
// that send people to sign in (e.g. checkout) lost their place. Screens read auth state themselves.
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/shop', builder: (_, __) => const ShopScreen()),
          GoRoute(
            path: '/product/:slug',
            builder: (_, state) =>
                ProductScreen(slug: state.pathParameters['slug']!),
          ),
          GoRoute(path: '/cart', builder: (_, __) => const CartScreen()),
          GoRoute(
            path: '/checkout',
            builder: (_, __) => const CheckoutScreen(),
          ),
          GoRoute(
            path: '/account/orders',
            builder: (_, __) => const OrdersScreen(),
          ),
          GoRoute(
            path: '/account/orders/:id',
            builder: (_, state) =>
                OrderDetailScreen(id: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/account/wishlist',
            builder: (_, __) => const WishlistScreen(),
          ),
          GoRoute(
            path: '/account/addresses',
            builder: (_, __) => const AddressesScreen(),
          ),
          GoRoute(
            path: '/account/profile/edit',
            builder: (_, __) => const EditProfileScreen(),
          ),
          GoRoute(
            path: '/account/profile',
            builder: (_, __) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (_, __) => const NotificationsScreen(),
          ),
        ],
      ),
      GoRoute(path: '/auth/login', builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: '/auth/register',
        builder: (_, __) => const RegisterScreen(),
      ),
    ],
    errorBuilder: (_, state) =>
        Scaffold(body: Center(child: Text('Page not found: ${state.error}'))),
  );
});

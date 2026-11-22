import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

/// The signed-in customer's wishlist, shared by the wishlist screen and the product page heart.
class WishlistNotifier extends AsyncNotifier<List<Map<String, dynamic>>> {
  @override
  Future<List<Map<String, dynamic>>> build() async {
    final user = await ref.watch(authStateProvider.future);
    if (user == null) return const [];
    final res = await ref.read(dioProvider).get('/me/wishlist');
    final products =
        ((res.data['data'] as Map)['products'] as List? ?? const []);
    return products
        .whereType<Map>()
        .map((p) => Map<String, dynamic>.from(p))
        .toList();
  }

  bool contains(String productId) =>
      (state.valueOrNull ?? const []).any((p) => p['_id'] == productId);

  /// Optimistic add/remove; restores the previous list if the API call fails.
  Future<void> toggle(Map<String, dynamic> product) async {
    final id = product['_id'] as String;
    final before = state.valueOrNull ?? const <Map<String, dynamic>>[];
    state = AsyncData(
      contains(id)
          ? before.where((p) => p['_id'] != id).toList()
          : [product, ...before],
    );
    try {
      await ref
          .read(dioProvider)
          .post('/me/wishlist/toggle', data: {'productId': id});
    } catch (_) {
      state = AsyncData(before);
      rethrow;
    }
  }
}

final wishlistProvider =
    AsyncNotifierProvider<WishlistNotifier, List<Map<String, dynamic>>>(
      WishlistNotifier.new,
    );

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';

import '../../auth/providers/auth_provider.dart';

class CartItem {
  final String productId;
  final String name;
  final String image;
  final double price;
  int qty;

  CartItem({
    required this.productId,
    required this.name,
    required this.image,
    required this.price,
    required this.qty,
  });

  Map<String, dynamic> toMap() => {
    'productId': productId,
    'name': name,
    'image': image,
    'price': price,
    'qty': qty,
  };

  factory CartItem.fromMap(Map m) => CartItem(
    productId: m['productId'] as String,
    name: m['name'] as String,
    image: m['image'] as String? ?? '',
    price: (m['price'] as num).toDouble(),
    qty: m['qty'] as int,
  );
}

class CartNotifier extends StateNotifier<List<CartItem>> {
  final Ref _ref;
  late Box _box;

  CartNotifier(this._ref) : super([]) {
    _loadFromHive();
  }

  void _loadFromHive() async {
    _box = await Hive.openBox('cart');
    final saved = _box.get('items', defaultValue: []) as List;
    state = saved.map((m) => CartItem.fromMap(m as Map)).toList();
  }

  void _persist() {
    _box.put('items', state.map((i) => i.toMap()).toList());
  }

  Future<void> addItem(String productId, int qty) async {
    try {
      final dio = _ref.read(dioProvider);
      final res = await dio.get('/public/products/$productId');
      final p = res.data['data'] as Map;
      final existing = state.where((i) => i.productId == productId).firstOrNull;
      if (existing != null) {
        state = state
            .map(
              (i) => i.productId == productId
                  ? (CartItem(
                      productId: i.productId,
                      name: i.name,
                      image: i.image,
                      price: i.price,
                      qty: i.qty + qty,
                    ))
                  : i,
            )
            .toList();
      } else {
        final images = p['images'] as List;
        state = [
          ...state,
          CartItem(
            productId: productId,
            name: p['name'] as String,
            image: images.isNotEmpty ? images.first as String : '',
            price: (p['price'] as num).toDouble(),
            qty: qty,
          ),
        ];
      }
      _persist();
    } catch (_) {}
  }

  void updateQty(String productId, int qty) {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    state = state
        .map(
          (i) => i.productId == productId
              ? CartItem(
                  productId: i.productId,
                  name: i.name,
                  image: i.image,
                  price: i.price,
                  qty: qty,
                )
              : i,
        )
        .toList();
    _persist();
  }

  void removeItem(String productId) {
    state = state.where((i) => i.productId != productId).toList();
    _persist();
  }

  void clearCart() {
    state = [];
    _box.put('items', []);
  }

  double get subtotal => state.fold(0, (sum, i) => sum + (i.price * i.qty));
}

final cartNotifierProvider =
    StateNotifierProvider<CartNotifier, List<CartItem>>(CartNotifier.new);

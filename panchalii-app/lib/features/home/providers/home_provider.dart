import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

final settingsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/public/settings');
  return res.data['data'] as Map<String, dynamic>;
});

final featuredProductsProvider = FutureProvider<List>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/public/products?featured=true&limit=10');
  return res.data['data'] as List;
});

final newArrivalsProvider = FutureProvider<List>((ref) async {
  final dio = ref.read(dioProvider);
  final res = await dio.get('/public/products?sort=newest&limit=10');
  return res.data['data'] as List;
});

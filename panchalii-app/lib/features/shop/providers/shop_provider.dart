import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';

class ShopFilter {
  final String search;
  final String sort;
  final String? category;
  const ShopFilter({this.search = '', this.sort = 'newest', this.category});

  @override
  bool operator ==(Object other) =>
      other is ShopFilter &&
      other.search == search &&
      other.sort == sort &&
      other.category == category;

  @override
  int get hashCode => Object.hash(search, sort, category);
}

final productsProvider = FutureProvider.family<List, ShopFilter>((
  ref,
  filter,
) async {
  final dio = ref.read(dioProvider);
  final params = {
    'sort': filter.sort,
    if (filter.search.isNotEmpty) 'q': filter.search,
    if (filter.category != null) 'category': filter.category!,
    'limit': '20',
  };
  final query = params.entries.map((e) => '${e.key}=${e.value}').join('&');
  final res = await dio.get('/public/products?$query');
  return res.data['data'] as List;
});

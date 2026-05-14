import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../../core/models/product.dart';

const apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://localhost:4000');

final httpClientProvider = Provider<http.Client>((ref) {
  return http.Client();
});

final productRepositoryProvider = Provider<ProductRepository>((ref) {
  final client = ref.watch(httpClientProvider);
  return ProductRepository(client: client);
});

final trendingProductsProvider = FutureProvider<List<Product>>((ref) {
  final repository = ref.watch(productRepositoryProvider);
  return repository.fetchTrendingProducts();
});

class ProductRepository {
  ProductRepository({required this.client});

  final http.Client client;

  Future<List<Product>> fetchTrendingProducts() async {
    // Backend returns admin-curated products that should appear in the app.
    final response = await client.get(Uri.parse('$apiBaseUrl/api/products/trending'));

    if (response.statusCode != 200) {
      throw Exception('API returned ${response.statusCode}');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final items = body['products'] as List<dynamic>? ?? [];

    return items
        .map((raw) => Product.fromJson(raw as Map<String, dynamic>))
        .toList(growable: false);
  }
}

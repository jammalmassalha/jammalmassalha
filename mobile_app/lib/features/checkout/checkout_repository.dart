import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../products/product_repository.dart';

final checkoutRepositoryProvider = Provider<CheckoutRepository>((ref) {
  return CheckoutRepository(client: ref.watch(httpClientProvider));
});

class CheckoutRepository {
  CheckoutRepository({required this.client});

  final http.Client client;

  Future<String> createOrder({
    required String productId,
    required int quantity,
    required String walletAddress,
    required String chain,
  }) async {
    final response = await client.post(
      Uri.parse('$apiBaseUrl/api/orders'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'productId': productId,
        'quantity': quantity,
        'walletAddress': walletAddress,
        'chain': chain,
      }),
    );

    if (response.statusCode != 201) {
      throw Exception('Failed to create order: ${response.statusCode}');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final order = body['order'] as Map<String, dynamic>;
    return order['id'] as String;
  }
}

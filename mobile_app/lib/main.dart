import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'features/cart/cart_controller.dart';
import 'features/products/product_repository.dart';

void main() {
  runApp(const ProviderScope(child: DropShoppingApp()));
}

class DropShoppingApp extends StatelessWidget {
  const DropShoppingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Drop Shopping',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F7A6C)),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(trendingProductsProvider);
    final cartCount = ref.watch(cartCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('USA Trending Products'),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Badge(
              label: Text('$cartCount'),
              child: const Icon(Icons.shopping_cart_outlined),
            ),
          ),
        ],
      ),
      body: productsAsync.when(
        data: (products) => ListView.separated(
          itemCount: products.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final product = products[index];
            return ListTile(
              leading: CircleAvatar(child: Text('#${product.rank}')),
              title: Text(product.title),
              subtitle: Text('${product.category} • \$${product.priceUsd.toStringAsFixed(2)}'),
              trailing: FilledButton.tonal(
                onPressed: () {
                  ref.read(cartControllerProvider.notifier).add(product);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('${product.title} added to cart')),
                  );
                },
                child: const Text('Add'),
              ),
            );
          },
        ),
        error: (error, _) => Center(child: Text('Failed to load products: $error')),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}

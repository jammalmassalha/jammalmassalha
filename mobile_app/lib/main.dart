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
        cardTheme: const CardTheme(
          elevation: 0,
          margin: EdgeInsets.zero,
        ),
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  String _query = '';
  String _category = 'All';

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(trendingProductsProvider);
    final cartCount = ref.watch(cartCountProvider);
    final cartItems = ref.watch(cartControllerProvider);
    final cartTotal = ref.watch(cartTotalProvider);

    final categories = productsAsync.maybeWhen(
      data: (products) {
        final names = products.map((item) => item.category).toSet().toList()..sort();
        return ['All', ...names];
      },
      orElse: () => ['All'],
    );

    final hero = Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          colors: [Color(0xFF0F7A6C), Color(0xFF3E9A80)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Curated USA Top Sellers',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            'Hand-picked by admin with built-in profit margin.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withOpacity(0.92),
                ),
          ),
          const SizedBox(height: 14),
          TextField(
            onChanged: (value) => setState(() => _query = value.trim().toLowerCase()),
            decoration: InputDecoration(
              hintText: 'Search product...',
              prefixIcon: const Icon(Icons.search),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
            ),
          ),
        ],
      ),
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Drop Shopping'),
        actions: [
          IconButton(
            tooltip: 'View cart',
            onPressed: () => _openCartSheet(context),
            icon: Badge(
              label: Text('$cartCount'),
              child: const Icon(Icons.shopping_bag_outlined),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                '\$${cartTotal.toStringAsFixed(2)}',
                style: Theme.of(context).textTheme.titleSmall,
              ),
            ),
          ),
        ],
      ),
      body: productsAsync.when(
        data: (products) {
          if (products.isEmpty) {
            return const Center(
              child: Text('No featured products yet. Select items from admin dashboard.'),
            );
          }

          final filtered = products.where((item) {
            final matchesCategory = _category == 'All' || item.category == _category;
            final matchesQuery = _query.isEmpty || item.title.toLowerCase().contains(_query);
            return matchesCategory && matchesQuery;
          }).toList();

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(trendingProductsProvider);
              await ref.read(trendingProductsProvider.future);
            },
            child: ListView(
              padding: const EdgeInsets.only(bottom: 110),
              children: [
                hero,
                SizedBox(
                  height: 48,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    scrollDirection: Axis.horizontal,
                    itemCount: categories.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final cat = categories[index];
                      return ChoiceChip(
                        label: Text(cat),
                        selected: _category == cat,
                        onSelected: (_) => setState(() => _category = cat),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 10),
                if (filtered.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(24),
                    child: Center(child: Text('No products match this filter.')),
                  ),
                for (final product in filtered)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                    child: _ProductCard(product: product),
                  ),
              ],
            ),
          );
        },
        error: (error, _) => Center(child: Text('Failed to load products: $error')),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
      floatingActionButton: cartItems.isEmpty
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _openCartSheet(context),
              icon: const Icon(Icons.shopping_bag_outlined),
              label: Text('Cart $cartCount'),
            ),
    );
  }

  void _openCartSheet(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) {
        final cartItems = ref.watch(cartControllerProvider);
        final cartTotal = ref.watch(cartTotalProvider);

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 22),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.outlineVariant,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Your Cart', style: Theme.of(context).textTheme.titleLarge),
                    Text('\$${cartTotal.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.titleMedium),
                  ],
                ),
                const SizedBox(height: 10),
                if (cartItems.isEmpty)
                  const Padding(
                    padding: EdgeInsets.all(12),
                    child: Text('Cart is empty.'),
                  )
                else
                  ...cartItems.map(
                    (item) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(item.product.title),
                      subtitle: Text('Qty: ${item.quantity}'),
                      trailing: Text(
                        '\$${(item.quantity * item.product.appPriceUsd).toStringAsFixed(2)}',
                      ),
                    ),
                  ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => ref.read(cartControllerProvider.notifier).clear(),
                        child: const Text('Clear'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: FilledButton(
                        onPressed: cartItems.isEmpty ? null : () {},
                        child: const Text('Checkout'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ProductCard extends ConsumerWidget {
  const _ProductCard({required this.product});

  final dynamic product;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: product.imageUrl.isNotEmpty
                  ? Image.network(
                      product.imageUrl,
                      width: 90,
                      height: 90,
                      fit: BoxFit.cover,
                    )
                  : Container(
                      width: 90,
                      height: 90,
                      color: Theme.of(context).colorScheme.surfaceContainerHighest,
                      child: const Icon(Icons.image_not_supported_outlined),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 6,
                    runSpacing: -8,
                    children: [
                      Chip(label: Text('#${product.rank}')),
                      Chip(
                        label: Text(product.category),
                        backgroundColor: Theme.of(context).colorScheme.secondaryContainer,
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    product.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 8,
                    children: [
                      Text(
                        '\$${product.originalPriceUsd.toStringAsFixed(2)}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              decoration: TextDecoration.lineThrough,
                              color: Theme.of(context).colorScheme.onSurfaceVariant,
                            ),
                      ),
                      Text(
                        '+\$${product.profitUsd.toStringAsFixed(2)} profit',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Theme.of(context).colorScheme.tertiary,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '\$${product.appPriceUsd.toStringAsFixed(2)}',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '30d sales: ${product.salesLast30d}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      FilledButton.icon(
                        onPressed: () {
                          ref.read(cartControllerProvider.notifier).add(product);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('${product.title} added to cart')),
                          );
                        },
                        icon: const Icon(Icons.add_shopping_cart_outlined),
                        label: const Text('Add'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

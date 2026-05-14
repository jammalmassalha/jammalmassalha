class Product {
  Product({
    required this.id,
    required this.title,
    required this.category,
    required this.priceUsd,
    required this.originalPriceUsd,
    required this.appPriceUsd,
    required this.profitUsd,
    required this.rank,
    required this.imageUrl,
    required this.source,
    required this.salesLast30d,
    required this.isFeatured,
  });

  final String id;
  final String title;
  final String category;
  final double priceUsd;
  final double originalPriceUsd;
  final double appPriceUsd;
  final double profitUsd;
  final int rank;
  final String imageUrl;
  final String source;
  final int salesLast30d;
  final bool isFeatured;

  factory Product.fromJson(Map<String, dynamic> json) {
    final basePrice = (json['originalPriceUsd'] as num?) ?? (json['priceUsd'] as num);
    final displayPrice = (json['appPriceUsd'] as num?) ?? (json['priceUsd'] as num);
    final profit = (json['profitUsd'] as num?) ?? (displayPrice.toDouble() - basePrice.toDouble());

    return Product(
      id: json['id'] as String,
      title: json['title'] as String,
      category: json['category'] as String,
      priceUsd: displayPrice.toDouble(),
      originalPriceUsd: basePrice.toDouble(),
      appPriceUsd: displayPrice.toDouble(),
      profitUsd: profit.toDouble(),
      rank: json['rank'] as int? ?? 0,
      imageUrl: json['imageUrl'] as String? ?? '',
      source: json['source'] as String? ?? 'unknown',
      salesLast30d: (json['salesLast30d'] as num?)?.toInt() ?? 0,
      isFeatured: json['isFeatured'] as bool? ?? false,
    );
  }
}

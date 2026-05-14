class Product {
  Product({
    required this.id,
    required this.title,
    required this.category,
    required this.priceUsd,
    required this.rank,
  });

  final String id;
  final String title;
  final String category;
  final double priceUsd;
  final int rank;

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] as String,
      title: json['title'] as String,
      category: json['category'] as String,
      priceUsd: (json['priceUsd'] as num).toDouble(),
      rank: json['rank'] as int? ?? 0,
    );
  }
}

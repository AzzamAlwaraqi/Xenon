class Destination {
  final String id;
  final String title;
  final String category;
  final String price;
  final String rating;
  final String imageUrl;

  Destination({
    required this.id,
    required this.title,
    required this.category,
    required this.price,
    required this.rating,
    required this.imageUrl,
  });

  factory Destination.fromJson(Map<String, dynamic> json) {
    return Destination(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      category: json['category'] ?? '',
      price: json['price'] ?? '',
      rating: json['rating']?.toString() ?? '0.0',
      imageUrl: json['imageUrl'] ?? '',
    );
  }
}

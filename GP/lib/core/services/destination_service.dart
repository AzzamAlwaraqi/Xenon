import 'dart:async';

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
}

class DestinationService {
  Future<List<Destination>> getDestinations() async {
    await Future.delayed(const Duration(seconds: 1));
    return [
      Destination(
        id: '1',
        title: 'Sunset Desert Safari',
        category: 'ADVENTURE',
        price: '\$299',
        rating: '4.9',
        imageUrl: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?q=80&w=800&auto=format&fit=crop',
      ),
      Destination(
        id: '2',
        title: 'Zen Mountain Retreat',
        category: 'WELLNESS',
        price: '\$450',
        rating: '4.8',
        imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?q=80&w=800&auto=format&fit=crop',
      ),
      Destination(
        id: '3',
        title: 'Azure Yacht Expedition',
        category: 'LUXURY',
        price: '\$1,200',
        rating: '5.0',
        imageUrl: 'https://images.unsplash.com/photo-1567899378494-47b22a2ad96a?q=80&w=800&auto=format&fit=crop',
      ),
    ];
  }
}

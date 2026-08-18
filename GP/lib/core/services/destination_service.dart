import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';

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

class DestinationService {
  Future<List<Destination>> getDestinations() async {
    // Simulate network delay
    await Future.delayed(const Duration(seconds: 1));
    
    return [
      Destination(
        id: '1',
        title: 'The Treasury at Petra',
        category: 'HISTORICAL',
        price: '50',
        rating: '4.9',
        imageUrl: 'https://images.unsplash.com/photo-1547234935-80c7145ec969?q=80&w=1000&auto=format&fit=crop',
      ),
      Destination(
        id: '2',
        title: 'Wadi Rum Desert Camp',
        category: 'ADVENTURE',
        price: '120',
        rating: '4.8',
        imageUrl: 'https://images.unsplash.com/photo-1548691905-57c36cc8d935?q=80&w=1000&auto=format&fit=crop',
      ),
      Destination(
        id: '3',
        title: 'Dead Sea Resort',
        category: 'WELLNESS',
        price: '200',
        rating: '4.7',
        imageUrl: 'https://images.unsplash.com/photo-1582650816738-1f637b587da4?q=80&w=1000&auto=format&fit=crop',
      ),
    ];
  }
}

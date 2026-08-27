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
    String extractImageUrl(dynamic imagesObj) {
      if (imagesObj is List && imagesObj.isNotEmpty) {
        return imagesObj[0]['url']?.toString() ?? '';
      }
      return '';
    }

    return Destination(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      title: json['package_name'] ?? json['title'] ?? '',
      category: json['package_type'] ?? json['category'] ?? '',
      price: json['package_price']?.toString() ?? json['price']?.toString() ?? '0',
      rating: json['ratingsAverage']?.toString() ?? json['rating']?.toString() ?? '0.0',
      imageUrl: json['images'] != null ? extractImageUrl(json['images']) : (json['imageUrl'] ?? ''),
    );
  }

  static Future<List<Destination>> getDestinations() async {
    try {
      final response = await http
          .get(
            Uri.parse('${ApiConfig.baseUrl}/packages'), // الرجاء التأكد من مسار الـ API الصحيح
            headers: ApiConfig.headers,
          )
          .timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = jsonDecode(response.body); 
        final List<dynamic> data = responseData['data']?['packages']?['data'] ?? [];
        return data.map((json) => Destination.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load destinations: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}

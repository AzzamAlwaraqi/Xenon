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

  static Future<List<Destination>> getDestinations() async {
    try {
      final response = await http
          .get(
            Uri.parse('${ApiConfig.baseUrl}/destinations'), // الرجاء التأكد من مسار الـ API الصحيح
            headers: ApiConfig.headers,
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        // تأكد من شكل استجابة الـ API. إذا كانت البيانات داخل 'data' استخدم: jsonDecode(response.body)['data']
        final List<dynamic> data = jsonDecode(response.body); 
        return data.map((json) => Destination.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load destinations: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}

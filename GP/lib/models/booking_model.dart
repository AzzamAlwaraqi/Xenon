import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'api_config.dart';

class Booking {
  final String title;
  final String date;
  final String status;
  final Color statusColor;
  final IconData icon;
  final double price;
  final String? bookingId;

  const Booking({
    required this.title,
    required this.date,
    required this.status,
    required this.statusColor,
    required this.icon,
    required this.price,
    this.bookingId,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    final statusString = json['status']?.toString().toLowerCase() ?? 'pending';
    
    Color statusColor;
    IconData icon;
    
    switch (statusString) {
      case 'confirmed':
      case 'completed':
        statusColor = Colors.green;
        icon = Icons.check_circle;
        break;
      case 'cancelled':
        statusColor = Colors.red;
        icon = Icons.cancel;
        break;
      case 'pending':
      default:
        statusColor = Colors.orange;
        icon = Icons.access_time;
        break;
    }

    return Booking(
      bookingId: json['id']?.toString() ?? json['bookingId']?.toString(),
      title: json['title'] ?? 'Unknown Booking',
      date: json['date'] ?? '',
      status: json['status'] ?? 'Pending',
      statusColor: statusColor,
      icon: icon,
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0.0,
    );
  }

  static Future<List<Booking>> getBookings() async {
    try {
      final response = await http
          .get(
            Uri.parse('${ApiConfig.baseUrl}/bookings'), // مسار API الخاص بالحجوزات (تأكد منه)
            headers: ApiConfig.headers,
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        // تأكد من شكل استجابة الـ API. إذا كانت البيانات داخل 'data' استخدم: jsonDecode(response.body)['data']
        final List<dynamic> data = jsonDecode(response.body); 
        return data.map((json) => Booking.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load bookings: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}

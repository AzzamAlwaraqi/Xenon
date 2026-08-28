import 'api_client.dart';
import 'package:flutter/material.dart';

class BookingModel {
  final String id;
  final String title;
  final String date;
  final String status;
  final Color statusColor;
  final IconData icon;
  final double price;
  final Map<String, dynamic>? package;
  final Map<String, dynamic>? user;
  final Map<String, dynamic>? vendor;
  final int guests;

  const BookingModel({
    required this.id,
    required this.title,
    required this.date,
    required this.status,
    required this.statusColor,
    required this.icon,
    required this.price,
    this.package,
    this.user,
    this.vendor,
    this.guests = 1,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    final statusString = json['status']?.toString().toLowerCase() ?? 'pending';
    
    Color statusColor;
    IconData icon;
    
    switch (statusString) {
      case 'confirmed':
      case 'completed':
      case 'accepted':
        statusColor = Colors.green;
        icon = Icons.check_circle;
        break;
      case 'cancelled':
      case 'rejected':
        statusColor = Colors.red;
        icon = Icons.cancel;
        break;
      case 'pending':
      default:
        statusColor = Colors.orange;
        icon = Icons.access_time;
        break;
    }

    final pkg = json['package'] is Map 
        ? json['package'] 
        : (json['package_id'] is Map ? json['package_id'] : null);

    return BookingModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: pkg?['title'] ?? pkg?['package_name'] ?? json['title'] ?? 'Unknown Package',
      date: json['booking_date'] ?? json['date'] ?? json['createdAt'] ?? '',
      status: json['status'] ?? 'pending',
      statusColor: statusColor,
      icon: icon,
      price: double.tryParse(pkg?['price']?.toString() ?? pkg?['package_price']?.toString() ?? json['total_price']?.toString() ?? json['price']?.toString() ?? '0') ?? 0.0,
      package: pkg,
      user: json['user_id'] is Map ? json['user_id'] : (json['user'] is Map ? json['user'] : null),
      vendor: json['vendor_id'] is Map ? json['vendor_id'] : (json['vendor'] is Map ? json['vendor'] : null),
      guests: json['number_of_people'] ?? json['guests'] ?? 1,
    );
  }
}


class BookingService {
  static const String _baseEndpoint = '/bookings';

  static Future<List<BookingModel>> getAllBookings() async {
    final response = await ApiClient.get('$_baseEndpoint/all-bookings');
    if (response['data'] != null && response['data'] is List) {
      return (response['data'] as List).map((e) => BookingModel.fromJson(e)).toList();
    }
    return [];
  }

  static Future<List<BookingModel>> getMyBookings() async {
    final response = await ApiClient.get('$_baseEndpoint/my-bookings');
    if (response['data'] != null && response['data'] is List) {
      return (response['data'] as List).map((e) => BookingModel.fromJson(e)).toList();
    }
    return [];
  }

  static Future<List<BookingModel>> getMyHistory() async {
    final response = await ApiClient.get('$_baseEndpoint/my-history');
    if (response['data'] != null && response['data'] is List) {
      return (response['data'] as List).map((e) => BookingModel.fromJson(e)).toList();
    }
    return [];
  }

  static Future<BookingModel?> getBookingById(String id) async {
    final response = await ApiClient.get('$_baseEndpoint/get-booking/$id');
    if (response['data'] != null) {
      return BookingModel.fromJson(response['data']);
    }
    return null;
  }

  static Future<Map<String, dynamic>> createBooking(Map<String, dynamic> data) async {
    return await ApiClient.post('$_baseEndpoint/create-booking', body: data);
  }

  static Future<Map<String, dynamic>> updateBooking(String id, Map<String, dynamic> data) async {
    return await ApiClient.put('$_baseEndpoint/update-booking/$id', body: data);
  }

  static Future<Map<String, dynamic>> deleteBooking(String id) async {
    return await ApiClient.put('$_baseEndpoint/delete-booking/$id');
  }

  static Future<List<dynamic>> getUserPendingRequests() async {
    final response = await ApiClient.get('$_baseEndpoint/user/pending-requests');
    return response['data'] ?? [];
  }
}


import 'api_client.dart';
class NotificationModel {
  final String id;
  final String title;
  final String message;
  final bool isRead;
  final DateTime? createdAt;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.isRead,
    this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }
}


class NotificationService {
  static const String _baseEndpoint = '/notifications';

  static Future<List<NotificationModel>> getMyNotifications() async {
    final response = await ApiClient.get(_baseEndpoint);
    if (response['data'] != null && response['data'] is List) {
      return (response['data'] as List).map((e) => NotificationModel.fromJson(e)).toList();
    }
    return [];
  }

  static Future<Map<String, dynamic>> markAsRead(String id) async {
    return await ApiClient.patch('$_baseEndpoint/$id/read');
  }

  static Future<Map<String, dynamic>> markAllAsRead() async {
    return await ApiClient.patch('$_baseEndpoint/read-all');
  }

  static Future<Map<String, dynamic>> deleteNotification(String id) async {
    return await ApiClient.patch('$_baseEndpoint/$id'); // Assuming this deletes it based on route map
  }

  static Future<Map<String, dynamic>> deleteAllNotifications() async {
    return await ApiClient.patch('$_baseEndpoint/delete-all');
  }
}


import 'api_client.dart';
class ComplaintModel {
  final String id;
  final String title;
  final String description;
  final String status;
  final DateTime? createdAt;

  ComplaintModel({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    this.createdAt,
  });

  factory ComplaintModel.fromJson(Map<String, dynamic> json) {
    return ComplaintModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      status: json['status'] ?? 'pending',
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }
}


class ComplaintService {
  static const String _baseEndpoint = '/complaints';

  static Future<Map<String, dynamic>> createComplaint(Map<String, dynamic> data) async {
    return await ApiClient.post('$_baseEndpoint/createComplaint', body: data);
  }

  static Future<List<ComplaintModel>> getMyComplaints() async {
    final response = await ApiClient.get('$_baseEndpoint/getMyComplaints');
    if (response['data'] != null && response['data'] is List) {
      return (response['data'] as List).map((e) => ComplaintModel.fromJson(e)).toList();
    }
    return [];
  }

  static Future<ComplaintModel?> getComplaintById(String id) async {
    final response = await ApiClient.get('$_baseEndpoint/getComplaintById/$id');
    if (response['data'] != null) {
      return ComplaintModel.fromJson(response['data']);
    }
    return null;
  }

  static Future<Map<String, dynamic>> cancelComplaint(String id) async {
    return await ApiClient.put('$_baseEndpoint/cancelComplaint/$id');
  }
}


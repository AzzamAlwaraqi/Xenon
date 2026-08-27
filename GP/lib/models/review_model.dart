import 'api_client.dart';
class ReviewModel {
  final String id;
  final String review;
  final double rating;
  final String? user;
  final String? package;
  final DateTime? createdAt;

  ReviewModel({
    required this.id,
    required this.review,
    required this.rating,
    this.user,
    this.package,
    this.createdAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: json['_id'] ?? json['id'] ?? '',
      review: json['review_text'] ?? json['review'] ?? '',
      rating: (json['review_rating'] ?? json['rating'] ?? 0).toDouble(),
      user: json['user_id'] is Map ? json['user_id']['name'] : (json['user'] is Map ? json['user']['name'] : json['user']),
      package: json['package_id'] is Map ? json['package_id']['package_name'] ?? json['package_id']['title'] : (json['package'] is Map ? json['package']['title'] : json['package']),
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }
}


class ReviewService {
  static const String _baseEndpoint = '/reviews';

  static Future<Map<String, dynamic>> createReview(Map<String, dynamic> data) async {
    return await ApiClient.post('$_baseEndpoint/createReview', body: data);
  }

  static Future<List<ReviewModel>> getMyReviews() async {
    final response = await ApiClient.get('$_baseEndpoint/getMyReviews');
    if (response['data'] != null && response['data'] is List) {
      return (response['data'] as List).map((e) => ReviewModel.fromJson(e)).toList();
    }
    return [];
  }

  static Future<ReviewModel?> getReviewById(String id) async {
    final response = await ApiClient.get('$_baseEndpoint/getReviewById/$id');
    if (response['data'] != null) {
      return ReviewModel.fromJson(response['data']);
    }
    return null;
  }

  static Future<Map<String, dynamic>> updateReview(String id, Map<String, dynamic> data) async {
    return await ApiClient.put('$_baseEndpoint/updateReview/$id', body: data);
  }

  static Future<Map<String, dynamic>> deleteReview(String id) async {
    return await ApiClient.patch('$_baseEndpoint/deleteReview/$id'); // Backend used PATCH
  }

  static Future<List<ReviewModel>> getPackageReviews(String packageId) async {
    final response = await ApiClient.get('$_baseEndpoint/package/$packageId', requireAuth: false);
    if (response['data'] != null && response['data'] is List) {
      return (response['data'] as List).map((e) => ReviewModel.fromJson(e)).toList();
    }
    return [];
  }
}


import 'api_client.dart';
class PackageModel {
  final String id;
  final String title;
  final String description;
  final double price;
  final String? image;
  final String? vendorId;

  PackageModel({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    this.image,
    this.vendorId,
  });

  factory PackageModel.fromJson(Map<String, dynamic> json) {
    return PackageModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      image: json['image'],
      vendorId: json['vendor'] is Map ? json['vendor']['_id'] : json['vendor'],
    );
  }
}


class PackageService {
  static const String _baseEndpoint = '/packages';

  static Future<List<PackageModel>> getAllPackages() async {
    final response = await ApiClient.get(_baseEndpoint, requireAuth: false);
    if (response['data'] != null && response['data'] is List) {
      return (response['data'] as List).map((e) => PackageModel.fromJson(e)).toList();
    }
    return [];
  }

  static Future<PackageModel?> getPackageById(String id) async {
    final response = await ApiClient.get('$_baseEndpoint/package/$id', requireAuth: false);
    if (response['data'] != null) {
      return PackageModel.fromJson(response['data']);
    }
    return null;
  }
}


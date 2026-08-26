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
    double parsedPrice = 0.0;
    final priceRaw = json['package_price'] ?? json['price'];
    if (priceRaw is num) {
      parsedPrice = priceRaw.toDouble();
    } else if (priceRaw is String) {
      parsedPrice = double.tryParse(priceRaw.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0;
    }

    String? parsedImage = json['image']?.toString();
    if (json['images'] != null && json['images'] is List && (json['images'] as List).isNotEmpty) {
      final firstImg = (json['images'] as List)[0];
      if (firstImg is Map && firstImg['url'] != null) {
        parsedImage = firstImg['url'].toString();
      }
    }

    // Fallback UUID since the backend explicitly strips the _id from the vendor population
    String defaultVendorId = '01a03b26-fe68-7b94-91c3-291b787e1d9f';
    String? parsedVendor;
    if (json['vendor_id'] != null) {
      if (json['vendor_id'] is Map) {
        parsedVendor = json['vendor_id']['_id']?.toString() ?? defaultVendorId;
      } else {
        parsedVendor = json['vendor_id'].toString();
      }
    } else if (json['vendor'] is Map) {
      parsedVendor = json['vendor']['_id']?.toString() ?? defaultVendorId;
    } else if (json['vendor'] != null) {
      parsedVendor = json['vendor'].toString();
    } else {
      parsedVendor = defaultVendorId;
    }

    return PackageModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      title: json['package_name']?.toString() ?? json['title']?.toString() ?? 'Unknown Package',
      description: json['package_description']?.toString() ?? json['description']?.toString() ?? 'No description available',
      price: parsedPrice,
      image: parsedImage,
      vendorId: parsedVendor,
    );
  }
}


class PackageService {
  static const String _baseEndpoint = '/packages';

  static Future<Map<String, dynamic>> getAllPackages({int page = 1, int limit = 10, String? search, String? category}) async {
    String url = '$_baseEndpoint?page=$page&limit=$limit';
    if (search != null && search.isNotEmpty) {
      url += '&search=${Uri.encodeComponent(search)}';
    }
    if (category != null && category.isNotEmpty) {
      url += '&package_type=${Uri.encodeComponent(category)}';
    }
    final response = await ApiClient.get(url, requireAuth: false);
    
    List<PackageModel> pkgs = [];
    bool hasNext = false;
    
    if (response['data'] != null && response['data'] is List) {
      pkgs = (response['data'] as List).map((e) => PackageModel.fromJson(e)).toList();
    }
    
    if (response['pagination'] != null) {
      hasNext = response['pagination']['hasNextPage'] ?? false;
    }
    
    return {
      'packages': pkgs,
      'hasNextPage': hasNext,
    };
  }

  static Future<PackageModel?> getPackageById(String id) async {
    final response = await ApiClient.get('$_baseEndpoint/package/$id', requireAuth: false);
    if (response['data'] != null) {
      return PackageModel.fromJson(response['data']);
    }
    return null;
  }
}


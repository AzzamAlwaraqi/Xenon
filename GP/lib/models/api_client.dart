import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/secure_storage_helper.dart';
import 'api_config.dart';

class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}

class ApiClient {
  static Future<Map<String, String>> _getHeaders({bool requireAuth = true}) async {
    final headers = Map<String, String>.from(ApiConfig.headers);
    if (requireAuth) {
      final token = await SecureStorageHelper.getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  static dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isNotEmpty) {
        return json.decode(response.body);
      }
      return null;
    } else {
      String errorMessage = 'An unexpected error occurred';
      try {
        final decoded = json.decode(response.body);
        if (decoded['message'] != null) {
          errorMessage = decoded['message'];
        }
      } catch (_) {
        errorMessage = response.body;
      }
      throw ApiException(errorMessage, response.statusCode);
    }
  }

  // GET Request
  static Future<dynamic> get(String endpoint, {bool requireAuth = true}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(requireAuth: requireAuth);
    
    try {
      final response = await http.get(url, headers: headers).timeout(
        const Duration(seconds: 30),
        onTimeout: () => throw ApiException('Connection timeout. Please check your internet connection.', 408),
      );
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: ${e.toString()}', 500);
    }
  }

  // POST Request
  static Future<dynamic> post(String endpoint, {Map<String, dynamic>? body, bool requireAuth = true}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(requireAuth: requireAuth);
    
    try {
      final response = await http.post(url, headers: headers, body: body != null ? json.encode(body) : null).timeout(
        const Duration(seconds: 30),
        onTimeout: () => throw ApiException('Connection timeout. Please check your internet connection.', 408),
      );
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: ${e.toString()}', 500);
    }
  }

  // PUT Request
  static Future<dynamic> put(String endpoint, {Map<String, dynamic>? body, bool requireAuth = true}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(requireAuth: requireAuth);
    
    try {
      final response = await http.put(url, headers: headers, body: body != null ? json.encode(body) : null).timeout(
        const Duration(seconds: 30),
        onTimeout: () => throw ApiException('Connection timeout. Please check your internet connection.', 408),
      );
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: ${e.toString()}', 500);
    }
  }
  
  // PATCH Request
  static Future<dynamic> patch(String endpoint, {Map<String, dynamic>? body, bool requireAuth = true}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(requireAuth: requireAuth);
    
    try {
      final response = await http.patch(url, headers: headers, body: body != null ? json.encode(body) : null);
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: ${e.toString()}', 500);
    }
  }

  // DELETE Request
  static Future<dynamic> delete(String endpoint, {bool requireAuth = true}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(requireAuth: requireAuth);
    
    try {
      final response = await http.delete(url, headers: headers).timeout(
        const Duration(seconds: 30),
        onTimeout: () => throw ApiException('Connection timeout. Please check your internet connection.', 408),
      );
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: ${e.toString()}', 500);
    }
  }
}

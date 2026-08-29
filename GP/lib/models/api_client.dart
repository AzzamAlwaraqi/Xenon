import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/secure_storage_helper.dart';
import 'api_config.dart';

class ApiException implements Exception {
  final String message;
  final int statusCode;

  /// Machine-readable reason from the API (for example 'CONVERSATION_EXPIRED')
  /// or 'TIMEOUT' when the request never completed. Callers use this instead of
  /// matching on the human-readable message, which changes with wording and locale.
  final String? code;

  /// Server-side request id, useful when reporting a failure.
  final String? requestId;

  ApiException(this.message, this.statusCode, {this.code, this.requestId});

  @override
  String toString() => message;
}

class ApiClient {
  static const Duration defaultTimeout = Duration(seconds: 30);

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

  static ApiException _timeout() => ApiException(
    'Connection timeout. Please check your internet connection.',
    408,
    code: 'TIMEOUT',
  );

  static dynamic _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isNotEmpty) {
        return json.decode(response.body);
      }
      return null;
    } else {
      String errorMessage = 'An unexpected error occurred';
      String? errorCode;
      String? requestId;
      try {
        final decoded = json.decode(response.body);
        if (decoded is Map) {
          // The API reports failures as { message, error: { code, message }, requestId }.
          // The nested error object is preferred because it carries the machine-readable code.
          final error = decoded['error'];
          if (error is Map) {
            errorMessage = error['message']?.toString() ?? errorMessage;
            errorCode = error['code']?.toString();
          }
          if (decoded['message'] != null) {
            errorMessage = decoded['message'].toString();
          }
          requestId = decoded['requestId']?.toString();
        }
      } catch (_) {
        errorMessage = response.body;
      }
      throw ApiException(
        errorMessage,
        response.statusCode,
        code: errorCode,
        requestId: requestId,
      );
    }
  }

  // GET Request
  static Future<dynamic> get(
    String endpoint, {
    bool requireAuth = true,
    Duration timeout = defaultTimeout,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(requireAuth: requireAuth);

    try {
      final response = await http
          .get(url, headers: headers)
          .timeout(timeout, onTimeout: () => throw _timeout());
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: ${e.toString()}', 500);
    }
  }

  // POST Request
  static Future<dynamic> post(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requireAuth = true,
    Duration timeout = defaultTimeout,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(requireAuth: requireAuth);

    try {
      final response = await http
          .post(
            url,
            headers: headers,
            body: body != null ? json.encode(body) : null,
          )
          .timeout(timeout, onTimeout: () => throw _timeout());
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: ${e.toString()}', 500);
    }
  }

  // PUT Request
  static Future<dynamic> put(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requireAuth = true,
    Duration timeout = defaultTimeout,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(requireAuth: requireAuth);

    try {
      final response = await http
          .put(
            url,
            headers: headers,
            body: body != null ? json.encode(body) : null,
          )
          .timeout(timeout, onTimeout: () => throw _timeout());
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: ${e.toString()}', 500);
    }
  }

  // PATCH Request
  static Future<dynamic> patch(
    String endpoint, {
    Map<String, dynamic>? body,
    bool requireAuth = true,
    Duration timeout = defaultTimeout,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(requireAuth: requireAuth);

    try {
      final response = await http
          .patch(
            url,
            headers: headers,
            body: body != null ? json.encode(body) : null,
          )
          .timeout(timeout, onTimeout: () => throw _timeout());
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: ${e.toString()}', 500);
    }
  }

  // DELETE Request
  static Future<dynamic> delete(
    String endpoint, {
    bool requireAuth = true,
    Duration timeout = defaultTimeout,
  }) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(requireAuth: requireAuth);

    try {
      final response = await http
          .delete(url, headers: headers)
          .timeout(timeout, onTimeout: () => throw _timeout());
      return _handleResponse(response);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Network error: ${e.toString()}', 500);
    }
  }
}

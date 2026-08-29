// Reference only — not used by the GP app, which has its own equivalent
// client wired into its ApiClient/provider architecture (see
// GP/lib/services/ai_advisor_service.dart, GP/lib/providers/ai_advisor_provider.dart,
// and GP/lib/models/ai_advisor_models.dart). Kept here as a copy-paste starting
// point for any other Flutter project that wants to talk to /api/v1/ai/chat
// without that architecture. Uncomment to use.
/*
import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

typedef AccessTokenProvider = Future<String?> Function();

/// Small transport adapter for the authenticated Xenon backend API.
/// This is not a Flutter app and never connects to the internal AI port directly.
class XenonAiClient {
  XenonAiClient({
    required this.baseUri,
    required this.accessTokenProvider,
    http.Client? httpClient,
    this.timeout = const Duration(seconds: 30),
  }) : _http = httpClient ?? http.Client();

  final Uri baseUri;
  final AccessTokenProvider accessTokenProvider;
  final Duration timeout;
  final http.Client _http;
  String? conversationId;

  Future<XenonAiResponse> recommend(String query) async {
    final normalized = query.trim();
    if (normalized.length < 2 || normalized.length > 1000) {
      throw const XenonAiException('INVALID_QUERY', 'Use 2 to 1000 characters.');
    }
    final accessToken = await accessTokenProvider();
    if (accessToken == null || accessToken.isEmpty) {
      throw const XenonAiException(
        'UNAUTHENTICATED',
        'Please sign in before using the travel advisor.',
      );
    }
    final response = await _http
        .post(
          baseUri.resolve('/api/v1/ai/chat'),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer $accessToken',
          },
          body: jsonEncode({
            'query': normalized,
            if (conversationId case final id?) 'conversationId': id,
          }),
        )
        .timeout(timeout, onTimeout: () => throw const XenonAiException('TIMEOUT', 'The recommendation request timed out.'));

    final Object? decoded;
    try {
      decoded = jsonDecode(utf8.decode(response.bodyBytes));
    } on FormatException {
      throw XenonAiException('INVALID_RESPONSE', 'The server returned invalid JSON.', statusCode: response.statusCode);
    }
    if (decoded is! Map<String, dynamic>) {
      throw XenonAiException('INVALID_RESPONSE', 'The server returned an unexpected response.', statusCode: response.statusCode);
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      final error = decoded['error'];
      throw XenonAiException(
        error is Map ? (error['code']?.toString() ?? 'REQUEST_FAILED') : 'REQUEST_FAILED',
        error is Map ? (error['message']?.toString() ?? 'Request failed.') : 'Request failed.',
        statusCode: response.statusCode,
        requestId: decoded['requestId']?.toString(),
      );
    }
    final data = decoded['data'];
    if (data is! Map<String, dynamic>) throw const XenonAiException('INVALID_RESPONSE', 'Response data is missing.');
    conversationId = data['conversationId']?.toString();
    return XenonAiResponse(
      data: data,
      requestId: decoded['requestId']?.toString(),
      apiVersion: decoded['apiVersion']?.toString() ?? 'unknown',
    );
  }

  void startNewConversation() => conversationId = null;
  void close() => _http.close();
}

class XenonAiResponse {
  const XenonAiResponse({required this.data, required this.apiVersion, this.requestId});
  final Map<String, dynamic> data;
  final String apiVersion;
  final String? requestId;
  String get reply => data['reply']?.toString() ?? '';
  String get outcome => data['outcome']?.toString() ?? 'unknown';
  Map<String, dynamic>? get topRecommendation => data['topRecommendation'] is Map<String, dynamic> ? data['topRecommendation'] as Map<String, dynamic> : null;
  List<dynamic> get matchingPackages => data['matchingPackages'] is List ? data['matchingPackages'] as List<dynamic> : const [];
}

class XenonAiException implements Exception {
  const XenonAiException(this.code, this.message, {this.statusCode, this.requestId});
  final String code;
  final String message;
  final int? statusCode;
  final String? requestId;
  @override
  String toString() => 'XenonAiException($code): $message';
}
*/

import '../models/ai_advisor_models.dart';
import '../models/api_client.dart';

class AiAdvisorService {
  const AiAdvisorService();

  Future<AiAdvisorResponse> sendMessage({
    required String query,
    String? conversationId,
  }) async {
    final body = <String, dynamic>{'query': query};
    if (conversationId != null) {
      body['conversationId'] = conversationId;
    }
    final response = await ApiClient.post(
      '/ai/chat',
      body: body,
      timeout: const Duration(seconds: 35),
    );
    if (response is! Map || response['data'] is! Map) {
      throw ApiException(
        'I received an incomplete response. Please try again.',
        502,
        code: 'INVALID_RESPONSE',
      );
    }
    try {
      return AiAdvisorResponse.fromJson(
        Map<String, dynamic>.from(response['data'] as Map),
      );
    } on FormatException {
      throw ApiException(
        'I received an incomplete response. Please try again.',
        502,
        code: 'INVALID_RESPONSE',
      );
    }
  }
}

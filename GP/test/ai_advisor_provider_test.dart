import 'package:flutter_test/flutter_test.dart';
import 'package:gp/models/ai_advisor_models.dart';
import 'package:gp/models/api_client.dart';
import 'package:gp/providers/ai_advisor_provider.dart';
import 'package:gp/services/ai_advisor_service.dart';

class FakeAdvisorService extends AiAdvisorService {
  FakeAdvisorService({this.error});
  final ApiException? error;
  String? receivedConversationId;

  @override
  Future<AiAdvisorResponse> sendMessage({
    required String query,
    String? conversationId,
  }) async {
    receivedConversationId = conversationId;
    if (error != null) throw error!;
    return const AiAdvisorResponse(
      reply: 'I found a suitable trip.',
      outcome: 'matches_found',
      conversationId: 'signed-token',
      recommendations: [],
      suggestions: ['Make it cheaper'],
    );
  }
}

void main() {
  test('validates messages with customer-friendly English and Arabic text', () {
    final provider = AiAdvisorProvider(service: FakeAdvisorService());
    expect(provider.validateMessage(' ', isArabic: false), contains('Tell me'));
    expect(provider.validateMessage(' ', isArabic: true), contains('أخبرني'));
    expect(
      provider.validateMessage('Jordan family trip', isArabic: false),
      isNull,
    );
  });

  test(
    'sends a message, stores conversation context and supports follow-up',
    () async {
      final service = FakeAdvisorService();
      final provider = AiAdvisorProvider(service: service);
      provider.ensureWelcome(isArabic: false);
      expect(
        await provider.sendMessage('Jordan family trip', isArabic: false),
        isTrue,
      );
      expect(provider.hasConversation, isTrue);
      expect(provider.messages.last.text, 'I found a suitable trip.');
      await provider.sendMessage('Make it cheaper', isArabic: false);
      expect(service.receivedConversationId, 'signed-token');
    },
  );

  test(
    'turns infrastructure failures into a reassuring customer message',
    () async {
      final provider = AiAdvisorProvider(
        service: FakeAdvisorService(
          error: ApiException('internal detail', 503),
        ),
      );
      await provider.sendMessage('Jordan family trip', isArabic: false);
      expect(
        provider.messages.last.text,
        contains('bookings and account are safe'),
      );
      expect(provider.messages.last.text, isNot(contains('503')));
    },
  );
}

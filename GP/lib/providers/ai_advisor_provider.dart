import 'package:flutter/foundation.dart';

import '../models/ai_advisor_models.dart';
import '../models/api_client.dart';
import '../services/ai_advisor_service.dart';

class AiAdvisorProvider extends ChangeNotifier {
  AiAdvisorProvider({AiAdvisorService? service})
    : _service = service ?? const AiAdvisorService();

  final AiAdvisorService _service;
  final List<AiChatMessage> _messages = [];
  String? _conversationId;
  bool _isSending = false;
  bool _welcomed = false;

  List<AiChatMessage> get messages => List.unmodifiable(_messages);
  bool get isSending => _isSending;
  bool get hasConversation => _conversationId != null;

  void ensureWelcome({required bool isArabic}) {
    if (_welcomed) return;
    _welcomed = true;
    _messages.add(
      AiChatMessage(
        author: AiMessageAuthor.assistant,
        text: isArabic
            ? 'أهلاً! أخبرني عن الرحلة التي تناسبك. يمكنك ذكر الميزانية، التاريخ، عدد الأشخاص، الطقس والأنشطة التي تفضلها.'
            : 'Ahlan! Tell me what kind of trip would suit you. You can mention your budget, dates, group size, weather and preferred activities.',
      ),
    );
    notifyListeners();
  }

  String? validateMessage(String value, {required bool isArabic}) {
    final normalized = value.trim();
    if (normalized.length < 2) {
      return isArabic
          ? 'أخبرني قليلاً عن الرحلة التي تريدها.'
          : 'Tell me a little about the trip you want.';
    }
    if (normalized.length > 1000) {
      return isArabic
          ? 'الرسالة طويلة قليلاً. اختصرها واحتفظ بأهم تفاصيل الرحلة.'
          : 'That message is a little long. Please keep the most important trip details.';
    }
    if (RegExp(
      r'[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]',
    ).hasMatch(normalized)) {
      return isArabic
          ? 'تحتوي الرسالة على رموز غير مدعومة. يرجى حذفها والمحاولة مرة أخرى.'
          : 'That message contains unsupported characters. Please remove them and try again.';
    }
    return null;
  }

  Future<bool> sendMessage(String value, {required bool isArabic}) async {
    if (_isSending) return false;
    final query = value.trim();
    final validationMessage = validateMessage(query, isArabic: isArabic);
    if (validationMessage != null) {
      _messages.add(
        AiChatMessage(
          author: AiMessageAuthor.assistant,
          text: validationMessage,
        ),
      );
      notifyListeners();
      return false;
    }

    _messages.add(AiChatMessage(author: AiMessageAuthor.customer, text: query));
    _isSending = true;
    notifyListeners();
    try {
      final response = await _service.sendMessage(
        query: query,
        conversationId: _conversationId,
      );
      _conversationId = response.conversationId;
      _messages.add(
        AiChatMessage(
          author: AiMessageAuthor.assistant,
          text: response.reply,
          recommendations: response.recommendations,
          suggestions: response.suggestions,
        ),
      );
      return true;
    } on ApiException catch (error) {
      // Only a conversation-specific rejection ends the conversation. A plain 400 about the
      // message itself must not silently throw away the context the customer built up.
      final expiredConversation =
          error.code == 'CONVERSATION_EXPIRED' && _conversationId != null;
      if (expiredConversation) _conversationId = null;
      _messages.add(
        AiChatMessage(
          author: AiMessageAuthor.assistant,
          text: _friendlyError(
            error,
            isArabic: isArabic,
            expiredConversation: expiredConversation,
          ),
        ),
      );
      return false;
    } catch (_) {
      _messages.add(
        AiChatMessage(
          author: AiMessageAuthor.assistant,
          text: isArabic
              ? 'تعذر إكمال طلبك الآن. حاول مرة أخرى بعد قليل.'
              : 'I could not complete that request right now. Please try again shortly.',
        ),
      );
      return false;
    } finally {
      _isSending = false;
      notifyListeners();
    }
  }

  void startNewConversation({required bool isArabic}) {
    _conversationId = null;
    _messages
      ..clear()
      ..add(
        AiChatMessage(
          author: AiMessageAuthor.assistant,
          text: isArabic
              ? 'لنبدأ رحلة جديدة. ما الذي تبحث عنه؟'
              : 'Let’s plan a new trip. What are you looking for?',
        ),
      );
    _welcomed = true;
    notifyListeners();
  }

  void clearForLogout() {
    _conversationId = null;
    _messages.clear();
    _welcomed = false;
    _isSending = false;
    notifyListeners();
  }

  String _friendlyError(
    ApiException error, {
    required bool isArabic,
    bool expiredConversation = false,
  }) {
    if (error.statusCode == 401 || error.statusCode == 403) {
      return isArabic
          ? 'انتهت جلستك. سجّل الدخول مرة أخرى للمتابعة.'
          : 'Your session has ended. Please sign in again to continue.';
    }
    if (error.statusCode == 429) {
      return isArabic
          ? 'تم إرسال الرسائل بسرعة. انتظر قليلاً ثم حاول مرة أخرى.'
          : 'You’re sending messages quickly. Please wait a moment and try again.';
    }
    if (error.code == 'TIMEOUT') {
      return isArabic
          ? 'يستغرق البحث وقتاً أطول من المتوقع. حاول مرة أخرى.'
          : 'The search is taking longer than expected. Please try again.';
    }
    if (expiredConversation) {
      return isArabic
          ? 'انتهت صلاحية هذه المحادثة. بدأت لك محادثة جديدة.'
          : 'This conversation has expired, so I started a fresh one for you.';
    }
    if (error.statusCode >= 500) {
      return isArabic
          ? 'لا أستطيع الوصول إلى مساعد الرحلات الآن. حجوزاتك وحسابك بأمان.'
          : 'I can’t reach the travel assistant right now. Your bookings and account are safe.';
    }
    return isArabic
        ? 'تعذر إكمال طلبك. تحقق من التفاصيل وحاول مرة أخرى.'
        : 'I couldn’t complete that request. Check the details and try again.';
  }
}

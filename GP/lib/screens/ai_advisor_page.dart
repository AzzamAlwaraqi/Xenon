import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/ai_advisor_models.dart';
import '../models/api_client.dart';
import '../models/package_model.dart';
import '../providers/ai_advisor_provider.dart';
import '../providers/settings_provider.dart';
import '../theme/colors.dart';
import '../utils/secure_storage_helper.dart';
import '../widgets/ai_message_bubble.dart';
import '../widgets/ai_recommendation_card.dart';
import '../widgets/ai_typing_indicator.dart';
import 'destination_details_page.dart';
import 'guest_required_page.dart';

class AiAdvisorPage extends StatelessWidget {
  const AiAdvisorPage({super.key});

  // The provider lives at the application root, so leaving and reopening this tab keeps the
  // conversation and its context instead of silently starting over.
  @override
  Widget build(BuildContext context) => const _AiAdvisorContent();
}

class _AiAdvisorContent extends StatefulWidget {
  const _AiAdvisorContent();

  @override
  State<_AiAdvisorContent> createState() => _AiAdvisorContentState();
}

class _AiAdvisorContentState extends State<_AiAdvisorContent> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  int _lastMessageCount = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;
      final isArabic =
          context.read<SettingsProvider>().locale.languageCode == 'ar';
      context.read<AiAdvisorProvider>().ensureWelcome(isArabic: isArabic);
      final token = await SecureStorageHelper.getToken();
      if (mounted && (token == null || token.isEmpty)) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const GuestRequiredPage()),
        );
      }
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToLatest() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _send(String value) async {
    final provider = context.read<AiAdvisorProvider>();
    final isArabic =
        context.read<SettingsProvider>().locale.languageCode == 'ar';
    if (provider.validateMessage(value, isArabic: isArabic) == null) {
      _messageController.clear();
    }
    await provider.sendMessage(value, isArabic: isArabic);
  }

  Future<void> _openPackage(AiRecommendation recommendation) async {
    final isArabic =
        context.read<SettingsProvider>().locale.languageCode == 'ar';
    if (!recommendation.package.canOpen) {
      _notice(
        isArabic
            ? 'لا يمكن فتح هذه الباقة الآن.'
            : 'This package cannot be opened right now.',
      );
      return;
    }
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );
    try {
      final livePackage = await PackageService.getPackageById(
        recommendation.package.id,
      );
      if (!mounted) return;
      Navigator.pop(context);
      if (livePackage == null) {
        _notice(
          isArabic
              ? 'لم تعد هذه الباقة متاحة.'
              : 'This package is no longer available.',
        );
        return;
      }
      final price =
          '${livePackage.price.toStringAsFixed(livePackage.price % 1 == 0 ? 0 : 2)} ${recommendation.currency}';
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => DestinationDetailsPage(
            destination: {
              'id': livePackage.id,
              'package_id': livePackage.id,
              'title': livePackage.title,
              'package_name': livePackage.title,
              'description': livePackage.description,
              'imageUrl':
                  livePackage.image ?? recommendation.package.imageUrl ?? '',
              'price': price,
              'category': recommendation.package.type ?? 'package',
              'vendor_id':
                  livePackage.vendorId ?? recommendation.package.vendorId,
            },
          ),
        ),
      );
    } on ApiException catch (error) {
      if (!mounted) return;
      Navigator.pop(context);
      _notice(
        error.statusCode == 401
            ? (isArabic
                  ? 'انتهت جلستك. سجّل الدخول مرة أخرى.'
                  : 'Your session has ended. Please sign in again.')
            : (isArabic
                  ? 'تعذر فتح الباقة الآن. حاول مرة أخرى.'
                  : 'I couldn’t open that package. Please try again.'),
      );
    } catch (_) {
      if (!mounted) return;
      Navigator.pop(context);
      _notice(
        isArabic
            ? 'تعذر فتح الباقة الآن. حاول مرة أخرى.'
            : 'I couldn’t open that package. Please try again.',
      );
    }
  }

  void _notice(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    final provider = context.watch<AiAdvisorProvider>();
    final isArabic = settings.locale.languageCode == 'ar';
    final isDark = settings.themeMode == ThemeMode.dark;
    if (_lastMessageCount != provider.messages.length) {
      _lastMessageCount = provider.messages.length;
      _scrollToLatest();
    }
    final suggestions = isArabic
        ? const [
            'رحلة عائلية تحت 300 دينار',
            'مكان ثقافي غير حار',
            'رحلة تتضمن مرشداً وغداءً',
          ]
        : const [
            'A family trip under 300 JOD',
            'A cultural place that isn’t too hot',
            'A trip with a guide and lunch',
          ];

    return Scaffold(
      appBar: AppBar(
        title: Text(isArabic ? 'مساعد الرحلات' : 'Travel Assistant'),
        actions: [
          IconButton(
            tooltip: isArabic ? 'محادثة جديدة' : 'New conversation',
            onPressed: provider.isSending
                ? null
                : () => provider.startNewConversation(isArabic: isArabic),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (provider.messages.length <= 1)
              SizedBox(
                height: 48,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 5,
                  ),
                  scrollDirection: Axis.horizontal,
                  itemCount: suggestions.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (_, index) => ActionChip(
                    label: Text(suggestions[index]),
                    onPressed: provider.isSending
                        ? null
                        : () => _send(suggestions[index]),
                  ),
                ),
              ),
            Expanded(
              child: ListView.builder(
                key: const ValueKey('ai-message-list'),
                controller: _scrollController,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                itemCount:
                    provider.messages.length + (provider.isSending ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == provider.messages.length) {
                    return AiTypingIndicator(isArabic: isArabic);
                  }
                  final message = provider.messages[index];
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      AiMessageBubble(message: message),
                      ...message.recommendations.asMap().entries.map(
                        (entry) => AiRecommendationCard(
                          recommendation: entry.value,
                          rank: entry.key + 1,
                          isArabic: isArabic,
                          onOpenPackage: entry.value.package.canOpen
                              ? () => _openPackage(entry.value)
                              : null,
                        ),
                      ),
                      if (message.suggestions.isNotEmpty)
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: message.suggestions
                              .take(3)
                              .map(
                                (suggestion) => ActionChip(
                                  label: Text(suggestion),
                                  onPressed: provider.isSending
                                      ? null
                                      : () => _send(suggestion),
                                ),
                              )
                              .toList(),
                        ),
                    ],
                  );
                },
              ),
            ),
            Container(
              padding: EdgeInsets.fromLTRB(
                12,
                10,
                12,
                10 + MediaQuery.viewInsetsOf(context).bottom,
              ),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : Colors.white,
                border: Border(
                  top: BorderSide(
                    color: isDark
                        ? AppColors.borderDark
                        : AppColors.borderLight,
                  ),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      key: const ValueKey('ai-message-input'),
                      controller: _messageController,
                      enabled: !provider.isSending,
                      minLines: 1,
                      maxLines: 4,
                      maxLength: 1000,
                      textInputAction: TextInputAction.newline,
                      decoration: InputDecoration(
                        counterText: '',
                        hintText: isArabic
                            ? 'صف الرحلة التي تريدها...'
                            : 'Describe the trip you want...',
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    key: const ValueKey('ai-send-button'),
                    onPressed: provider.isSending
                        ? null
                        : () => _send(_messageController.text),
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.primaryRust,
                    ),
                    icon: Icon(
                      isArabic
                          ? Icons.arrow_back_rounded
                          : Icons.arrow_forward_rounded,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

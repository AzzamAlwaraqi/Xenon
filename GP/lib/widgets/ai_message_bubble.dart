import 'package:flutter/material.dart';

import '../models/ai_advisor_models.dart';
import '../theme/colors.dart';

class AiMessageBubble extends StatelessWidget {
  const AiMessageBubble({super.key, required this.message});

  final AiChatMessage message;

  @override
  Widget build(BuildContext context) {
    final isCustomer = message.author == AiMessageAuthor.customer;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Align(
      alignment: isCustomer
          ? AlignmentDirectional.centerEnd
          : AlignmentDirectional.centerStart,
      child: Container(
        constraints: const BoxConstraints(maxWidth: 560),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isCustomer
              ? AppColors.primaryRust
              : (isDark ? AppColors.surfaceDark : Colors.white),
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(18),
            topRight: const Radius.circular(18),
            bottomLeft: Radius.circular(isCustomer ? 18 : 4),
            bottomRight: Radius.circular(isCustomer ? 4 : 18),
          ),
          border: isCustomer
              ? null
              : Border.all(
                  color: isDark ? AppColors.borderDark : AppColors.borderLight,
                ),
        ),
        child: Text(
          message.text,
          style: TextStyle(
            color: isCustomer
                ? Colors.white
                : (isDark
                      ? AppColors.textPrimaryDark
                      : AppColors.textPrimaryLight),
            height: 1.4,
          ),
        ),
      ),
    );
  }
}

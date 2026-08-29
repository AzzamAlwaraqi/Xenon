import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../theme/colors.dart';

class AiTypingIndicator extends StatelessWidget {
  const AiTypingIndicator({super.key, required this.isArabic});

  final bool isArabic;

  @override
  Widget build(BuildContext context) => Align(
    alignment: AlignmentDirectional.centerStart,
    child: Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.auto_awesome, size: 18, color: AppColors.primaryRust)
              .animate(onPlay: (controller) => controller.repeat())
              .shimmer(duration: 1200.ms),
          const SizedBox(width: 10),
          Text(
            isArabic
                ? 'أبحث عن أفضل الرحلات لك...'
                : 'Finding the best trips for you...',
          ),
        ],
      ),
    ),
  );
}

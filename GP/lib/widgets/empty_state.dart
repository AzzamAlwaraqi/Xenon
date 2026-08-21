import 'package:flutter/material.dart';
import 'package:gp/theme/colors.dart';

/// Reusable empty state widget — shown when a list has no items.
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final String? retryLabel;
  final VoidCallback? onRetry;
  final bool isDark;

  const EmptyState({
    super.key,
    required this.icon,
    required this.message,
    required this.isDark,
    this.retryLabel,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(top: 60),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 56,
              color: isDark ? AppColors.textSecondaryLight : Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: isDark ? AppColors.textSecondaryLight : Colors.grey[600],
                fontSize: 16,
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 12),
              TextButton(
                onPressed: onRetry,
                child: Text(retryLabel ?? 'Try Again'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

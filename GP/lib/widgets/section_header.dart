import 'package:flutter/material.dart';
import 'package:gp/theme/colors.dart';

/// Reusable section header with a small uppercase label and a bold title.
/// Used on HomePages, BookingsPage, etc.
class SectionHeader extends StatelessWidget {
  final String label;
  final String title;
  final bool isDark;
  final Widget? trailing;

  const SectionHeader({
    super.key,
    required this.label,
    required this.title,
    required this.isDark,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: AppColors.primaryRust,
                fontSize: 10,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              style: TextStyle(
                color: isDark ? Colors.white : Colors.black,
                fontSize: 28,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        trailing ?? const SizedBox.shrink(),
      ],
    );
  }
}

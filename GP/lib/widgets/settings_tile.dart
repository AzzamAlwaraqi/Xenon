import 'package:flutter/material.dart';
import 'package:gp/theme/colors.dart';

/// A single settings row with an icon, title, subtitle, and an optional trailing widget.
/// Used in settings_page.dart to replace all the _buildSettingsTile / _buildPreviewTile methods.
class SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final bool isDark;
  final VoidCallback? onTap;
  final Widget? trailing;

  const SettingsTile({
    super.key,
    required this.icon,
    required this.title,
    required this.isDark,
    this.subtitle,
    this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final Widget content = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 14.0),
      child: Row(
        children: [
          // Icon bubble
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? AppColors.cardBgDark : const Color(0xFFF0EDEB),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.primaryRust, size: 22),
          ),
          const SizedBox(width: 16),
          // Title + subtitle
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 3),
                  Text(
                    subtitle!,
                    style: TextStyle(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      fontSize: 14,
                    ),
                  ),
                ],
              ],
            ),
          ),
          // Trailing widget or default chevron
          trailing ??
              Icon(Icons.chevron_right,
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
        ],
      ),
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: content,
      );
    }

    return content;
  }
}

/// A thin divider aligned to match the icon offset in SettingsTile.
class SettingsDivider extends StatelessWidget {
  final bool isDark;
  const SettingsDivider({super.key, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 68.0, right: 16.0),
      child: Divider(
        color: isDark ? AppColors.borderDark : AppColors.borderLight,
        height: 1,
      ),
    );
  }
}

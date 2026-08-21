import 'package:flutter/material.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/screens/notifications_page.dart';

/// Reusable AppBar used across all main pages.
class AppNavBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final bool isDark;
  final bool showBack;
  final bool showNotifications;
  final List<Widget>? extraActions;

  const AppNavBar({
    super.key,
    required this.title,
    required this.isDark,
    this.showBack = false,
    this.showNotifications = true,
    this.extraActions,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final contentColor = isDark ? Colors.white : Colors.black;

    return AppBar(
      backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
      elevation: 0,
      leading: showBack
          ? IconButton(
              icon: Icon(
                Icons.arrow_back_ios_new,
                color: AppColors.primaryRust,
              ),
              onPressed: () => Navigator.pop(context),
            )
          : null,
      title: Text(
        title,
        style: TextStyle(
          color: contentColor,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      actions: [
        if (extraActions != null) ...extraActions!,
        if (showNotifications)
          IconButton(
            icon: Icon(Icons.notifications_outlined, color: contentColor),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NotificationsPage()),
              );
            },
          ),
        const SizedBox(width: 8),
      ],
    );
  }
}

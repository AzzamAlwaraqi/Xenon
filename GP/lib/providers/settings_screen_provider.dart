import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/providers/settings_provider.dart';
import 'package:gp/providers/ai_advisor_provider.dart';

class SettingsScreenProvider extends ChangeNotifier {
  bool isDarkMode(BuildContext context) {
    return context.read<SettingsProvider>().themeMode == ThemeMode.dark;
  }

  void toggleDarkMode(BuildContext context, bool value) {
    // toggleTheme just flips it, if value matches current, no op needed, 
    // but typically switch passes the new value, so we just toggle
    if (isDarkMode(context) != value) {
      context.read<SettingsProvider>().toggleTheme();
      notifyListeners();
    }
  }

  void logout(BuildContext context) {
    // Perform logout logic
    // The assistant transcript belongs to the account signing out, so it must not survive.
    context.read<AiAdvisorProvider>().clearForLogout();
    Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
  }
}

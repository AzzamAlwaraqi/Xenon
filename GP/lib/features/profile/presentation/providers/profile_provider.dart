import 'package:flutter/material.dart';

class ProfileProvider extends ChangeNotifier {
  void navigateToSettings(BuildContext context) {
    // Usually via bottom nav now, but can push if needed.
    // However, the new design has Settings as a tab, but the user image shows a Settings icon on the top right of the Profile Page too.
    // If they click the Settings gear, we can just navigate to the settings page.
    Navigator.pushNamed(context, '/settings');
  }

  void logout(BuildContext context) {
    Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
  }

  void navigateToAllBookings(BuildContext context) {
    // Handle navigation
  }

  void navigateToMyCards(BuildContext context) {
    // Handle navigation
  }

  void navigateToResetPassword(BuildContext context) {
    // Handle navigation
  }
}

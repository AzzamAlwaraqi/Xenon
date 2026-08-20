import 'package:flutter/material.dart';

class GuestRequiredProvider extends ChangeNotifier {
  void navigateToAuth(BuildContext context) {
    Navigator.pushNamed(context, '/login');
  }

  void goBack(BuildContext context) {
    Navigator.pop(context);
  }
}

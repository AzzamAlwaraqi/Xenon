import 'package:flutter/material.dart';

class LoginProvider extends ChangeNotifier {
  final TextEditingController emailOrPhoneController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  bool _obscurePassword = true;
  bool _isLoading = false;

  bool get obscurePassword => _obscurePassword;
  bool get isLoading => _isLoading;

  void togglePasswordVisibility() {
    _obscurePassword = !_obscurePassword;
    notifyListeners();
  }

  Future<void> login(BuildContext context) async {
    _isLoading = true;
    notifyListeners();
    
    // Simulate API call
    await Future.delayed(const Duration(seconds: 2));
    
    _isLoading = false;
    notifyListeners();

    if (context.mounted) {
      Navigator.pushReplacementNamed(context, '/main');
    }
  }

  void continueWithGoogle() {
    // Implement Google login
  }

  void continueWithApple() {
    // Implement Apple login
  }

  @override
  void dispose() {
    emailOrPhoneController.dispose();
    passwordController.dispose();
    super.dispose();
  }
}

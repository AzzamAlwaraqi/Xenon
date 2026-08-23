import 'package:flutter/material.dart';
import 'package:gp/models/auth_model.dart';

class LoginProvider extends ChangeNotifier {
  bool _obscurePassword = true;
  bool _isLoading = false;

  bool get obscurePassword => _obscurePassword;
  bool get isLoading => _isLoading;

  void togglePasswordVisibility() {
    _obscurePassword = !_obscurePassword;
    notifyListeners();
  }

  Future<String?> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    
    final error = await AuthService.login(
      email.trim(),
      password,
    );
    
    _isLoading = false;
    notifyListeners();

    return error;
  }

  void continueWithGoogle() {
    // Implement Google login
  }

  void continueWithApple() {
    // Implement Apple login
  }
}

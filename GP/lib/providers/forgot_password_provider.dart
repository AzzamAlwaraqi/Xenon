import 'package:flutter/material.dart';
import 'package:gp/models/auth_model.dart';

class ForgotPasswordProvider extends ChangeNotifier {
  bool _isLoading = false;
  bool _otpSent = false;
  
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _hasMinLength = false;
  bool _hasCapital = false;
  bool _hasNumber = false;
  bool _hasSpecial = false;
  bool _passwordsMatch = false;

  bool get isLoading => _isLoading;
  bool get otpSent => _otpSent;
  
  bool get obscurePassword => _obscurePassword;
  bool get obscureConfirmPassword => _obscureConfirmPassword;
  
  bool get hasMinLength => _hasMinLength;
  bool get hasCapital => _hasCapital;
  bool get hasNumber => _hasNumber;
  bool get hasSpecial => _hasSpecial;
  bool get passwordsMatch => _passwordsMatch;

  void validatePassword(String password, String confirm) {
    _hasMinLength = password.length >= 8;
    _hasCapital = password.contains(RegExp(r'[A-Z]'));
    _hasNumber = password.contains(RegExp(r'[0-9]'));
    _hasSpecial = password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>\-\_]'));
    _passwordsMatch = password.isNotEmpty && password == confirm;
    
    notifyListeners();
  }

  bool get isPasswordValid => _hasMinLength && _hasCapital && _hasNumber && _hasSpecial && _passwordsMatch;

  int get passwordStrengthLevel {
    int metConditions = 0;
    if (_hasMinLength) metConditions++;
    if (_hasCapital) metConditions++;
    if (_hasNumber) metConditions++;
    if (_hasSpecial) metConditions++;
    
    if (metConditions == 0) return 0;
    if (metConditions <= 1) return 1; // Weak
    if (metConditions <= 3) return 2; // Medium
    return 3; // Strong
  }

  void togglePasswordVisibility() {
    _obscurePassword = !_obscurePassword;
    notifyListeners();
  }

  void toggleConfirmPasswordVisibility() {
    _obscureConfirmPassword = !_obscureConfirmPassword;
    notifyListeners();
  }

  Future<bool> requestOtp(String email) async {
    if (email.isEmpty) return false;

    _isLoading = true;
    notifyListeners();

    final success = await AuthService.forgotPassword(email.trim());

    _isLoading = false;
    
    if (success) {
      _otpSent = true;
    }
    notifyListeners();
    
    return success;
  }

  Future<bool> submitNewPassword({
    required String email,
    required String otp,
    required String newPassword,
    required String confirmPassword,
  }) async {
    if (otp.isEmpty || newPassword.isEmpty || confirmPassword.isEmpty) {
      return false;
    }
    if (newPassword != confirmPassword) {
      return false;
    }

    _isLoading = true;
    notifyListeners();

    final success = await AuthService.resetPassword(
      email.trim(),
      newPassword,
      otp.trim(),
    );

    _isLoading = false;
    notifyListeners();
    return success;
  }
}

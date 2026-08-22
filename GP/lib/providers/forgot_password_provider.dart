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

  final TextEditingController emailController = TextEditingController();
  final TextEditingController otpController = TextEditingController();
  final TextEditingController newPasswordController = TextEditingController();
  final TextEditingController confirmPasswordController = TextEditingController();

  ForgotPasswordProvider() {
    newPasswordController.addListener(_validatePassword);
    confirmPasswordController.addListener(_validatePassword);
  }

  void _validatePassword() {
    final password = newPasswordController.text;
    final confirm = confirmPasswordController.text;
    
    _hasMinLength = password.length >= 8;
    _hasCapital = password.contains(RegExp(r'[A-Z]'));
    _hasNumber = password.contains(RegExp(r'[0-9]'));
    _hasSpecial = password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>\-\_]'));
    _passwordsMatch = password.isNotEmpty && password == confirm;
    
    notifyListeners();
  }

  bool get isPasswordValid => _hasMinLength && _hasCapital && _hasNumber && _hasSpecial && _passwordsMatch;

  int get passwordStrengthLevel {
    if (newPasswordController.text.isEmpty) return 0;
    int metConditions = 0;
    if (_hasMinLength) metConditions++;
    if (_hasCapital) metConditions++;
    if (_hasNumber) metConditions++;
    if (_hasSpecial) metConditions++;
    
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

  Future<void> requestOtp(BuildContext context) async {
    if (emailController.text.isEmpty) return;

    _isLoading = true;
    notifyListeners();

    final success = await AuthService.forgotPassword(emailController.text.trim());

    _isLoading = false;
    
    if (success) {
      _otpSent = true;
      notifyListeners();
    } else {
      notifyListeners();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to send OTP. Check email and try again.')),
        );
      }
    }
  }

  Future<void> submitNewPassword(BuildContext context) async {
    if (otpController.text.isEmpty || 
        newPasswordController.text.isEmpty || 
        confirmPasswordController.text.isEmpty) return;

    if (newPasswordController.text != confirmPasswordController.text) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Passwords do not match')),
        );
      }
      return;
    }

    _isLoading = true;
    notifyListeners();

    final success = await AuthService.resetPassword(
      emailController.text.trim(),
      newPasswordController.text,
      otpController.text.trim(),
    );

    _isLoading = false;
    notifyListeners();

    if (success) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password reset successfully!')),
        );
        Navigator.pushReplacementNamed(context, '/login');
      }
    } else {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to reset password. Check OTP and try again.')),
        );
      }
    }
  }
}

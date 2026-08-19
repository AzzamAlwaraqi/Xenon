import 'package:flutter/material.dart';
import 'package:gp/core/services/auth_service.dart';
import 'package:gp/core/utils/toast_utils.dart';

class SignupProvider extends ChangeNotifier {
  final TextEditingController fullNameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController = TextEditingController();
  final AuthService _authService = AuthService();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;

  bool _hasMinLength = false;
  bool _hasCapital = false;
  bool _hasNumber = false;
  bool _hasSpecial = false;
  bool _passwordsMatch = false;

  SignupProvider() {
    passwordController.addListener(_validatePassword);
    confirmPasswordController.addListener(_validatePassword);
  }

  void _validatePassword() {
    final password = passwordController.text;
    final confirm = confirmPasswordController.text;
    
    _hasMinLength = password.length >= 8;
    _hasCapital = password.contains(RegExp(r'[A-Z]'));
    _hasNumber = password.contains(RegExp(r'[0-9]'));
    _hasSpecial = password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>\-\_]'));
    _passwordsMatch = password.isNotEmpty && password == confirm;
    
    notifyListeners();
  }

  bool get obscurePassword => _obscurePassword;
  bool get obscureConfirmPassword => _obscureConfirmPassword;
  bool get isLoading => _isLoading;
  
  bool get hasMinLength => _hasMinLength;
  bool get hasCapital => _hasCapital;
  bool get hasNumber => _hasNumber;
  bool get hasSpecial => _hasSpecial;
  bool get passwordsMatch => _passwordsMatch;

  bool get isPasswordValid => _hasMinLength && _hasCapital && _hasNumber && _hasSpecial && _passwordsMatch;

  int get passwordStrengthLevel {
    if (passwordController.text.isEmpty) return 0;
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

  Future<void> signup(BuildContext context) async {
    if (!isPasswordValid) return;

    _isLoading = true;
    notifyListeners();
    
    final error = await _authService.signUp(
      fullNameController.text.trim(),
      emailController.text.trim(),
      passwordController.text,
    );

    _isLoading = false;
    notifyListeners();

    if (context.mounted) {
      if (error == null) {
        Navigator.pushReplacementNamed(
          context, 
          '/otp',
          arguments: {'email': emailController.text.trim()},
        );
      } else {
        showTopToast(context, error, isError: true);
      }
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
    fullNameController.dispose();
    emailController.dispose();
    phoneController.dispose();
    passwordController.removeListener(_validatePassword);
    passwordController.dispose();
    confirmPasswordController.removeListener(_validatePassword);
    confirmPasswordController.dispose();
    super.dispose();
  }
}

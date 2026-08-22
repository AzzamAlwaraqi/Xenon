import 'package:flutter/material.dart';
import 'package:gp/models/auth_model.dart';
import 'package:gp/utils/toast_utils.dart';

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
    
    final error = await AuthService.login(
      emailOrPhoneController.text.trim(),
      passwordController.text,
    );
    
    _isLoading = false;
    notifyListeners();

    if (context.mounted) {
      if (error == null) {
        Navigator.pushReplacementNamed(context, '/main');
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
    emailOrPhoneController.dispose();
    passwordController.dispose();
    super.dispose();
  }
}

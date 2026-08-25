import 'package:flutter/material.dart';
import 'package:gp/models/auth_model.dart';
import 'package:gp/models/api_client.dart';
import 'package:gp/utils/secure_storage_helper.dart';

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
    
    try {
      final response = await AuthService.login(email.trim(), password);
      final data = response['data'] ?? {};
      final token = data['token'] ?? data['accessToken'];
      if (token != null) {
        await SecureStorageHelper.saveToken(token);
      }
      
      final userData = data['user'];
      if (userData != null) {
        await SecureStorageHelper.saveUserData(
          userData['_id']?.toString() ?? '',
          userData['role']?.toString() ?? '',
        );
      }
      
      _isLoading = false;
      notifyListeners();
      return null;
    } on ApiException catch (e) {
      _isLoading = false;
      notifyListeners();
      return e.message;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return 'An unexpected error occurred';
    }
  }

  void continueWithGoogle() {
    // Implement Google login
  }

  void continueWithApple() {
    // Implement Apple login
  }
}

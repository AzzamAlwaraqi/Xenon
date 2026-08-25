import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../models/auth_model.dart';
import '../models/api_client.dart';
import '../utils/secure_storage_helper.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  Future<bool> login(String email, String password, BuildContext context) async {
    _setLoading(true);
    _errorMessage = null;
    try {
      final response = await AuthService.login(email, password);
      final data = response['data'] ?? {};
      final token = data['token'] ?? data['accessToken'];
      if (token != null) {
        await SecureStorageHelper.saveToken(token);
        _user = UserModel.fromJson(data['user']);
        await SecureStorageHelper.saveUserData(_user!.id, _user!.role);
        _setLoading(false);
        return true;
      }
    } on ApiException catch (e) {
      _errorMessage = e.message;
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      _errorMessage = 'An unexpected error occurred';
      if (context.mounted) _showErrorSnackBar(context, _errorMessage!);
    }
    _setLoading(false);
    return false;
  }

  Future<bool> register(Map<String, dynamic> data, BuildContext context) async {
    _setLoading(true);
    _errorMessage = null;
    try {
      final response = await AuthService.register(data);
      final resData = response['data'] ?? {};
      final token = resData['token'] ?? resData['accessToken'];
      if (token != null) {
        await SecureStorageHelper.saveToken(token);
        _user = UserModel.fromJson(resData['user']);
        await SecureStorageHelper.saveUserData(_user!.id, _user!.role);
        _setLoading(false);
        return true;
      }
    } on ApiException catch (e) {
      _errorMessage = e.message;
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      _errorMessage = 'An unexpected error occurred';
      if (context.mounted) _showErrorSnackBar(context, _errorMessage!);
    }
    _setLoading(false);
    return false;
  }

  Future<void> logout() async {
    _setLoading(true);
    try {
      await AuthService.logout();
    } catch (_) {} // Ignore logout errors
    await SecureStorageHelper.clearAll();
    _user = null;
    _setLoading(false);
  }

  void _showErrorSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }
}

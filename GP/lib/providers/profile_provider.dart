import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../models/profile_model.dart';
import '../models/auth_model.dart';
import '../models/api_client.dart';

class ProfileProvider with ChangeNotifier {
  UserModel? _profile;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get profile => _profile;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  Future<void> loadProfile(BuildContext context) async {
    _setLoading(true);
    _errorMessage = null;
    try {
      final response = await ProfileService.getProfile();
      if (response['data'] != null) {
        _profile = UserModel.fromJson(response['data']);
      }
    } on ApiException catch (e) {
      _errorMessage = e.message;
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      _errorMessage = 'Failed to load profile';
      if (context.mounted) _showErrorSnackBar(context, _errorMessage!);
    }
    _setLoading(false);
  }

  Future<bool> updateProfile(Map<String, dynamic> data, BuildContext context) async {
    _setLoading(true);
    try {
      final response = await ProfileService.updateProfile(data);
      if (response['data'] != null) {
        _profile = UserModel.fromJson(response['data']);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile updated successfully'), backgroundColor: Colors.green),
          );
        }
        _setLoading(false);
        return true;
      }
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Update failed');
    }
    _setLoading(false);
    return false;
  }

  Future<bool> changePassword(String currentPassword, String newPassword, BuildContext context) async {
    _setLoading(true);
    try {
      await ProfileService.changePassword(currentPassword, newPassword);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password changed successfully'), backgroundColor: Colors.green),
        );
      }
      _setLoading(false);
      return true;
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Failed to change password');
    }
    _setLoading(false);
    return false;
  }

  void _showErrorSnackBar(BuildContext context, String message) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }

  // Legacy Navigation Methods Preserved
  void navigateToSettings(BuildContext context) {
    Navigator.pushNamed(context, '/settings');
  }

  Future<void> logout(BuildContext context) async {
    _setLoading(true);
    try {
      await AuthService.logout();
    } catch (e) {
      // Ignore errors
    }
    _setLoading(false);
    if (context.mounted) {
      Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
    }
  }

  void navigateToAllBookings(BuildContext context) {}

  void navigateToResetPassword(BuildContext context) {
    Navigator.pushNamed(context, '/change-password');
  }

  void navigateToEditProfile(BuildContext context) {
    Navigator.pushNamed(context, '/edit-profile');
  }
}

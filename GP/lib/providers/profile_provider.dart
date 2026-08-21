import 'package:flutter/material.dart';
import 'package:gp/services/profile_service.dart';
import 'package:gp/services/auth_service.dart';

class ProfileProvider extends ChangeNotifier {
  final ProfileService _profileService = ProfileService();
  final AuthService _authService = AuthService();

  Map<String, dynamic>? _userData;
  bool _isLoading = false;

  Map<String, dynamic>? get userData => _userData;
  bool get isLoading => _isLoading;

  ProfileProvider() {
    loadProfile();
  }

  Future<void> loadProfile() async {
    _isLoading = true;
    notifyListeners();

    _userData = await _profileService.getProfile();

    _isLoading = false;
    notifyListeners();
  }

  Future<String?> updateProfile(String name, String phone) async {
    _isLoading = true;
    notifyListeners();

    final error = await _profileService.updateProfile({
      'name': name,
      'mobileNumber': phone,
    });

    if (error == null) {
      await loadProfile(); // reload profile
    }

    _isLoading = false;
    notifyListeners();
    return error;
  }

  Future<String?> changePassword(String currentPassword, String newPassword) async {
    _isLoading = true;
    notifyListeners();

    final error = await _profileService.changePassword(currentPassword, newPassword);

    _isLoading = false;
    notifyListeners();
    return error;
  }

  void navigateToSettings(BuildContext context) {
    Navigator.pushNamed(context, '/settings');
  }

  Future<void> logout(BuildContext context) async {
    _isLoading = true;
    notifyListeners();

    await _authService.logout();
    
    _isLoading = false;
    notifyListeners();

    if (context.mounted) {
      Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
    }
  }

  void navigateToAllBookings(BuildContext context) {
    // Handle navigation
  }

  void navigateToResetPassword(BuildContext context) {
    Navigator.pushNamed(context, '/change-password');
  }

  void navigateToEditProfile(BuildContext context) {
    Navigator.pushNamed(context, '/edit-profile');
  }
}

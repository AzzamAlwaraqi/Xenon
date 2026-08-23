import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';

const _storage = FlutterSecureStorage();

class ProfileService {
  Future<Map<String, String>> _getHeaders() async {
    String? token;
    try {
      token = await _storage.read(key: 'accessToken');
    } catch (e) {
      debugPrint('Failed to get token: $e');
    }

    final headers = Map<String, String>.from(ApiConfig.headers);
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  Future<Map<String, dynamic>?> getProfile() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/profile/me'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['data']; // The user profile data
      }
      return null;
    } catch (e) {
      debugPrint('Get Profile error: $e');
      return null;
    }
  }

  Future<String?> updateProfile(Map<String, dynamic> data) async {
    try {
      final headers = await _getHeaders();
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/profile/update'),
        headers: headers,
        body: jsonEncode(data),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return null; // Success
      }
      
      try {
        final resData = jsonDecode(response.body);
        return resData['message'] ?? 'Profile update failed.';
      } catch (_) {
        return 'Update failed with status code: ${response.statusCode}';
      }
    } catch (e) {
      debugPrint('Update Profile error: $e');
      return 'Network error or timeout. Please try again.';
    }
  }

  Future<String?> changePassword(String currentPassword, String newPassword) async {
    try {
      final headers = await _getHeaders();
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/profile/change-password'),
        headers: headers,
        body: jsonEncode({
          'oldPassword': currentPassword,
          'newPassword': newPassword,
          'confirmPassword': newPassword,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return null; // Success
      }
      
      try {
        final resData = jsonDecode(response.body);
        return resData['message'] ?? 'Change password failed.';
      } catch (_) {
        return 'Change password failed with status code: ${response.statusCode}';
      }
    } catch (e) {
      debugPrint('Change Password error: $e');
      return 'Network error or timeout. Please try again.';
    }
  }
}

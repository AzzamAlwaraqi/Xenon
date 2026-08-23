import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_config.dart';

const _storage = FlutterSecureStorage();

class AuthService {
  static Future<String?> login(String email, String password) async {
    try {
      final response = await http
          .post(
            Uri.parse('${ApiConfig.baseUrl}/auth/login'),
            headers: ApiConfig.headers,
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['data'] != null && data['data']['accessToken'] != null) {
          try {
            await _storage.write(key: 'accessToken', value: data['data']['accessToken']);
            if (data['data']['refreshToken'] != null) {
              await _storage.write(key: 'refreshToken', value: data['data']['refreshToken']);
            }
          } catch (spError) {
            debugPrint('Failed to save token: $spError');
          }
        }
        return null; // Success
      }
      
      try {
        final data = jsonDecode(response.body);
        return data['message'] ?? 'Login failed. Please check your credentials.';
      } catch (_) {
        return 'Login failed with status code: ${response.statusCode}';
      }
    } catch (e) {
      debugPrint('Login error: $e');
      return 'Network error or timeout. Please try again.';
    }
  }

  static Future<String?> signUp({
    required String name, 
    required String email, 
    required String password,
    required String confirmPassword,
    required String gender,
    required String mobileNumber,
    required String dateOfBirth,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/auth/register'),
        headers: ApiConfig.headers,
        body: jsonEncode({
          'name': name, 
          'email': email, 
          'password': password,
          'confirm-password': confirmPassword,
          'gender': gender,
          'mobileNumber': mobileNumber,
          'DateOfBirth': dateOfBirth,
        }),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 201 || response.statusCode == 200) {
        return null; // Success
      }
      
      try {
        final data = jsonDecode(response.body);
        return data['message'] ?? 'Registration failed. Please try again.';
      } catch (_) {
        return 'Registration failed with status code: ${response.statusCode}';
      }
    } catch (e) {
      debugPrint('Signup error: $e');
      return 'Network error or timeout. Please try again.';
    }
  }

  static Future<void> logout() async {
    try {
      await http.post(
        Uri.parse('${ApiConfig.baseUrl}/auth/logout'),
        headers: ApiConfig.headers,
      );
      await _storage.delete(key: 'accessToken');
      await _storage.delete(key: 'refreshToken');
    } catch (e) {
      debugPrint('Logout error: $e');
    }
  }

  static Future<bool> verifyOtp(String email, String otp) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/auth/verify-otp'),
        headers: ApiConfig.headers,
        body: jsonEncode({
          'email': email,
          'otp': otp,
          'purpose': 'registration',
        }),
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Verify OTP error: $e');
      return false;
    }
  }

  static Future<bool> sendOtp(String email) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/auth/send-otp'),
        headers: ApiConfig.headers,
        body: jsonEncode({
          'email': email,
        }),
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Send OTP error: $e');
      return false;
    }
  }

  static Future<bool> resetPassword(
    String email,
    String password,
    String otpCode,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/auth/reset-password'),
        headers: ApiConfig.headers,
        body: jsonEncode({
          'email': email,
          'password': password,
          'confirm_password': password,
          'otpCode': otpCode,
        }),
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Reset Password error: $e');
      return false;
    }
  }

  static Future<bool> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/auth/forgot-password'),
        headers: ApiConfig.headers,
        body: jsonEncode({
          'email': email,
        }),
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Forgot Password error: $e');
      return false;
    }
  }
}

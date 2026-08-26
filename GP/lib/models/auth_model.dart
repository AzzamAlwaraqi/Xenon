import 'api_client.dart';
import '../utils/secure_storage_helper.dart';

class AuthService {
  static const String _baseEndpoint = '/auth';

  static Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    return await ApiClient.post('$_baseEndpoint/register', body: data, requireAuth: false);
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    return await ApiClient.post(
      '$_baseEndpoint/login',
      body: {'email': email, 'password': password},
      requireAuth: false,
    );
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
      final response = await register({
        'name': name,
        'email': email,
        'password': password,
        'passwordConfirm': confirmPassword,
        'gender': gender,
        'mobileNumber': mobileNumber,
        'DateOfBirth': dateOfBirth,
      });
      final data = response['data'] ?? {};
      final token = data['accessToken'] ?? data['token'];
      if (token != null) {
        await SecureStorageHelper.saveToken(token);
      }
      return null;
    } on ApiException catch (e) {
      return e.message;
    } catch (e) {
      return 'An unexpected error occurred';
    }
  }

  static Future<Map<String, dynamic>> sendOtp(String email) async {
    return await ApiClient.post(
      '$_baseEndpoint/send-otp',
      body: {'email': email},
      requireAuth: false,
    );
  }

  static Future<Map<String, dynamic>> verifyOtp(String email, String otp) async {
    return await ApiClient.post(
      '$_baseEndpoint/verify-otp',
      body: {'email': email, 'otp': otp},
      requireAuth: false,
    );
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    return await ApiClient.post(
      '$_baseEndpoint/forgot-password',
      body: {'email': email},
      requireAuth: false,
    );
  }

  static Future<Map<String, dynamic>> resetPassword(String email, String newPassword, String otpCode) async {
    return await ApiClient.post(
      '$_baseEndpoint/reset-password',
      body: {
        'email': email,
        'password': newPassword,
        'confirm_password': newPassword,
        'otpCode': otpCode,
      },
      requireAuth: false,
    );
  }

  static Future<Map<String, dynamic>> logout() async {
    return await ApiClient.post('$_baseEndpoint/logout');
  }
}

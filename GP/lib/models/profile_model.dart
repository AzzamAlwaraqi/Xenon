import 'api_client.dart';


class ProfileService {
  static const String _baseEndpoint = '/profile';

  static Future<Map<String, dynamic>> getProfile() async {
    return await ApiClient.get('$_baseEndpoint/me');
  }

  static Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    return await ApiClient.put('$_baseEndpoint/update', body: data);
  }

  static Future<Map<String, dynamic>> changePassword(String currentPassword, String newPassword) async {
    return await ApiClient.put(
      '$_baseEndpoint/change-password',
      body: {'currentPassword': currentPassword, 'newPassword': newPassword},
    );
  }

  static Future<Map<String, dynamic>> deleteProfile() async {
    return await ApiClient.put('$_baseEndpoint/delete'); // Soft delete or delete? Postman collection said PUT delete profile
  }

  static Future<Map<String, dynamic>> updateFCMToken(String token) async {
    return await ApiClient.put('$_baseEndpoint/fcm-token', body: {'fcm_token': token});
  }
}


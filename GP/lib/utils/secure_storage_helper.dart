import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageHelper {
  static const _storage = FlutterSecureStorage();
  
  static const _keyToken = 'auth_token';
  static const _keyUserId = 'user_id';
  static const _keyUserRole = 'user_role';

  // Token Methods
  static Future<void> saveToken(String token) async {
    await _storage.write(key: _keyToken, value: token);
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: _keyToken);
  }

  static Future<void> deleteToken() async {
    await _storage.delete(key: _keyToken);
  }

  // User Data Methods (Optional quick access)
  static Future<void> saveUserData(String id, String role) async {
    await _storage.write(key: _keyUserId, value: id);
    await _storage.write(key: _keyUserRole, value: role);
  }

  static Future<Map<String, String?>> getUserData() async {
    return {
      'id': await _storage.read(key: _keyUserId),
      'role': await _storage.read(key: _keyUserRole),
    };
  }

  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}

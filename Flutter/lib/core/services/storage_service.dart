// TODO: Add shared_preferences: ^2.3.0 to pubspec.yaml
//
// import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  StorageService._();

  // ignore: unused_field
  static const _tokenKey = 'xenon_token';

  // static Future<void> saveToken(String token) async {
  //   final prefs = await SharedPreferences.getInstance();
  //   await prefs.setString(_tokenKey, token);
  // }

  // static Future<String?> getToken() async {
  //   final prefs = await SharedPreferences.getInstance();
  //   return prefs.getString(_tokenKey);
  // }

  // static Future<void> clearToken() async {
  //   final prefs = await SharedPreferences.getInstance();
  //   await prefs.remove(_tokenKey);
  // }
}

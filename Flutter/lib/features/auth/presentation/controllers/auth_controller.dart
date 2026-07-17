import '../../data/auth_api.dart';

class AuthController {
  final AuthApi _api = AuthApi();

  Future<void> login(String email, String password) async {
    // TODO: wire to state management (Provider / Riverpod / Bloc)
    try {
      final result = await _api.login(email, password);
      // await StorageService.saveToken(result['token']);
      // Navigate to dashboard
      print('Login success: $result');
    } catch (e) {
      print('Login error: $e');
      rethrow;
    }
  }

  Future<void> logout() async {
    await _api.logout();
    // await StorageService.clearToken();
    // Navigate to login
  }
}

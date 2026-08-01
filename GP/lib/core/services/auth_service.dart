import 'dart:async';

class AuthService {
  // Simulate a backend call
  Future<bool> login(String email, String password) async {
    await Future.delayed(const Duration(seconds: 2));
    // For demo purposes, any non-empty password works
    return password.isNotEmpty;
  }

  Future<bool> signUp(String name, String email, String password) async {
    await Future.delayed(const Duration(seconds: 2));
    return true;
  }

  Future<void> logout() async {
    await Future.delayed(const Duration(milliseconds: 500));
  }
}

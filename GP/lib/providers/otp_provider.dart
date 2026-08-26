import 'package:flutter/material.dart';
import 'package:gp/models/auth_model.dart';
import 'package:gp/models/api_client.dart';
import 'package:gp/utils/toast_utils.dart';
import 'package:gp/utils/secure_storage_helper.dart';
import 'dart:async';

class OtpProvider extends ChangeNotifier {
  final String email;

  List<TextEditingController> controllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  List<FocusNode> focusNodes = List.generate(6, (_) => FocusNode());

  bool _isLoading = false;
  int _countdown = 60;
  Timer? _timer;

  OtpProvider({required this.email}) {
    _startCountdown();
  }

  bool get isLoading => _isLoading;
  int get countdown => _countdown;
  bool get canResend => _countdown == 0;

  void _startCountdown() {
    _countdown = 60;
    notifyListeners();
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdown > 0) {
        _countdown--;
        notifyListeners();
      } else {
        timer.cancel();
      }
    });
  }

  String get _otpCode {
    return controllers.map((c) => c.text).join('');
  }

  Future<void> verify(BuildContext context) async {
    final code = _otpCode;
    if (code.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter all 6 digits'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    _isLoading = true;
    notifyListeners();

    bool success = false;
    String errorMessage = 'Invalid OTP. Please try again.';
    try {
      final response = await AuthService.verifyOtp(email, code);
      final data = response['data'] ?? {};
      final token = data['token'] ?? data['accessToken'];
      if (token != null) {
        await SecureStorageHelper.saveToken(token);
      }
      
      final userData = response['data']?['user'];
      if (userData != null) {
        await SecureStorageHelper.saveUserData(
          userData['_id']?.toString() ?? '',
          userData['role']?.toString() ?? '',
        );
      }
      success = true;
    } on ApiException catch (e) {
      success = false;
      errorMessage = e.message;
    } catch (e) {
      success = false;
      errorMessage = e.toString();
    }

    _isLoading = false;
    notifyListeners();

    if (context.mounted) {
      if (success) {
        Navigator.pushReplacementNamed(context, '/main');
      } else {
        showTopToast(context, errorMessage, isError: true);
      }
    }
  }

  Future<void> resendOtp(BuildContext context) async {
    if (!canResend) return;

    _isLoading = true;
    notifyListeners();

    bool success = false;
    try {
      await AuthService.sendOtp(email);
      success = true;
    } catch (e) {
      success = false;
    }

    _isLoading = false;

    if (context.mounted) {
      if (success) {
        _startCountdown();
        showTopToast(context, 'OTP sent to your email.', isError: false);
      } else {
        showTopToast(
          context,
          'Failed to send OTP. Please try again.',
          isError: true,
        );
      }
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (var c in controllers) {
      c.dispose();
    }
    for (var f in focusNodes) {
      f.dispose();
    }
    super.dispose();
  }
}

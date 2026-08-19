import 'package:flutter/material.dart';
import 'package:gp/core/services/auth_service.dart';
import 'dart:async';

class OtpProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final String email;

  List<TextEditingController> controllers = List.generate(6, (_) => TextEditingController());
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
        const SnackBar(content: Text('Please enter all 6 digits'), backgroundColor: Colors.red),
      );
      return;
    }

    _isLoading = true;
    notifyListeners();

    final success = await _authService.verifyOtp(email, code);

    _isLoading = false;
    notifyListeners();

    if (context.mounted) {
      if (success) {
        Navigator.pushReplacementNamed(context, '/main');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invalid or expired OTP code.'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> resendOtp(BuildContext context) async {
    if (!canResend) return;

    _isLoading = true;
    notifyListeners();

    // Re-trigger signup API or a specific resend API if it exists.
    // For now, simulating resend success.
    await Future.delayed(const Duration(seconds: 1));
    
    _isLoading = false;
    _startCountdown();

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('OTP sent to your email.'), backgroundColor: Colors.green),
      );
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

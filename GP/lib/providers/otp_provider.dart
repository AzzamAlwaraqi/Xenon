import 'package:flutter/material.dart';
import 'package:gp/models/auth_model.dart';
import 'package:gp/utils/toast_utils.dart';
import 'dart:async';

class OtpProvider extends ChangeNotifier {
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

    final success = await AuthService.verifyOtp(email, code);

    _isLoading = false;
    notifyListeners();

    if (context.mounted) {
      if (success) {
        Navigator.pushReplacementNamed(context, '/main');
      } else {
        showTopToast(context, 'Invalid OTP. Please try again.', isError: true);
      }
    }
  }

  Future<void> resendOtp(BuildContext context) async {
    if (!canResend) return;

    _isLoading = true;
    notifyListeners();

    // Re-trigger signup API or a specific resend API if it exists.
    final success = await AuthService.sendOtp(email);
    
    _isLoading = false;

    if (context.mounted) {
      if (success) {
        _startCountdown();
        showTopToast(context, 'OTP sent to your email.', isError: false);
      } else {
        showTopToast(context, 'Failed to send OTP. Please try again.', isError: true);
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

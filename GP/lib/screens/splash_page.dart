import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/utils/secure_storage_helper.dart';
import 'package:gp/providers/profile_provider.dart';
import 'package:gp/theme/colors.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkLoginStatus() async {
    // Add a slight delay for smooth transition if needed
    await Future.delayed(const Duration(milliseconds: 500));
    
    final token = await SecureStorageHelper.getToken();
    
    if (!mounted) return;
    
    if (token != null && token.isNotEmpty) {
      // Token exists, pre-load profile and go to main
      context.read<ProfileProvider>().loadProfile(context);
      Navigator.pushReplacementNamed(context, '/main');
    } else {
      // No token, go to login
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.explore, 
              size: 80, 
              color: AppColors.primaryRust,
            ),
            const SizedBox(height: 24),
            Text(
              'Jordanian Horizon',
              style: TextStyle(
                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryRust),
            ),
          ],
        ),
      ),
    );
  }
}

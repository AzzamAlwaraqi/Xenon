import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/utils/secure_storage_helper.dart';
import 'package:gp/providers/profile_provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';

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
    // Increased delay to make the splash screen visible for longer
    await Future.delayed(const Duration(milliseconds: 500));

    final token = await SecureStorageHelper.getToken();

    if (!mounted) return;

    if (token != null && token.isNotEmpty) {
      // Token exists, try to load profile
      await context.read<ProfileProvider>().loadProfile(context, silent: true);

      if (!mounted) return;

      // If profile is loaded successfully, token is valid
      if (context.read<ProfileProvider>().profile != null) {
        Navigator.pushReplacementNamed(context, '/main');
      } else {
        // Token likely expired or invalid
        await SecureStorageHelper.clearAll();
        if (!mounted) return;
        Navigator.pushReplacementNamed(context, '/login');
      }
    } else {
      // No token, go to login
      Navigator.pushReplacementNamed(context, '/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FF),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // 1. Pixel Art Camel
            Image.asset(
              'assets/images/camel_pixel.png',
              width: 180,
              height: 180,
              fit: BoxFit.contain,
            ),

            // 2. Soft Elliptical Shadow
            Container(
              width: 120,
              height: 12,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(50),
              ),
            ),

            const SizedBox(height: 48),

            // 3. Text
            Text(
              'Loading your journey...',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF5C4033),
              ),
            ),

            const SizedBox(height: 24),

            // 4. Animated Dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(3, (index) {
                return Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFFD47A5A),
                        shape: BoxShape.circle,
                      ),
                    )
                    .animate(onPlay: (controller) => controller.repeat())
                    .slideY(
                      begin: 0,
                      end: -1,
                      duration: 400.ms,
                      curve: Curves.easeInOut,
                      delay: (index * 150).ms,
                    )
                    .then()
                    .slideY(
                      begin: -1,
                      end: 0,
                      duration: 400.ms,
                      curve: Curves.easeInOut,
                    );
              }),
            ),
          ],
        ),
      ),
    );
  }
}

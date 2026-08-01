import 'package:flutter/material.dart';
import 'package:gp/app/theme/colors.dart';
import 'package:gp/core/widgets/app_button.dart';
import 'package:gp/core/widgets/app_textfield.dart';

class SignUpPage extends StatelessWidget {
  const SignUpPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                const Text(
                  'Create Account',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Join the Voyage and explore the world with us.',
                  style: TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 40),
                const AppTextField(
                  hint: 'Full Name',
                  prefixIcon: Icons.person_outline,
                ),
                const SizedBox(height: 16),
                const AppTextField(
                  hint: 'Email Address',
                  prefixIcon: Icons.email_outlined,
                ),
                const SizedBox(height: 16),
                const AppTextField(
                  hint: 'Password',
                  isPassword: true,
                  prefixIcon: Icons.lock_outline,
                ),
                const SizedBox(height: 16),
                const AppTextField(
                  hint: 'Confirm Password',
                  isPassword: true,
                  prefixIcon: Icons.lock_reset,
                ),
                const SizedBox(height: 32),
                AppButton(
                  text: 'Create Account',
                  onPressed: () {
                    // Navigate to home after signup
                    Navigator.pushNamedAndRemoveUntil(context, '/main', (route) => false);
                  },
                ),
                const SizedBox(height: 24),
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        "Already have an account? ",
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: const Text(
                          'Sign In',
                          style: TextStyle(
                            color: AppColors.accentBlue,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

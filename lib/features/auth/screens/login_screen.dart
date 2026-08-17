import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ahlan_widgets.dart';
import '../../../core/navigation/app_routes.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.sizeOf(context).height;

    return Scaffold(
      body: Stack(
        children: [
          SizedBox(
            width: double.infinity,
            height: screenHeight * 0.4,
            child: Image.network(
              'https://images.unsplash.com/photo-1542156822-6924d1a71ace?w=800&q=80',
              fit: BoxFit.cover,
              frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
                if (wasSynchronouslyLoaded) return child;
                return AnimatedOpacity(
                  opacity: frame == null ? 0 : 1,
                  duration: const Duration(milliseconds: 400),
                  child: child,
                );
              },
              errorBuilder: (context, error, stackTrace) => Container(
                color: AppColors.primaryBrown.withValues(alpha: 0.15),
              ),
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              constraints: BoxConstraints(maxHeight: screenHeight * 0.85),
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(40)),
              ),
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.all(32),
                child: Column(
                  children: [
                    Text(
                      'Welcome Back',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    Text('Sign in to continue your journey.', style: Theme.of(context).textTheme.bodyMedium),
                    const SizedBox(height: 40),
                    const AhlanTextField(label: 'Email or Phone', hint: 'Enter your email or phone', prefixIcon: Icons.person_outline),
                    const SizedBox(height: 24),
                    const AhlanTextField(
                      label: 'Password',
                      hint: 'Enter your password',
                      prefixIcon: Icons.lock_outline,
                      isPassword: true,
                      suffixIcon: Icon(Icons.visibility_off_outlined, color: AppColors.greyText),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () => context.go(AppRoutes.resetPassword),
                        child: const Text('Forgot Password?', style: TextStyle(color: AppColors.primaryBrown)),
                      ),
                    ),
                    const SizedBox(height: 24),
                    AhlanButton(
                      text: 'Login',
                      onPressed: () => context.go(AppRoutes.profile),
                    ),
                    const SizedBox(height: 40),
                    const Text('Or continue with', style: TextStyle(color: AppColors.greyText)),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {},
                            icon: const FaIcon(FontAwesomeIcons.google, size: 16),
                            label: const Text('Google'),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {},
                            icon: const FaIcon(FontAwesomeIcons.apple, size: 18),
                            label: const Text('Apple'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text("Don't have an account? "),
                        GestureDetector(
                          onTap: () => context.go(AppRoutes.signup),
                          child: const Text(
                            'Sign up',
                            style: TextStyle(color: AppColors.primaryBrown, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: MediaQuery.paddingOf(context).bottom),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

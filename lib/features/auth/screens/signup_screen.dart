import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ahlan_widgets.dart';
import '../../../core/navigation/app_routes.dart';

/// Full sign-up form screen.
class SignUpScreen extends StatelessWidget {
  const SignUpScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.sizeOf(context).height;

    return Scaffold(
      body: Stack(
        children: [
          // Background hero image — top 40% of screen
          SizedBox(
            width: double.infinity,
            height: screenHeight * 0.38,
            child: Image.network(
              'https://images.unsplash.com/photo-1542156822-6924d1a71ace?w=800&q=80',
              fit: BoxFit.cover,
              // Fade in to avoid jarring white flash
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

          // White card — bottom sheet style
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              // Let the card size to content, max 80% of screen
              constraints: BoxConstraints(
                maxHeight: screenHeight * 0.80,
              ),
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(40)),
              ),
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(32, 36, 32, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Create Account',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Join Ahlan wa Sahlan for a luxurious experience.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 32),
                    AhlanTextField(
                      label: 'Full Name',
                      hint: 'John Doe',
                      prefixIcon: Icons.person_outline,
                    ),
                    const SizedBox(height: 20),
                    AhlanTextField(
                      label: 'Email',
                      hint: 'you@example.com',
                      prefixIcon: Icons.email_outlined,
                    ),
                    const SizedBox(height: 20),
                    AhlanTextField(
                      label: 'Password',
                      hint: 'Create a password',
                      prefixIcon: Icons.lock_outline,
                      isPassword: true,
                      suffixIcon: const Icon(Icons.visibility_off_outlined, color: AppColors.greyText),
                    ),
                    const SizedBox(height: 32),
                    AhlanButton(
                      text: 'Create Account',
                      onPressed: () => context.go(AppRoutes.verify),
                      icon: const Icon(Icons.arrow_forward, size: 20),
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Already have an account? '),
                        GestureDetector(
                          onTap: () => context.go(AppRoutes.login),
                          child: const Text(
                            'Log In',
                            style: TextStyle(color: AppColors.primaryBrown, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    // Bottom safe-area padding
                    SizedBox(height: MediaQuery.paddingOf(context).bottom + 8),
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


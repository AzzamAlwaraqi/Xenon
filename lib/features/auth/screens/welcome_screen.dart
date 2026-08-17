import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ahlan_widgets.dart';
import '../../../core/navigation/app_routes.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.sizeOf(context).height;

    return Scaffold(
      body: Stack(
        children: [
          // Background Image
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
              // maxHeight instead of fixed height — grows with content, never overflows
              constraints: BoxConstraints(maxHeight: screenHeight * 0.80),
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(40)),
              ),
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(32, 36, 32, 32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      'Begin Your Journey',
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 28),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Create an account to unlock luxurious discovery.',
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 28),
                    OutlinedButton.icon(
                      onPressed: () {},
                      icon: const FaIcon(FontAwesomeIcons.google, size: 18),
                      label: const Text('Continue with Google'),
                    ),
                    const SizedBox(height: 14),
                    OutlinedButton.icon(
                      onPressed: () {},
                      icon: const FaIcon(FontAwesomeIcons.apple, size: 20),
                      label: const Text('Continue with Apple'),
                    ),
                    const SizedBox(height: 20),
                    const Row(
                      children: [
                        Expanded(child: Divider()),
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: Text('OR', style: TextStyle(color: AppColors.greyText)),
                        ),
                        Expanded(child: Divider()),
                      ],
                    ),
                    const SizedBox(height: 20),
                    AhlanTextField(
                      label: 'Full Name',
                      hint: 'John Doe',
                      prefixIcon: Icons.person_outline,
                    ),
                    const SizedBox(height: 20),
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
                            style: TextStyle(
                              color: AppColors.primaryBrown,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
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

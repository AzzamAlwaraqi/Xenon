import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/providers/signup_provider.dart';
import 'package:gp/widgets/app_textfield.dart';

class SignUpPage extends StatelessWidget {
  const SignUpPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SignupProvider(),
      child: const _SignUpPageContent(),
    );
  }
}

class _SignUpPageContent extends StatelessWidget {
  const _SignUpPageContent();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SignupProvider>();
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Top Image Section
            Container(
              height: size.height * 0.35,
              width: double.infinity,
              decoration: const BoxDecoration(
                image: DecorationImage(
                  image: NetworkImage(
                    'https://images.unsplash.com/photo-1548691905-57c36cc8d935?q=80&w=1000&auto=format&fit=crop', // Wadi Rum placeholder
                  ),
                  fit: BoxFit.cover,
                ),
              ),
              child: Stack(
                children: [
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.white.withValues(alpha: 0.8),
                            Colors.white,
                          ],
                          stops: const [0.5, 0.9, 1.0],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // White Card Section
            Container(
              transform: Matrix4.translationValues(0, -30, 0),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(32),
                  topRight: Radius.circular(32),
                ),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 32),
                  const Text(
                    'Begin Your Journey',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.textPrimaryLight,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Create an account to unlock luxurious\ndiscovery.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.textSecondaryLight,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Form Fields
                  const FieldLabel(text: 'Full Name'),
                  AppTextField(
                    controller: provider.fullNameController,
                    hint: 'John Doe',
                    prefixIcon: Icons.person_outline,
                  ),

                  const SizedBox(height: 16),

                  const FieldLabel(text: 'Email Address'),
                  AppTextField(
                    controller: provider.emailController,
                    hint: 'john@example.com',
                    prefixIcon: Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress,
                  ),

                  const SizedBox(height: 16),

                  const FieldLabel(text: 'Phone Number'),
                  AppTextField(
                    controller: provider.phoneController,
                    hint: '+962 7 9000 0000',
                    prefixIcon: Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                  ),

                  const SizedBox(height: 16),

                  const FieldLabel(text: 'Password'),
                  AppTextField(
                    controller: provider.passwordController,
                    hint: '••••••••',
                    prefixIcon: Icons.lock_outline,
                    isPassword: provider.obscurePassword,
                    onToggleVisibility: provider.togglePasswordVisibility,
                  ),

                  const SizedBox(height: 16),

                  const FieldLabel(text: 'Confirm Password'),
                  AppTextField(
                    controller: provider.confirmPasswordController,
                    hint: '••••••••',
                    prefixIcon: Icons.lock_outline,
                    isPassword: provider.obscureConfirmPassword,
                    onToggleVisibility:
                        provider.toggleConfirmPasswordVisibility,
                  ),

                  const SizedBox(height: 16),

                  // Password Strength Bar
                  if (provider.passwordController.text.isNotEmpty)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: _buildStrengthSegment(
                                provider.passwordStrengthLevel >= 1,
                                provider.passwordStrengthLevel,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: _buildStrengthSegment(
                                provider.passwordStrengthLevel >= 2,
                                provider.passwordStrengthLevel,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: _buildStrengthSegment(
                                provider.passwordStrengthLevel >= 3,
                                provider.passwordStrengthLevel,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          _getStrengthText(provider.passwordStrengthLevel),
                          style: TextStyle(
                            color: _getStrengthColor(
                              provider.passwordStrengthLevel,
                            ),
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Checklist
                        _buildChecklistItem(
                          'At least 8 characters',
                          provider.hasMinLength,
                        ),
                        _buildChecklistItem(
                          'At least 1 capital letter',
                          provider.hasCapital,
                        ),
                        _buildChecklistItem(
                          'At least 1 number',
                          provider.hasNumber,
                        ),
                        _buildChecklistItem(
                          'At least 1 special character',
                          provider.hasSpecial,
                        ),
                        _buildChecklistItem(
                          'Passwords match',
                          provider.passwordsMatch,
                        ),
                      ],
                    ),

                  const SizedBox(height: 32),

                  // Create Account Button
                  ElevatedButton(
                    onPressed: (provider.isLoading || !provider.isPasswordValid)
                        ? null
                        : () => provider.signup(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryRust,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: provider.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Create Account',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              SizedBox(width: 8),
                              Icon(Icons.arrow_forward, size: 18),
                            ],
                          ),
                  ),

                  const SizedBox(height: 32),

                  // Log In link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        "Already have an account? ",
                        style: TextStyle(color: AppColors.textSecondaryLight),
                      ),
                      GestureDetector(
                        onTap: () =>
                            Navigator.pushReplacementNamed(context, '/login'),
                        child: const Text(
                          'Log In',
                          style: TextStyle(
                            color: AppColors.primaryRust,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStrengthSegment(bool isActive, int level) {
    return Container(
      height: 4,
      decoration: BoxDecoration(
        color: isActive ? _getStrengthColor(level) : Colors.grey[300],
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  Color _getStrengthColor(int level) {
    if (level == 1) return Colors.red;
    if (level == 2) return Colors.orange;
    if (level == 3) return Colors.green;
    return Colors.transparent;
  }

  String _getStrengthText(int level) {
    if (level == 1) return 'Weak';
    if (level == 2) return 'Medium';
    if (level == 3) return 'Strong';
    return '';
  }

  Widget _buildChecklistItem(String text, bool isMet) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        children: [
          Icon(
            isMet ? Icons.check_circle : Icons.circle_outlined,
            size: 14,
            color: isMet ? Colors.green : Colors.grey[400],
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              color: isMet ? Colors.green : Colors.grey[600],
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

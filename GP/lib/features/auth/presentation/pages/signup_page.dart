import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:gp/app/theme/colors.dart';
import 'package:gp/features/auth/presentation/providers/signup_provider.dart';

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
                  
                  // Social Buttons
                  OutlinedButton.icon(
                    onPressed: provider.continueWithGoogle,
                    icon: const FaIcon(FontAwesomeIcons.google, size: 18, color: AppColors.textPrimaryLight),
                    label: const Text(
                      'Continue with Google',
                      style: TextStyle(color: AppColors.textPrimaryLight, fontWeight: FontWeight.bold),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: AppColors.borderLight),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: provider.continueWithApple,
                    icon: const FaIcon(FontAwesomeIcons.apple, size: 18, color: AppColors.textPrimaryLight),
                    label: const Text(
                      'Continue with Apple',
                      style: TextStyle(color: AppColors.textPrimaryLight, fontWeight: FontWeight.bold),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      side: const BorderSide(color: AppColors.borderLight),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // OR divider
                  Row(
                    children: [
                      const Expanded(child: Divider(color: AppColors.borderLight)),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'OR',
                          style: TextStyle(
                            color: AppColors.textPrimaryLight.withValues(alpha: 0.8),
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ),
                      const Expanded(child: Divider(color: AppColors.borderLight)),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Form Fields
                  _buildLabel('Full Name'),
                  _buildTextField(
                    controller: provider.fullNameController,
                    hint: 'John Doe',
                    icon: Icons.person_outline,
                  ),
                  
                  const SizedBox(height: 16),
                  
                  _buildLabel('Email Address'),
                  _buildTextField(
                    controller: provider.emailController,
                    hint: 'john@example.com',
                    icon: Icons.email_outlined,
                  ),
                  
                  const SizedBox(height: 16),
                  
                  _buildLabel('Phone Number'),
                  _buildTextField(
                    controller: provider.phoneController,
                    hint: '+962 7 9000 0000',
                    icon: Icons.phone_outlined,
                  ),
                  
                  const SizedBox(height: 16),
                  
                  _buildLabel('Password'),
                  TextFormField(
                    controller: provider.passwordController,
                    obscureText: provider.obscurePassword,
                    style: const TextStyle(color: AppColors.textPrimaryLight),
                    decoration: InputDecoration(
                      hintText: '••••••••',
                      prefixIcon: const Icon(Icons.lock_outline, color: AppColors.textSecondaryLight),
                      suffixIcon: IconButton(
                        icon: Icon(
                          provider.obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: AppColors.textSecondaryLight,
                        ),
                        onPressed: provider.togglePasswordVisibility,
                      ),
                      filled: true,
                      fillColor: Colors.transparent,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.borderLight),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.borderLight),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.primaryRust),
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Create Account Button
                  ElevatedButton(
                    onPressed: provider.isLoading ? null : () => provider.signup(context),
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
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
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
                        onTap: () => Navigator.pushReplacementNamed(context, '/login'),
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

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0, left: 4.0),
      child: Text(
        text,
        style: const TextStyle(
          color: AppColors.textPrimaryLight,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
  }) {
    return TextFormField(
      controller: controller,
      style: const TextStyle(color: AppColors.textPrimaryLight),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: AppColors.textSecondaryLight.withValues(alpha: 0.5)),
        prefixIcon: Icon(icon, color: AppColors.textSecondaryLight),
        filled: true,
        fillColor: Colors.transparent,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primaryRust),
        ),
      ),
    );
  }
}

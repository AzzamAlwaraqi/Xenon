import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/providers/login_provider.dart';
import 'package:gp/providers/profile_provider.dart';
import 'package:gp/widgets/compass_loading_overlay.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => LoginProvider(),
      child: const _LoginPageContent(),
    );
  }
}

class _LoginPageContent extends StatefulWidget {
  const _LoginPageContent();

  @override
  State<_LoginPageContent> createState() => _LoginPageContentState();
}

class _LoginPageContentState extends State<_LoginPageContent> {
  final TextEditingController _emailOrPhoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailOrPhoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin(BuildContext context, LoginProvider provider) async {
    final email = _emailOrPhoneController.text;
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all fields')),
      );
      return;
    }

    final error = await provider.login(email, password);
    if (context.mounted) {
      if (error == null) {
        context.read<ProfileProvider>().loadProfile(context);
        Navigator.pushReplacementNamed(context, '/main');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<LoginProvider>();
    final size = MediaQuery.of(context).size;

    return CompassLoadingOverlay(
      isLoading: provider.isLoading,
      child: Scaffold(
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
                    const Positioned(
                      bottom: 40,
                      left: 24,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Jordanian\nHorizon',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 36,
                              fontWeight: FontWeight.bold,
                              height: 1.1,
                              shadows: [
                                Shadow(
                                  color: Colors.black26,
                                  blurRadius: 10,
                                  offset: Offset(0, 4),
                                ),
                              ],
                            ),
                          ),
                        ],
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
                      'Welcome Back',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textPrimaryLight,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Sign in to continue your journey.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textSecondaryLight,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Email Field
                    const Text(
                      'Email or Phone',
                      style: TextStyle(
                        color: AppColors.textPrimaryLight,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    AutofillGroup(
                      child: Column(
                        children: [
                          TextFormField(
                            controller: _emailOrPhoneController,
                            autofillHints: const [AutofillHints.email],
                            keyboardType: TextInputType.emailAddress,
                            style: const TextStyle(color: AppColors.textPrimaryLight),
                            decoration: InputDecoration(
                              hintText: 'Enter your email or phone',
                              prefixIcon: const Icon(
                                Icons.person_outline,
                                color: AppColors.primaryRust,
                              ),
                              filled: true,
                              fillColor: Colors.transparent,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: AppColors.borderLight,
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: AppColors.borderLight,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: AppColors.primaryRust,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),
      
                          // Password Field
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Password',
                                style: TextStyle(
                                  color: AppColors.textPrimaryLight,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              GestureDetector(
                                onTap: () {
                                  Navigator.pushNamed(context, '/forgot-password');
                                },
                                child: const Text(
                                  'Forgot Password?',
                                  style: TextStyle(
                                    color: AppColors.primaryRust,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _passwordController,
                            autofillHints: const [AutofillHints.password],
                            obscureText: provider.obscurePassword,
                            style: const TextStyle(color: AppColors.textPrimaryLight),
                            decoration: InputDecoration(
                              hintText: 'Enter your password',
                              prefixIcon: const Icon(
                                Icons.lock_outline,
                                color: AppColors.primaryRust,
                              ),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  provider.obscurePassword
                                      ? Icons.visibility_off_outlined
                                      : Icons.visibility_outlined,
                                  color: AppColors.textSecondaryLight,
                                ),
                                onPressed: provider.togglePasswordVisibility,
                              ),
                              filled: true,
                              fillColor: Colors.transparent,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: AppColors.borderLight,
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: AppColors.borderLight,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: AppColors.primaryRust,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Login Button
                    ElevatedButton(
                      onPressed: provider.isLoading
                          ? null
                          : () => _handleLogin(context, provider),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryRust,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'Login',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),

                    const SizedBox(height: 40),

                    // Sign up
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          "Don't have an account? ",
                          style: TextStyle(color: AppColors.textSecondaryLight),
                        ),
                        GestureDetector(
                          onTap: () => Navigator.pushReplacementNamed(
                            context,
                            '/signup',
                          ),
                          child: const Text(
                            'Sign up',
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
      ),
    );
  }
}

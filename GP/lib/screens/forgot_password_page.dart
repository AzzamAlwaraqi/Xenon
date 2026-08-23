import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/providers/forgot_password_provider.dart';
import 'package:gp/widgets/app_textfield.dart';
import 'package:gp/widgets/compass_loading_overlay.dart';
import 'package:gp/utils/toast_utils.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _otpController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRequestOtp(BuildContext context, ForgotPasswordProvider provider) async {
    final success = await provider.requestOtp(_emailController.text);
    if (!context.mounted) return;

    if (!success) {
      showTopToast(context, 'Failed to send OTP. Check email and try again.', isError: true);
    }
  }

  Future<void> _handleSubmit(BuildContext context, ForgotPasswordProvider provider) async {
    if (_newPasswordController.text != _confirmPasswordController.text) {
      showTopToast(context, 'Passwords do not match', isError: true);
      return;
    }

    final success = await provider.submitNewPassword(
      email: _emailController.text,
      otp: _otpController.text,
      newPassword: _newPasswordController.text,
      confirmPassword: _confirmPasswordController.text,
    );
    if (!context.mounted) return;

    if (success) {
      showTopToast(context, 'Password reset successfully!', isError: false);
      Navigator.pushReplacementNamed(context, '/login');
    } else {
      showTopToast(context, 'Failed to reset password. Check OTP and try again.', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ForgotPasswordProvider(),
      child: Consumer<ForgotPasswordProvider>(
        builder: (context, provider, _) {
          final isDark = Theme.of(context).brightness == Brightness.dark;

          return CompassLoadingOverlay(
            isLoading: provider.isLoading,
            child: Scaffold(
              backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              appBar: AppBar(
                backgroundColor: Colors.transparent,
                elevation: 0,
                leading: IconButton(
                  icon: Icon(Icons.arrow_back, color: isDark ? Colors.white : Colors.black),
                  onPressed: () => Navigator.pop(context),
                ),
                title: Text(
                  'Forgot Password',
                  style: TextStyle(color: isDark ? Colors.white : Colors.black),
                ),
              ),
              body: SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Reset your password',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : Colors.black,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        provider.otpSent
                            ? 'Enter the OTP sent to your email and your new password.'
                            : 'Enter your email address to receive an OTP.',
                        style: TextStyle(
                          color: isDark ? Colors.grey[400] : Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 32),
                      
                      if (!provider.otpSent) ...[
                        AppTextField(
                          controller: _emailController,
                          hint: 'Email Address',
                          prefixIcon: Icons.email_outlined,
                          keyboardType: TextInputType.emailAddress,
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: () => _handleRequestOtp(context, provider),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryRust,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: const Text('Send OTP', style: TextStyle(color: Colors.white, fontSize: 16)),
                        ),
                      ] else ...[
                        AppTextField(
                          controller: _otpController,
                          hint: 'OTP Code',
                          prefixIcon: Icons.password,
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 16),
                        AppTextField(
                          controller: _newPasswordController,
                          hint: 'New Password',
                          prefixIcon: Icons.lock_outline,
                          isPassword: provider.obscurePassword,
                          onToggleVisibility: provider.togglePasswordVisibility,
                          onChanged: (_) => provider.validatePassword(_newPasswordController.text, _confirmPasswordController.text),
                        ),
                        const SizedBox(height: 16),
                        AppTextField(
                          controller: _confirmPasswordController,
                          hint: 'Confirm Password',
                          prefixIcon: Icons.lock_outline,
                          isPassword: provider.obscureConfirmPassword,
                          onToggleVisibility: provider.toggleConfirmPasswordVisibility,
                          onChanged: (_) => provider.validatePassword(_newPasswordController.text, _confirmPasswordController.text),
                        ),
                        const SizedBox(height: 16),

                        // Password Strength Bar
                        if (_newPasswordController.text.isNotEmpty)
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

                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: provider.isPasswordValid 
                              ? () => _handleSubmit(context, provider) 
                              : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryRust,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                          ),
                          child: const Text('Reset Password', style: TextStyle(color: Colors.white, fontSize: 16)),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          );
        },
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
    switch (level) {
      case 1:
        return Colors.red;
      case 2:
        return Colors.orange;
      case 3:
        return Colors.green;
      default:
        return Colors.grey[300]!;
    }
  }

  String _getStrengthText(int level) {
    switch (level) {
      case 1:
        return 'Weak Password';
      case 2:
        return 'Medium Password';
      case 3:
        return 'Strong Password';
      default:
        return '';
    }
  }

  Widget _buildChecklistItem(String text, bool isMet) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(
            isMet ? Icons.check_circle : Icons.radio_button_unchecked,
            size: 16,
            color: isMet ? Colors.green : Colors.grey,
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: TextStyle(
              color: isMet ? AppColors.textPrimaryLight : Colors.grey,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

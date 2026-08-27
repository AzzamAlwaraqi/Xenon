import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/providers/signup_provider.dart';
import 'package:gp/providers/settings_provider.dart';
import 'package:gp/widgets/app_textfield.dart';
import 'package:gp/widgets/compass_loading_overlay.dart';

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
    final settings = context.watch<SettingsProvider>();
    final isArabic = settings.locale.languageCode == 'ar';
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;

    return CompassLoadingOverlay(
      isLoading: provider.isLoading,
      child: Scaffold(
        backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
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
                              (isDark ? AppColors.backgroundDark : Colors.white).withValues(alpha: 0.8),
                              isDark ? AppColors.backgroundDark : Colors.white,
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
                decoration: BoxDecoration(
                  color: isDark ? AppColors.backgroundDark : Colors.white,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(32),
                    topRight: Radius.circular(32),
                  ),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 32),
                    Text(
                      isArabic ? 'ابدأ رحلتك' : 'Begin Your Journey',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      isArabic 
                          ? 'قم بإنشاء حساب لاكتشاف الفخامة.'
                          : 'Create an account to unlock luxurious\ndiscovery.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Form Fields
                    FieldLabel(text: isArabic ? 'الاسم الكامل' : 'Full Name'),
                    AppTextField(
                      controller: provider.fullNameController,
                      hint: isArabic ? 'فلان الفلاني' : 'John Doe',
                      prefixIcon: Icons.person_outline,
                    ),

                    const SizedBox(height: 16),

                    FieldLabel(text: isArabic ? 'البريد الإلكتروني' : 'Email Address'),
                    AppTextField(
                      controller: provider.emailController,
                      hint: 'john@example.com',
                      prefixIcon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                    ),

                    const SizedBox(height: 16),

                    FieldLabel(text: isArabic ? 'رقم الهاتف' : 'Phone Number'),
                    AppTextField(
                      controller: provider.phoneController,
                      hint: '+962 7 9000 0000',
                      prefixIcon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                    ),

                    const SizedBox(height: 16),

                    FieldLabel(text: isArabic ? 'الجنس' : 'Gender'),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight, width: 0.5),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: provider.gender,
                          dropdownColor: isDark ? AppColors.surfaceDark : Colors.white,
                          hint: Text(
                            isArabic ? 'اختر الجنس' : 'Select Gender',
                            style: TextStyle(
                              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                              fontSize: 14,
                            ),
                          ),
                          isExpanded: true,
                          icon: Icon(
                            Icons.arrow_drop_down,
                            color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                          ),
                          items: ['male', 'female'].map((String value) {
                            return DropdownMenuItem<String>(
                              value: value,
                              child: Text(
                                value == 'male' 
                                    ? (isArabic ? 'ذكر' : 'Male') 
                                    : (isArabic ? 'أنثى' : 'Female'),
                                style: TextStyle(color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
                              ),
                            );
                          }).toList(),
                          onChanged: provider.setGender,
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    FieldLabel(text: isArabic ? 'تاريخ الميلاد' : 'Date of Birth'),
                    GestureDetector(
                      onTap: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: DateTime(2000),
                          firstDate: DateTime(1900),
                          lastDate: DateTime.now(),
                          builder: (context, child) {
                            return Theme(
                              data: Theme.of(context).copyWith(
                                colorScheme: const ColorScheme.light(
                                  primary: AppColors.primaryRust,
                                  onPrimary: Colors.white,
                                  onSurface: Colors.black,
                                ),
                              ),
                              child: child!,
                            );
                          },
                        );
                        if (date != null) {
                          provider.setDateOfBirth(date);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 16,
                        ),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight, width: 0.5),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.calendar_today_outlined,
                              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Text(
                              provider.dateOfBirth != null
                                  ? "${provider.dateOfBirth!.day}/${provider.dateOfBirth!.month}/${provider.dateOfBirth!.year}"
                                  : (isArabic ? 'اختر تاريخ الميلاد' : 'Select Date of Birth'),
                              style: TextStyle(
                                color: provider.dateOfBirth != null
                                    ? (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight)
                                    : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    FieldLabel(text: isArabic ? 'كلمة المرور' : 'Password'),
                    AppTextField(
                      controller: provider.passwordController,
                      hint: '••••••••',
                      prefixIcon: Icons.lock_outline,
                      isPassword: provider.obscurePassword,
                      onToggleVisibility: provider.togglePasswordVisibility,
                    ),

                    const SizedBox(height: 16),

                    FieldLabel(text: isArabic ? 'تأكيد كلمة المرور' : 'Confirm Password'),
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
                            _getStrengthText(provider.passwordStrengthLevel, isArabic),
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
                            isArabic ? 'على الأقل 8 أحرف' : 'At least 8 characters',
                            provider.hasMinLength,
                          ),
                          _buildChecklistItem(
                            isArabic ? 'على الأقل حرف كبير واحد' : 'At least 1 capital letter',
                            provider.hasCapital,
                          ),
                          _buildChecklistItem(
                            isArabic ? 'على الأقل رقم واحد' : 'At least 1 number',
                            provider.hasNumber,
                          ),
                          _buildChecklistItem(
                            isArabic ? 'على الأقل رمز خاص واحد' : 'At least 1 special character',
                            provider.hasSpecial,
                          ),
                          _buildChecklistItem(
                            isArabic ? 'كلمتا المرور متطابقتان' : 'Passwords match',
                            provider.passwordsMatch,
                          ),
                        ],
                      ),

                    const SizedBox(height: 32),

                    // Create Account Button
                    ElevatedButton(
                      onPressed:
                          (provider.isLoading || !provider.isPasswordValid)
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
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            isArabic ? 'إنشاء حساب' : 'Create Account',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Icon(isArabic ? Icons.arrow_back : Icons.arrow_forward, size: 18),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Log In link
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          isArabic ? "لديك حساب بالفعل؟ " : "Already have an account? ",
                          style: const TextStyle(color: AppColors.textSecondaryLight),
                        ),
                        GestureDetector(
                          onTap: () =>
                              Navigator.pushReplacementNamed(context, '/login'),
                          child: Text(
                            isArabic ? 'تسجيل الدخول' : 'Log In',
                            style: const TextStyle(
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

  String _getStrengthText(int level, bool isArabic) {
    if (level == 1) return isArabic ? 'ضعيف' : 'Weak';
    if (level == 2) return isArabic ? 'متوسط' : 'Medium';
    if (level == 3) return isArabic ? 'قوي' : 'Strong';
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

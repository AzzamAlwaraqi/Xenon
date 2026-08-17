import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ahlan_widgets.dart';
import '../../../core/navigation/app_routes.dart';

class ResetPasswordScreen extends StatelessWidget {
  const ResetPasswordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(leading: const BackButton()),
      body: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Create New Password', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            const Text('Your new password must be different from previous used passwords.', style: TextStyle(color: AppColors.greyText)),
            const SizedBox(height: 32),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('PASSWORD REQUIREMENTS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(height: 16),
                  _requirementItem('Minimum 8 characters', true),
                  _requirementItem('At least one uppercase letter', false),
                  _requirementItem('At least one number or symbol', false),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const AhlanTextField(label: 'New Password', hint: 'Enter new password', prefixIcon: Icons.lock_outline, isPassword: true),
            const SizedBox(height: 24),
            const AhlanTextField(label: 'Confirm New Password', hint: 'Confirm new password', prefixIcon: Icons.refresh, isPassword: true),
            const Spacer(),
            AhlanButton(
              text: 'Reset Password',
              onPressed: () => context.go(AppRoutes.login),
            ),
          ],
        ),
      ),
    );
  }

  Widget _requirementItem(String text, bool checked) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(checked ? Icons.check_circle : Icons.circle_outlined, size: 20, color: checked ? AppColors.successGreen : AppColors.greyText),
          const SizedBox(width: 8),
          Text(text, style: TextStyle(color: checked ? AppColors.darkText : AppColors.greyText)),
        ],
      ),
    );
  }
}

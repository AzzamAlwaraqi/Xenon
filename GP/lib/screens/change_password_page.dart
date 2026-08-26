import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/providers/profile_provider.dart';
import 'package:gp/widgets/app_textfield.dart';
import 'package:gp/widgets/compass_loading_overlay.dart';

class ChangePasswordPage extends StatelessWidget {
  const ChangePasswordPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const _ChangePasswordPageContent();
  }
}

class _ChangePasswordPageContent extends StatefulWidget {
  const _ChangePasswordPageContent();

  @override
  State<_ChangePasswordPageContent> createState() => _ChangePasswordPageContentState();
}

class _ChangePasswordPageContentState extends State<_ChangePasswordPageContent> {
  final TextEditingController _currentPasswordController = TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProfileProvider>();
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
            'Change Password',
            style: TextStyle(color: isDark ? Colors.white : Colors.black),
          ),
        ),
        body: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppTextField(
                controller: _currentPasswordController,
                hint: 'Current Password',
                prefixIcon: Icons.lock_outline,
                isPassword: true,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _newPasswordController,
                hint: 'New Password',
                prefixIcon: Icons.lock_outline,
                isPassword: true,
              ),
              const SizedBox(height: 16),
              AppTextField(
                controller: _confirmPasswordController,
                hint: 'Confirm New Password',
                prefixIcon: Icons.lock_outline,
                isPassword: true,
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () async {
                  if (_newPasswordController.text != _confirmPasswordController.text) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('New passwords do not match')),
                    );
                    return;
                  }
                  final success = await provider.changePassword(
                    _currentPasswordController.text,
                    _newPasswordController.text,
                    context,
                  );
                  if (success) {
                    if (context.mounted) {
                      Navigator.pop(context);
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryRust,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Change Password', style: TextStyle(color: Colors.white, fontSize: 16)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

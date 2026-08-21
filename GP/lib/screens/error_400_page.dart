import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/providers/error_provider.dart';

class Error400Page extends StatelessWidget {
  const Error400Page({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ErrorProvider(),
      child: const _Error400PageContent(),
    );
  }
}

class _Error400PageContent extends StatelessWidget {
  const _Error400PageContent();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ErrorProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon Container
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : const Color(0xFFF9EAE1), // Very faint peach
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0),
                    width: 1,
                  ),
                ),
                child: Center(
                  child: Stack(
                    alignment: Alignment.topRight,
                    children: [
                      Icon(
                        Icons.location_on, // Map pin
                        color: AppColors.primaryRust,
                        size: 60,
                      ),
                      // The X inside or near the pin. Since we don't have the exact icon, we construct it.
                      Positioned(
                        top: 5,
                        right: 5,
                        child: Container(
                          decoration: const BoxDecoration(
                            color: AppColors.primaryRust,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.close,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 48),
              
              // Title
              Text(
                'Something\'s not\nright',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  height: 1.2,
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Subtitle
              Text(
                'The request couldn\'t be\nprocessed. Please check your\ninformation and try again.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  fontSize: 16,
                  height: 1.5,
                ),
              ),
              
              const SizedBox(height: 48),
              
              // Try Again Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: provider.isLoading ? null : () => provider.refreshPage(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryRust,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: provider.isLoading 
                    ? const SizedBox(
                        width: 20, 
                        height: 20, 
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                      )
                    : const Text(
                        'TRY AGAIN',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          letterSpacing: 1.2,
                        ),
                      ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Back to Home Button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.pushReplacementNamed(context, '/');
                  },
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: AppColors.textPrimaryLight, width: 1.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Text(
                    'BACK TO HOME',
                    style: TextStyle(
                      color: AppColors.textPrimaryLight,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 48),
              
              // Error Code text
              Text(
                'Error Code: 400',
                style: TextStyle(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

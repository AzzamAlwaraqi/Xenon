import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/app/theme/colors.dart';
import 'package:gp/core/presentation/providers/error_provider.dart';

class Error403Page extends StatelessWidget {
  const Error403Page({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ErrorProvider(),
      child: const _Error403PageContent(),
    );
  }
}

class _Error403PageContent extends StatelessWidget {
  const _Error403PageContent();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon Container
                Stack(
                  alignment: Alignment.center,
                  children: [
                    // Faint background circle
                    Container(
                      width: 200,
                      height: 200,
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withValues(alpha: 0.05) : const Color(0xFFF3EDEC),
                        shape: BoxShape.circle,
                      ),
                    ),
                    // Outer ring
                    Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFE5E5),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 4),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.red.withValues(alpha: 0.1),
                            blurRadius: 20,
                            spreadRadius: 5,
                          ),
                        ],
                      ),
                      child: Center(
                        child: Container(
                          width: 60,
                          height: 60,
                          decoration: const BoxDecoration(
                            color: Color(0xFFC52B2B), // Deep red
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.remove,
                            color: Colors.white,
                            size: 40,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 48),
                
                // Title
                Text(
                  'Restricted Area',
                  style: TextStyle(
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Subtitle
                Text(
                  'It looks like you don\'t have\npermission to access this\nlocation.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    fontSize: 16,
                    height: 1.5,
                  ),
                ),
                
                const SizedBox(height: 32),
                
                // Error Code Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0), // Light blue-grey
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'ERROR 403',
                    style: TextStyle(
                      color: AppColors.textPrimaryLight,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      letterSpacing: 1.2,
                    ),
                  ),
                ),
                
                const SizedBox(height: 48),
                
                // Back Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      if (Navigator.canPop(context)) {
                        Navigator.pop(context);
                      } else {
                        Navigator.pushReplacementNamed(context, '/'); // Or specific explore route
                      }
                    },
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    label: const Text(
                      'Back to Explore',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryRust,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

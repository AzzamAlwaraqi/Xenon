import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/providers/error_provider.dart';

class ServerErrorPage extends StatelessWidget {
  const ServerErrorPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ErrorProvider(),
      child: const _ServerErrorPageContent(),
    );
  }
}

class _ServerErrorPageContent extends StatelessWidget {
  const _ServerErrorPageContent();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ErrorProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Stack(
        children: [
          // Background Gradient to simulate Sandstorm / Blur
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: isDark 
                  ? [AppColors.backgroundDark, AppColors.surfaceDark]
                  : [const Color(0xFFE8DECF), AppColors.backgroundLight],
              ),
            ),
          ),
          
          // 500 Watermark
          Center(
            child: Text(
              '500',
              style: TextStyle(
                fontSize: 160,
                fontWeight: FontWeight.bold,
                color: isDark 
                    ? Colors.white.withValues(alpha: 0.03) 
                    : AppColors.primaryRust.withValues(alpha: 0.03),
              ),
            ),
          ),
          
          // Content
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.air, // Wind/Air icon for Sandstorm
                    size: 80,
                    color: AppColors.primaryRust,
                  ),
                  const SizedBox(height: 32),
                  Text(
                    'Sandstorm in the\nServers',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Something went wrong on our end.\nWe\'re working to clear the air. Please try\nagain later.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      fontSize: 16,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 48),
                  
                  // Refresh Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: provider.isLoading ? null : () => provider.refreshPage(context),
                      icon: provider.isLoading 
                          ? const SizedBox(
                              width: 20, 
                              height: 20, 
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                            )
                          : const Icon(Icons.refresh, color: Colors.white),
                      label: Text(
                        provider.isLoading ? 'REFRESHING...' : 'REFRESH PAGE',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryRust,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(24),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

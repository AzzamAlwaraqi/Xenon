import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/providers/error_provider.dart';

class Error404Page extends StatelessWidget {
  const Error404Page({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => ErrorProvider(),
      child: const _Error404PageContent(),
    );
  }
}

class _Error404PageContent extends StatelessWidget {
  const _Error404PageContent();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 40),
                
                // Desert Image Container (Circle)
                Container(
                  width: 250,
                  height: 250,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.brown.withValues(alpha: 0.1),
                        blurRadius: 30,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  // We'll use a placeholder network image representing the desert
                  child: Image.network(
                    'https://images.unsplash.com/photo-1547234935-80c7145ec969?q=80&w=600&auto=format&fit=crop', // Desert image
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      color: const Color(0xFFF0E5D8),
                      child: const Center(
                        child: Text(
                          'ERROR 404\n\nLooks like the page you\'re looking for has wandered off into the vast unknown.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 10),
                        ),
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 60),
                
                // Title
                Text(
                  'Lost in the Desert?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.primaryRust,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Subtitle
                Text(
                  'We can\'t find the page you\'re looking\nfor. It might have moved or disappeared\nlike a mirage.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    fontSize: 16,
                    height: 1.5,
                  ),
                ),
                
                const SizedBox(height: 48),
                
                // Return Home Button
                SizedBox(
                  width: 200,
                  child: ElevatedButton(
                    onPressed: () {
                      if (Navigator.canPop(context)) {
                        Navigator.pop(context);
                      } else {
                        Navigator.pushReplacementNamed(context, '/');
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryRust,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'Return Home',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
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

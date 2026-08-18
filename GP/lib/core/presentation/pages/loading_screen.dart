import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:gp/app/theme/colors.dart';

class LoadingScreen extends StatelessWidget {
  const LoadingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Animated Camel (using an emoji as a placeholder for the pixel art)
            // It bobs up and down and tilts slightly to simulate walking
            const Text(
              '🐪', 
              style: TextStyle(fontSize: 100),
            )
            .animate(onPlay: (controller) => controller.repeat())
            .moveY(begin: 0, end: -15, duration: 400.ms, curve: Curves.easeInOut)
            .then()
            .moveY(begin: -15, end: 0, duration: 400.ms, curve: Curves.easeInOut)
            .rotate(begin: -0.05, end: 0.05, duration: 400.ms, curve: Curves.easeInOut)
            .then()
            .rotate(begin: 0.05, end: -0.05, duration: 400.ms, curve: Curves.easeInOut),
            
            const SizedBox(height: 16),
            
            // Shadow beneath the camel
            Container(
              width: 60,
              height: 8,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(100),
              ),
            )
            .animate(onPlay: (controller) => controller.repeat())
            .scaleX(begin: 1.0, end: 0.7, duration: 400.ms, curve: Curves.easeInOut)
            .then()
            .scaleX(begin: 0.7, end: 1.0, duration: 400.ms, curve: Curves.easeInOut),

            const SizedBox(height: 60),

            // Loading Text
            Text(
              'Loading your journey...',
              style: TextStyle(
                color: isDark ? AppColors.textPrimaryDark : const Color(0xFF4A3E3D),
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Animated Dots
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(3, (index) {
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 6),
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: AppColors.primaryRust,
                    shape: BoxShape.circle,
                  ),
                )
                .animate(
                  onPlay: (controller) => controller.repeat(),
                  delay: (index * 200).ms,
                )
                .scale(begin: const Offset(1, 1), end: const Offset(1.5, 1.5), duration: 300.ms)
                .fade(begin: 1, end: 0.5, duration: 300.ms)
                .then()
                .scale(begin: const Offset(1.5, 1.5), end: const Offset(1, 1), duration: 300.ms)
                .fade(begin: 0.5, end: 1, duration: 300.ms);
              }),
            ),
          ],
        ),
      ),
    );
  }
}

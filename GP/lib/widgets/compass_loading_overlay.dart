import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:gp/theme/colors.dart';

class CompassLoadingOverlay extends StatelessWidget {
  final bool isLoading;
  final Widget child;

  const CompassLoadingOverlay({
    super.key,
    required this.isLoading,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (isLoading)
          Positioned.fill(
            child: Container(
              color: Colors.black.withValues(alpha: 0.5),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Theme.of(context).scaffoldBackgroundColor,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.explore, // Compass icon
                        size: 60,
                        color: AppColors.primaryRust,
                      )
                      .animate(onPlay: (controller) => controller.repeat())
                      .scaleXY(begin: 0.8, end: 1.2, duration: 800.ms, curve: Curves.easeInOut)
                      .then()
                      .scaleXY(begin: 1.2, end: 0.8, duration: 800.ms, curve: Curves.easeInOut),
                      
                      const SizedBox(height: 16),
                      
                      const Text(
                        'Please wait...',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                      .animate(onPlay: (controller) => controller.repeat())
                      .fade(begin: 0.5, end: 1.0, duration: 800.ms)
                      .then()
                      .fade(begin: 1.0, end: 0.5, duration: 800.ms),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

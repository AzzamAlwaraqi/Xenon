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
                      const SizedBox(
                        width: 40,
                        height: 40,
                        child: CircularProgressIndicator(
                          color: AppColors.primaryRust,
                          strokeWidth: 3,
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                        'Preparing your journey...',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 1.1,
                          color: AppColors.primaryRust,
                        ),
                      )
                      .animate(onPlay: (controller) => controller.repeat())
                      .fade(begin: 0.6, end: 1.0, duration: 1000.ms)
                      .then()
                      .fade(begin: 1.0, end: 0.6, duration: 1000.ms),
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

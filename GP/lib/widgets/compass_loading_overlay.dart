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
                        width: 50,
                        height: 50,
                        child: Icon(
                          Icons.explore_rounded,
                          color: AppColors.primaryRust,
                          size: 50,
                        ),
                      )
                      .animate(onPlay: (controller) => controller.repeat())
                      .rotate(duration: 2.seconds)
                      .scale(
                        begin: const Offset(0.8, 0.8),
                        end: const Offset(1.1, 1.1),
                        duration: 1.seconds,
                        curve: Curves.easeInOut,
                      )
                      .then()
                      .scale(
                        begin: const Offset(1.1, 1.1),
                        end: const Offset(0.8, 0.8),
                        duration: 1.seconds,
                        curve: Curves.easeInOut,
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        'Preparing your journey...',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.2,
                          color: AppColors.primaryRust,
                        ),
                      )
                      .animate(onPlay: (controller) => controller.repeat())
                      .fade(begin: 0.5, end: 1.0, duration: 1.seconds)
                      .then()
                      .fade(begin: 1.0, end: 0.5, duration: 1.seconds),
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

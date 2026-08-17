import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/navigation/app_routes.dart';

/// Uses [StatefulWidget] so the [Future.delayed] side-effect runs once in
/// [initState], never on subsequent rebuilds — unlike the previous
/// [StatelessWidget] implementation that re-scheduled the timer every build.
class LoadingScreen extends StatefulWidget {
  final String nextRoute;
  final String message;

  const LoadingScreen({
    super.key,
    this.nextRoute = AppRoutes.profile,
    this.message = 'Loading your journey...',
  });

  @override
  State<LoadingScreen> createState() => _LoadingScreenState();
}

class _LoadingScreenState extends State<LoadingScreen> {
  @override
  void initState() {
    super.initState();
    // Simulate some work, then navigate to the specified nextRoute
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) context.go(widget.nextRoute);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.terrain, size: 100, color: AppColors.primaryBrown),
            const SizedBox(height: 32),
            Text(
              widget.message,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            const CircularProgressIndicator(
              color: AppColors.primaryBrown,
            ),
          ],
        ),
      ),
    );
  }
}

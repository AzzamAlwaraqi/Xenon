import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ahlan_widgets.dart';
import '../../../core/navigation/app_routes.dart';

class ErrorScreen extends StatelessWidget {
  final String code;
  final String? message;

  const ErrorScreen({super.key, required this.code, this.message});

  @override
  Widget build(BuildContext context) {
    String title = 'Something\'s not right';
    String desc = message ?? 'The request couldn\'t be processed. Please check your information and try again.';
    IconData icon = Icons.error_outline;

    if (code == '404') {
      title = 'Lost in the Desert?';
      desc = 'We can\'t find the page you\'re looking for. It might have moved or disappeared like a mirage.';
      icon = Icons.landscape;
    } else if (code == '500') {
      title = 'Sandstorm in the Servers';
      desc = 'Something went wrong on our end. We\'re working to clear the air. Please try again later.';
      icon = Icons.air;
    } else if (code == '403') {
      title = 'Restricted Area';
      desc = 'It looks like you don\'t have permission to access this location.';
      icon = Icons.block;
    }

    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppColors.primaryPink.withValues(alpha: 0.5),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 80, color: AppColors.primaryBrown),
            ),
            const SizedBox(height: 48),
            Text(title, style: Theme.of(context).textTheme.headlineMedium, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            Text(desc, style: const TextStyle(color: AppColors.greyText), textAlign: TextAlign.center),
            if (code != '404' && code != '500') ...[
              const SizedBox(height: 16),
              Text('Error Code: $code', style: const TextStyle(color: AppColors.greyText, fontSize: 12)),
            ],
            const SizedBox(height: 48),
            AhlanButton(
              text: code == '404' || code == '403' ? 'Back to Explore' : 'TRY AGAIN',
              onPressed: () => context.go(AppRoutes.welcome),
            ),
            if (code == '400') ...[
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () => context.go(AppRoutes.welcome),
                child: const Text('BACK TO HOME'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

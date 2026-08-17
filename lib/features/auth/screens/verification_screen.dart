import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ahlan_widgets.dart';
import '../../../core/navigation/app_routes.dart';

class VerificationScreen extends StatelessWidget {
  const VerificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(leading: const BackButton()),
      body: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            Text('Verify Account', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 8),
            const Text('We sent a code to your phone', style: TextStyle(color: AppColors.greyText)),
            const SizedBox(height: 48),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(6, (index) => _otpBox(context)),
            ),
            const SizedBox(height: 32),
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.timer_outlined, size: 16, color: AppColors.greyText),
                SizedBox(width: 8),
                Text('Resend Code in 00:58', style: TextStyle(color: AppColors.greyText)),
              ],
            ),
            const Spacer(),
            AhlanButton(
              text: 'Verify',
              onPressed: () => context.go(AppRoutes.profile),
            ),
          ],
        ),
      ),
    );
  }

  Widget _otpBox(BuildContext context) {
    return Container(
      width: 48,
      height: 60,
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.divider),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(
        child: Text(
          '0',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppColors.divider),
        ),
      ),
    );
  }
}

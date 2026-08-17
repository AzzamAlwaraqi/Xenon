import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ahlan_widgets.dart';
import '../../../core/navigation/app_routes.dart';

class PaymentScreen extends StatelessWidget {
  const PaymentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Payment'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('ORDER SUMMARY', style: TextStyle(color: AppColors.greyText, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        image: const DecorationImage(
                          image: NetworkImage('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e'),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text('The Treasury at Petra', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                          Text('Guided Tour • 2 Adults', style: TextStyle(color: AppColors.greyText)),
                          SizedBox(height: 4),
                          Text('JOD 120', style: TextStyle(color: AppColors.primaryBrown, fontWeight: FontWeight.bold, fontSize: 18)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            const Text('PAYMENT METHOD', style: TextStyle(color: AppColors.greyText, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.primaryBrown, width: 2),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Row(
                children: [
                  const Icon(Icons.radio_button_checked, color: AppColors.primaryBrown),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('Cash', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                        SizedBox(height: 4),
                        Text('Pay cash upon arrival', style: TextStyle(color: AppColors.greyText, fontSize: 13)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.primaryBrown.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.payments_outlined, color: AppColors.primaryBrown),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            AhlanButton(
              text: 'Confirm Payment',
              onPressed: () => context.go(
                Uri(
                  path: AppRoutes.loading,
                  queryParameters: {
                    'nextRoute': AppRoutes.trips,
                    'message': 'Processing your payment...',
                  },
                ).toString(),
              ),
              icon: const Icon(Icons.lock_outline),
            ),
          ],
        ),
      ),
    );
  }
}

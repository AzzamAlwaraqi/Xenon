import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ahlan_widgets.dart';
import '../../../core/navigation/app_routes.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ahlan wa Sahlan'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push(AppRoutes.settings),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const CircleAvatar(
              radius: 60,
              backgroundColor: Color(0xFFE0E7FF),
              child: Icon(Icons.person, size: 60, color: AppColors.primaryBrown),
            ),
            const SizedBox(height: 16),
            const Text(
              'Change Profile Picture',
              style: TextStyle(color: AppColors.primaryBrown, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 24),
            Text('Sarah User', style: Theme.of(context).textTheme.headlineMedium),
            const Text('sa***@email.com', style: TextStyle(color: AppColors.greyText)),
            const SizedBox(height: 40),
            AhlanPreferenceCard(
              title: 'All Bookings',
              subtitle: '',
              icon: Icons.receipt_long_outlined,
              onTap: () => context.go(AppRoutes.trips),
            ),
            AhlanPreferenceCard(
              title: 'Reset Password',
              subtitle: '',
              icon: Icons.lock_reset_outlined,
              onTap: () => context.push(AppRoutes.resetPassword),
            ),
            const SizedBox(height: 32),
            AhlanLogOutButton(onPressed: () => context.go(AppRoutes.welcome)),
          ],
        ),
      ),
    );
  }
}

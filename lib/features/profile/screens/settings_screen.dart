import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ahlan_widgets.dart';
import '../../../core/navigation/app_routes.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Ahlan wa Sahlan'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () => context.push(AppRoutes.notifications),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Settings', style: Theme.of(context).textTheme.displayLarge?.copyWith(fontSize: 32)),
            const SizedBox(height: 8),
            const Text(
              'Manage your account preferences and app experience.',
              style: TextStyle(color: AppColors.greyText),
            ),
            const SizedBox(height: 32),
            const Text('Preferences', style: TextStyle(color: AppColors.primaryBrown, fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 16),
            AhlanPreferenceCard(
              title: 'Language',
              subtitle: 'Select your preferred language',
              icon: Icons.language,
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF2F4F7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('English'),
                    Icon(Icons.expand_more, size: 20),
                  ],
                ),
              ),
            ),
            AhlanPreferenceCard(
              title: 'Currency',
              subtitle: 'Choose display currency',
              icon: Icons.payments_outlined,
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF2F4F7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('JOD (JD)'),
              ),
            ),
            AhlanPreferenceCard(
              title: 'Dark Mode',
              subtitle: 'Switch to dark appearance',
              icon: Icons.dark_mode_outlined,
              trailing: Switch(
                value: false,
                onChanged: (v) {},
                activeThumbColor: AppColors.primaryBrown,
              ),
            ),
            const SizedBox(height: 32),
            AhlanLogOutButton(onPressed: () => context.go(AppRoutes.welcome)),
          ],
        ),
      ),
    );
  }
}

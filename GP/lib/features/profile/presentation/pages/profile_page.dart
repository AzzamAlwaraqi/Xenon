import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/app/theme/colors.dart';
import 'package:gp/core/providers/settings_provider.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    final isDark = settings.themeMode == ThemeMode.dark;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        elevation: 0,
        title: Text(
          settings.locale.languageCode == 'ar' ? 'أهلاً بك' : 'Hello, Voyager',
          style: TextStyle(color: isDark ? Colors.white : Colors.black, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications_outlined, color: isDark ? Colors.white : Colors.black),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          children: [
            const SizedBox(height: 20),
            // Profile Header
            Center(
              child: Column(
                children: [
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.accentGreen, width: 2),
                        ),
                      ),
                      const CircleAvatar(
                        radius: 45,
                        backgroundImage: NetworkImage('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Jordan Donovan',
                    style: TextStyle(
                      color: isDark ? Colors.white : Colors.black,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.accentGreen),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.verified, color: AppColors.accentGreen, size: 14),
                        SizedBox(width: 4),
                        Text('VOYAGER TIER', style: TextStyle(color: AppColors.accentGreen, fontSize: 10, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            _buildSectionHeader('ACCOUNT SETTINGS', context),
            _buildSettingTile(Icons.person_outline, 'Personal Information', 'Contact and identity details', context),
            _buildSettingTile(Icons.payment, 'Payment Methods', 'Cards, wallets, and billing', context),
            
            const SizedBox(height: 32),
            _buildSectionHeader('PREFERENCES', context),
            
            // Theme Toggle
            _buildSwitchTile(
              Icons.brightness_6_outlined,
              'Dark Mode',
              'Toggle between bright and dark theme',
              isDark,
              (value) => settings.toggleTheme(),
              context,
            ),

            // Language Selection
            _buildActionTile(
              Icons.language,
              'Language',
              settings.locale.languageCode == 'ar' ? 'العربية' : 'English',
              () => _showLanguageDialog(context, settings),
              context,
            ),

            // Currency Selection
            _buildActionTile(
              Icons.monetization_on_outlined,
              'Currency',
              settings.currency,
              () => _showCurrencyDialog(context, settings),
              context,
            ),

            const SizedBox(height: 32),
            _buildSectionHeader('SUPPORT', context),
            _buildSettingTile(Icons.help_outline, 'Help Center', 'FAQs and customer support', context),

            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.logout),
                label: const Text('Log out'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isDark ? AppColors.surface : Colors.grey[200],
                  foregroundColor: isDark ? Colors.white : Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(color: isDark ? AppColors.border : Colors.grey[300]!),
                  ),
                  elevation: 0,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'App Version 2.4.1 (Stable)',
              style: TextStyle(color: isDark ? AppColors.textMuted : Colors.grey[600], fontSize: 12),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: TextStyle(
            color: isDark ? AppColors.textMuted : Colors.grey[600],
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.2,
          ),
        ),
      ),
    );
  }

  Widget _buildSettingTile(IconData icon, String title, String subtitle, BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surface : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? AppColors.border : Colors.grey[300]!, width: 0.5),
        boxShadow: isDark ? [] : [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.blue.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: isDark ? Colors.white : Colors.blue, size: 20),
        ),
        title: Text(
          title,
          style: TextStyle(color: isDark ? Colors.white : Colors.black, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(color: isDark ? AppColors.textMuted : Colors.grey[600], fontSize: 12),
        ),
        trailing: Icon(Icons.chevron_right, color: isDark ? AppColors.textMuted : Colors.grey[400]),
        onTap: () {},
      ),
    );
  }

  Widget _buildSwitchTile(IconData icon, String title, String subtitle, bool value, ValueChanged<bool> onChanged, BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surface : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? AppColors.border : Colors.grey[300]!, width: 0.5),
      ),
      child: SwitchListTile(
        secondary: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.orange.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: isDark ? Colors.white : Colors.orange, size: 20),
        ),
        title: Text(
          title,
          style: TextStyle(color: isDark ? Colors.white : Colors.black, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(color: isDark ? AppColors.textMuted : Colors.grey[600], fontSize: 12),
        ),
        value: value,
        onChanged: onChanged,
        activeThumbColor: AppColors.accentGreen,
      ),
    );
  }

  Widget _buildActionTile(IconData icon, String title, String value, VoidCallback onTap, BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surface : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? AppColors.border : Colors.grey[300]!, width: 0.5),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.purple.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: isDark ? Colors.white : Colors.purple, size: 20),
        ),
        title: Text(
          title,
          style: TextStyle(color: isDark ? Colors.white : Colors.black, fontSize: 14, fontWeight: FontWeight.w600),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              value,
              style: TextStyle(color: isDark ? AppColors.accentGreen : Colors.blue, fontSize: 12, fontWeight: FontWeight.bold),
            ),
            const SizedBox(width: 8),
            Icon(Icons.chevron_right, color: isDark ? AppColors.textMuted : Colors.grey[400]),
          ],
        ),
        onTap: onTap,
      ),
    );
  }

  void _showLanguageDialog(BuildContext context, SettingsProvider settings) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Language'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: const Text('English'),
              trailing: settings.locale.languageCode == 'en' ? const Icon(Icons.check, color: AppColors.accentGreen) : null,
              onTap: () {
                settings.setLocale('en');
                Navigator.pop(context);
              },
            ),
            ListTile(
              title: const Text('العربية'),
              trailing: settings.locale.languageCode == 'ar' ? const Icon(Icons.check, color: AppColors.accentGreen) : null,
              onTap: () {
                settings.setLocale('ar');
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showCurrencyDialog(BuildContext context, SettingsProvider settings) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Currency'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ['USD', 'JOD', 'EUR'].map((c) => ListTile(
            title: Text(c),
            trailing: settings.currency == c ? const Icon(Icons.check, color: AppColors.accentGreen) : null,
            onTap: () {
              settings.setCurrency(c);
              Navigator.pop(context);
            },
          )).toList(),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/app/theme/colors.dart';
import 'package:gp/features/profile/presentation/providers/settings_screen_provider.dart';
import 'package:gp/core/presentation/pages/loading_screen.dart';
import 'package:gp/core/presentation/pages/error_404_page.dart';
import 'package:gp/core/presentation/pages/error_403_page.dart';
import 'package:gp/core/presentation/pages/error_400_page.dart';
import 'package:gp/core/presentation/pages/server_error_page.dart';
import 'package:gp/core/presentation/pages/invalid_details_page.dart';
import 'package:gp/features/bookings/presentation/pages/booking_conflict_page.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SettingsScreenProvider(),
      child: const _SettingsPageContent(),
    );
  }
}

class _SettingsPageContent extends StatelessWidget {
  const _SettingsPageContent();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SettingsScreenProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: AppColors.primaryRust),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Settings',
          style: TextStyle(
            color: AppColors.primaryRust,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionTitle('PREFERENCES', isDark),
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    _buildSettingsTile(
                      icon: Icons.language,
                      title: 'Language',
                      subtitle: 'English (US)',
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),
                    _buildSettingsTile(
                      icon: Icons.public,
                      title: 'Country/Region',
                      subtitle: 'Jordan',
                      isDark: isDark,
                    ),
                    _buildDivider(isDark),
                    _buildSettingsTile(
                      icon: Icons.payments_outlined,
                      title: 'Currency',
                      subtitle: 'JOD',
                      isDark: isDark,
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 32),
              
              _buildSectionTitle('DISPLAY', isDark),
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.cardBgDark : const Color(0xFFF0EDEB),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(Icons.dark_mode_outlined, color: AppColors.primaryRust, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Dark Mode',
                              style: TextStyle(
                                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'System default',
                              style: TextStyle(
                                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: provider.isDarkMode(context),
                        onChanged: (val) => provider.toggleDarkMode(context, val),
                        activeThumbColor: AppColors.primaryRust,
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 32),
              
              _buildSectionTitle('DESIGN PREVIEWS', isDark),
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    _buildPreviewTile(context, 'Loading Screen', Icons.animation, isDark, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoadingScreen()))),
                    _buildDivider(isDark),
                    _buildPreviewTile(context, 'Error 404 (Desert)', Icons.not_interested, isDark, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const Error404Page()))),
                    _buildDivider(isDark),
                    _buildPreviewTile(context, 'Error 403 (Restricted)', Icons.block, isDark, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const Error403Page()))),
                    _buildDivider(isDark),
                    _buildPreviewTile(context, 'Error 400 (Not Right)', Icons.location_off, isDark, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const Error400Page()))),
                    _buildDivider(isDark),
                    _buildPreviewTile(context, 'Server Error (500)', Icons.air, isDark, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ServerErrorPage()))),
                    _buildDivider(isDark),
                    _buildPreviewTile(context, 'Invalid Details', Icons.priority_high, isDark, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InvalidDetailsPage()))),
                    _buildDivider(isDark),
                    _buildPreviewTile(context, 'Booking Conflict', Icons.event_busy, isDark, () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BookingConflictPage()))),
                  ],
                ),
              ),

              const SizedBox(height: 48),
              
              // Logout Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => provider.logout(context),
                  icon: const Icon(Icons.logout, color: Color(0xFFA02B2B)),
                  label: const Text(
                    'Log Out',
                    style: TextStyle(
                      color: Color(0xFFA02B2B),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFFE5E5),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(left: 8.0),
      child: Text(
        title,
        style: TextStyle(
          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildSettingsTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool isDark,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 16.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? AppColors.cardBgDark : const Color(0xFFF0EDEB),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: AppColors.primaryRust, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right, color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
        ],
      ),
    );
  }

  Widget _buildDivider(bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(left: 68.0, right: 16.0),
      child: Divider(
        color: isDark ? AppColors.borderDark : AppColors.borderLight,
        height: 1,
      ),
    );
  }

  Widget _buildPreviewTile(BuildContext context, String title, IconData icon, bool isDark, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? AppColors.cardBgDark : const Color(0xFFF0EDEB),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: AppColors.primaryRust, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ),
            Icon(Icons.chevron_right, color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
          ],
        ),
      ),
    );
  }
}

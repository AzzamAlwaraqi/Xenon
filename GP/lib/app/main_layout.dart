import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/app/theme/colors.dart';
import 'package:gp/features/home/presentation/pages/home_page.dart';
import 'package:gp/features/bookings/presentation/pages/bookings_page.dart';
import 'package:gp/features/profile/presentation/pages/profile_page.dart';
import 'package:gp/features/profile/presentation/pages/settings_page.dart';
import 'package:gp/core/providers/settings_provider.dart';

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const HomePage(),
    const BookingsPage(),
    const ProfilePage(),
    const SettingsPage(),
  ];

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    final isDark = settings.themeMode == ThemeMode.dark;

    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: Container(
        padding: const EdgeInsets.only(bottom: 8, top: 4),
        decoration: BoxDecoration(
          color: isDark ? AppColors.backgroundDark : Colors.white,
          border: Border(
            top: BorderSide(color: isDark ? AppColors.borderDark : AppColors.borderLight, width: 0.5),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.transparent,
          elevation: 0,
          selectedItemColor: Colors.white,
          unselectedItemColor: isDark ? AppColors.textSecondaryDark : AppColors.textPrimaryLight,
          showSelectedLabels: true,
          showUnselectedLabels: true,
          selectedFontSize: 12,
          unselectedFontSize: 12,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold),
          items: [
            _buildNavItem(Icons.home_outlined, Icons.home, 'Home', 0, isDark),
            _buildNavItem(Icons.explore_outlined, Icons.explore, 'Trips', 1, isDark),
            _buildNavItem(Icons.person_outline, Icons.person, 'Profile', 2, isDark),
            _buildNavItem(Icons.settings_outlined, Icons.settings, 'Settings', 3, isDark),
          ],
        ),
      ),
    );
  }

  BottomNavigationBarItem _buildNavItem(IconData icon, IconData activeIcon, String label, int index, bool isDark) {
    final isSelected = _currentIndex == index;
    return BottomNavigationBarItem(
      icon: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryRust : Colors.transparent,
          shape: BoxShape.circle,
        ),
        child: Icon(
          isSelected ? activeIcon : icon,
          color: isSelected ? Colors.white : (isDark ? AppColors.textSecondaryDark : AppColors.textPrimaryLight),
          size: 24,
        ),
      ),
      label: label,
    );
  }
}

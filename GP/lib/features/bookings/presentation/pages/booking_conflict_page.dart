import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/app/theme/colors.dart';
import 'package:gp/features/bookings/presentation/providers/booking_conflict_provider.dart';

class BookingConflictPage extends StatelessWidget {
  const BookingConflictPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => BookingConflictProvider(),
      child: const _BookingConflictPageContent(),
    );
  }
}

class _BookingConflictPageContent extends StatelessWidget {
  const _BookingConflictPageContent();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BookingConflictProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            stops: const [0.0, 0.4],
            colors: isDark
                ? [AppColors.primaryRust.withValues(alpha: 0.1), AppColors.backgroundDark]
                : [AppColors.primaryRust.withValues(alpha: 0.1), AppColors.backgroundLight],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon Stack
                SizedBox(
                  height: 140,
                  width: 140,
                  child: Stack(
                    children: [
                      // Bottom right light orange circle with calendar icon
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            color: AppColors.primaryRust.withValues(alpha: 0.7),
                            shape: BoxShape.circle,
                            border: Border.all(color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight, width: 4),
                          ),
                          child: const Icon(
                            Icons.calendar_today_outlined,
                            size: 40,
                            color: Color(0xFF5A2A1E), // Darker brown
                          ),
                        ),
                      ),
                      // Top left red circle with calendar-X icon
                      Positioned(
                        top: 0,
                        left: 0,
                        child: Container(
                          width: 85,
                          height: 85,
                          decoration: BoxDecoration(
                            color: const Color(0xFFC52B2B), // Strong Red
                            shape: BoxShape.circle,
                            border: Border.all(color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight, width: 4),
                          ),
                          child: const Icon(
                            Icons.event_busy,
                            size: 35,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      // Sparkle icon in the middle
                      Positioned(
                        top: 60,
                        left: 60,
                        child: Icon(
                          Icons.auto_awesome,
                          color: Colors.white,
                          size: 30,
                          shadows: [
                            Shadow(
                              color: Colors.black.withValues(alpha: 0.2),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 48),
                
                // Title
                Text(
                  'Booking Conflict',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Subtitle
                Text(
                  'There\'s a scheduling conflict with your\nrequest. Please review your trips and try\nagain.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    fontSize: 16,
                    height: 1.5,
                  ),
                ),
                
                const SizedBox(height: 48),
                
                // View My Trips Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => provider.viewMyTrips(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryRust,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.flight_takeoff, color: Colors.white, size: 20),
                        const SizedBox(width: 8),
                        const Text(
                          'View My Trips',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Cancel TextButton
                TextButton(
                  onPressed: () => provider.cancel(context),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF3B82F6), // Blue text
                  ),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

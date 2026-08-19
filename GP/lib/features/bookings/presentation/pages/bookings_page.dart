import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/app/theme/colors.dart';
import 'package:gp/core/providers/settings_provider.dart';

import 'package:gp/core/providers/booking_provider.dart';
import 'package:gp/features/home/presentation/pages/notifications_page.dart';

class BookingsPage extends StatefulWidget {
  const BookingsPage({super.key});

  @override
  State<BookingsPage> createState() => _BookingsPageState();
}

class _BookingsPageState extends State<BookingsPage> {
  bool isUpcoming = true;

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    final bookingProvider = context.watch<BookingProvider>();
    final isDark = settings.themeMode == ThemeMode.dark;
    final isArabic = settings.locale.languageCode == 'ar';

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        elevation: 0,
        title: Text(
          isArabic ? 'حجوزاتي' : 'My Bookings',
          style: TextStyle(color: isDark ? Colors.white : Colors.black, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications_outlined, color: isDark ? Colors.white : Colors.black),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsPage()));
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 10),
            Text(
              isArabic ? 'خط سير الرحلة' : 'YOUR ITINERARY',
              style: const TextStyle(color: AppColors.primaryRust, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  isArabic ? 'الحجوزات' : 'Bookings',
                  style: TextStyle(color: isDark ? Colors.white : Colors.black, fontSize: 28, fontWeight: FontWeight.bold),
                ),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.surfaceLight : Colors.grey[200],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      _buildToggleButton(
                        isArabic ? 'القادمة' : 'Upcoming',
                        isUpcoming,
                        () => setState(() => isUpcoming = true),
                        isDark,
                      ),
                      _buildToggleButton(
                        isArabic ? 'السابقة' : 'Past',
                        !isUpcoming,
                        () => setState(() => isUpcoming = false),
                        isDark,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Expanded(
              child: isUpcoming 
                ? (bookingProvider.bookings.isEmpty 
                  ? _buildEmptyState(isArabic, isDark)
                  : ListView.builder(
                      itemCount: bookingProvider.bookings.length,
                      itemBuilder: (context, index) {
                        final booking = bookingProvider.bookings[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _buildBookingCard(
                            title: booking.title,
                            date: booking.date,
                            status: booking.status,
                            statusColor: booking.statusColor,
                            icon: booking.icon,
                            isDark: isDark,
                            currency: settings.currency,
                            price: booking.price,
                            bookingId: booking.bookingId,
                          ),
                        );
                      },
                    ))
                : _buildEmptyState(isArabic, isDark),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(bool isArabic, bool isDark) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.history, color: isDark ? AppColors.textSecondaryLight : Colors.grey[400], size: 48),
          const SizedBox(height: 16),
          Text(
            isArabic ? 'لا توجد حجوزات بعد' : 'No bookings yet',
            style: TextStyle(color: isDark ? AppColors.textSecondaryLight : Colors.grey[600], fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildToggleButton(String label, bool isSelected, VoidCallback onTap, bool isDark) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.accentBlue : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : (isDark ? AppColors.textSecondaryLight : Colors.grey[600]),
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildBookingCard({
    required String title,
    required String date,
    required String status,
    required Color statusColor,
    required IconData icon,
    required bool isDark,
    required String currency,
    required double price,
    bool showCheckIn = false,
    bool showDetails = false,
    bool showMore = false,
    String? bookingId,
    String? footerText,
  }) {
    String formattedPrice = '';
    if (currency == 'USD') {
      formattedPrice = '\$${price.toStringAsFixed(0)}';
    } else if (currency == 'JOD') {
      formattedPrice = '${(price * 0.71).toStringAsFixed(0)} JOD';
    } else if (currency == 'EUR') {
      formattedPrice = '€${(price * 0.92).toStringAsFixed(0)}';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardBgDark : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.borderLight : Colors.grey[300]!, width: 0.5),
        boxShadow: isDark ? [] : [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.blue.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: isDark ? Colors.white.withValues(alpha: 0.7) : Colors.blue, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(title, style: TextStyle(color: isDark ? Colors.white : Colors.black, fontSize: 16, fontWeight: FontWeight.bold)),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            border: Border.all(color: statusColor.withValues(alpha: 0.5)),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(status, style: TextStyle(color: statusColor, fontSize: 8, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.calendar_today, color: isDark ? AppColors.textSecondaryLight : Colors.grey[600], size: 12),
                            const SizedBox(width: 4),
                            Text(date, style: TextStyle(color: isDark ? AppColors.textSecondaryLight : Colors.grey[600], fontSize: 12)),
                          ],
                        ),
                        Text(
                          formattedPrice,
                          style: TextStyle(color: isDark ? AppColors.primaryRust : Colors.blue, fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (bookingId != null || showCheckIn || showDetails) ...[
            const SizedBox(height: 16),
            Divider(color: isDark ? AppColors.borderLight : Colors.grey[200], height: 1),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (bookingId != null)
                  Text('Booking ID: $bookingId', style: TextStyle(color: isDark ? AppColors.textSecondaryLight : Colors.grey[600], fontSize: 12))
                else if (showCheckIn)
                   const Row(
                    children: [
                      CircleAvatar(radius: 10, backgroundImage: NetworkImage('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop')),
                      SizedBox(width: -4),
                      CircleAvatar(radius: 10, backgroundImage: NetworkImage('https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop')),
                    ],
                  )
                else
                  const SizedBox(),

              ],
            ),
          ],
          if (footerText != null) ...[
            const SizedBox(height: 16),
            Divider(color: isDark ? AppColors.borderLight : Colors.grey[200], height: 1),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(footerText, style: TextStyle(color: isDark ? AppColors.textSecondaryLight : Colors.grey[600], fontSize: 12)),
                if (showMore) Icon(Icons.more_vert, color: isDark ? AppColors.textSecondaryLight : Colors.grey[400], size: 20),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

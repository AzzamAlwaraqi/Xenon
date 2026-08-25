import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/providers/settings_provider.dart';
import 'package:gp/providers/booking_provider.dart';
import 'package:gp/widgets/booking_card.dart';
import 'package:gp/widgets/empty_state.dart';
import 'package:gp/widgets/section_header.dart';
import 'package:gp/widgets/app_nav_bar.dart';
import 'package:gp/screens/destination_details_page.dart' as gp_dest_details;
import 'package:gp/screens/add_review_dialog.dart';

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
      appBar: AppNavBar(title: isArabic ? 'حجوزاتي' : 'My Bookings', isDark: isDark),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 10),
            SectionHeader(
              label: isArabic ? 'خط سير الرحلة' : 'YOUR ITINERARY',
              title: isArabic ? 'الحجوزات' : 'Bookings',
              isDark: isDark,
              trailing: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceLight : Colors.grey[200],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    _buildToggleButton(isArabic ? 'القادمة' : 'Upcoming', isUpcoming, () => setState(() => isUpcoming = true), isDark),
                    _buildToggleButton(isArabic ? 'السابقة' : 'Past', !isUpcoming, () => setState(() => isUpcoming = false), isDark),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: Builder(
                builder: (context) {
                  final list = isUpcoming ? bookingProvider.bookings : bookingProvider.historyBookings;
                  if (list.isEmpty) {
                    return EmptyState(
                      icon: Icons.history, 
                      message: isUpcoming 
                        ? (isArabic ? 'لا توجد حجوزات بعد' : 'No upcoming bookings')
                        : (isArabic ? 'لا توجد حجوزات سابقة' : 'No past bookings'), 
                      isDark: isDark
                    );
                  }
                  return ListView.builder(
                    itemCount: list.length,
                    itemBuilder: (context, index) {
                      final booking = list[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: BookingCard(
                          title: booking.title,
                          date: booking.date,
                          status: booking.status,
                          statusColor: booking.statusColor,
                          icon: booking.icon,
                          isDark: isDark,
                          currency: settings.currency,
                          price: booking.price,
                          bookingId: booking.id,
                          onViewDetails: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => gp_dest_details.DestinationDetailsPage(
                                  destination: {
                                    'title': booking.title,
                                    'price': '\$${booking.price}',
                                  },
                                ),
                              ),
                            );
                          },
                          onReview: (booking.status == 'completed' && !isUpcoming) ? () async {
                            final packageId = booking.package?['_id'] ?? '';
                            final vendorId = booking.vendor?['_id'] ?? booking.package?['vendor'] ?? '';
                            if (packageId.isEmpty || vendorId.isEmpty) {
                               ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Missing package data for review')));
                               return;
                            }
                            // Show review dialog
                            await showDialog<bool>(
                              context: context,
                              builder: (context) => AddReviewDialog(
                                packageId: packageId,
                                vendorId: vendorId,
                                bookingId: booking.id,
                              ),
                            );
                          } : null,
                        ),
                      );
                    },
                  );
                }
              )
            ),
          ],
        ),
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
}

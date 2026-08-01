import 'package:flutter/material.dart';
import 'package:gp/app/theme/colors.dart';

class BookingsPage extends StatefulWidget {
  const BookingsPage({super.key});

  @override
  State<BookingsPage> createState() => _BookingsPageState();
}

class _BookingsPageState extends State<BookingsPage> {
  bool isUpcoming = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('Hello, Voyager', style: TextStyle(color: Colors.white, fontSize: 18)),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_outlined, color: Colors.white), onPressed: () {}),
          const SizedBox(width: 8),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 10),
            const Text('YOUR ITINERARY', style: TextStyle(color: AppColors.accentGreen, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Bookings', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      _buildToggleButton('Upcoming', isUpcoming, () => setState(() => isUpcoming = true)),
                      _buildToggleButton('Past', !isUpcoming, () => setState(() => isUpcoming = false)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Expanded(
              child: isUpcoming 
                ? ListView(
                  children: [
                    _buildBookingCard(
                      title: 'Tokyo Neo-Expedition',
                      date: 'Oct 14 - Oct 21, 2024',
                      status: 'CONFIRMED',
                      statusColor: AppColors.accentGreen,
                      icon: Icons.airplanemode_active,
                      showCheckIn: true,
                    ),
                    const SizedBox(height: 16),
                    _buildBookingCard(
                      title: 'Mars-Orbit Transit Hub',
                      date: 'Dec 02 - Dec 05, 2024',
                      status: 'PENDING',
                      statusColor: Colors.amber,
                      icon: Icons.hotel,
                      bookingId: '#BK-9902',
                      showDetails: true,
                    ),
                    const SizedBox(height: 16),
                    _buildBookingCard(
                      title: 'Icelandic Ring Road',
                      date: 'Jan 15 - Jan 25, 2025',
                      status: 'CONFIRMED',
                      statusColor: AppColors.accentGreen,
                      icon: Icons.directions_car,
                      footerText: 'Awaiting car model confirmation',
                      showMore: true,
                    ),
                  ],
                )
                : Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.history, color: AppColors.textMuted, size: 48),
                        const SizedBox(height: 16),
                        const Text(
                          'No past bookings yet',
                          style: TextStyle(color: AppColors.textMuted, fontSize: 16),
                        ),
                      ],
                    ),
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildToggleButton(String label, bool isSelected, VoidCallback onTap) {
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
            color: isSelected ? Colors.white : AppColors.textMuted,
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
    bool showCheckIn = false,
    bool showDetails = false,
    bool showMore = false,
    String? bookingId,
    String? footerText,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: Colors.white.withValues(alpha: 0.7), size: 24),
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
                          child: Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
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
                      children: [
                        const Icon(Icons.calendar_today, color: AppColors.textMuted, size: 12),
                        const SizedBox(width: 4),
                        Text(date, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (bookingId != null || showCheckIn || showDetails) ...[
            const SizedBox(height: 16),
            const Divider(color: AppColors.border, height: 1),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (bookingId != null)
                  Text('Booking ID: $bookingId', style: const TextStyle(color: AppColors.textMuted, fontSize: 12))
                else if (showCheckIn)
                   const Row(
                    children: [
                      CircleAvatar(radius: 10, backgroundImage: NetworkImage('https://i.pravatar.cc/100?u=1')),
                      SizedBox(width: -4),
                      CircleAvatar(radius: 10, backgroundImage: NetworkImage('https://i.pravatar.cc/100?u=2')),
                    ],
                  )
                else
                  const SizedBox(),
                
                if (showCheckIn)
                  ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.qr_code, size: 16),
                    label: const Text('CHECK-IN'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accentBlue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      textStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  )
                else if (showDetails)
                  OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppColors.border),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      textStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('VIEW DETAILS'),
                  ),
              ],
            ),
          ],
          if (footerText != null) ...[
            const SizedBox(height: 16),
            const Divider(color: AppColors.border, height: 1),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(footerText, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                if (showMore) const Icon(Icons.more_vert, color: AppColors.textMuted, size: 20),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () {},
            child: const Text('Mark all read', style: TextStyle(color: AppColors.primaryBrown, fontSize: 13)),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: const [
          _NotifSection(label: 'TODAY'),
          SizedBox(height: 8),
          _NotifTile(
            icon: Icons.check_circle_outline,
            iconColor: AppColors.successGreen,
            title: 'Booking Confirmed!',
            body: 'Your Petra Treasury tour on Sep 14 is confirmed. Reference: #AHL-2026-001.',
            time: '2h ago',
            isUnread: true,
          ),
          _NotifTile(
            icon: Icons.credit_card_outlined,
            iconColor: AppColors.primaryBrown,
            title: 'Payment Received',
            body: 'JOD 240 payment for Petra Treasury tour was processed successfully.',
            time: '2h ago',
            isUnread: true,
          ),
          SizedBox(height: 20),
          _NotifSection(label: 'EARLIER'),
          SizedBox(height: 8),
          _NotifTile(
            icon: Icons.star_outline,
            iconColor: Colors.amber,
            title: 'How was your trip?',
            body: 'You recently completed the Dead Sea experience. Share your review!',
            time: '3 days ago',
            isUnread: false,
          ),
          _NotifTile(
            icon: Icons.local_offer_outlined,
            iconColor: AppColors.accentPink,
            title: 'Special Offer 🎉',
            body: 'Get 15% off your next Wadi Rum booking this weekend only.',
            time: '5 days ago',
            isUnread: false,
          ),
          _NotifTile(
            icon: Icons.calendar_today_outlined,
            iconColor: AppColors.primaryBrown,
            title: 'Trip Reminder',
            body: 'Your Dead Sea Float & Spa experience is tomorrow. Don\'t forget!',
            time: '1 month ago',
            isUnread: false,
          ),
        ],
      ),
    );
  }
}

class _NotifSection extends StatelessWidget {
  final String label;
  const _NotifSection({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(color: AppColors.greyText, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1),
    );
  }
}

class _NotifTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String body;
  final String time;
  final bool isUnread;

  const _NotifTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.body,
    required this.time,
    required this.isUnread,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isUnread ? AppColors.primaryPink.withValues(alpha: 0.4) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isUnread ? AppColors.accentPink.withValues(alpha: 0.3) : AppColors.divider,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14))),
                    if (isUnread)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(color: AppColors.primaryBrown, shape: BoxShape.circle),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(body, style: const TextStyle(color: AppColors.greyText, fontSize: 13, height: 1.4)),
                const SizedBox(height: 6),
                Text(time, style: const TextStyle(color: AppColors.greyText, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

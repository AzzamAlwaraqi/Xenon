import 'package:flutter/material.dart';
import 'package:gp/theme/colors.dart';

/// Reusable booking card extracted from bookings_page.dart.
class BookingCard extends StatelessWidget {
  final String title;
  final String date;
  final String status;
  final Color statusColor;
  final IconData icon;
  final bool isDark;
  final String currency;
  final double price;
  final String? bookingId;
  final String? footerText;
  final bool showCheckIn;
  final bool showMore;
  final VoidCallback? onViewDetails;
  final VoidCallback? onReview;
  final VoidCallback? onCancel;

  const BookingCard({
    super.key,
    required this.title,
    required this.date,
    required this.status,
    required this.statusColor,
    required this.icon,
    required this.isDark,
    required this.currency,
    required this.price,
    this.bookingId,
    this.footerText,
    this.showCheckIn = false,
    this.showMore = false,
    this.onViewDetails,
    this.onReview,
    this.onCancel,
  });

  String get _formattedPrice {
    if (currency == 'USD') return '\$${price.toStringAsFixed(0)}';
    if (currency == 'JOD') return '${(price * 0.71).toStringAsFixed(0)} JOD';
    if (currency == 'EUR') return '€${(price * 0.92).toStringAsFixed(0)}';
    return '\$${price.toStringAsFixed(0)}';
  }

  String get _formattedDate {
    try {
      final DateTime parsed = DateTime.parse(date);
      return '${parsed.year}-${parsed.month.toString().padLeft(2, '0')}-${parsed.day.toString().padLeft(2, '0')}';
    } catch (_) {
      return date.length > 10 ? date.substring(0, 10) : date;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardBgDark : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.borderLight : Colors.grey[300]!, width: 0.5),
        boxShadow: isDark
            ? []
            : [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          // Main row: icon + info
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
                    // Title + status badge
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: TextStyle(
                              color: isDark ? Colors.white : Colors.black,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            border: Border.all(color: statusColor.withValues(alpha: 0.5)),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            status,
                            style: TextStyle(color: statusColor, fontSize: 8, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    // Date + price
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Icon(Icons.calendar_today,
                                color: isDark ? AppColors.textSecondaryLight : Colors.grey[600], size: 12),
                            const SizedBox(width: 4),
                            Text(_formattedDate,
                                style: TextStyle(
                                    color: isDark ? AppColors.textSecondaryLight : Colors.grey[600], fontSize: 12)),
                          ],
                        ),
                        Text(
                          _formattedPrice,
                          style: TextStyle(
                            color: isDark ? AppColors.primaryRust : Colors.blue,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Booking ID / check-in section
          if (bookingId != null || showCheckIn) ...[
            const SizedBox(height: 16),
            Divider(color: isDark ? AppColors.borderLight : Colors.grey[200], height: 1),
            const SizedBox(height: 16),
            Row(
              children: [
                if (bookingId != null)
                  Expanded(
                    child: Text(
                      'Booking ID: $bookingId',
                      style: TextStyle(
                          color: isDark ? AppColors.textSecondaryLight : Colors.grey[600], fontSize: 12),
                      overflow: TextOverflow.ellipsis,
                    ),
                  )
                else if (showCheckIn)
                  const Row(
                    children: [
                      CircleAvatar(
                          radius: 10,
                          backgroundImage: NetworkImage(
                              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop')),
                      SizedBox(width: -4),
                      CircleAvatar(
                          radius: 10,
                          backgroundImage: NetworkImage(
                              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop')),
                    ],
                  ),
              ],
            ),
          ],

          // Footer text section
          if (footerText != null) ...[
            const SizedBox(height: 16),
            Divider(color: isDark ? AppColors.borderLight : Colors.grey[200], height: 1),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(footerText!,
                    style: TextStyle(
                        color: isDark ? AppColors.textSecondaryLight : Colors.grey[600], fontSize: 12)),
                if (showMore)
                  Icon(Icons.more_vert,
                      color: isDark ? AppColors.textSecondaryLight : Colors.grey[400], size: 20),
              ],
            ),
          ],

          if (onViewDetails != null || onReview != null || onCancel != null) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                if (onCancel != null)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: onCancel,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red,
                        side: const BorderSide(color: Colors.red),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                if (onCancel != null && onViewDetails != null) const SizedBox(width: 8),
                if (onViewDetails != null)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: onViewDetails,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primaryRust,
                        side: const BorderSide(color: AppColors.primaryRust),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text('Details', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                if ((onViewDetails != null || onCancel != null) && onReview != null)
                  const SizedBox(width: 8),
                if (onReview != null)
                  Expanded(
                    child: ElevatedButton(
                      onPressed: onReview,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.amber,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        elevation: 0,
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.star, size: 16),
                          SizedBox(width: 4),
                          Text('Review', style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

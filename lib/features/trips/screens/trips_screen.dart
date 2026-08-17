import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/navigation/app_routes.dart';

class TripsScreen extends StatelessWidget {
  const TripsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('My Bookings'),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(52),
            child: Container(
              margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.divider),
              ),
              child: TabBar(
                labelColor: Colors.white,
                unselectedLabelColor: AppColors.greyText,
                indicator: BoxDecoration(
                  color: AppColors.primaryBrown,
                  borderRadius: BorderRadius.circular(12),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                tabs: const [
                  Tab(text: 'Upcoming'),
                  Tab(text: 'Completed'),
                ],
              ),
            ),
          ),
        ),
        body: const TabBarView(children: [_UpcomingTab(), _CompletedTab()]),
      ),
    );
  }
}

// â”€â”€â”€ DATA MODEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _BookingData {
  final String imageUrl;
  final String title;
  final String location;
  final String dateRange;
  final String guests;
  final double costAmount;
  final String currency;
  final String bookingRef;
  final _BookingStatus status;
  final int? rating;

  const _BookingData({
    required this.imageUrl,
    required this.title,
    required this.location,
    required this.dateRange,
    required this.guests,
    required this.costAmount,
    required this.currency,
    required this.bookingRef,
    required this.status,
    this.rating,
  });

  String get formattedCost => '$currency ${costAmount.toStringAsFixed(0)}';
}

enum _BookingStatus { upcoming, confirmed, completed }

// â”€â”€â”€ SAMPLE DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const _upcomingBookings = [
  _BookingData(
    imageUrl:
        'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&q=80',
    title: 'The Treasury at Petra',
    location: "Ma'an Governorate, Jordan",
    dateRange: 'Sep 14 â€“ Sep 15, 2026',
    guests: '2 Adults',
    costAmount: 240,
    currency: 'JOD',
    bookingRef: '#AHL-2026-001',
    status: _BookingStatus.upcoming,
  ),
  _BookingData(
    imageUrl:
        'https://images.unsplash.com/photo-1542156822-6924d1a71ace?w=600&q=80',
    title: 'Wadi Rum Jeep Safari',
    location: 'Aqaba Governorate, Jordan',
    dateRange: 'Oct 3, 2026',
    guests: '2 Adults Â· 1 Child',
    costAmount: 195,
    currency: 'JOD',
    bookingRef: '#AHL-2026-002',
    status: _BookingStatus.confirmed,
  ),
];

const _completedBookings = [
  _BookingData(
    imageUrl:
        'https://images.unsplash.com/photo-1547234935-80c7145ec969?w=600&q=80',
    title: 'Dead Sea Float & Spa',
    location: 'Balqa Governorate, Jordan',
    dateRange: 'Jul 22, 2026',
    guests: '2 Adults',
    costAmount: 190,
    currency: 'JOD',
    bookingRef: '#AHL-2026-000',
    status: _BookingStatus.completed,
    rating: 4,
  ),
  _BookingData(
    imageUrl:
        'https://images.unsplash.com/photo-1597766490107-34dfbaabc44e?w=600&q=80',
    title: 'Jerash Ruins Evening Tour',
    location: 'Jerash, Jordan',
    dateRange: 'Jun 10, 2026',
    guests: '1 Adult',
    costAmount: 55,
    currency: 'JOD',
    bookingRef: '#AHL-2026-000B',
    status: _BookingStatus.completed,
    rating: 5,
  ),
  _BookingData(
    imageUrl:
        'https://images.unsplash.com/photo-1549989476-69a92fa57c36?w=600&q=80',
    title: 'Aqaba Snorkeling Adventure',
    location: 'Aqaba, Jordan',
    dateRange: 'May 4, 2026',
    guests: '2 Adults',
    costAmount: 120,
    currency: 'JOD',
    bookingRef: '#AHL-2026-000C',
    status: _BookingStatus.completed,
    rating: 5,
  ),
];

// â”€â”€â”€ UPCOMING TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _UpcomingTab extends StatelessWidget {
  const _UpcomingTab();

  @override
  Widget build(BuildContext context) {
    final total = _upcomingBookings.fold<double>(0, (s, b) => s + b.costAmount);

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      children: [
        _SummaryCard(
          label: 'Total Upcoming',
          count: _upcomingBookings.length,
          totalCost: 'JOD ${total.toStringAsFixed(0)}',
          icon: Icons.luggage_outlined,
          gradientColors: [AppColors.primaryBrown, AppColors.accentPink],
        ),
        const SizedBox(height: 20),
        ..._upcomingBookings.map(
          (b) => Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _BookingCard(
              data: b,
              onTap: () => context.push(AppRoutes.bookingDetail),
            ),
          ),
        ),
      ],
    );
  }
}

// â”€â”€â”€ COMPLETED TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _CompletedTab extends StatelessWidget {
  const _CompletedTab();

  @override
  Widget build(BuildContext context) {
    final total = _completedBookings.fold<double>(
      0,
      (s, b) => s + b.costAmount,
    );

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      children: [
        _SummaryCard(
          label: 'Total Spent',
          count: _completedBookings.length,
          totalCost: 'JOD ${total.toStringAsFixed(0)}',
          icon: Icons.check_circle_outline,
          gradientColors: [const Color(0xFF2D6A4F), const Color(0xFF52B788)],
        ),
        const SizedBox(height: 20),
        ..._completedBookings.map(
          (b) => Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _BookingCard(
              data: b,
              onTap: () => context.push(AppRoutes.bookingDetail),
            ),
          ),
        ),
      ],
    );
  }
}

// â”€â”€â”€ SUMMARY CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _SummaryCard extends StatelessWidget {
  final String label;
  final int count;
  final String totalCost;
  final IconData icon;
  final List<Color> gradientColors;

  const _SummaryCard({
    required this.label,
    required this.count,
    required this.totalCost,
    required this.icon,
    required this.gradientColors,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: gradientColors.first.withValues(alpha: 0.35),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  totalCost,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$count ${count == 1 ? 'booking' : 'bookings'}',
                  style: const TextStyle(color: Colors.white60, fontSize: 13),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Colors.white24,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 28),
          ),
        ],
      ),
    );
  }
}

// â”€â”€â”€ BOOKING CARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _BookingCard extends StatelessWidget {
  final _BookingData data;
  final VoidCallback onTap;

  const _BookingCard({required this.data, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final (statusLabel, statusColor) = switch (data.status) {
      _BookingStatus.upcoming => ('Upcoming', const Color(0xFF0086C9)),
      _BookingStatus.confirmed => ('Confirmed', AppColors.successGreen),
      _BookingStatus.completed => ('Completed', AppColors.greyText),
    };

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.divider),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // â”€â”€ Hero image + overlaid badges â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(20),
                  ),
                  child: Image.network(
                    data.imageUrl,
                    height: 150,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    frameBuilder: (context, child, frame, wasSync) {
                      if (wasSync) return child;
                      return AnimatedOpacity(
                        opacity: frame == null ? 0 : 1,
                        duration: const Duration(milliseconds: 300),
                        child: child,
                      );
                    },
                    errorBuilder: (context, error, stackTrace) => Container(
                      height: 150,
                      color: AppColors.divider,
                      child: const Center(
                        child: Icon(
                          Icons.image_not_supported_outlined,
                          color: AppColors.greyText,
                          size: 36,
                        ),
                      ),
                    ),
                  ),
                ),
                // Status badge â€” top left
                Positioned(
                  top: 12,
                  left: 12,
                  child: _Badge(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          decoration: BoxDecoration(
                            color: statusColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          statusLabel,
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Star rating â€” top right (completed only)
                if (data.status == _BookingStatus.completed &&
                    data.rating != null)
                  Positioned(
                    top: 12,
                    right: 12,
                    child: _Badge(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: List.generate(
                          data.rating!,
                          (_) => const Icon(
                            Icons.star_rounded,
                            color: Colors.amber,
                            size: 13,
                          ),
                        ),
                      ),
                    ),
                  ),
                // Cost pill â€” bottom right
                Positioned(
                  bottom: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primaryBrown,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      data.formattedCost,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // â”€â”€ Text content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    data.title,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.location_on_outlined,
                        size: 13,
                        color: AppColors.greyText,
                      ),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          data.location,
                          style: const TextStyle(
                            color: AppColors.greyText,
                            fontSize: 12,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  // Date row
                  _InfoChip(
                    icon: Icons.calendar_month_outlined,
                    label: data.dateRange,
                    flex: true,
                  ),
                  const SizedBox(height: 8),
                  // Guests + cost row
                  Row(
                    children: [
                      _InfoChip(
                        icon: Icons.people_outline,
                        label: data.guests,
                        flex: true,
                      ),
                      const SizedBox(width: 8),
                      _InfoChip(
                        icon: Icons.payments_outlined,
                        label: data.formattedCost,
                      ),
                    ],
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Divider(color: AppColors.divider, height: 1),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        data.bookingRef,
                        style: const TextStyle(
                          color: AppColors.greyText,
                          fontSize: 11,
                        ),
                      ),
                      const Row(
                        children: [
                          Text(
                            'View details',
                            style: TextStyle(
                              color: AppColors.primaryBrown,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          Icon(
                            Icons.chevron_right,
                            color: AppColors.primaryBrown,
                            size: 16,
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class _Badge extends StatelessWidget {
  final Widget child;
  const _Badge({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 6),
        ],
      ),
      child: child,
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool flex;

  const _InfoChip({required this.icon, required this.label, this.flex = false});

  @override
  Widget build(BuildContext context) {
    final chip = Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: AppColors.greyText),
          const SizedBox(width: 5),
          Flexible(
            child: Text(
              label,
              style: const TextStyle(color: AppColors.greyText, fontSize: 11),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
    return flex ? Expanded(child: chip) : chip;
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/navigation/app_routes.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // ── App Bar ──────────────────────────────────────────────────
          SliverAppBar(
            floating: true,
            backgroundColor: AppColors.background,
            title: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Ahlan, Sarah 👋',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                Text(
                  'Where to next?',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_none_outlined),
                onPressed: () => context.push(AppRoutes.notifications),
              ),
              const SizedBox(width: 8),
            ],
          ),

          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Search Bar ──────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.divider),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.search, color: AppColors.greyText),
                        SizedBox(width: 12),
                        Text('Search destinations, experiences...', style: TextStyle(color: AppColors.greyText)),
                      ],
                    ),
                  ),
                ),

                // ── Category Chips ──────────────────────────────────
                const SizedBox(height: 24),
                Padding(
                  padding: const EdgeInsets.only(left: 20),
                  child: Text('Categories', style: Theme.of(context).textTheme.titleMedium),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 44,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    children: const [
                      _CategoryChip(label: '🏛️ Historical', isSelected: true),
                      _CategoryChip(label: '🏜️ Desert'),
                      _CategoryChip(label: '🌿 Nature'),
                      _CategoryChip(label: '🍽️ Culinary'),
                      _CategoryChip(label: '🤿 Adventure'),
                      _CategoryChip(label: '🕌 Cultural'),
                    ],
                  ),
                ),

                // ── Featured Experience ─────────────────────────────
                const SizedBox(height: 28),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Featured Experience', style: Theme.of(context).textTheme.titleMedium),
                      TextButton(
                        onPressed: () {},
                        child: const Text('See all', style: TextStyle(color: AppColors.primaryBrown)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: _FeaturedCard(
                    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e',
                    tag: 'HISTORICAL SITE',
                    title: 'The Treasury at Petra',
                    location: 'Ma\'an, Jordan',
                    rating: '4.9',
                    price: 'JOD 120',
                    duration: '2 Days',
                    onTap: () => context.push(AppRoutes.bookingDetail),
                  ),
                ),

                // ── Discover Nearby ────────────────────────────────
                const SizedBox(height: 28),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Discover More', style: Theme.of(context).textTheme.titleMedium),
                      TextButton(
                        onPressed: () {},
                        child: const Text('See all', style: TextStyle(color: AppColors.primaryBrown)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 240,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    children: [
                      _DestinationCard(
                        imageUrl: 'https://images.unsplash.com/photo-1542156822-6924d1a71ace',
                        title: 'Wadi Rum Desert',
                        location: 'Aqaba, Jordan',
                        rating: '4.8',
                        price: 'JOD 85',
                        onTap: () => context.push(AppRoutes.bookingDetail),
                      ),
                      const SizedBox(width: 16),
                      _DestinationCard(
                        imageUrl: 'https://images.unsplash.com/photo-1547234935-80c7145ec969',
                        title: 'Dead Sea Experience',
                        location: 'Balqa, Jordan',
                        rating: '4.7',
                        price: 'JOD 65',
                        onTap: () => context.push(AppRoutes.bookingDetail),
                      ),
                      const SizedBox(width: 16),
                      _DestinationCard(
                        imageUrl: 'https://images.unsplash.com/photo-1597766490107-34dfbaabc44e',
                        title: 'Jerash Ruins',
                        location: 'Jerash, Jordan',
                        rating: '4.6',
                        price: 'JOD 40',
                        onTap: () => context.push(AppRoutes.bookingDetail),
                      ),
                    ],
                  ),
                ),

                // ── Trending Experiences ───────────────────────────
                const SizedBox(height: 28),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Text('Trending This Month', style: Theme.of(context).textTheme.titleMedium),
                ),
                const SizedBox(height: 12),
                _TrendingCard(
                  imageUrl: 'https://images.unsplash.com/photo-1547234935-80c7145ec969',
                  number: '01',
                  title: 'Dead Sea Float & Spa',
                  subtitle: 'Full day • Lunch included • Transport',
                  price: 'JOD 95',
                  onTap: () => context.push(AppRoutes.bookingDetail),
                ),
                _TrendingCard(
                  imageUrl: 'https://images.unsplash.com/photo-1597766490107-34dfbaabc44e',
                  number: '02',
                  title: 'Jerash by Night Tour',
                  subtitle: 'Evening • Guided • 3 Hours',
                  price: 'JOD 55',
                  onTap: () => context.push(AppRoutes.bookingDetail),
                ),
                _TrendingCard(
                  imageUrl: 'https://images.unsplash.com/photo-1542156822-6924d1a71ace',
                  number: '03',
                  title: 'Wadi Rum Jeep Safari',
                  subtitle: 'Full day • Camp dinner • Stargazing',
                  price: 'JOD 130',
                  onTap: () => context.push(AppRoutes.bookingDetail),
                ),

                const SizedBox(height: 32),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Private Widgets ────────────────────────────────────────────────────────────

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool isSelected;

  const _CategoryChip({required this.label, this.isSelected = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.primaryBrown : Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isSelected ? AppColors.primaryBrown : AppColors.divider,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : AppColors.greyText,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 13,
        ),
      ),
    );
  }
}

class _FeaturedCard extends StatelessWidget {
  final String imageUrl;
  final String tag;
  final String title;
  final String location;
  final String rating;
  final String price;
  final String duration;
  final VoidCallback onTap;

  const _FeaturedCard({
    required this.imageUrl,
    required this.tag,
    required this.title,
    required this.location,
    required this.rating,
    required this.price,
    required this.duration,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 280,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          image: DecorationImage(
            image: NetworkImage(imageUrl),
            fit: BoxFit.cover,
          ),
        ),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.transparent,
                Colors.black.withValues(alpha: 0.75),
              ],
            ),
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.accentPink.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(tag, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 8),
              Text(title, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Row(
                children: [
                  const Icon(Icons.location_on, color: Colors.white70, size: 14),
                  Text(' $location  ', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                  const Icon(Icons.access_time, color: Colors.white70, size: 14),
                  Text(' $duration', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.star, color: Colors.amber, size: 16),
                      Text(' $rating', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.primaryBrown,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'From $price',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _DestinationCard extends StatelessWidget {
  final String imageUrl;
  final String title;
  final String location;
  final String rating;
  final String price;
  final VoidCallback onTap;

  const _DestinationCard({
    required this.imageUrl,
    required this.title,
    required this.location,
    required this.rating,
    required this.price,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 180,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.divider),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              child: Image.network(imageUrl, height: 130, width: 180, fit: BoxFit.cover),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 12, color: AppColors.greyText),
                      Expanded(child: Text(' $location', style: const TextStyle(color: AppColors.greyText, fontSize: 12), overflow: TextOverflow.ellipsis)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(children: [
                        const Icon(Icons.star, color: Colors.amber, size: 14),
                        Text(' $rating', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ]),
                      Text(price, style: const TextStyle(color: AppColors.primaryBrown, fontWeight: FontWeight.bold, fontSize: 13)),
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

class _TrendingCard extends StatelessWidget {
  final String imageUrl;
  final String number;
  final String title;
  final String subtitle;
  final String price;
  final VoidCallback onTap;

  const _TrendingCard({
    required this.imageUrl,
    required this.number,
    required this.title,
    required this.subtitle,
    required this.price,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.divider),
          ),
          child: Row(
            children: [
              Text(number, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppColors.divider)),
              const SizedBox(width: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.network(imageUrl, width: 72, height: 72, fit: BoxFit.cover),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 4),
                    Text(subtitle, style: const TextStyle(color: AppColors.greyText, fontSize: 12)),
                    const SizedBox(height: 6),
                    Text(price, style: const TextStyle(color: AppColors.primaryBrown, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.greyText),
            ],
          ),
        ),
      ),
    );
  }
}

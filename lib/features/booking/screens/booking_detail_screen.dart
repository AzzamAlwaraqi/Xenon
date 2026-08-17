import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ahlan_widgets.dart';
import '../../../core/navigation/app_routes.dart';

class BookingDetailScreen extends StatelessWidget {
  const BookingDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 400,
            pinned: true,
            leading: const Padding(
              padding: EdgeInsets.all(8.0),
              child: CircleAvatar(
                backgroundColor: Colors.white,
                child: BackButton(color: Colors.black),
              ),
            ),
            actions: const [
              Padding(
                padding: EdgeInsets.all(8.0),
                child: CircleAvatar(
                  backgroundColor: Colors.white,
                  child: Icon(Icons.favorite_border, color: Colors.black),
                ),
              ),
              Padding(
                padding: EdgeInsets.all(8.0),
                child: CircleAvatar(
                  backgroundColor: Colors.white,
                  child: Icon(Icons.share_outlined, color: Colors.black),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Image.network(
                'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e',
                fit: BoxFit.cover,
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.accentPink.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('HISTORICAL SITE', style: TextStyle(color: AppColors.primaryBrown, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('The Treasury at Petra', style: Theme.of(context).textTheme.headlineMedium),
                      const Row(
                        children: [
                          Icon(Icons.star, color: Colors.amber, size: 20),
                          Text(' 4.9 (1.2k Reviews)', style: TextStyle(fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Row(
                    children: [
                      Icon(Icons.location_on_outlined, size: 16, color: AppColors.greyText),
                      Text(' Ma\'an Governorate, Jordan  ', style: TextStyle(color: AppColors.greyText)),
                      Icon(Icons.access_time, size: 16, color: AppColors.greyText),
                      Text(' 2 Days', style: TextStyle(color: AppColors.greyText)),
                    ],
                  ),
                  const SizedBox(height: 32),
                  const DefaultTabController(
                    length: 3,
                    child: Column(
                      children: [
                        TabBar(
                          labelColor: AppColors.primaryBrown,
                          unselectedLabelColor: AppColors.greyText,
                          indicatorColor: AppColors.primaryBrown,
                          tabs: [
                            Tab(text: 'ITINERARY'),
                            Tab(text: 'INCLUDED'),
                            Tab(text: 'REVIEWS'),
                          ],
                        ),
                        SizedBox(height: 24),
                      ],
                    ),
                  ),
                  Text('About this experience', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  const Text(
                    'Journey through the narrow gorge of the Siq to reveal the magnificent Treasury (Al-Khazneh), Petra\'s most famous monument....',
                    style: TextStyle(color: AppColors.greyText, height: 1.5),
                  ),
                  TextButton(onPressed: () {}, child: const Text('Read more', style: TextStyle(color: AppColors.primaryBrown))),
                  const SizedBox(height: 24),
                  Text('Itinerary Overview', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 24),
                  _itineraryItem(context, 'Day 1: The Siq and The Treasury', 'Begin your journey walking through the 1.2km Siq, culminating in the dramatic reveal of Al-Khazneh.'),
                  const SizedBox(height: 32),
                  AhlanButton(
                    text: 'Book Now',
                    onPressed: () => context.push(AppRoutes.payment),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _itineraryItem(BuildContext context, String title, String desc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Column(
          children: [
            Icon(Icons.radio_button_checked, color: AppColors.primaryBrown),
            SizedBox(child: SizedBox(width: 2, height: 100, child: ColoredBox(color: AppColors.divider))),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 8),
              Text(desc, style: const TextStyle(color: AppColors.greyText)),
              const SizedBox(height: 16),
              Row(
                children: [
                  _imgBox('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e'),
                  const SizedBox(width: 12),
                  _imgBox('https://images.unsplash.com/photo-1542156822-6924d1a71ace'),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _imgBox(String url) {
    return Container(
      width: 120,
      height: 80,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        image: DecorationImage(image: NetworkImage(url), fit: BoxFit.cover),
      ),
    );
  }
}

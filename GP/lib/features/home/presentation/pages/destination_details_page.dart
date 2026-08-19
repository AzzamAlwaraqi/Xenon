import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/app/theme/colors.dart';
import 'package:gp/features/bookings/presentation/pages/checkout_page.dart';
import 'package:gp/features/home/presentation/providers/destination_details_provider.dart';

class DestinationDetailsPage extends StatelessWidget {
  final Map<String, dynamic>? destination;

  const DestinationDetailsPage({super.key, this.destination});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => DestinationDetailsProvider(),
      child: _DestinationDetailsPageContent(destination: destination),
    );
  }
}

class _DestinationDetailsPageContent extends StatelessWidget {
  final Map<String, dynamic>? destination;
  
  const _DestinationDetailsPageContent({this.destination});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DestinationDetailsProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    // Use fallback data if destination is null
    final String title = destination?['title'] ?? 'The Treasury at Petra';
    final String imageUrl = destination?['imageUrl'] ?? 'https://images.unsplash.com/photo-1547234935-80c7145ec969?q=80&w=1000&auto=format&fit=crop';
    
    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      body: CustomScrollView(
        slivers: [
          // Header Image with Back Button & Actions
          SliverAppBar(
            expandedHeight: 350.0,
            pinned: true,
            backgroundColor: AppColors.backgroundDark,
            leading: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.8),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: Colors.black),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),
            actions: [
              Container(
                margin: const EdgeInsets.all(8.0),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.8),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: Icon(
                    provider.isSaved ? Icons.favorite : Icons.favorite_border,
                    color: provider.isSaved ? Colors.red : Colors.black,
                  ),
                  onPressed: () => provider.toggleSaved(),
                ),
              ),

            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                  ),
                  // Dark gradient overlay
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.8),
                        ],
                        stops: const [0.5, 1.0],
                      ),
                    ),
                  ),
                  // Title and Info overlay
                  Positioned(
                    bottom: 40,
                    left: 24,
                    right: 24,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primaryRust,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Text(
                                'HISTORICAL SITE',
                                style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.star, color: Colors.amber, size: 14),
                            const SizedBox(width: 4),
                            const Text(
                              '4.9 (1.2k Reviews)',
                              style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          title,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, color: Colors.white70, size: 16),
                            const SizedBox(width: 4),
                            const Text(
                              'Ma\'an Governorate, Jordan',
                              style: TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                            const SizedBox(width: 16),
                            const Icon(Icons.access_time, color: Colors.white70, size: 16),
                            const SizedBox(width: 4),
                            const Text(
                              '2 Days',
                              style: TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            // The white rounded sheet overlap effect
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(20),
              child: Container(
                height: 20,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                ),
              ),
            ),
          ),
          
          // Content
          SliverToBoxAdapter(
            child: Container(
              color: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Tabs
                  Container(
                    decoration: BoxDecoration(
                      border: Border(bottom: BorderSide(color: isDark ? AppColors.borderDark : AppColors.borderLight)),
                    ),
                    child: Row(
                      children: [
                        _buildTab(context, provider, 0, 'ITINERARY', isDark),
                        _buildTab(context, provider, 1, 'INCLUDED', isDark),
                        _buildTab(context, provider, 2, 'REVIEWS', isDark),
                      ],
                    ),
                  ),
                  
                  // Tab Content
                  Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: _buildTabContent(context, provider.selectedTabIndex, isDark),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(24.0),
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Price',
                    style: TextStyle(
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                      fontSize: 12,
                    ),
                  ),
                  Text(
                    destination?['price'] ?? '\$120',
                    style: TextStyle(
                      color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CheckoutPage(destination: destination ?? {}),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text('Proceed to Booking', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTab(BuildContext context, DestinationDetailsProvider provider, int index, String label, bool isDark) {
    final isSelected = provider.selectedTabIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => provider.setTabIndex(index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: isSelected ? AppColors.primaryRust : Colors.transparent,
                width: 2,
              ),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected 
                  ? AppColors.primaryRust 
                  : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              fontSize: 12,
              letterSpacing: 1.2,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabContent(BuildContext context, int tabIndex, bool isDark) {
    if (tabIndex == 0) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // About Section
          Text(
            'About this experience',
            style: TextStyle(
              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Journey through the narrow gorge of the Siq to reveal the magnificent Treasury (Al-Khazneh), Petra\'s most famous monument....',
            style: TextStyle(
              color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
              fontSize: 14,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Read more ∨',
            style: TextStyle(
              color: AppColors.primaryRust,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Itinerary Timeline
          Text(
            'Itinerary Overview',
            style: TextStyle(
              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          
          // Day 1
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.primaryRust, width: 2),
                    ),
                    child: Center(
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: const BoxDecoration(
                          color: AppColors.primaryRust,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                  Container(
                    width: 2,
                    height: 180, // Approximate height to connect to next node
                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Day 1: The Siq and The Treasury',
                      style: TextStyle(
                        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Begin your journey walking through the 1.2km Siq, culminating in the dramatic reveal of Al-Khazneh.',
                      style: TextStyle(
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 100,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              'https://images.unsplash.com/photo-1547234935-80c7145ec969?q=80&w=200&auto=format&fit=crop',
                              width: 140,
                              fit: BoxFit.cover,
                            ),
                          ),
                          const SizedBox(width: 12),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              'https://images.unsplash.com/photo-1574017377800-475a89849ee5?q=80&w=200&auto=format&fit=crop',
                              width: 140,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ],
          ),
          
          // Day 2
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.blue.withValues(alpha: 0.3), width: 2),
                      color: Colors.blue.withValues(alpha: 0.1),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Day 2: Royal Tombs & The Monastery',
                      style: TextStyle(
                        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Hike up the 800 ancient steps to Ad-Deir (The Monastery) and explore the expansive Royal Tombs overlooking the valley.',
                      style: TextStyle(
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 40),
          
          // Guide Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDark : const Color(0xFFF8F9FA),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundImage: const NetworkImage('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'),
                  backgroundColor: AppColors.primaryRust.withValues(alpha: 0.2),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'EXPERT LOCAL GUIDE',
                        style: TextStyle(
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Tariq Al-Naimat',
                        style: TextStyle(
                          color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '10+ years experience in Petra archaeology',
                        style: TextStyle(
                          color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 100), // Padding for bottom nav
        ],
      );
    } else {
      return Center(
        child: Text(
          'Content for ${tabIndex == 1 ? 'Included' : 'Reviews'}',
          style: TextStyle(color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
        ),
      );
    }
  }
}

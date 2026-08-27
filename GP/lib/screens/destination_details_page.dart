import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/screens/checkout_page.dart';
import 'package:gp/providers/destination_details_provider.dart';
import 'package:gp/providers/review_provider.dart';
import 'package:gp/providers/settings_provider.dart';

class DestinationDetailsPage extends StatelessWidget {
  final Map<String, dynamic>? destination;
  final bool isAlreadyBooked;
  final String? bookingStatus;

  const DestinationDetailsPage({
    super.key, 
    this.destination, 
    this.isAlreadyBooked = false,
    this.bookingStatus,
  });

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => DestinationDetailsProvider(),
      child: _DestinationDetailsPageContent(
        destination: destination,
        isAlreadyBooked: isAlreadyBooked,
        bookingStatus: bookingStatus,
      ),
    );
  }
}

class _DestinationDetailsPageContent extends StatefulWidget {
  final Map<String, dynamic>? destination;
  final bool isAlreadyBooked;
  final String? bookingStatus;
  
  const _DestinationDetailsPageContent({
    this.destination,
    this.isAlreadyBooked = false,
    this.bookingStatus,
  });

  @override
  State<_DestinationDetailsPageContent> createState() => _DestinationDetailsPageContentState();
}

class _DestinationDetailsPageContentState extends State<_DestinationDetailsPageContent> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.destination != null && widget.destination!['id'] != null) {
        context.read<ReviewProvider>().fetchPackageReviews(widget.destination!['id'], context);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final destination = widget.destination;
    final isAlreadyBooked = widget.isAlreadyBooked;
    final bookingStatus = widget.bookingStatus;

    final provider = context.watch<DestinationDetailsProvider>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isArabic = context.watch<SettingsProvider>().locale.languageCode == 'ar';
    
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
                  if (imageUrl.isNotEmpty)
                    Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: Colors.grey[800],
                        child: const Icon(Icons.image_not_supported, color: Colors.white, size: 50),
                      ),
                    )
                  else
                    Container(
                      color: Colors.grey[800],
                      child: const Icon(Icons.image_not_supported, color: Colors.white, size: 50),
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
                              child: Text(
                                (destination?['category'] ?? 'PACKAGE').toString().toUpperCase(),
                                style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.star, color: Colors.amber, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              '${destination?['ratingsAverage'] ?? 0.0} (${destination?['ratingsQuantity'] ?? 0} ${isArabic ? 'تقييم' : 'Reviews'})',
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
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
                        _buildTab(context, provider, 0, isArabic ? 'مسار الرحلة' : 'ITINERARY', isDark),
                        _buildTab(context, provider, 1, isArabic ? 'يتضمن' : 'INCLUDED', isDark),
                        _buildTab(context, provider, 2, isArabic ? 'التقييمات' : 'REVIEWS', isDark),
                      ],
                    ),
                  ),
                  
                  // Tab Content
                  Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: _buildTabContent(context, provider.selectedTabIndex, isDark, isArabic),
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
                onPressed: isAlreadyBooked 
                    ? null 
                    : () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => CheckoutPage(destination: destination ?? {}),
                          ),
                        );
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: isAlreadyBooked ? Colors.grey : AppColors.accentBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  disabledBackgroundColor: Colors.grey[400],
                  disabledForegroundColor: Colors.white,
                ),
                child: Text(
                  isAlreadyBooked 
                      ? (bookingStatus?.toUpperCase() ?? (isArabic ? 'محجوز' : 'BOOKED'))
                      : (isArabic ? 'متابعة الحجز' : 'Proceed to Booking'), 
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
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

  Widget _buildTabContent(BuildContext context, int tabIndex, bool isDark, bool isArabic) {
    if (tabIndex == 0) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // About Section
          Text(
            isArabic ? 'حول هذه التجربة' : 'About this experience',
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
            isArabic ? 'اقرأ المزيد ∨' : 'Read more ∨',
            style: TextStyle(
              color: AppColors.primaryRust,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Itinerary Timeline
          Text(
            isArabic ? 'نظرة عامة على خط سير الرحلة' : 'Itinerary Overview',
            style: TextStyle(
              color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          
          // Generic Dynamic Day
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
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isArabic ? 'الوصول والاستكشاف' : 'Arrival & Exploration',
                      style: TextStyle(
                        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.destination?['description'] ?? 'Your journey begins! Enjoy a breathtaking experience curated specifically for this package.',
                      style: TextStyle(
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
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
                        isArabic ? 'مرشد محلي خبير' : 'EXPERT LOCAL GUIDE',
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
    } else if (tabIndex == 2) {
      final reviewProvider = context.watch<ReviewProvider>();
      if (reviewProvider.isLoading) {
        return const Center(child: CircularProgressIndicator());
      }
      
      final reviews = reviewProvider.packageReviews;
      if (reviews.isEmpty) {
        return Center(
          child: Text(
            'No reviews yet for this package.',
            style: TextStyle(color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
          ),
        );
      }
      
      return ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: reviews.length,
        separatorBuilder: (context, index) => const Divider(height: 32),
        itemBuilder: (context, index) {
          final review = reviews[index];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppColors.primaryRust,
                    child: Text(
                      review.user != null && review.user!.isNotEmpty ? review.user![0].toUpperCase() : 'U',
                      style: const TextStyle(color: Colors.white),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          review.user ?? 'User',
                          style: TextStyle(
                            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Row(
                          children: [
                            const Icon(Icons.star, color: Colors.amber, size: 14),
                            const SizedBox(width: 4),
                            Text(
                              review.rating.toString(),
                              style: TextStyle(
                                color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  if (review.createdAt != null)
                    Text(
                      '${review.createdAt!.year}-${review.createdAt!.month.toString().padLeft(2, '0')}-${review.createdAt!.day.toString().padLeft(2, '0')}',
                      style: TextStyle(
                        color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                        fontSize: 12,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                review.review,
                style: TextStyle(
                  color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                  height: 1.4,
                ),
              ),
            ],
          );
        },
      );
    } else {
      return Center(
        child: Text(
          'Content for Included',
          style: TextStyle(color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
        ),
      );
    }
  }
}

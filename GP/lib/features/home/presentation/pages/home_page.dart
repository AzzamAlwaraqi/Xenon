import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/app/theme/colors.dart';
import 'package:gp/core/providers/settings_provider.dart';
import 'package:gp/core/providers/destination_provider.dart';
import 'destination_details_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<DestinationProvider>().fetchDestinations());
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    final destinationProvider = context.watch<DestinationProvider>();
    final isDark = settings.themeMode == ThemeMode.dark;
    final isArabic = settings.locale.languageCode == 'ar';

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        elevation: 0,
        title: Text(
          isArabic ? 'أهلاً بك' : 'Hello, Voyager',
          style: TextStyle(
            color: isDark ? AppColors.textPrimaryLight : Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications_outlined, color: isDark ? AppColors.textPrimaryLight : Colors.black),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => destinationProvider.fetchDestinations(),
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              // Search Bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceLight : Colors.grey[200],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? AppColors.borderLight : Colors.grey[300]!, width: 0.5),
                ),
                child: TextField(
                  style: TextStyle(color: isDark ? Colors.white : Colors.black),
                  decoration: InputDecoration(
                    icon: Icon(Icons.search, color: AppColors.textSecondaryLight, size: 20),
                    hintText: isArabic ? 'استكشف الوجهات...' : 'Explore destinations...',
                    hintStyle: const TextStyle(color: AppColors.textSecondaryLight, fontSize: 14),
                    border: InputBorder.none,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // Categories
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildCategoryChip(isArabic ? 'كل الحزم' : 'All Packages', true, isDark),
                    _buildCategoryChip(isArabic ? 'مغامرة' : 'Adventure', false, isDark),
                    _buildCategoryChip(isArabic ? 'صحة' : 'Wellness', false, isDark),
                    _buildCategoryChip(isArabic ? 'فخامة' : 'Luxury', false, isDark),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // Dynamic Content
              if (destinationProvider.isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.only(top: 100),
                    child: CircularProgressIndicator(color: AppColors.primaryRust),
                  ),
                )
              else if (destinationProvider.error != null)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 100),
                    child: Column(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red, size: 48),
                        const SizedBox(height: 16),
                        Text(
                          isArabic ? 'حدث خطأ ما' : 'Something went wrong',
                          style: TextStyle(color: isDark ? Colors.white : Colors.black),
                        ),
                        TextButton(
                          onPressed: () => destinationProvider.fetchDestinations(),
                          child: Text(isArabic ? 'إعادة المحاولة' : 'Try Again'),
                        ),
                      ],
                    ),
                  ),
                )
              else if (destinationProvider.destinations.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.only(top: 100),
                    child: Text(
                      isArabic ? 'لا توجد وجهات حالياً' : 'No destinations found',
                      style: TextStyle(color: isDark ? Colors.white : Colors.black),
                    ),
                  ),
                )
              else
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: destinationProvider.destinations.length,
                  itemBuilder: (context, index) {
                    final destination = destinationProvider.destinations[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 20),
                      child: _buildDestinationCard(
                        context,
                        category: destination.category,
                        title: destination.title,
                        price: double.tryParse(destination.price.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0,
                        rating: destination.rating,
                        imageUrl: destination.imageUrl,
                        description: isArabic 
                          ? 'استمتع بتجربة فريدة في ${destination.title}'
                          : 'Enjoy a unique experience in ${destination.title}',
                        settings: settings,
                      ),
                    );
                  },
                ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }


  Widget _buildCategoryChip(String label, bool isSelected, bool isDark) {
    return Container(
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.primaryRust.withValues(alpha: 1.0) : Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isSelected ? AppColors.primaryRust : (isDark ? AppColors.borderLight : Colors.grey[300]!),
          width: 1,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? (isDark ? AppColors.primaryRust : Colors.white) : (isDark ? AppColors.textSecondaryLight : Colors.grey[600]),
          fontSize: 12,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
    );
  }

  Widget _buildDestinationCard(
    BuildContext context, {
    required String category,
    required String title,
    required double price,
    required String rating,
    required String imageUrl,
    required String description,
    required SettingsProvider settings,
  }) {
    final isDark = settings.themeMode == ThemeMode.dark;
    final isArabic = settings.locale.languageCode == 'ar';
    
    String formattedPrice = '';
    if (settings.currency == 'USD') {
      formattedPrice = '\$${price.toStringAsFixed(0)}';
    } else if (settings.currency == 'JOD') {
      formattedPrice = '${(price * 0.71).toStringAsFixed(0)} JOD';
    } else if (settings.currency == 'EUR') {
      formattedPrice = '€${(price * 0.92).toStringAsFixed(0)}';
    }

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardBgDark : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.borderLight : Colors.grey[300]!, width: 0.5),
        boxShadow: isDark ? [] : [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                child: Image.network(
                  imageUrl,
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      height: 200,
                      color: isDark ? AppColors.surfaceLight : Colors.grey[200],
                      child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) => Container(
                    height: 200,
                    color: isDark ? AppColors.surfaceLight : Colors.grey[200],
                    child: const Icon(Icons.image_not_supported, size: 50),
                  ),
                ),
              ),
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.star, color: Colors.amber, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        rating,
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  category,
                  style: const TextStyle(
                    color: AppColors.primaryRust,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(
                          color: isDark ? Colors.white : Colors.black,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      formattedPrice,
                      style: TextStyle(
                        color: isDark ? Colors.white : Colors.black,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  description,
                  style: TextStyle(
                    color: isDark ? AppColors.textSecondaryLight.withValues(alpha: 0.7) : Colors.grey[600],
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isArabic ? 'للشخص الواحد' : 'Per person',
                      style: TextStyle(
                        color: isDark ? AppColors.textSecondaryLight : Colors.grey[500],
                        fontSize: 12,
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => DestinationDetailsPage(
                              destination: {
                                'title': title,
                                'imageUrl': imageUrl,
                                'price': formattedPrice,
                                'rating': rating,
                                'category': category,
                              },
                            ),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accentBlue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: Text(isArabic ? 'احجز الآن' : 'Book Now', style: const TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

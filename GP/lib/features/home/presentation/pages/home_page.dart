import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/app/theme/colors.dart';
import 'package:gp/core/providers/settings_provider.dart';
import 'destination_details_page.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
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
            color: isDark ? AppColors.textPrimary : Colors.black,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications_outlined, color: isDark ? AppColors.textPrimary : Colors.black),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Directionality(
        textDirection: isArabic ? TextDirection.rtl : TextDirection.ltr,
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
                  color: isDark ? AppColors.surface : Colors.grey[200],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? AppColors.border : Colors.grey[300]!, width: 0.5),
                ),
                child: TextField(
                  style: TextStyle(color: isDark ? Colors.white : Colors.black),
                  decoration: InputDecoration(
                    icon: Icon(Icons.search, color: AppColors.textMuted, size: 20),
                    hintText: isArabic ? 'استكشف الوجهات...' : 'Explore destinations...',
                    hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 14),
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
              // Destination Cards
              _buildDestinationCard(
                context,
                category: isArabic ? 'مغامرة' : 'ADVENTURE',
                title: isArabic ? 'البتراء: المدينة الوردية' : 'Petra: The Rose City',
                price: 50,
                rating: '5.0',
                imageUrl: 'https://images.unsplash.com/photo-1580618673372-9742760b0642?q=80&w=800&auto=format&fit=crop',
                description: isArabic 
                  ? 'استكشف إحدى عجائب الدنيا السبع، المدينة النبطية القديمة المنحوتة في الصخور الوردية.'
                  : 'Explore one of the Seven Wonders of the World, the ancient Nabataean city carved into rose-red cliffs.',
                settings: settings,
              ),
              const SizedBox(height: 20),
              _buildDestinationCard(
                context,
                category: isArabic ? 'مغامرة' : 'ADVENTURE',
                title: isArabic ? 'وادي رم: وادي القمر' : 'Wadi Rum: Valley of the Moon',
                price: 75,
                rating: '4.9',
                imageUrl: 'https://images.unsplash.com/photo-1509233725247-49e657c54213?q=80&w=800&auto=format&fit=crop',
                description: isArabic 
                  ? 'عش تجربة المريخ على الأرض مع رحلات السفاري في الصحراء الحمراء والتخييم تحت النجوم.'
                  : 'Experience Mars on Earth with red desert safaris and luxury camping under the stars.',
                settings: settings,
              ),
              const SizedBox(height: 20),
              _buildDestinationCard(
                context,
                category: isArabic ? 'صحة' : 'WELLNESS',
                title: isArabic ? 'البحر الميت: الطفو والاسترخاء' : 'Dead Sea: Float & Relax',
                price: 120,
                rating: '4.8',
                imageUrl: 'https://images.unsplash.com/photo-1551041777-ed9383fd386d?q=80&w=800&auto=format&fit=crop',
                description: isArabic 
                  ? 'استمتع بأدنى نقطة على سطح الأرض، واشعر بالطفو في المياه الغنية بالمعادن وعلاجات الطين الطبيعية.'
                  : 'Visit the lowest point on Earth, float in mineral-rich waters and enjoy natural mud treatments.',
                settings: settings,
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
        color: isSelected ? AppColors.accentGreen.withValues(alpha: 1.0) : Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isSelected ? AppColors.accentGreen : (isDark ? AppColors.border : Colors.grey[300]!),
          width: 1,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isSelected ? (isDark ? AppColors.accentGreen : Colors.white) : (isDark ? AppColors.textSecondary : Colors.grey[600]),
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
        color: isDark ? AppColors.cardBg : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? AppColors.border : Colors.grey[300]!, width: 0.5),
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
                  errorBuilder: (context, error, stackTrace) => Container(
                    height: 200,
                    color: Colors.grey[300],
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
                    color: AppColors.accentGreen,
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
                    color: isDark ? AppColors.textSecondary.withValues(alpha: 0.7) : Colors.grey[600],
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
                        color: isDark ? AppColors.textMuted : Colors.grey[500],
                        fontSize: 12,
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => DestinationDetailsPage(
                              title: title,
                              imageUrl: imageUrl,
                              price: formattedPrice,
                              rating: rating,
                              category: category,
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

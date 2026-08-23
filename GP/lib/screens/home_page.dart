import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/providers/settings_provider.dart';
import 'package:gp/providers/destination_provider.dart';
import 'package:gp/widgets/destination_card.dart';
import 'package:gp/widgets/empty_state.dart';
import 'package:gp/widgets/app_nav_bar.dart';
import 'package:gp/providers/profile_provider.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (mounted) {
        context.read<DestinationProvider>().fetchDestinations();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    final destinationProvider = context.watch<DestinationProvider>();
    final profileProvider = context.watch<ProfileProvider>();
    final isDark = settings.themeMode == ThemeMode.dark;
    final isArabic = settings.locale.languageCode == 'ar';
    final userName = profileProvider.userData?['name']?.split(' ').first ?? 'Voyager';

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppNavBar(
        title: isArabic ? 'أهلاً بك، $userName' : 'Hello, $userName',
        isDark: isDark,
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
                  border: Border.all(
                    color: isDark ? AppColors.borderLight : Colors.grey[300]!,
                    width: 0.5,
                  ),
                ),
                child: TextField(
                  onChanged: (value) => destinationProvider.setSearchQuery(value),
                  style: TextStyle(color: isDark ? Colors.white : Colors.black),
                  decoration: InputDecoration(
                    icon: Icon(
                      Icons.search,
                      color: AppColors.textSecondaryLight,
                      size: 20,
                    ),
                    hintText: isArabic
                        ? 'استكشف الوجهات...'
                        : 'Explore destinations...',
                    hintStyle: const TextStyle(
                      color: AppColors.textSecondaryLight,
                      fontSize: 14,
                    ),
                    border: InputBorder.none,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // Categories
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: [
                    _buildCategoryChip(
                      isArabic ? 'الكل' : 'All',
                      'All',
                      destinationProvider.selectedCategory == 'All',
                      isDark,
                      destinationProvider,
                    ),
                    _buildCategoryChip(
                      isArabic ? 'مغامرة' : 'Adventure',
                      'adventure',
                      destinationProvider.selectedCategory == 'adventure',
                      isDark,
                      destinationProvider,
                    ),
                    _buildCategoryChip(
                      isArabic ? 'ثقافي' : 'Cultural',
                      'cultural',
                      destinationProvider.selectedCategory == 'cultural',
                      isDark,
                      destinationProvider,
                    ),
                    _buildCategoryChip(
                      isArabic ? 'استرخاء' : 'Relaxation',
                      'relaxation',
                      destinationProvider.selectedCategory == 'relaxation',
                      isDark,
                      destinationProvider,
                    ),
                    _buildCategoryChip(
                      isArabic ? 'تاريخي' : 'Historical',
                      'historical',
                      destinationProvider.selectedCategory == 'historical',
                      isDark,
                      destinationProvider,
                    ),
                    _buildCategoryChip(
                      isArabic ? 'عائلي' : 'Family',
                      'family',
                      destinationProvider.selectedCategory == 'family',
                      isDark,
                      destinationProvider,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Dynamic Content
              if (destinationProvider.isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.only(top: 100),
                    child: CircularProgressIndicator(
                      color: AppColors.primaryRust,
                    ),
                  ),
                )
              else if (destinationProvider.error != null)
                EmptyState(
                  icon: Icons.error_outline,
                  message: isArabic ? 'حدث خطأ ما' : 'Something went wrong',
                  isDark: isDark,
                  retryLabel: isArabic ? 'إعادة المحاولة' : 'Try Again',
                  onRetry: destinationProvider.fetchDestinations,
                )
              else if (destinationProvider.destinations.isEmpty)
                EmptyState(
                  icon: Icons.explore_off,
                  message: isArabic
                      ? 'لا توجد وجهات حالياً'
                      : 'No destinations found',
                  isDark: isDark,
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
                      child: DestinationCard(
                        category: destination.category,
                        title: destination.title,
                        price:
                            double.tryParse(
                              destination.price.replaceAll(
                                RegExp(r'[^0-9.]'),
                                '',
                              ),
                            ) ??
                            0.0,
                        rating: destination.rating,
                        imageUrl: destination.imageUrl,
                        description: isArabic
                            ? 'استمتع بتجربة فريدة في ${destination.title}'
                            : 'Enjoy a unique experience in ${destination.title}',
                        isDark: isDark,
                        isArabic: isArabic,
                        currency: settings.currency,
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

  Widget _buildCategoryChip(String label, String categoryId, bool isSelected, bool isDark, DestinationProvider provider) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: InkWell(
        onTap: () => provider.setCategory(categoryId),
        borderRadius: BorderRadius.circular(24),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.primaryRust
                : (isDark ? AppColors.surfaceLight.withValues(alpha: 0.1) : Colors.white),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: isSelected
                  ? AppColors.primaryRust
                  : (isDark ? AppColors.borderLight : Colors.grey[300]!),
              width: 1,
            ),
            boxShadow: [
              if (!isSelected && !isDark)
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
            ],
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected
                  ? Colors.white
                  : (isDark ? AppColors.textSecondaryLight : Colors.black87),
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }
}

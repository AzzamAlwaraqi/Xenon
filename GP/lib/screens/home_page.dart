import 'package:flutter/material.dart';
import 'dart:async';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/providers/settings_provider.dart';
import 'package:gp/providers/destination_provider.dart';
import 'package:gp/widgets/destination_card.dart';
import 'package:gp/widgets/empty_state.dart';
import 'package:gp/widgets/app_nav_bar.dart';
import 'package:gp/providers/profile_provider.dart';
import 'package:gp/providers/package_provider.dart';
import 'package:gp/widgets/package_card.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final ScrollController _scrollController = ScrollController();
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    Future.microtask(() {
      if (mounted) {
        context.read<ProfileProvider>().loadProfile(context, silent: true);
        context.read<DestinationProvider>().fetchDestinations();
        context.read<PackageProvider>().fetchPackages(context);
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      context.read<PackageProvider>().loadMorePackages(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    final destinationProvider = context.watch<DestinationProvider>();
    final profileProvider = context.watch<ProfileProvider>();
    final packageProvider = context.watch<PackageProvider>();
    final isDark = settings.themeMode == ThemeMode.dark;
    final isArabic = settings.locale.languageCode == 'ar';
    final String rawName = profileProvider.profile?.name ?? '';
    final userName = rawName.isNotEmpty ? rawName.split(' ').first : 'Voyager';

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppNavBar(
        title: isArabic ? 'أهلاً بك، $userName' : 'Hello, $userName',
        isDark: isDark,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          destinationProvider.fetchDestinations();
          context.read<PackageProvider>().fetchPackages(context);
        },
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
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
                        onChanged: (value) {
                          destinationProvider.setSearchQuery(value);
                          if (_debounce?.isActive ?? false) _debounce!.cancel();
                          _debounce = Timer(const Duration(milliseconds: 500), () {
                            if (mounted) {
                              context.read<PackageProvider>().setSearchQuery(value, context);
                            }
                          });
                        },
                        style: TextStyle(color: isDark ? Colors.white : Colors.black),
                        decoration: InputDecoration(
                          icon: const Icon(
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
                            context,
                          ),
                          _buildCategoryChip(
                            isArabic ? 'مغامرة' : 'Adventure',
                            'adventure',
                            destinationProvider.selectedCategory == 'adventure',
                            isDark,
                            context,
                          ),
                          _buildCategoryChip(
                            isArabic ? 'ثقافي' : 'Cultural',
                            'cultural',
                            destinationProvider.selectedCategory == 'cultural',
                            isDark,
                            context,
                          ),
                          _buildCategoryChip(
                            isArabic ? 'استرخاء' : 'Relaxation',
                            'relaxation',
                            destinationProvider.selectedCategory == 'relaxation',
                            isDark,
                            context,
                          ),
                          _buildCategoryChip(
                            isArabic ? 'تاريخي' : 'Historical',
                            'historical',
                            destinationProvider.selectedCategory == 'historical',
                            isDark,
                            context,
                          ),
                          _buildCategoryChip(
                            isArabic ? 'عائلي' : 'Family',
                            'family',
                            destinationProvider.selectedCategory == 'family',
                            isDark,
                            context,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
            
            // Packages Vertical List
            if (packageProvider.packages.isNotEmpty)
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      return PackageCard(
                        package: packageProvider.packages[index],
                        isDark: isDark,
                        isArabic: isArabic,
                        currency: settings.currency,
                      ).animate().fade(duration: 400.ms).slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOut);
                    },
                    childCount: packageProvider.packages.length,
                  ),
                ),
              ),

            if (packageProvider.packages.isNotEmpty && !destinationProvider.isLoading && destinationProvider.destinations.isNotEmpty)
              const SliverToBoxAdapter(
                child: SizedBox(height: 20),
              ),

            if (packageProvider.isLoading && packageProvider.packages.isEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: const Icon(Icons.explore, size: 48, color: AppColors.primaryRust)
                        .animate(onPlay: (c) => c.repeat())
                        .rotate(duration: 2.seconds),
                  ),
                ),
              ),

            if (packageProvider.isFetchingMore)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  child: Center(
                    child: const Icon(Icons.explore, size: 32, color: AppColors.primaryRust)
                        .animate(onPlay: (c) => c.repeat())
                        .rotate(duration: 2.seconds),
                  ),
                ),
              ),

            // Dynamic Content (Destinations)
            if (destinationProvider.isLoading)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: const Icon(Icons.explore, size: 48, color: AppColors.primaryRust)
                      .animate(onPlay: (c) => c.repeat())
                      .rotate(duration: 2.seconds),
                ),
              )
            else if (destinationProvider.error != null)
              SliverFillRemaining(
                hasScrollBody: false,
                child: EmptyState(
                  icon: Icons.error_outline,
                  message: isArabic ? 'حدث خطأ ما' : 'Something went wrong',
                  isDark: isDark,
                  retryLabel: isArabic ? 'إعادة المحاولة' : 'Try Again',
                  onRetry: () => destinationProvider.fetchDestinations(),
                ),
              )
            else if (destinationProvider.destinations.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: EmptyState(
                  icon: Icons.explore_off,
                  message: isArabic ? 'لا توجد وجهات' : 'No destinations found',
                  isDark: isDark,
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
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
                        ).animate().fade(duration: 400.ms).slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOut),
                      );
                    },
                    childCount: destinationProvider.destinations.length,
                  ),
                ),
              ),
            const SliverToBoxAdapter(
              child: SizedBox(height: 30),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String label, String categoryId, bool isSelected, bool isDark, BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: InkWell(
        onTap: () {
          context.read<DestinationProvider>().setCategory(categoryId);
          context.read<PackageProvider>().setCategory(categoryId, context);
        },
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

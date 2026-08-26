import 'package:flutter/material.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/models/package_model.dart';
import 'package:gp/screens/destination_details_page.dart';

class PackageCard extends StatelessWidget {
  final PackageModel package;
  final bool isDark;
  final bool isArabic;
  final String currency;

  const PackageCard({
    super.key,
    required this.package,
    required this.isDark,
    required this.isArabic,
    required this.currency,
  });

  String get _formattedPrice {
    if (currency == 'USD') return '\$${package.price.toStringAsFixed(0)}';
    if (currency == 'JOD') return '${(package.price * 0.71).toStringAsFixed(0)} JOD';
    if (currency == 'EUR') return '€${(package.price * 0.92).toStringAsFixed(0)}';
    return '\$${package.price.toStringAsFixed(0)}';
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => DestinationDetailsPage(
                destination: {
                  'title': package.title,
                  'imageUrl': package.image ?? '',
                  'description': package.description,
                  'price': _formattedPrice,
                  'category': 'package',
                  'package_name': package.title,
                  'vendor_id': package.vendorId,
                },
              ),
            ),
          );
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          width: double.infinity,
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(
            color: isDark ? AppColors.cardBgDark : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? AppColors.borderLight : Colors.grey[300]!, width: 0.5),
            boxShadow: isDark
                ? []
                : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    )
                  ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image Section
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                    child: (package.image != null && package.image!.isNotEmpty)
                        ? Image.network(
                            package.image!,
                            height: 180,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            loadingBuilder: (context, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return Container(
                                height: 180,
                                color: isDark ? AppColors.surfaceLight : Colors.grey[200],
                                child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) => Container(
                              height: 180,
                              color: isDark ? AppColors.surfaceLight : Colors.grey[200],
                              child: const Icon(Icons.image_not_supported, size: 40),
                            ),
                          )
                        : Container(
                            height: 180,
                            color: isDark ? AppColors.surfaceLight : Colors.grey[200],
                            child: const Icon(Icons.card_travel, size: 40),
                          ),
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.primaryRust,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        isArabic ? 'باقة' : 'PACKAGE',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.1,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              // Content Section
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      package.title,
                      style: TextStyle(
                        color: isDark ? Colors.white : Colors.black,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      package.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: isDark ? AppColors.textSecondaryLight.withValues(alpha: 0.7) : Colors.grey[600],
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _formattedPrice,
                          style: const TextStyle(
                            color: AppColors.primaryRust,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.primaryRust.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Text(
                                isArabic ? 'احجز الآن' : 'Book Now',
                                style: const TextStyle(
                                  color: AppColors.primaryRust,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(
                                Icons.arrow_forward_rounded,
                                color: AppColors.primaryRust,
                                size: 16,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

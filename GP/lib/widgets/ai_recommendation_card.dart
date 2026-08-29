import 'package:flutter/material.dart';

import '../models/ai_advisor_models.dart';
import '../theme/colors.dart';

class AiRecommendationCard extends StatelessWidget {
  const AiRecommendationCard({
    super.key,
    required this.recommendation,
    required this.rank,
    required this.isArabic,
    required this.onOpenPackage,
  });

  final AiRecommendation recommendation;
  final int rank;
  final bool isArabic;
  final VoidCallback? onOpenPackage;

  String _money(double amount) =>
      '${amount.toStringAsFixed(amount % 1 == 0 ? 0 : 2)} ${recommendation.currency}';

  @override
  Widget build(BuildContext context) {
    final package = recommendation.package;
    final weather = recommendation.weather;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      margin: const EdgeInsetsDirectional.only(start: 8, bottom: 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardBgDark : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: rank == 1
              ? AppColors.primaryRust
              : (isDark ? AppColors.borderDark : AppColors.borderLight),
          width: rank == 1 ? 1.5 : 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (package.imageUrl?.isNotEmpty == true)
            Image.network(
              package.imageUrl!,
              height: 145,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => const SizedBox.shrink(),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (rank == 1)
                  Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primaryRust.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      isArabic ? 'أفضل اختيار لك' : 'Best match for you',
                      style: const TextStyle(
                        color: AppColors.primaryRust,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ),
                InkWell(
                  key: ValueKey('ai-package-link-${package.id}'),
                  onTap: onOpenPackage,
                  child: Text(
                    package.title,
                    style: const TextStyle(
                      color: Colors.blue,
                      decoration: TextDecoration.underline,
                      decorationColor: Colors.blue,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _money(recommendation.totalPrice),
                  style: const TextStyle(
                    color: AppColors.primaryRust,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (package.description.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    package.description,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                if (weather?.available == true) ...[
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 12,
                    runSpacing: 6,
                    children: [
                      if (weather!.maxTemperatureC != null)
                        _fact(
                          Icons.thermostat,
                          '${weather.minTemperatureC?.toStringAsFixed(0) ?? '–'}–${weather.maxTemperatureC!.toStringAsFixed(0)}°C',
                        ),
                      if (weather.averageHumidityPercent != null)
                        _fact(
                          Icons.water_drop_outlined,
                          '${weather.averageHumidityPercent!.toStringAsFixed(0)}% ${isArabic ? 'رطوبة' : 'humidity'}',
                        ),
                    ],
                  ),
                ] else if (weather?.status == 'not_yet_available') ...[
                  const SizedBox(height: 10),
                  Text(
                    isArabic
                        ? 'سيتوفر توقع الطقس عندما يقترب موعد الرحلة.'
                        : 'A reliable forecast will be available closer to the trip.',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondaryLight,
                    ),
                  ),
                ],
                if (recommendation.matchReasons.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    isArabic ? 'لماذا يناسبك؟' : 'Why it suits you',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 5),
                  ...recommendation.matchReasons
                      .take(3)
                      .map(
                        (reason) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(
                                Icons.check_circle,
                                size: 16,
                                color: Colors.green,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  reason,
                                  style: const TextStyle(fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                ],
                if (recommendation.tradeoffs.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    isArabic ? 'أمور يجب معرفتها' : 'Things to know',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 5),
                  ...recommendation.tradeoffs
                      .take(2)
                      .map(
                        (tradeoff) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Icon(
                                Icons.info_outline,
                                size: 16,
                                color: Colors.orange,
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  tradeoff,
                                  style: const TextStyle(fontSize: 13),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                ],
                const SizedBox(height: 14),
                TextButton.icon(
                  key: ValueKey('ai-view-package-${package.id}'),
                  onPressed: onOpenPackage,
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.blue,
                    padding: EdgeInsets.zero,
                  ),
                  icon: const Icon(Icons.open_in_new, size: 18),
                  label: Text(
                    isArabic
                        ? 'عرض الباقة والمتابعة للحجز'
                        : 'View package and continue to booking',
                    style: const TextStyle(
                      decoration: TextDecoration.underline,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _fact(IconData icon, String text) => Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, size: 16, color: AppColors.primaryRust),
      const SizedBox(width: 4),
      Text(text, style: const TextStyle(fontSize: 12)),
    ],
  );
}

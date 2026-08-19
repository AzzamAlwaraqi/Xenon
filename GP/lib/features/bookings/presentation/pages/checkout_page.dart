import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/app/theme/colors.dart';
import 'package:gp/core/providers/settings_provider.dart';

class CheckoutPage extends StatelessWidget {
  final Map<String, dynamic> destination;

  const CheckoutPage({super.key, required this.destination});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final settings = context.watch<SettingsProvider>();
    final isArabic = settings.locale.languageCode == 'ar';

    final String title = destination['title'] ?? 'The Treasury at Petra';
    final String imageUrl = destination['imageUrl'] ?? 'https://images.unsplash.com/photo-1547234935-80c7145ec969';
    final String price = destination['price'] ?? '\$120';

    return Scaffold(
      backgroundColor: isDark ? AppColors.backgroundDark : AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
        elevation: 0,
        title: Text(
          isArabic ? 'تأكيد الحجز' : 'Confirm Booking',
          style: TextStyle(
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Destination summary card
            Container(
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? AppColors.borderDark : Colors.grey[300]!),
              ),
              clipBehavior: Clip.antiAlias,
              child: Row(
                children: [
                  Image.network(
                    imageUrl,
                    width: 100,
                    height: 100,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => Container(
                      width: 100,
                      height: 100,
                      color: Colors.grey,
                      child: const Icon(Icons.image_not_supported),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: TextStyle(
                            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          price,
                          style: const TextStyle(
                            color: AppColors.primaryRust,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            
            // Payment Method Section
            Text(
              isArabic ? 'طريقة الدفع' : 'Payment Method',
              style: TextStyle(
                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primaryRust),
              ),
              child: Row(
                children: [
                  const Icon(Icons.money, color: AppColors.primaryRust),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      isArabic ? 'دفع نقدي' : 'Cash',
                      style: TextStyle(
                        color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const Icon(Icons.check_circle, color: AppColors.primaryRust),
                ],
              ),
            ),
            const SizedBox(height: 48),
            
            // Confirm Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(isArabic ? 'تم الحجز بنجاح!' : 'Booking confirmed!'),
                      backgroundColor: Colors.green,
                    ),
                  );
                  Navigator.pop(context); // Go back to details
                  Navigator.pop(context); // Go back to home/explore
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: Text(
                  isArabic ? 'تأكيد الحجز' : 'Confirm Booking',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/colors.dart';
import 'package:gp/providers/settings_provider.dart';
import 'package:gp/providers/booking_provider.dart';

class CheckoutPage extends StatefulWidget {
  final Map<String, dynamic> destination;

  const CheckoutPage({super.key, required this.destination});

  @override
  State<CheckoutPage> createState() => _CheckoutPageState();
}

class _CheckoutPageState extends State<CheckoutPage> {
  int _guests = 1;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final settings = context.watch<SettingsProvider>();
    final isArabic = settings.locale.languageCode == 'ar';

    final String title = widget.destination['title'] ?? 'The Treasury at Petra';
    final String imageUrl = widget.destination['imageUrl'] ?? 'https://images.unsplash.com/photo-1547234935-80c7145ec969';
    final String priceString = widget.destination['price'] ?? '\$120';
    
    // Calculate total price based on guests
    final baseNumericPrice = double.tryParse(priceString.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0;
    final totalPrice = baseNumericPrice * _guests;
    
    // Get currency symbol from original string or use default
    String currencySymbol = '\$';
    if (priceString.contains('JOD')) {
      currencySymbol = 'JOD ';
    } else if (priceString.contains('€')) {
      currencySymbol = '€';
    }
    
    final formattedTotalPrice = currencySymbol == 'JOD ' 
        ? '${totalPrice.toStringAsFixed(0)} JOD' 
        : '$currencySymbol${totalPrice.toStringAsFixed(0)}';

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
                          priceString,
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
            
            // Guests Selection
            Text(
              isArabic ? 'عدد الضيوف' : 'Number of Guests',
              style: TextStyle(
                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? AppColors.borderDark : Colors.grey[300]!),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '$_guests ${isArabic ? 'ضيف' : (_guests == 1 ? 'Guest' : 'Guests')}',
                    style: TextStyle(
                      color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Row(
                    children: [
                      IconButton(
                        onPressed: _guests > 1 ? () => setState(() => _guests--) : null,
                        icon: Icon(Icons.remove_circle_outline, color: _guests > 1 ? AppColors.primaryRust : Colors.grey),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        onPressed: _guests < 5 ? () => setState(() => _guests++) : null,
                        icon: Icon(Icons.add_circle_outline, color: _guests < 5 ? AppColors.primaryRust : Colors.grey),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            
            // Total Price Summary
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? AppColors.surfaceDark : Colors.blue.shade50,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? AppColors.borderDark : Colors.blue.shade100),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    isArabic ? 'الإجمالي' : 'Total Price',
                    style: TextStyle(
                      color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    formattedTotalPrice,
                    style: const TextStyle(
                      color: AppColors.primaryRust,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
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
                onPressed: () async {
                  final success = await context.read<BookingProvider>().createBooking({
                    'package_Name': widget.destination['package_name'] ?? widget.destination['title'],
                    'vendor_id': widget.destination['vendor_id'],
                    'date': DateTime.now().add(const Duration(days: 1)).toIso8601String(),
                    'guests': _guests,
                  }, context);

                  if (success && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(isArabic ? 'تم الحجز بنجاح!' : 'Booking confirmed!'),
                        backgroundColor: Colors.green,
                      ),
                    );
                    Navigator.pop(context); // Go back to details
                    Navigator.pop(context); // Go back to home/explore
                  }
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
                  isArabic ? 'احجز الآن (الدفع عند الوصول)' : 'Book Now (Pay on Arrival)',
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

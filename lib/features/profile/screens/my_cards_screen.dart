import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/ahlan_widgets.dart';

class MyCardsScreen extends StatelessWidget {
  const MyCardsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: const BackButton(),
        title: const Text('My Cards'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          // ── Saved Cards ────────────────────────────────────────────
          const Text('SAVED CARDS', style: TextStyle(color: AppColors.greyText, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1)),
          const SizedBox(height: 16),
          _CreditCard(
            brand: 'Visa',
            last4: '4242',
            expiry: '08 / 27',
            holderName: 'SARAH USER',
            isDefault: true,
            gradient: const [Color(0xFF8D4B32), Color(0xFFE9967A)],
          ),
          const SizedBox(height: 16),
          _CreditCard(
            brand: 'Mastercard',
            last4: '8891',
            expiry: '12 / 25',
            holderName: 'SARAH USER',
            isDefault: false,
            gradient: const [Color(0xFF1D2939), Color(0xFF667085)],
          ),

          // ── Add New Card ───────────────────────────────────────────
          const SizedBox(height: 32),
          const Text('ADD NEW CARD', style: TextStyle(color: AppColors.greyText, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1)),
          const SizedBox(height: 16),
          const AhlanTextField(label: 'Card Number', hint: '4111 2222 3333 4444', prefixIcon: Icons.credit_card),
          const SizedBox(height: 16),
          const AhlanTextField(label: 'Cardholder Name', hint: 'Your Name', prefixIcon: Icons.person_outline),
          const SizedBox(height: 16),
          const Row(
            children: [
              Expanded(child: AhlanTextField(label: 'MM / YY', hint: '08 / 27')),
              SizedBox(width: 16),
              Expanded(child: AhlanTextField(label: 'CVC', hint: '***', isPassword: true)),
            ],
          ),
          const SizedBox(height: 32),
          AhlanButton(
            text: 'Add Card',
            onPressed: () {},
            icon: const Icon(Icons.add),
          ),
        ],
      ),
    );
  }
}

class _CreditCard extends StatelessWidget {
  final String brand;
  final String last4;
  final String expiry;
  final String holderName;
  final bool isDefault;
  final List<Color> gradient;

  const _CreditCard({
    required this.brand,
    required this.last4,
    required this.expiry,
    required this.holderName,
    required this.isDefault,
    required this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 190,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(brand, style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 18)),
              if (isDefault)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text('Default', style: TextStyle(color: Colors.white, fontSize: 12)),
                ),
            ],
          ),
          const Spacer(),
          // Card number
          Text(
            '**** **** **** $last4',
            style: const TextStyle(color: Colors.white, fontSize: 20, letterSpacing: 3, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          // Bottom row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('CARDHOLDER', style: TextStyle(color: Colors.white54, fontSize: 10)),
                  Text(holderName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('EXPIRES', style: TextStyle(color: Colors.white54, fontSize: 10)),
                  Text(expiry, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

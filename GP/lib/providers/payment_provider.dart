import 'package:flutter/material.dart';
import '../models/payment_model.dart';
import '../models/api_client.dart';

class PaymentProvider with ChangeNotifier {
  List<PaymentModel> _payments = [];
  bool _isLoading = false;

  List<PaymentModel> get payments => _payments;
  bool get isLoading => _isLoading;

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  Future<void> fetchMyPayments(BuildContext context) async {
    _setLoading(true);
    try {
      _payments = await PaymentService.getBookingPayments();
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Failed to load payments');
    }
    _setLoading(false);
  }

  void _showErrorSnackBar(BuildContext context, String message) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }
}

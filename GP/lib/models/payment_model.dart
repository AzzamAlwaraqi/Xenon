import 'api_client.dart';
class PaymentModel {
  final String id;
  final double amount;
  final String status;
  final String? paymentMethod;
  final DateTime? createdAt;

  PaymentModel({
    required this.id,
    required this.amount,
    required this.status,
    this.paymentMethod,
    this.createdAt,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: json['_id'] ?? json['id'] ?? '',
      amount: (json['amount'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      paymentMethod: json['paymentMethod'],
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt']) : null,
    );
  }
}


class PaymentService {
  static const String _baseEndpoint = '/payments';

  static Future<List<PaymentModel>> getBookingPayments() async {
    final response = await ApiClient.get('$_baseEndpoint/booking');
    if (response['data'] != null && response['data'] is List) {
      return (response['data'] as List).map((e) => PaymentModel.fromJson(e)).toList();
    }
    return [];
  }
}


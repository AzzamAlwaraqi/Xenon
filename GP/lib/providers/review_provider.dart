import 'package:flutter/material.dart';
import '../models/review_model.dart';
import '../models/api_client.dart';

class ReviewProvider with ChangeNotifier {
  List<ReviewModel> _myReviews = [];
  List<ReviewModel> _packageReviews = [];
  bool _isLoading = false;

  List<ReviewModel> get myReviews => _myReviews;
  List<ReviewModel> get packageReviews => _packageReviews;
  bool get isLoading => _isLoading;

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  Future<void> fetchMyReviews(BuildContext context) async {
    _setLoading(true);
    try {
      _myReviews = await ReviewService.getMyReviews();
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Failed to load reviews');
    }
    _setLoading(false);
  }
  
  Future<void> fetchPackageReviews(String packageId, BuildContext context) async {
    _setLoading(true);
    try {
      _packageReviews = await ReviewService.getPackageReviews(packageId);
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Failed to load package reviews');
    }
    _setLoading(false);
  }

  Future<bool> submitReview(
      BuildContext context, {
      required String packageId,
      required String vendorId,
      required String bookingId,
      required String reviewText,
      required double rating,
    }) async {
    _setLoading(true);
    bool success = false;
    try {
      await ReviewService.createReview({
        'package_id': packageId,
        'vendor_id': vendorId,
        'booking_id': bookingId,
        'review_text': reviewText,
        'review_rating': rating,
      });
      success = true;
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Review submitted successfully!'), backgroundColor: Colors.green),
        );
      }
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Failed to submit review');
    }
    _setLoading(false);
    return success;
  }

  void _showErrorSnackBar(BuildContext context, String message) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }
}

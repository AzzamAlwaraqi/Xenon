import 'package:flutter/material.dart';
import '../models/booking_model.dart';
import '../models/api_client.dart';

class BookingProvider with ChangeNotifier {
  List<BookingModel> _bookings = [];
  List<BookingModel> _historyBookings = [];
  bool _isLoading = false;

  List<BookingModel> get bookings => _bookings;
  List<BookingModel> get historyBookings => _historyBookings;
  bool get isLoading => _isLoading;

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  Future<void> fetchMyBookings(BuildContext context) async {
    _setLoading(true);
    try {
      _bookings = await BookingService.getMyBookings();
      _historyBookings = await BookingService.getMyHistory();
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Failed to load bookings');
    }
    _setLoading(false);
  }

  Future<bool> createBooking(Map<String, dynamic> data, BuildContext context) async {
    _setLoading(true);
    try {
      await BookingService.createBooking(data);
      if (context.mounted) await fetchMyBookings(context); // Refresh list
      _setLoading(false);
      return true;
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Failed to create booking');
    }
    _setLoading(false);
    return false;
  }
  
  Future<bool> cancelBooking(String id, BuildContext context) async {
    _setLoading(true);
    try {
      // Assuming delete means cancel
      await BookingService.deleteBooking(id);
      if (context.mounted) await fetchMyBookings(context); // Refresh list
      _setLoading(false);
      return true;
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Failed to cancel booking');
    }
    _setLoading(false);
    return false;
  }

  void _showErrorSnackBar(BuildContext context, String message) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }

  // Preserve any old methods if they existed
  void navigateToBookingDetails(BuildContext context, String bookingId) {
    // legacy handle
  }
}

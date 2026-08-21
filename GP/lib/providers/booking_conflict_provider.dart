import 'package:flutter/material.dart';

class BookingConflictProvider extends ChangeNotifier {
  void viewMyTrips(BuildContext context) {
    // Navigate to the trips/bookings page
    // Since this might be pushed on top of the trips page, we can pop or navigate
    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  void cancel(BuildContext context) {
    if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }
}

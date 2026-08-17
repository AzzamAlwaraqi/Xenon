import 'package:flutter/material.dart';

class Booking {
  final String title;
  final String date;
  final String status;
  final Color statusColor;
  final IconData icon;
  final double price;
  final String? bookingId;

  Booking({
    required this.title,
    required this.date,
    required this.status,
    required this.statusColor,
    required this.icon,
    required this.price,
    this.bookingId,
  });
}

class BookingProvider extends ChangeNotifier {
  final List<Booking> _bookings = [
    Booking(
      title: 'Petra: The Rose City',
      date: 'Oct 14 - Oct 16, 2024',
      status: 'CONFIRMED',
      statusColor: const Color(0xFF4ADE80),
      icon: Icons.airplanemode_active,
      price: 50,
    ),
    Booking(
      title: 'Wadi Rum Safari',
      date: 'Dec 02 - Dec 04, 2024',
      status: 'PENDING',
      statusColor: Colors.amber,
      icon: Icons.hotel,
      bookingId: '#BK-9902',
      price: 75,
    ),
  ];

  List<Booking> get bookings => _bookings;

  void addBooking(Booking booking) {
    _bookings.insert(0, booking);
    notifyListeners();
  }
}

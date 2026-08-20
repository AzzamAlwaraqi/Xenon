import 'package:flutter/material.dart';

class Booking {
  final String title;
  final String date;
  final String status;
  final Color statusColor;
  final IconData icon;
  final double price;
  final String? bookingId;

  const Booking({
    required this.title,
    required this.date,
    required this.status,
    required this.statusColor,
    required this.icon,
    required this.price,
    this.bookingId,
  });
}

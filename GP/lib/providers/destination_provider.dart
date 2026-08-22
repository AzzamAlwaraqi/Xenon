import 'package:flutter/material.dart';
import 'package:gp/models/destination_model.dart';

class DestinationProvider extends ChangeNotifier {
  List<Destination> _destinations = [];
  bool _isLoading = false;
  String? _error;

  List<Destination> get destinations => _destinations;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchDestinations() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _destinations = await Destination.getDestinations();
      _isLoading = false;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
    }
    notifyListeners();
  }
}

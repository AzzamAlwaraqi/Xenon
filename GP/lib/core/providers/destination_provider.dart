import 'package:flutter/material.dart';
import '../services/destination_service.dart';

class DestinationProvider extends ChangeNotifier {
  final DestinationService _service = DestinationService();
  
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
      _destinations = await _service.getDestinations();
      _isLoading = false;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
    }
    notifyListeners();
  }
}

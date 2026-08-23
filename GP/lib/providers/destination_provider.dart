import 'package:flutter/material.dart';
import 'package:gp/models/destination_model.dart';

class DestinationProvider extends ChangeNotifier {
  List<Destination> _destinations = [];
  bool _isLoading = false;
  String? _error;
  String _searchQuery = '';
  String _selectedCategory = 'All';

  List<Destination> get destinations {
    return _destinations.where((d) {
      final matchesSearch = d.title.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesCategory = _selectedCategory == 'All' || 
                              d.category.toLowerCase() == _selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    }).toList();
  }

  bool get isLoading => _isLoading;
  String? get error => _error;
  String get selectedCategory => _selectedCategory;

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

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

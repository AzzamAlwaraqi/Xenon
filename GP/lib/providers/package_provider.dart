import 'package:flutter/material.dart';
import '../models/package_model.dart';
import '../models/api_client.dart';

class PackageProvider with ChangeNotifier {
  List<PackageModel> _packages = [];
  bool _isLoading = false;
  bool _isFetchingMore = false;
  bool _hasNextPage = true;
  int _currentPage = 1;

  List<PackageModel> get packages => _packages;
  bool get isLoading => _isLoading;
  bool get isFetchingMore => _isFetchingMore;
  bool get hasNextPage => _hasNextPage;

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setFetchingMore(bool value) {
    _isFetchingMore = value;
    notifyListeners();
  }

  Future<void> fetchPackages(BuildContext context) async {
    _currentPage = 1;
    _hasNextPage = true;
    _setLoading(true);
    try {
      final result = await PackageService.getAllPackages(page: _currentPage, limit: 10);
      _packages = result['packages'] as List<PackageModel>;
      _hasNextPage = result['hasNextPage'] as bool;
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Failed to load packages');
    }
    _setLoading(false);
  }

  Future<void> loadMorePackages(BuildContext context) async {
    if (_isFetchingMore || !_hasNextPage) return;
    
    _setFetchingMore(true);
    try {
      _currentPage++;
      final result = await PackageService.getAllPackages(page: _currentPage, limit: 10);
      final newPackages = result['packages'] as List<PackageModel>;
      _packages.addAll(newPackages);
      _hasNextPage = result['hasNextPage'] as bool;
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Failed to load more packages');
    }
    _setFetchingMore(false);
  }

  void _showErrorSnackBar(BuildContext context, String message) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }
}

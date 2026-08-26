import 'package:flutter/material.dart';
import '../models/package_model.dart';
import '../models/api_client.dart';

class PackageProvider with ChangeNotifier {
  List<PackageModel> _packages = [];
  bool _isLoading = false;

  List<PackageModel> get packages => _packages;
  bool get isLoading => _isLoading;

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  Future<void> fetchPackages(BuildContext context) async {
    _setLoading(true);
    try {
      _packages = await PackageService.getAllPackages();
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Failed to load packages');
    }
    _setLoading(false);
  }

  void _showErrorSnackBar(BuildContext context, String message) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    }
  }
}

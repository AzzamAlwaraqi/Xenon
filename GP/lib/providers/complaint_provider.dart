import 'package:flutter/material.dart';
import '../models/complaint_model.dart';
import '../models/api_client.dart';

class ComplaintProvider with ChangeNotifier {
  List<ComplaintModel> _complaints = [];
  bool _isLoading = false;

  List<ComplaintModel> get complaints => _complaints;
  bool get isLoading => _isLoading;

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  Future<void> fetchMyComplaints(BuildContext context) async {
    _setLoading(true);
    try {
      _complaints = await ComplaintService.getMyComplaints();
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Failed to load complaints');
    }
    _setLoading(false);
  }

  Future<bool> createComplaint(Map<String, dynamic> data, BuildContext context) async {
    _setLoading(true);
    try {
      await ComplaintService.createComplaint(data);
      if (context.mounted) await fetchMyComplaints(context);
      _setLoading(false);
      return true;
    } on ApiException catch (e) {
      if (context.mounted) _showErrorSnackBar(context, e.message);
    } catch (e) {
      if (context.mounted) _showErrorSnackBar(context, 'Failed to create complaint');
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
}

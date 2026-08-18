import 'package:flutter/material.dart';

class DestinationDetailsProvider extends ChangeNotifier {
  int _selectedTabIndex = 0;
  bool _isSaved = false;

  int get selectedTabIndex => _selectedTabIndex;
  bool get isSaved => _isSaved;

  void setTabIndex(int index) {
    _selectedTabIndex = index;
    notifyListeners();
  }

  void toggleSaved() {
    _isSaved = !_isSaved;
    notifyListeners();
  }
}

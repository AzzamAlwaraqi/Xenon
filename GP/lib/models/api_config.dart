import 'package:flutter/foundation.dart';

class ApiConfig {
  static String get baseUrl {
    // 1. بيئة الويب (Chrome / Edge)
    if (kIsWeb) {
      return 'http://localhost:3000/api/v1';
    }

    // 2. بيئة الأندرويد
    // استخدام defaultTargetPlatform بيحمينا من مشاكل الويب وما بيحتاج dart:io
    if (defaultTargetPlatform == TargetPlatform.android) {
      // Because you are running on a PHYSICAL phone, you must use your laptop's Wi-Fi IP address!
      return 'http://192.168.1.157:3000/api/v1'; 
    }

    // 3. بيئة iOS Simulator أو Windows Desktop
    return 'http://localhost:3000/api/v1';
  }

  static const Map<String, String> headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-client-type': 'mobile',
  };
}

import 'package:flutter/material.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import 'app_routes.dart';

class AppPages {
  AppPages._();

  static final Map<String, WidgetBuilder> routes = {
    AppRoutes.login:     (_) => const LoginPage(),
    // AppRoutes.dashboard: (_) => const DashboardPage(),
  };
}

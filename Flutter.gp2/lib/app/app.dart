import 'package:flutter/material.dart';
import 'package:graduation_project/app/theme/app_theme.dart';
import 'package:graduation_project/features/auth/presentation/pages/login_page.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Graduation Project',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system, // Automatically switches based on system settings
      home: const LoginPage(),
    );
  }
}

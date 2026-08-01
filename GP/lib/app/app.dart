import 'package:flutter/material.dart';
import 'package:gp/app/theme/app_theme.dart';
import 'package:gp/app/main_layout.dart';
import 'package:gp/features/auth/presentation/pages/login_page.dart';
import 'package:gp/features/auth/presentation/pages/signup_page.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Voyage',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginPage(),
        '/signup': (context) => const SignUpPage(),
        '/main': (context) => const MainLayout(),
      },
    );
  }
}

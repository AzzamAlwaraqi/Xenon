import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gp/app/theme/app_theme.dart';
import 'package:gp/app/main_layout.dart';
import 'package:gp/features/auth/presentation/pages/login_page.dart';
import 'package:gp/features/auth/presentation/pages/signup_page.dart';
import 'package:gp/core/providers/settings_provider.dart';
import 'package:gp/core/providers/booking_provider.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        ChangeNotifierProvider(create: (_) => BookingProvider()),
      ],
      child: Consumer<SettingsProvider>(
        builder: (context, settings, child) {
          return MaterialApp(
            title: 'Xenon',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: settings.themeMode,
            locale: settings.locale,
            initialRoute: '/login',
            routes: {
              '/login': (context) => const LoginPage(),
              '/signup': (context) => const SignUpPage(),
              '/main': (context) => const MainLayout(),
            },
          );
        },
      ),
    );
  }
}

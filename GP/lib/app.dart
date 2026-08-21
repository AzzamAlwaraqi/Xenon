import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:gp/theme/app_theme.dart';
import 'package:gp/screens/main_layout.dart';
import 'package:gp/screens/login_page.dart';
import 'package:gp/screens/signup_page.dart';
import 'package:gp/screens/otp_page.dart';
import 'package:gp/screens/edit_profile_page.dart';
import 'package:gp/screens/change_password_page.dart';
import 'package:gp/screens/forgot_password_page.dart';
import 'package:gp/providers/settings_provider.dart';
import 'package:gp/providers/booking_provider.dart';
import 'package:gp/providers/destination_provider.dart';
import 'package:gp/providers/profile_provider.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => SettingsProvider()),
        ChangeNotifierProvider(create: (_) => BookingProvider()),
        ChangeNotifierProvider(create: (_) => DestinationProvider()),
        ChangeNotifierProvider(create: (_) => ProfileProvider()),
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
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [Locale('en'), Locale('ar')],
            initialRoute: '/login',
            routes: {
              '/login': (context) => const LoginPage(),
              '/signup': (context) => const SignUpPage(),
              '/main': (context) => const MainLayout(),
              '/otp': (context) => const OtpPage(),
              '/edit-profile': (context) => const EditProfilePage(),
              '/change-password': (context) => const ChangePasswordPage(),
              '/forgot-password': (context) => const ForgotPasswordPage(),
            },
          );
        },
      ),
    );
  }
}

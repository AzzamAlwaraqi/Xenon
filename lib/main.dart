import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'core/navigation/nav_graph.dart';

// Feature Providers
import 'features/auth/providers/auth_provider.dart';
import 'features/home/providers/home_provider.dart';
import 'features/trips/providers/trips_provider.dart';
import 'features/booking/providers/booking_provider.dart';
import 'features/profile/providers/profile_provider.dart';
import 'features/ai_agent/providers/ai_agent_provider.dart';
import 'features/notifications/providers/notifications_provider.dart';

void main() {
  runApp(const AhlanApp());
}

class AhlanApp extends StatelessWidget {
  const AhlanApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => HomeProvider()),
        ChangeNotifierProvider(create: (_) => TripsProvider()),
        ChangeNotifierProvider(create: (_) => BookingProvider()),
        ChangeNotifierProvider(create: (_) => ProfileProvider()),
        ChangeNotifierProvider(create: (_) => AiAgentProvider()),
        ChangeNotifierProvider(create: (_) => NotificationsProvider()),
      ],
      child: MaterialApp.router(
        title: 'Ahlan wa Sahlan',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        routerConfig: appRouter,
      ),
    );
  }
}

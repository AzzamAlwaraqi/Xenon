import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'app_routes.dart';
import '../widgets/ahlan_widgets.dart';

// --- Auth ---
import '../../features/auth/screens/welcome_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/signup_screen.dart';
import '../../features/auth/screens/verification_screen.dart';
import '../../features/auth/screens/reset_password_screen.dart';

// --- Shell tabs ---
import '../../features/home/screens/home_screen.dart';
import '../../features/trips/screens/trips_screen.dart';
import '../../features/ai_agent/screens/ai_agent_screen.dart';
import '../../features/profile/screens/profile_screen.dart';

// --- Profile sub-screens ---
import '../../features/profile/screens/settings_screen.dart';

// --- Notifications ---
import '../../features/notifications/screens/notifications_screen.dart';

// --- Booking flow ---
import '../../features/booking/screens/booking_detail_screen.dart';
import '../../features/booking/screens/payment_screen.dart';

// --- State screens ---
import '../../features/common/screens/loading_screen.dart';
import '../../features/common/screens/error_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();
final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>();

final GoRouter appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: AppRoutes.welcome,
  routes: [
    // --- Auth routes (no bottom nav) ---
    GoRoute(
      path: AppRoutes.welcome,
      builder: (context, state) => const WelcomeScreen(),
    ),
    GoRoute(
      path: AppRoutes.login,
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: AppRoutes.signup,
      builder: (context, state) => const SignUpScreen(),
    ),
    GoRoute(
      path: AppRoutes.verify,
      builder: (context, state) => const VerificationScreen(),
    ),
    GoRoute(
      path: AppRoutes.resetPassword,
      builder: (context, state) => const ResetPasswordScreen(),
    ),

    // --- Main shell (bottom nav) ---
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) {
        return Scaffold(
          body: child,
          bottomNavigationBar: AhlanBottomNav(
            currentIndex: _getSelectedIndex(state.uri.path),
            onTap: (index) {
              switch (index) {
                case 0:
                  context.go(AppRoutes.trips);
                case 1:
                  context.go(AppRoutes.home);
                case 2:
                  context.go(AppRoutes.aiAgent);
                case 3:
                  context.go(AppRoutes.profile);
              }
            },
          ),
        );
      },
      routes: [
        GoRoute(
          path: AppRoutes.trips,
          builder: (context, state) => const TripsScreen(),
        ),
        GoRoute(
          path: AppRoutes.home,
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: AppRoutes.aiAgent,
          builder: (context, state) => const AiAgentScreen(),
        ),
        GoRoute(
          path: AppRoutes.profile,
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    ),

    // --- Profile sub-screens (no bottom nav) ---
    GoRoute(
      path: AppRoutes.settings,
      builder: (context, state) => const SettingsScreen(),
    ),
    GoRoute(
      path: AppRoutes.notifications,
      builder: (context, state) => const NotificationsScreen(),
    ),

    // --- Booking flow (no bottom nav) ---
    GoRoute(
      path: AppRoutes.bookingDetail,
      builder: (context, state) => const BookingDetailScreen(),
    ),
    GoRoute(
      path: AppRoutes.payment,
      builder: (context, state) => const PaymentScreen(),
    ),

    // --- State screens ---
    GoRoute(
      path: AppRoutes.loading,
      builder: (context, state) {
        final nextRoute = state.uri.queryParameters['nextRoute'] ?? AppRoutes.profile;
        final message = state.uri.queryParameters['message'] ?? 'Loading your journey...';
        return LoadingScreen(nextRoute: nextRoute, message: message);
      },
    ),
    GoRoute(
      path: AppRoutes.error,
      builder: (context, state) {
        final code = state.uri.queryParameters['code'] ?? '400';
        final message = state.uri.queryParameters['message'];
        return ErrorScreen(code: code, message: message);
      },
    ),
  ],
);

int _getSelectedIndex(String location) {
  if (location.startsWith(AppRoutes.trips)) return 0;
  if (location.startsWith(AppRoutes.home)) return 1;
  if (location.startsWith(AppRoutes.aiAgent)) return 2;
  if (location.startsWith(AppRoutes.profile)) return 3;
  return 1;
}

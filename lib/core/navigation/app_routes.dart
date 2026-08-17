/// Central source of truth for all route paths.
/// Use these constants everywhere instead of raw strings.
class AppRoutes {
  AppRoutes._();

  // --- Auth ---
  static const String welcome = '/';
  static const String login = '/login';
  static const String signup = '/signup';
  static const String verify = '/verify';
  static const String resetPassword = '/reset-password';

  // --- Main shell tabs ---
  static const String home = '/home';
  static const String trips = '/trips';
  static const String aiAgent = '/ai-agent';
  static const String profile = '/profile';

  // --- Profile sub-screens ---
  static const String settings = '/settings';
  static const String notifications = '/notifications';

  // --- Booking flow ---
  static const String bookingDetail = '/booking-detail';
  static const String payment = '/payment';

  // --- State screens ---
  static const String loading = '/loading';
  static const String error = '/error';
}

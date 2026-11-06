import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gp/providers/booking_conflict_provider.dart';
import 'package:gp/providers/error_provider.dart';
import 'package:gp/providers/guest_required_provider.dart';
import 'package:gp/providers/settings_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Records every push and pop so navigation can be asserted after the
/// originating widget has been torn down.
class RouteLog extends NavigatorObserver {
  final List<String> pushed = [];
  final List<String> popped = [];
  final List<String> replaced = [];

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    pushed.add(route.settings.name ?? '');
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    popped.add(route.settings.name ?? '');
  }

  @override
  void didReplace({Route<dynamic>? newRoute, Route<dynamic>? oldRoute}) {
    replaced.add(newRoute?.settings.name ?? '');
  }
}

/// Pumps an app that exposes the BuildContext of its topmost route.
/// With [canPop] a second route is pushed first, so the captured context sits
/// above another route and can legitimately be dismissed.
Future<({BuildContext context, RouteLog log})> screen(WidgetTester tester, {bool canPop = false}) async {
  final log = RouteLog();
  final contexts = <BuildContext>[];

  await tester.pumpWidget(MaterialApp(
    navigatorObservers: [log],
    onGenerateRoute: (settings) => MaterialPageRoute(
      settings: settings,
      builder: (context) {
        contexts.add(context);
        return const Scaffold(body: SizedBox());
      },
    ),
    initialRoute: '/',
  ));

  if (canPop) {
    Navigator.of(contexts.first).pushNamed('/second');
    await tester.pumpAndSettle();
  }
  return (context: contexts.last, log: log);
}

void main() {
  group('SettingsProvider', () {
    setUp(() => SharedPreferences.setMockInitialValues({}));

    test('defaults to dark theme, English, and USD before anything is stored', () {
      final settings = SettingsProvider();
      expect(settings.themeMode, ThemeMode.dark);
      expect(settings.locale.languageCode, 'en');
      expect(settings.currency, 'USD');
    });

    test('restores a stored light theme on start-up', () async {
      SharedPreferences.setMockInitialValues({'isDark': false});
      final settings = SettingsProvider();
      await Future<void>.delayed(Duration.zero);
      expect(settings.themeMode, ThemeMode.light);
    });

    test('restores a stored language and currency on start-up', () async {
      SharedPreferences.setMockInitialValues({'languageCode': 'ar', 'currency': 'JOD'});
      final settings = SettingsProvider();
      await Future<void>.delayed(Duration.zero);
      expect(settings.locale.languageCode, 'ar');
      expect(settings.currency, 'JOD');
    });

    test('toggling the theme flips it and notifies listeners', () async {
      final settings = SettingsProvider();
      await Future<void>.delayed(Duration.zero);
      var notifications = 0;
      settings.addListener(() => notifications++);

      final before = settings.themeMode;
      await settings.toggleTheme();
      expect(settings.themeMode, isNot(before));
      expect(notifications, greaterThanOrEqualTo(1));
    });

    test('the theme survives a restart', () async {
      final settings = SettingsProvider();
      await Future<void>.delayed(Duration.zero);
      final target = settings.themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
      await settings.toggleTheme();
      expect(settings.themeMode, target);

      final restarted = SettingsProvider();
      await Future<void>.delayed(Duration.zero);
      expect(restarted.themeMode, target, reason: 'the preference must persist');
    });

    test('toggling twice returns to the original theme', () async {
      final settings = SettingsProvider();
      await Future<void>.delayed(Duration.zero);
      final original = settings.themeMode;
      await settings.toggleTheme();
      await settings.toggleTheme();
      expect(settings.themeMode, original);
    });

    test('setting the language persists it and notifies listeners', () async {
      final settings = SettingsProvider();
      await Future<void>.delayed(Duration.zero);
      var notifications = 0;
      settings.addListener(() => notifications++);

      await settings.setLocale('ar');
      expect(settings.locale.languageCode, 'ar');
      expect(notifications, 1);

      final restarted = SettingsProvider();
      await Future<void>.delayed(Duration.zero);
      expect(restarted.locale.languageCode, 'ar');
    });

    test('supports the two languages the app ships', () async {
      final settings = SettingsProvider();
      await Future<void>.delayed(Duration.zero);
      for (final code in ['en', 'ar']) {
        await settings.setLocale(code);
        expect(settings.locale.languageCode, code);
      }
    });

    test('setting the currency persists it and notifies listeners', () async {
      final settings = SettingsProvider();
      await Future<void>.delayed(Duration.zero);
      var notifications = 0;
      settings.addListener(() => notifications++);

      await settings.setCurrency('JOD');
      expect(settings.currency, 'JOD');
      expect(notifications, 1);

      final restarted = SettingsProvider();
      await Future<void>.delayed(Duration.zero);
      expect(restarted.currency, 'JOD');
    });

    test('OBSERVATION: the default currency is USD although the platform prices in JOD', () async {
      // Backend package prices and the AI service both use JOD. A tourist who
      // never opens settings sees prices labelled in the wrong currency.
      SharedPreferences.setMockInitialValues({});
      final settings = SettingsProvider();
      await Future<void>.delayed(Duration.zero);
      expect(settings.currency, 'USD');
    });
  });

  group('ErrorProvider', () {
    testWidgets('is not loading until a refresh starts', (tester) async {
      expect(ErrorProvider().isLoading, isFalse);
    });

    testWidgets('reports loading during a refresh and clears it afterwards', (tester) async {
      final provider = ErrorProvider();
      final screenUnderTest = await screen(tester);
      final states = <bool>[];
      provider.addListener(() => states.add(provider.isLoading));

      final refresh = provider.refreshPage(screenUnderTest.context);
      await tester.pump();
      expect(provider.isLoading, isTrue, reason: 'the retry button must show progress');

      await tester.pump(const Duration(seconds: 2));
      await refresh;
      expect(provider.isLoading, isFalse);
      expect(states, [true, false]);
    });

    testWidgets('returns to the home route when there is nothing to pop', (tester) async {
      final provider = ErrorProvider();
      final screenUnderTest = await screen(tester);

      final refresh = provider.refreshPage(screenUnderTest.context);
      await tester.pump(const Duration(seconds: 2));
      await refresh;
      await tester.pumpAndSettle();

      expect(screenUnderTest.log.replaced, contains('/'),
          reason: 'a root-level error screen navigates home rather than popping');
    });

    testWidgets('pops back to the previous screen when one exists', (tester) async {
      final provider = ErrorProvider();
      final screenUnderTest = await screen(tester, canPop: true);

      provider.fixDetails(screenUnderTest.context);
      await tester.pumpAndSettle();
      expect(screenUnderTest.log.popped, contains('/second'));
    });

    testWidgets('fixing details on a root screen does nothing rather than crashing', (tester) async {
      final provider = ErrorProvider();
      final screenUnderTest = await screen(tester);
      provider.fixDetails(screenUnderTest.context);
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(screenUnderTest.log.popped, isEmpty);
    });
  });

  group('GuestRequiredProvider', () {
    testWidgets('sends a guest to the login screen', (tester) async {
      final screenUnderTest = await screen(tester);
      GuestRequiredProvider().navigateToAuth(screenUnderTest.context);
      await tester.pumpAndSettle();
      expect(screenUnderTest.log.pushed, contains('/login'));
    });

    testWidgets('goes back to the screen the guest came from', (tester) async {
      final screenUnderTest = await screen(tester, canPop: true);
      GuestRequiredProvider().goBack(screenUnderTest.context);
      await tester.pumpAndSettle();
      expect(screenUnderTest.log.popped, contains('/second'));
    });
  });

  group('BookingConflictProvider', () {
    testWidgets('dismisses the conflict screen to reveal the trips list', (tester) async {
      final screenUnderTest = await screen(tester, canPop: true);
      BookingConflictProvider().viewMyTrips(screenUnderTest.context);
      await tester.pumpAndSettle();
      expect(screenUnderTest.log.popped, contains('/second'));
    });

    testWidgets('cancelling dismisses the conflict screen', (tester) async {
      final screenUnderTest = await screen(tester, canPop: true);
      BookingConflictProvider().cancel(screenUnderTest.context);
      await tester.pumpAndSettle();
      expect(screenUnderTest.log.popped, contains('/second'));
    });

    testWidgets('neither action crashes when there is nothing to dismiss', (tester) async {
      final screenUnderTest = await screen(tester);
      final provider = BookingConflictProvider();
      provider.viewMyTrips(screenUnderTest.context);
      provider.cancel(screenUnderTest.context);
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
      expect(screenUnderTest.log.popped, isEmpty);
    });
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gp/utils/translation_helper.dart';
import 'package:gp/widgets/app_button.dart';
import 'package:gp/widgets/empty_state.dart';
import 'package:gp/widgets/password_strength_widget.dart';
import 'package:gp/widgets/section_header.dart';

/// Wraps a widget in the minimum app scaffolding a widget test needs.
Widget host(Widget child) => MaterialApp(home: Scaffold(body: child));

void main() {
  group('AppButton', () {
    testWidgets('renders its label', (tester) async {
      await tester.pumpWidget(host(AppButton(text: 'Book now', onPressed: () {})));
      expect(find.text('Book now'), findsOneWidget);
    });

    testWidgets('reports a tap to the caller', (tester) async {
      var taps = 0;
      await tester.pumpWidget(host(AppButton(text: 'Book now', onPressed: () => taps++)));
      await tester.tap(find.byType(AppButton));
      await tester.pump();
      expect(taps, 1);
    });

    testWidgets('renders an elevated button by default', (tester) async {
      await tester.pumpWidget(host(AppButton(text: 'Book now', onPressed: () {})));
      expect(find.byType(ElevatedButton), findsOneWidget);
      expect(find.byType(OutlinedButton), findsNothing);
    });

    testWidgets('renders an outlined button when asked', (tester) async {
      await tester.pumpWidget(host(AppButton(text: 'Cancel', onPressed: () {}, isOutlined: true)));
      expect(find.byType(OutlinedButton), findsOneWidget);
      expect(find.byType(ElevatedButton), findsNothing);
    });

    testWidgets('honours a custom colour', (tester) async {
      await tester.pumpWidget(host(AppButton(text: 'Delete', onPressed: () {}, color: Colors.red)));
      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      final background = button.style?.backgroundColor?.resolve(<WidgetState>{});
      expect(background, Colors.red);
    });

    testWidgets('fills the available width so it cannot render as a stray chip', (tester) async {
      await tester.pumpWidget(host(AppButton(text: 'Book now', onPressed: () {})));
      final box = tester.widget<SizedBox>(find.byType(SizedBox).first);
      expect(box.width, double.infinity);
      expect(box.height, 56);
    });
  });

  group('EmptyState', () {
    testWidgets('shows the message and icon', (tester) async {
      await tester.pumpWidget(host(const EmptyState(
        icon: Icons.inbox, message: 'You have no bookings yet.', isDark: false,
      )));
      expect(find.text('You have no bookings yet.'), findsOneWidget);
      expect(find.byIcon(Icons.inbox), findsOneWidget);
    });

    testWidgets('hides the retry control when no retry is offered', (tester) async {
      await tester.pumpWidget(host(const EmptyState(
        icon: Icons.inbox, message: 'Nothing here.', isDark: false,
      )));
      expect(find.byType(TextButton), findsNothing);
    });

    testWidgets('shows a retry control and reports the tap', (tester) async {
      var retries = 0;
      await tester.pumpWidget(host(EmptyState(
        icon: Icons.wifi_off, message: 'Could not load bookings.', isDark: false,
        onRetry: () => retries++,
      )));
      expect(find.text('Try Again'), findsOneWidget);
      await tester.tap(find.byType(TextButton));
      await tester.pump();
      expect(retries, 1);
    });

    testWidgets('uses a caller-supplied retry label', (tester) async {
      await tester.pumpWidget(host(EmptyState(
        icon: Icons.wifi_off, message: 'Offline.', isDark: false,
        retryLabel: 'Reload', onRetry: () {},
      )));
      expect(find.text('Reload'), findsOneWidget);
      expect(find.text('Try Again'), findsNothing);
    });

    testWidgets('renders in dark mode without losing the message', (tester) async {
      await tester.pumpWidget(host(const EmptyState(
        icon: Icons.inbox, message: 'Nothing here.', isDark: true,
      )));
      expect(find.text('Nothing here.'), findsOneWidget);
    });
  });

  group('PasswordStrengthWidget', () {
    Future<void> type(WidgetTester tester, TextEditingController controller, String value) async {
      controller.text = value;
      await tester.pump();
    }

    testWidgets('shows nothing until the user types', (tester) async {
      final controller = TextEditingController();
      await tester.pumpWidget(host(PasswordStrengthWidget(passwordController: controller)));
      expect(find.text('Weak'), findsNothing);
      expect(find.text('At least 8 characters'), findsNothing);
      controller.dispose();
    });

    testWidgets('rates a short password as weak', (tester) async {
      final controller = TextEditingController();
      await tester.pumpWidget(host(PasswordStrengthWidget(passwordController: controller)));
      await type(tester, controller, 'abcdefgh');
      expect(find.text('Weak'), findsOneWidget);
      controller.dispose();
    });

    testWidgets('rates a password with a capital and a number as medium', (tester) async {
      final controller = TextEditingController();
      await tester.pumpWidget(host(PasswordStrengthWidget(passwordController: controller)));
      await type(tester, controller, 'Password1');
      expect(find.text('Medium'), findsOneWidget);
      controller.dispose();
    });

    testWidgets('rates a full-strength password as strong', (tester) async {
      final controller = TextEditingController();
      await tester.pumpWidget(host(PasswordStrengthWidget(passwordController: controller)));
      await type(tester, controller, 'Passw0rd!');
      expect(find.text('Strong'), findsOneWidget);
      controller.dispose();
    });

    testWidgets('shows every requirement in the checklist', (tester) async {
      final controller = TextEditingController();
      await tester.pumpWidget(host(PasswordStrengthWidget(passwordController: controller)));
      await type(tester, controller, 'a');
      for (final requirement in [
        'At least 8 characters',
        'At least 1 capital letter',
        'At least 1 number',
        'At least 1 special character',
      ]) {
        expect(find.text(requirement), findsOneWidget);
      }
      controller.dispose();
    });

    testWidgets('ticks each requirement as it is satisfied', (tester) async {
      final controller = TextEditingController();
      await tester.pumpWidget(host(PasswordStrengthWidget(passwordController: controller)));

      await type(tester, controller, 'a');
      expect(find.byIcon(Icons.check_circle), findsNothing);

      await type(tester, controller, 'Passw0rd!');
      expect(find.byIcon(Icons.check_circle), findsNWidgets(4));
      expect(find.byIcon(Icons.circle_outlined), findsNothing);
      controller.dispose();
    });

    testWidgets('the checklist matches the backend password rule', (tester) async {
      // backend passwordRegex requires 8+ chars, lower, upper, digit, and one
      // of @$!%*?&. A password that satisfies the widget must satisfy the API.
      final controller = TextEditingController();
      await tester.pumpWidget(host(PasswordStrengthWidget(passwordController: controller)));
      await type(tester, controller, 'Passw0rd!');

      expect(find.text('Strong'), findsOneWidget);
      final backendRule = RegExp(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$');
      expect(backendRule.hasMatch('Passw0rd!'), isTrue);
      controller.dispose();
    });

    testWidgets('stops listening once disposed', (tester) async {
      final controller = TextEditingController();
      await tester.pumpWidget(host(PasswordStrengthWidget(passwordController: controller)));
      await type(tester, controller, 'Passw0rd!');
      await tester.pumpWidget(host(const SizedBox()));
      controller.text = 'changed after dispose';
      await tester.pump();
      expect(tester.takeException(), isNull);
      controller.dispose();
    });
  });

  group('SectionHeader', () {
    testWidgets('renders both the eyebrow label and the title', (tester) async {
      await tester.pumpWidget(host(const SectionHeader(
        label: 'EXPLORE', title: 'Popular packages', isDark: false,
      )));
      expect(find.text('EXPLORE'), findsOneWidget);
      expect(find.text('Popular packages'), findsOneWidget);
    });

    testWidgets('renders a trailing action when one is supplied', (tester) async {
      await tester.pumpWidget(host(SectionHeader(
        label: 'EXPLORE', title: 'Popular packages', isDark: false,
        trailing: TextButton(onPressed: () {}, child: const Text('See all')),
      )));
      expect(find.text('See all'), findsOneWidget);
    });

    testWidgets('renders without a trailing action', (tester) async {
      await tester.pumpWidget(host(const SectionHeader(
        label: 'EXPLORE', title: 'Popular packages', isDark: false,
      )));
      expect(find.byType(TextButton), findsNothing);
      expect(tester.takeException(), isNull);
    });

    testWidgets('keeps the title readable in dark mode', (tester) async {
      await tester.pumpWidget(host(const SectionHeader(
        label: 'EXPLORE', title: 'Popular packages', isDark: true,
      )));
      final title = tester.widget<Text>(find.text('Popular packages'));
      expect(title.style?.color, Colors.white);
    });
  });

  group('TranslationHelper', () {
    test('leaves English text untouched when Arabic is not requested', () {
      expect(TranslationHelper.getLocalizedTitle('Petra Tour', false), 'Petra Tour');
      expect(TranslationHelper.getLocalizedDescription('No description available', false), 'No description available');
    });

    test('translates known destination names into Arabic', () {
      expect(TranslationHelper.getLocalizedTitle('Petra', true), 'البتراء');
      expect(TranslationHelper.getLocalizedTitle('Wadi Rum', true), 'وادي رم');
      expect(TranslationHelper.getLocalizedTitle('Amman', true), 'عمان');
      expect(TranslationHelper.getLocalizedTitle('Aqaba', true), 'العقبة');
    });

    test('translates package category names', () {
      expect(TranslationHelper.getLocalizedTitle('Adventure', true), 'مغامرة');
      expect(TranslationHelper.getLocalizedTitle('Cultural', true), 'ثقافي');
      expect(TranslationHelper.getLocalizedTitle('Historical', true), 'تاريخي');
      expect(TranslationHelper.getLocalizedTitle('Family', true), 'عائلي');
    });

    test('matches regardless of the casing the vendor typed', () {
      expect(TranslationHelper.getLocalizedTitle('petra', true), 'البتراء');
      expect(TranslationHelper.getLocalizedTitle('PETRA', true), 'البتراء');
    });

    test('translates the placeholder description', () {
      expect(TranslationHelper.getLocalizedDescription('No description available', true), 'لا يوجد وصف متاح');
    });

    test('leaves an untranslatable title readable rather than blank', () {
      const title = 'Sunset Kayaking';
      expect(TranslationHelper.getLocalizedTitle(title, true), title);
    });

    test('handles an empty string without throwing', () {
      expect(TranslationHelper.getLocalizedTitle('', true), '');
      expect(TranslationHelper.getLocalizedDescription('', true), '');
    });

    test('prefers the longer phrase over its constituent words', () {
      // "Amazing Package" must not become "مذهل باقة" word by word.
      expect(TranslationHelper.getLocalizedTitle('Amazing Package', true), 'باقة مذهلة');
    });
  });
}

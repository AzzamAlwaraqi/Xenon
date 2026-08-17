import 'package:flutter_test/flutter_test.dart';
import 'package:design_only/main.dart';

void main() {
  testWidgets('App launches smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const AhlanApp());
    // The app renders without crashing
    expect(find.byType(AhlanApp), findsOneWidget);
  });
}

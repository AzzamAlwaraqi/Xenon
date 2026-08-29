import 'package:flutter_test/flutter_test.dart';
import 'package:gp/models/ai_advisor_models.dart';

void main() {
  test('parses and limits grounded recommendations to three', () {
    Map<String, dynamic> recommendation(int index) => {
      'package': {
        '_id': 'package-$index',
        'package_name': 'Package $index',
        'package_description': 'Description',
        'package_price': 50,
        'max_people': 10,
      },
      'totalPrice': 200,
      'currency': 'JOD',
      'matchReasons': ['Fits the budget'],
      'weather': {
        'available': true,
        'maxTemperatureC': 27,
        'averageHumidityPercent': 45,
      },
    };
    final response = AiAdvisorResponse.fromJson({
      'reply': 'I found some trips for you.',
      'outcome': 'matches_found',
      'conversationId': 'signed-conversation-token',
      'matchingPackages': List.generate(5, recommendation),
    });
    expect(response.recommendations, hasLength(3));
    expect(response.recommendations.first.package.id, 'package-0');
    expect(response.recommendations.first.weather?.averageHumidityPercent, 45);
  });

  test('skips a malformed recommendation without losing valid packages', () {
    final response = AiAdvisorResponse.fromJson({
      'reply': 'One trip is available.',
      'outcome': 'matches_found',
      'conversationId': 'signed-token',
      'matchingPackages': [
        {'notPackage': true},
        {
          'package': {'_id': 'valid-id', 'package_name': 'Valid package'},
          'totalPrice': 90,
          'currency': 'JOD',
        },
      ],
    });
    expect(response.recommendations.single.package.id, 'valid-id');
  });

  test('rejects a response without a conversation token', () {
    expect(
      () => AiAdvisorResponse.fromJson({'reply': 'Hello'}),
      throwsFormatException,
    );
  });
}

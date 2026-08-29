class AiWeather {
  const AiWeather({
    required this.available,
    this.status,
    this.date,
    this.minTemperatureC,
    this.maxTemperatureC,
    this.averageHumidityPercent,
    this.maximumHumidityPercent,
    this.reason,
  });

  final bool available;
  final String? status;
  final String? date;
  final double? minTemperatureC;
  final double? maxTemperatureC;
  final double? averageHumidityPercent;
  final double? maximumHumidityPercent;
  final String? reason;

  factory AiWeather.fromJson(Map<String, dynamic> json) => AiWeather(
    available: json['available'] == true,
    status: json['status']?.toString(),
    date: json['date']?.toString() ?? json['requestedDate']?.toString(),
    minTemperatureC: _asDouble(json['minTemperatureC']),
    maxTemperatureC: _asDouble(json['maxTemperatureC']),
    averageHumidityPercent: _asDouble(json['averageHumidityPercent']),
    maximumHumidityPercent: _asDouble(json['maximumHumidityPercent']),
    reason: json['reason']?.toString(),
  );
}

class AiPackageSummary {
  const AiPackageSummary({
    required this.id,
    required this.title,
    required this.description,
    required this.pricePerPerson,
    this.type,
    this.imageUrl,
    this.vendorId,
    this.startDate,
    this.endDate,
    this.maximumPeople,
    this.availableSeats,
  });

  final String id;
  final String title;
  final String description;
  final double pricePerPerson;
  final String? type;
  final String? imageUrl;
  final String? vendorId;
  final String? startDate;
  final String? endDate;
  final int? maximumPeople;
  final int? availableSeats;

  bool get canOpen => id.isNotEmpty;

  factory AiPackageSummary.fromJson(Map<String, dynamic> json) {
    final images = json['images'];
    String? imageUrl;
    if (images is List && images.isNotEmpty && images.first is Map) {
      imageUrl = (images.first as Map)['url']?.toString();
    }
    final vendor = json['vendor_id'];
    return AiPackageSummary(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      title: json['package_name']?.toString() ?? 'Available trip',
      description: json['package_description']?.toString() ?? '',
      pricePerPerson: _asDouble(json['package_price']) ?? 0,
      type: json['package_type']?.toString(),
      imageUrl: imageUrl,
      vendorId: vendor is Map ? vendor['_id']?.toString() : vendor?.toString(),
      startDate: json['startDate']?.toString(),
      endDate: json['endDate']?.toString(),
      maximumPeople: _asInt(json['max_people']),
      availableSeats: _asInt(json['available_seats']),
    );
  }
}

class AiRecommendation {
  const AiRecommendation({
    required this.package,
    required this.totalPrice,
    required this.currency,
    required this.matchReasons,
    required this.tradeoffs,
    this.weather,
  });

  final AiPackageSummary package;
  final double totalPrice;
  final String currency;
  final List<String> matchReasons;
  final List<String> tradeoffs;
  final AiWeather? weather;

  factory AiRecommendation.fromJson(Map<String, dynamic> json) {
    final packageJson = json['package'];
    if (packageJson is! Map) {
      throw const FormatException('Recommendation package is missing');
    }
    return AiRecommendation(
      package: AiPackageSummary.fromJson(
        Map<String, dynamic>.from(packageJson),
      ),
      totalPrice: _asDouble(json['totalPrice']) ?? 0,
      currency: json['currency']?.toString() ?? 'JOD',
      matchReasons: _stringList(json['matchReasons']),
      tradeoffs: _stringList(json['tradeoffs']),
      weather: json['weather'] is Map
          ? AiWeather.fromJson(
              Map<String, dynamic>.from(json['weather'] as Map),
            )
          : null,
    );
  }
}

class AiAdvisorResponse {
  const AiAdvisorResponse({
    required this.reply,
    required this.outcome,
    required this.conversationId,
    required this.recommendations,
    required this.suggestions,
  });

  final String reply;
  final String outcome;
  final String conversationId;
  final List<AiRecommendation> recommendations;
  final List<String> suggestions;

  factory AiAdvisorResponse.fromJson(Map<String, dynamic> json) {
    final conversationId = json['conversationId']?.toString() ?? '';
    if (conversationId.isEmpty) {
      throw const FormatException('Conversation is missing');
    }
    final rawRecommendations =
        json['matchingPackages'] ?? json['recommendations'];
    final recommendations = <AiRecommendation>[];
    if (rawRecommendations is List) {
      for (final item in rawRecommendations.take(3)) {
        if (item is Map) {
          try {
            recommendations.add(
              AiRecommendation.fromJson(Map<String, dynamic>.from(item)),
            );
          } on FormatException {
            // One malformed package must not hide otherwise valid results.
          }
        }
      }
    }
    return AiAdvisorResponse(
      reply: json['reply']?.toString().trim().isNotEmpty == true
          ? json['reply'].toString().trim()
          : 'I found an update for your trip.',
      outcome: json['outcome']?.toString() ?? 'unknown',
      conversationId: conversationId,
      recommendations: recommendations,
      suggestions: _stringList(json['suggestions']),
    );
  }
}

enum AiMessageAuthor { customer, assistant }

class AiChatMessage {
  const AiChatMessage({
    required this.author,
    required this.text,
    this.recommendations = const [],
    this.suggestions = const [],
  });

  final AiMessageAuthor author;
  final String text;
  final List<AiRecommendation> recommendations;
  final List<String> suggestions;
}

double? _asDouble(dynamic value) {
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '');
}

int? _asInt(dynamic value) {
  if (value is int) return value;
  // Mongo may return a whole number as a double, which int.tryParse alone would reject.
  if (value is num) return value.round();
  final text = value?.toString() ?? '';
  return int.tryParse(text) ?? double.tryParse(text)?.round();
}

List<String> _stringList(dynamic value) => value is List
    ? value
          .map((item) => item.toString().trim())
          .where((item) => item.isNotEmpty)
          .toList()
    : const [];

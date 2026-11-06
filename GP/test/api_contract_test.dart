import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:gp/models/api_client.dart';
import 'package:gp/models/api_config.dart';

/// Cross-module contract tests.
///
/// The app and the Express API are separate deployables with no shared schema,
/// so route or payload drift is invisible until a screen fails on a phone.
/// These tests parse both sides and compare them.
const Map<String, String> routerMounts = {
  'authRoutes': '/auth',
  'profileRoutes': '/profile',
  'staffRoutes': '/staff',
  'bookingRoutes': '/bookings',
  'packageRoutes': '/packages',
  'adminRoutes': '/admin',
  'aiRoutes': '/ai',
  'complaintRouter': '/complaints',
  'reviewRouter': '/reviews',
  'notificationRoutes': '/notifications',
  'reportRoutes': '/reports',
  'analysisRouter': '/analytics',
  'PaymentRouter': '/payments',
};

String normalise(String path) {
  var value = path
      .replaceAll(RegExp(r'\$\{[^}]*\}'), ':param')
      .replaceAll(RegExp(r'\$\w+'), ':param')
      .replaceAll(RegExp(r':[A-Za-z_][A-Za-z0-9_]*'), ':param');
  final query = value.indexOf('?');
  if (query != -1) value = value.substring(0, query);
  if (value.length > 1 && value.endsWith('/')) value = value.substring(0, value.length - 1);
  return value.isEmpty ? '/' : value;
}

Set<String> readBackendEndpoints() {
  final endpoints = <String>{};
  for (final entry in routerMounts.entries) {
    final file = File('../backend/src/Routes/${entry.key}.js');
    if (!file.existsSync()) continue;
    final source = file.readAsStringSync();
    final pattern = RegExp('''router\\.(get|post|put|patch|delete)\\(\\s*["'`]([^"'`]*)["'`]''');
    for (final match in pattern.allMatches(source)) {
      final method = match.group(1)!.toUpperCase();
      final route = match.group(2)!;
      final full = entry.value + (route == '/' ? '' : route);
      endpoints.add('$method ${normalise(full)}');
    }
  }
  return endpoints;
}

/// Every ApiClient call the app makes, as `METHOD /path`.
List<String> readAppCalls() {
  final calls = <String>[];
  final serviceDir = Directory('lib/models');
  final pattern = RegExp(r"""ApiClient\.(get|post|put|patch|delete)\(\s*(?:'([^']*)'|"([^"]*)")""");

  for (final file in serviceDir.listSync().whereType<File>()) {
    if (!file.path.endsWith('.dart')) continue;
    var source = file.readAsStringSync();
    // Inline the `_baseEndpoint` constant so interpolated paths resolve.
    final base = RegExp(r"static const String _baseEndpoint = '([^']*)'").firstMatch(source);
    if (base != null) {
      source = source.replaceAll(r'$_baseEndpoint', base.group(1)!);
    }
    for (final match in pattern.allMatches(source)) {
      final method = match.group(1)!.toUpperCase();
      final path = match.group(2) ?? match.group(3)!;
      if (!path.startsWith('/')) continue;
      calls.add('$method ${normalise(path)}');
    }
  }
  return calls;
}

void main() {
  final backend = readBackendEndpoints();
  final appCalls = readAppCalls();

  group('mobile app to backend route contract', () {
    test('the backend route table is readable from the test run', () {
      expect(backend.length, greaterThanOrEqualTo(80));
      expect(backend, contains('POST /auth/login'));
      expect(backend, contains('GET /profile/me'));
    });

    test('the app calls a meaningful part of the API', () {
      expect(appCalls.length, greaterThanOrEqualTo(25),
          reason: 'parsed only ${appCalls.length} ApiClient calls');
    });

    test('every endpoint the app calls exists on the backend with the same method', () {
      final missing = appCalls.where((call) => !backend.contains(call)).toSet().toList()..sort();
      expect(missing, isEmpty, reason: 'the app calls routes the API does not expose');
    });

    test('the app never calls the unauthenticated catalogue-rewrite route', () {
      // Backend defect XEN-D03. Removing that route must not break the app.
      expect(backend, contains('GET /packages/fix-ownership'));
      expect(appCalls.any((call) => call.contains('fix-ownership')), isFalse);
    });
  });

  group('request payload contract', () {
    final authSource = File('lib/models/auth_model.dart').readAsStringSync();
    final profileSource = File('lib/models/profile_model.dart').readAsStringSync();
    final backendAuthValidation = File('../backend/src/validations/authValidation.js').readAsStringSync();

    test('registration sends every field the backend registration schema requires', () {
      for (final field in ['name', 'email', 'password', 'passwordConfirm', 'mobileNumber', 'DateOfBirth', 'otp']) {
        expect(authSource, contains("'$field'"), reason: 'registration must send $field');
      }
    });

    test('registration sends an OTP, so the app cannot bypass email verification', () {
      expect(authSource, contains("'otp': otp"));
      expect(backendAuthValidation, contains('otp: joi.string().trim().required()'));
    });

    test('password reset uses the field names the backend reset schema accepts', () {
      // Backend maps password -> new password and confirm_password -> confirmation.
      expect(authSource, contains("'password': newPassword"));
      expect(authSource, contains("'confirm_password': newPassword"));
      expect(authSource, contains("'otpCode': otpCode"));
    });

    test('KNOWN DEFECT XEN-D24: change password sends field names the backend cannot map', () {
      // backend/src/validations/authValidation.js reads old_password from
      // (oldPassword | old_password) and requires confirm_password. The app
      // sends currentPassword and no confirmation, so every change-password
      // request is rejected with HTTP 400 before reaching the controller.
      expect(profileSource, contains("'currentPassword': currentPassword"));
      expect(profileSource.contains("'old_password'"), isFalse);
      expect(profileSource.contains("'oldPassword'"), isFalse);
      expect(profileSource.contains('confirm_password'), isFalse);
      expect(backendAuthValidation, contains('old_password: joi.string().required()'));
      expect(backendAuthValidation, contains('confirm_password: joi.string()'));
    });
  });

  group('ApiConfig', () {
    test('identifies the client as mobile so the backend channel policy passes', () {
      // The backend refuses a tourist login that does not arrive from the app.
      expect(ApiConfig.headers['x-client-type'], 'mobile');
    });

    test('sends and accepts JSON', () {
      expect(ApiConfig.headers['Content-Type'], 'application/json');
      expect(ApiConfig.headers['Accept'], 'application/json');
    });

    test('targets the versioned API prefix', () {
      expect(ApiConfig.baseUrl, endsWith('/api/v1'));
    });

    test('KNOWN DEFECT XEN-D25: a developer LAN address is hardcoded as the Android host', () {
      final source = File('lib/models/api_config.dart').readAsStringSync();
      expect(source, contains('192.168.1.157'),
          reason: 'the Android build points at one machine on one Wi-Fi network');
      expect(source.contains('String.fromEnvironment'), isFalse,
          reason: 'the host should come from build configuration, not a literal');
    });
  });

  group('ApiException', () {
    test('carries the status code and the human-readable message', () {
      final error = ApiException('Package not found', 404);
      expect(error.statusCode, 404);
      expect(error.message, 'Package not found');
      expect(error.toString(), 'Package not found');
    });

    test('carries the machine-readable code so callers do not match on wording', () {
      final error = ApiException('Conversation expired', 400, code: 'CONVERSATION_EXPIRED');
      expect(error.code, 'CONVERSATION_EXPIRED');
    });

    test('carries the server request id for failure reports', () {
      expect(ApiException('boom', 500, requestId: 'req-1').requestId, 'req-1');
    });

    test('leaves the optional fields null when the API supplies none', () {
      final error = ApiException('boom', 500);
      expect(error.code, isNull);
      expect(error.requestId, isNull);
    });

    test('is a real Exception, so it can be caught by type', () {
      expect(ApiException('boom', 500), isA<Exception>());
    });
  });
}

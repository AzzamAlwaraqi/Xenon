// TODO: Add to pubspec.yaml:
//   dio: ^5.7.0
//
// import 'package:dio/dio.dart';
// import 'interceptors.dart';

const String _baseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:3000/api/v1', // Android emulator → host machine
);

// class ApiClient {
//   ApiClient._();
//
//   static final Dio _dio = Dio(
//     BaseOptions(
//       baseUrl: _baseUrl,
//       connectTimeout: const Duration(seconds: 10),
//       receiveTimeout: const Duration(seconds: 10),
//       headers: {'Content-Type': 'application/json'},
//     ),
//   )..interceptors.addAll([
//     AuthInterceptor(),
//     LoggingInterceptor(),
//   ]);
//
//   static Dio get instance => _dio;
// }

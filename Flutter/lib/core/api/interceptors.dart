// TODO: Add dio: ^5.7.0 to pubspec.yaml
//
// import 'package:dio/dio.dart';
// import '../services/storage_service.dart';

// ── Auth Interceptor ──────────────────────────────────────────────────────
// Attaches JWT token to every request
//
// class AuthInterceptor extends Interceptor {
//   @override
//   void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
//     final token = StorageService.getToken();
//     if (token != null) {
//       options.headers['Authorization'] = 'Bearer $token';
//     }
//     handler.next(options);
//   }
//
//   @override
//   void onError(DioException err, ErrorInterceptorHandler handler) {
//     if (err.response?.statusCode == 401) {
//       StorageService.clearToken();
//       // Navigate to login
//     }
//     handler.next(err);
//   }
// }

// ── Logging Interceptor ───────────────────────────────────────────────────
// class LoggingInterceptor extends LogInterceptor {
//   LoggingInterceptor() : super(requestBody: true, responseBody: true);
// }

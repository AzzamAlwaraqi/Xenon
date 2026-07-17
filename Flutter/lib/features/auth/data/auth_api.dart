// import '../../../core/api/api_client.dart';

class AuthApi {
  // final Dio _dio = ApiClient.instance;

  Future<Map<String, dynamic>> login(String email, String password) async {
    // final response = await _dio.post('/clients/login', data: {
    //   'email': email,
    //   'password': password,
    // });
    // return response.data;
    throw UnimplementedError('Wire up ApiClient first.');
  }

  Future<Map<String, dynamic>> register(Map<String, dynamic> data) async {
    // final response = await _dio.post('/clients/register', data: data);
    // return response.data;
    throw UnimplementedError('Wire up ApiClient first.');
  }

  Future<void> logout() async {
    // await _dio.post('/clients/logout');
  }

  Future<Map<String, dynamic>> getMe() async {
    // final response = await _dio.get('/clients/me');
    // return response.data;
    throw UnimplementedError('Wire up ApiClient first.');
  }
}

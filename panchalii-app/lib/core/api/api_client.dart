import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// Override per build: --dart-define=API_URL=https://panchalii-api-production.up.railway.app/v1
const _baseUrl = String.fromEnvironment('API_URL', defaultValue: 'http://localhost:4000/v1');
const _storage = FlutterSecureStorage();

Dio buildDio() {
  final dio = Dio(
    BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  // Auth interceptor
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshToken = await _storage.read(key: 'refresh_token');
          if (refreshToken != null) {
            try {
              final res = await Dio(BaseOptions(baseUrl: _baseUrl)).post(
                '/public/auth/refresh-tokens',
                data: {'refreshToken': refreshToken},
              );
              // The API rotates refresh tokens (the old one is deleted), so store both
              final tokens = res.data['tokens'];
              final newAccess = tokens['access']['token'] as String;
              await saveTokens(newAccess, tokens['refresh']['token'] as String);
              error.requestOptions.headers['Authorization'] =
                  'Bearer $newAccess';
              final retry = await Dio().fetch(error.requestOptions);
              return handler.resolve(retry);
            } catch (_) {
              await _storage.deleteAll();
            }
          }
        }
        handler.next(error);
      },
    ),
  );

  return dio;
}

Future<void> saveTokens(String access, String refresh) async {
  await _storage.write(key: 'access_token', value: access);
  await _storage.write(key: 'refresh_token', value: refresh);
}

Future<void> clearTokens() async {
  await _storage.deleteAll();
}

Future<String?> getAccessToken() => _storage.read(key: 'access_token');

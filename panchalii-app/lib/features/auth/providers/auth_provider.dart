import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';

import '../../../core/api/api_client.dart';
import '../models/user_model.dart';

final dioProvider = Provider<Dio>((ref) => buildDio());

final authStateProvider = FutureProvider<UserModel?>((ref) async {
  final token = await getAccessToken();
  if (token == null) return null;
  try {
    final dio = ref.read(dioProvider);
    final res = await dio.get('/me/profile');
    return UserModel.fromJson(res.data['data'] as Map<String, dynamic>);
  } catch (_) {
    return null;
  }
});

final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
      return AuthNotifier(ref.read(dioProvider), ref);
    });

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final Dio _dio;
  final Ref _ref;
  AuthNotifier(this._dio, this._ref) : super(const AsyncValue.data(null));

  Future<void> loginEmail(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final res = await _dio.post(
        '/public/auth/login',
        data: {'email': email, 'password': password},
      );
      await _handleAuthResponse(res.data);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
      rethrow;
    }
  }

  Future<void> loginOtp(String phone, String otp) async {
    state = const AsyncValue.loading();
    try {
      final res = await _dio.post(
        '/public/auth/verify-login-otp',
        data: {'identifier': phone, 'otp': otp},
      );
      await _handleAuthResponse(res.data);
    } catch (e, s) {
      state = AsyncValue.error(e, s);
      rethrow;
    }
  }

  Future<void> register(
    String name,
    String email,
    String phone,
    String password,
  ) async {
    await _dio.post(
      '/public/auth/register',
      data: {
        'name': name,
        'email': email,
        'phone': phone,
        'password': password,
      },
    );
  }

  /// Confirms the emailed registration code; the API returns tokens, so this also signs the user in.
  Future<void> verifyRegistration(String identifier, String otp) async {
    final res = await _dio.post(
      '/public/auth/verify-otp',
      data: {'identifier': identifier, 'otp': otp},
    );
    await _handleAuthResponse(res.data);
  }

  Future<void> sendOtp(String identifier, String type) async {
    await _dio.post(
      '/public/auth/send-otp',
      data: {'identifier': identifier, 'type': type},
    );
  }

  Future<void> logout() async {
    await clearTokens();
    state = const AsyncValue.data(null);
    // Screens read authStateProvider, which is only computed once; recompute it on sign-in/out
    _ref.invalidate(authStateProvider);
  }

  Future<void> _handleAuthResponse(dynamic data) async {
    // API returns { success, user, tokens } at the top level
    final tokens = data['tokens'];
    await saveTokens(
      tokens['access']['token'] as String,
      tokens['refresh']['token'] as String,
    );
    final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
    state = AsyncValue.data(user);
    _ref.invalidate(authStateProvider);
  }
}

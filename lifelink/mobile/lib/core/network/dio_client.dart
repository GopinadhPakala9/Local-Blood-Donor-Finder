import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';
import '../errors/app_exception.dart';

class DioClient {
  static Dio? _instance;

  static Dio get instance {
    _instance ??= _createDio();
    return _instance!;
  }

  static Dio _createDio() {
    final dio = Dio(BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
    ));

    dio.interceptors.addAll([
      _AuthInterceptor(dio),
      if (kDebugMode) LogInterceptor(requestBody: true, responseBody: true),
    ]);

    return dio;
  }
}

class _AuthInterceptor extends QueuedInterceptor {
  final Dio dio;
  final _storage = const FlutterSecureStorage();
  bool _isRefreshing = false;

  _AuthInterceptor(this.dio);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.read(key: AppConstants.accessTokenKey);
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 && !_isRefreshing) {
      _isRefreshing = true;
      try {
        final refreshToken = await _storage.read(key: AppConstants.refreshTokenKey);
        if (refreshToken == null) {
          await _storage.deleteAll();
          handler.next(err);
          return;
        }
        final response = await Dio().post(
          '${AppConstants.baseUrl}/auth/refresh',
          data: {'refreshToken': refreshToken},
        );
        final newToken = response.data['data']['accessToken'];
        await _storage.write(key: AppConstants.accessTokenKey, value: newToken);
        err.requestOptions.headers['Authorization'] = 'Bearer $newToken';
        final retryResponse = await dio.fetch(err.requestOptions);
        handler.resolve(retryResponse);
      } catch (_) {
        await _storage.deleteAll();
        handler.next(err);
      } finally {
        _isRefreshing = false;
      }
    } else {
      handler.next(err);
    }
  }
}

AppException handleDioError(DioException e) {
  if (e.type == DioExceptionType.connectionTimeout ||
      e.type == DioExceptionType.receiveTimeout ||
      e.type == DioExceptionType.connectionError) {
    return const NetworkException('No internet connection. Please check your network.');
  }
  final statusCode = e.response?.statusCode;
  final message = e.response?.data?['error']?['message'] ?? e.message ?? 'Something went wrong';
  if (statusCode == 401) return AuthException(message, code: statusCode);
  if (statusCode == 404) return NotFoundException(message, code: statusCode);
  if (statusCode == 400 || statusCode == 422) return ValidationException(message, code: statusCode);
  if (statusCode != null && statusCode >= 500) return ServerException(message, code: statusCode);
  return UnknownException(message, code: statusCode);
}

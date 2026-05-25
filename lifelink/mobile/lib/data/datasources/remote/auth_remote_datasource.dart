import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/errors/app_exception.dart';
import '../../../domain/entities/user_entity.dart';

class AuthRemoteDataSource {
  final Dio _dio = DioClient.instance;

  Future<Map<String, dynamic>> sendOtp(String phone) async {
    try {
      final res = await _dio.post('/auth/send-otp', data: {'phone': phone});
      return res.data['data'];
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> verifyOtp(String phone, String otp) async {
    try {
      final res = await _dio.post('/auth/verify-otp', data: {'phone': phone, 'otp': otp});
      return res.data['data'];
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> googleLogin(String idToken) async {
    try {
      final res = await _dio.post('/auth/google', data: {'idToken': idToken});
      return res.data['data'];
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }

  Future<UserEntity> getMe() async {
    try {
      final res = await _dio.get('/users/me');
      return _mapUser(res.data['data']);
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }

  Future<void> updateFcmToken(String token) async {
    try {
      await _dio.put('/users/me/fcm-token', data: {'fcmToken': token});
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }

  UserEntity _mapUser(Map<String, dynamic> json) => UserEntity(
        id: json['id'],
        name: json['name'] ?? '',
        phone: json['phone'] ?? '',
        email: json['email'],
        role: json['role'] ?? 'donor',
        bloodGroup: json['blood_group'],
        gender: json['gender'],
        dob: json['dob'],
        weight: double.tryParse(json['weight']?.toString() ?? ''),
        city: json['city'],
        state: json['state'],
        latitude: double.tryParse(json['latitude']?.toString() ?? ''),
        longitude: double.tryParse(json['longitude']?.toString() ?? ''),
        isAvailable: json['is_available'] ?? true,
        isVerified: json['is_verified'] ?? false,
      );
}

import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../core/constants/app_constants.dart';
import '../../../domain/entities/user_entity.dart';

class AuthLocalDataSource {
  final _storage = const FlutterSecureStorage();

  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await Future.wait([
      _storage.write(key: AppConstants.accessTokenKey, value: accessToken),
      _storage.write(key: AppConstants.refreshTokenKey, value: refreshToken),
    ]);
  }

  Future<String?> getAccessToken() => _storage.read(key: AppConstants.accessTokenKey);
  Future<String?> getRefreshToken() => _storage.read(key: AppConstants.refreshTokenKey);

  Future<void> saveUser(UserEntity user) async {
    await _storage.write(
      key: AppConstants.userKey,
      value: jsonEncode({
        'id': user.id, 'name': user.name, 'phone': user.phone,
        'email': user.email, 'role': user.role, 'blood_group': user.bloodGroup,
        'city': user.city, 'is_available': user.isAvailable, 'is_verified': user.isVerified,
      }),
    );
  }

  Future<UserEntity?> getUser() async {
    final data = await _storage.read(key: AppConstants.userKey);
    if (data == null) return null;
    final json = jsonDecode(data);
    return UserEntity(
      id: json['id'], name: json['name'], phone: json['phone'],
      email: json['email'], role: json['role'], bloodGroup: json['blood_group'],
      city: json['city'], isAvailable: json['is_available'] ?? true,
      isVerified: json['is_verified'] ?? false,
    );
  }

  Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    return token != null;
  }

  Future<void> clearAll() => _storage.deleteAll();
}

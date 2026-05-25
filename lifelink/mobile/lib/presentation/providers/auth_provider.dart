import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../../core/utils/fcm_service.dart';
import '../../data/datasources/local/auth_local_datasource.dart';
import '../../data/datasources/remote/auth_remote_datasource.dart';
import '../../domain/entities/user_entity.dart';

final authLocalDataSourceProvider = Provider((ref) => AuthLocalDataSource());
final authRemoteDataSourceProvider = Provider((ref) => AuthRemoteDataSource());

final authProvider = AsyncNotifierProvider<AuthNotifier, UserEntity?>(() => AuthNotifier());

class AuthNotifier extends AsyncNotifier<UserEntity?> {
  late AuthLocalDataSource _local;
  late AuthRemoteDataSource _remote;

  @override
  Future<UserEntity?> build() async {
    _local = ref.read(authLocalDataSourceProvider);
    _remote = ref.read(authRemoteDataSourceProvider);
    final isLoggedIn = await _local.isLoggedIn();
    if (!isLoggedIn) return null;
    try {
      final user = await _remote.getMe();
      await _local.saveUser(user);
      return user;
    } catch (_) {
      return _local.getUser();
    }
  }

  Future<void> sendOtp(String phone) async {
    await _remote.sendOtp(phone);
  }

  Future<void> verifyOtp(String phone, String otp) async {
    state = const AsyncLoading();
    final result = await _remote.verifyOtp(phone, otp);
    final accessToken = result['accessToken'];
    final refreshToken = result['refreshToken'];
    await _local.saveTokens(accessToken, refreshToken);
    final user = await _remote.getMe();
    await _local.saveUser(user);
    final fcmToken = await FcmService.getToken();
    if (fcmToken != null) await _remote.updateFcmToken(fcmToken);
    state = AsyncData(user);
  }

  Future<void> googleLogin() async {
    state = const AsyncLoading();
    final googleSignIn = GoogleSignIn();
    final account = await googleSignIn.signIn();
    if (account == null) { state = const AsyncData(null); return; }
    final auth = await account.authentication;
    final idToken = auth.idToken;
    if (idToken == null) throw Exception('No ID token');
    final result = await _remote.googleLogin(idToken);
    await _local.saveTokens(result['accessToken'], result['refreshToken']);
    final user = await _remote.getMe();
    await _local.saveUser(user);
    state = AsyncData(user);
  }

  Future<void> logout() async {
    await _local.clearAll();
    state = const AsyncData(null);
  }
}

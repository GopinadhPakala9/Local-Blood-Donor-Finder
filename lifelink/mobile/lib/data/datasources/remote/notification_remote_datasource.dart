import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/errors/app_exception.dart';
import '../../../domain/entities/notification_entity.dart';

class NotificationRemoteDataSource {
  final Dio _dio = DioClient.instance;

  Future<Map<String, dynamic>> getNotifications({int page = 1, int limit = 20}) async {
    try {
      final res = await _dio.get('/notifications', queryParameters: {'page': page, 'limit': limit});
      return res.data['data'];
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _dio.put('/notifications/$id/read');
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }

  Future<void> markAllRead() async {
    try {
      await _dio.put('/notifications/read-all');
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }
}

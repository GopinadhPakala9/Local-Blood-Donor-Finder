import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/errors/app_exception.dart';
import '../../../domain/entities/blood_request_entity.dart';

class BloodRequestRemoteDataSource {
  final Dio _dio = DioClient.instance;

  Future<BloodRequestEntity> createRequest(Map<String, dynamic> data) async {
    try {
      final res = await _dio.post('/blood-requests', data: data);
      return BloodRequestEntity.fromJson(res.data['data']);
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }

  Future<Map<String, dynamic>> getRequests({
    String? bloodGroup, String? city, String? urgency,
    String status = 'Open', int page = 1, int limit = 20,
  }) async {
    try {
      final res = await _dio.get('/blood-requests', queryParameters: {
        if (bloodGroup != null) 'blood_group': bloodGroup,
        if (city != null) 'city': city,
        if (urgency != null) 'urgency': urgency,
        'status': status, 'page': page, 'limit': limit,
      });
      return res.data['data'];
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }

  Future<List<BloodRequestEntity>> getNearbyRequests(double lat, double lng, {int radius = 20}) async {
    try {
      final res = await _dio.get('/blood-requests/nearby', queryParameters: {
        'latitude': lat, 'longitude': lng, 'radius': radius,
      });
      final list = res.data['data'] as List;
      return list.map((e) => BloodRequestEntity.fromJson(e)).toList();
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }

  Future<BloodRequestEntity> getRequestById(String id) async {
    try {
      final res = await _dio.get('/blood-requests/$id');
      return BloodRequestEntity.fromJson(res.data['data']);
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }
}

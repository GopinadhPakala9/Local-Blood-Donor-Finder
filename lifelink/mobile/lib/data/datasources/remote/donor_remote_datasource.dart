import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/errors/app_exception.dart';
import '../../../domain/entities/donor_entity.dart';

class DonorRemoteDataSource {
  final Dio _dio = DioClient.instance;

  Future<Map<String, dynamic>> searchDonors({
    String? bloodGroup, double? lat, double? lng,
    int? radius, String? city, int page = 1, int limit = 20,
  }) async {
    try {
      final res = await _dio.get('/donors/search', queryParameters: {
        if (bloodGroup != null) 'blood_group': bloodGroup,
        if (lat != null) 'latitude': lat,
        if (lng != null) 'longitude': lng,
        if (radius != null) 'radius': radius,
        if (city != null) 'city': city,
        'page': page,
        'limit': limit,
      });
      return res.data['data'];
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }

  Future<DonorEntity> getDonorById(String id, {double? lat, double? lng}) async {
    try {
      final res = await _dio.get('/donors/$id', queryParameters: {
        if (lat != null) 'latitude': lat,
        if (lng != null) 'longitude': lng,
      });
      return DonorEntity.fromJson(res.data['data']);
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }

  Future<void> registerDonor(Map<String, dynamic> data) async {
    try {
      await _dio.post('/donors/register', data: data);
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }

  Future<List<DonorEntity>> getNearbyDonors(double lat, double lng, {int radius = 10}) async {
    try {
      final res = await _dio.get('/donors/nearby', queryParameters: {
        'latitude': lat, 'longitude': lng, 'radius': radius,
      });
      final list = res.data['data'] as List;
      return list.map((e) => DonorEntity.fromJson(e)).toList();
    } on DioException catch (e) {
      throw handleDioError(e);
    }
  }
}

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/remote/donor_remote_datasource.dart';
import '../../domain/entities/donor_entity.dart';

final donorRemoteDataSourceProvider = Provider((ref) => DonorRemoteDataSource());

class DonorSearchParams {
  final String? bloodGroup;
  final int radius;
  final double? latitude;
  final double? longitude;
  final String? city;
  final int page;
  DonorSearchParams({this.bloodGroup, this.radius = 10, this.latitude, this.longitude, this.city, this.page = 1});
}

final donorSearchProvider = FutureProvider.family<Map<String, dynamic>, DonorSearchParams>((ref, params) async {
  final ds = ref.read(donorRemoteDataSourceProvider);
  return ds.searchDonors(
    bloodGroup: params.bloodGroup,
    lat: params.latitude,
    lng: params.longitude,
    radius: params.radius,
    city: params.city,
    page: params.page,
  );
});

final donorProfileProvider = FutureProvider.family<DonorEntity, String>((ref, id) async {
  final ds = ref.read(donorRemoteDataSourceProvider);
  return ds.getDonorById(id);
});

final nearbyDonorsProvider = FutureProvider.family<List<DonorEntity>, ({double lat, double lng, int radius})>((ref, args) async {
  final ds = ref.read(donorRemoteDataSourceProvider);
  return ds.getNearbyDonors(args.lat, args.lng, radius: args.radius);
});

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/remote/blood_request_remote_datasource.dart';
import '../../domain/entities/blood_request_entity.dart';

final bloodRequestDataSourceProvider = Provider((ref) => BloodRequestRemoteDataSource());

final nearbyRequestsProvider = FutureProvider.family<List<BloodRequestEntity>, ({double lat, double lng})>((ref, args) async {
  final ds = ref.read(bloodRequestDataSourceProvider);
  return ds.getNearbyRequests(args.lat, args.lng);
});

final bloodRequestsProvider = FutureProvider.family<Map<String, dynamic>, Map<String, dynamic>>((ref, filters) async {
  final ds = ref.read(bloodRequestDataSourceProvider);
  return ds.getRequests(
    bloodGroup: filters['blood_group'],
    city: filters['city'],
    urgency: filters['urgency'],
    page: filters['page'] ?? 1,
  );
});

final bloodRequestDetailProvider = FutureProvider.family<BloodRequestEntity, String>((ref, id) async {
  return ref.read(bloodRequestDataSourceProvider).getRequestById(id);
});

final createRequestProvider = AsyncNotifierProvider<CreateRequestNotifier, void>(() => CreateRequestNotifier());

class CreateRequestNotifier extends AsyncNotifier<void> {
  @override
  Future<void> build() async {}

  Future<BloodRequestEntity> createRequest(Map<String, dynamic> data) async {
    state = const AsyncLoading();
    final result = await ref.read(bloodRequestDataSourceProvider).createRequest(data);
    state = const AsyncData(null);
    return result;
  }
}

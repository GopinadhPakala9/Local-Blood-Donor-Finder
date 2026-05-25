import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/remote/notification_remote_datasource.dart';
import '../../domain/entities/notification_entity.dart';

final notifDataSourceProvider = Provider((ref) => NotificationRemoteDataSource());

final notificationsProvider = AsyncNotifierProvider<NotificationsNotifier, List<NotificationEntity>>(
  () => NotificationsNotifier(),
);

class NotificationsNotifier extends AsyncNotifier<List<NotificationEntity>> {
  @override
  Future<List<NotificationEntity>> build() async {
    final ds = ref.read(notifDataSourceProvider);
    final result = await ds.getNotifications();
    final list = result['notifications'] as List;
    return list.map((e) => NotificationEntity.fromJson(e)).toList();
  }

  Future<void> markRead(String id) async {
    await ref.read(notifDataSourceProvider).markRead(id);
    final current = state.value ?? [];
    state = AsyncData(current.map((n) => n.id == id ? _markAsRead(n) : n).toList());
  }

  Future<void> markAllRead() async {
    await ref.read(notifDataSourceProvider).markAllRead();
    final current = state.value ?? [];
    state = AsyncData(current.map(_markAsRead).toList());
  }

  NotificationEntity _markAsRead(NotificationEntity n) => NotificationEntity(
        id: n.id, title: n.title, body: n.body,
        isRead: true, createdAt: n.createdAt, data: n.data,
      );
}

final unreadCountProvider = Provider<int>((ref) {
  final notifs = ref.watch(notificationsProvider).value ?? [];
  return notifs.where((n) => !n.isRead).length;
});

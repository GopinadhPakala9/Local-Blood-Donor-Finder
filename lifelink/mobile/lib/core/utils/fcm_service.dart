import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

class FcmService {
  static final _messaging = FirebaseMessaging.instance;
  static final _localNotifications = FlutterLocalNotificationsPlugin();
  static final _storage = const FlutterSecureStorage();

  static const _channel = AndroidNotificationChannel(
    'lifelink_alerts',
    'LifeLink Alerts',
    description: 'Emergency blood request notifications',
    importance: Importance.max,
    playSound: true,
  );

  static Future<void> initialize() async {
    final settings = await _messaging.requestPermission(alert: true, badge: true, sound: true);
    if (settings.authorizationStatus == AuthorizationStatus.denied) return;

    await _localNotifications.initialize(
      const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(),
      ),
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(_channel);

    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

    final token = await _messaging.getToken();
    if (token != null) await _storage.write(key: AppConstants.fcmTokenKey, value: token);

    _messaging.onTokenRefresh.listen((token) async {
      await _storage.write(key: AppConstants.fcmTokenKey, value: token);
    });
  }

  static Future<String?> getToken() async {
    return _storage.read(key: AppConstants.fcmTokenKey) ?? _messaging.getToken();
  }

  static void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;
    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.max,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(),
      ),
    );
  }

  static void _handleMessageOpenedApp(RemoteMessage message) {
    // Navigation handled by app router based on data payload
  }
}

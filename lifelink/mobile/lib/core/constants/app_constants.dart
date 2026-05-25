class AppConstants {
  static const String appName = 'LifeLink';
  static const String tagline = 'Connecting Donors, Saving Lives';
  static const String baseUrl = 'https://api.lifelink.health/api/v1';

  static const List<String> bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  static const List<String> urgencyLevels = ['Normal', 'Urgent', 'Critical'];

  static const List<int> radiusOptions = [5, 10, 25, 50];

  static const Map<String, String> bloodGroupCompatibility = {
    'O-': 'Universal Donor',
    'AB+': 'Universal Recipient',
    'O+': 'Most Common',
    'AB-': 'Rarest Type',
  };

  // Hive box names
  static const String cacheBox = 'cache';
  static const String authBox = 'auth';

  // Hive keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user';
  static const String fcmTokenKey = 'fcm_token';
}

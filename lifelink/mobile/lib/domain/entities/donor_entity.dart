class DonorEntity {
  final String id;
  final String name;
  final String bloodGroup;
  final String? city;
  final String? state;
  final bool isAvailable;
  final bool isVerified;
  final int totalDonations;
  final String? lastDonationDate;
  final String badge;
  final String? distance;
  final String? phone;

  const DonorEntity({
    required this.id,
    required this.name,
    required this.bloodGroup,
    this.city,
    this.state,
    this.isAvailable = true,
    this.isVerified = false,
    this.totalDonations = 0,
    this.lastDonationDate,
    this.badge = 'New',
    this.distance,
    this.phone,
  });

  factory DonorEntity.fromJson(Map<String, dynamic> json) => DonorEntity(
        id: json['id'],
        name: json['name'],
        bloodGroup: json['blood_group'],
        city: json['city'],
        state: json['state'],
        isAvailable: json['is_available'] ?? true,
        isVerified: json['is_verified'] ?? false,
        totalDonations: int.tryParse(json['total_donations']?.toString() ?? '0') ?? 0,
        lastDonationDate: json['last_donation_date'],
        badge: json['badge'] ?? 'New',
        distance: json['distance'],
        phone: json['phone'],
      );
}

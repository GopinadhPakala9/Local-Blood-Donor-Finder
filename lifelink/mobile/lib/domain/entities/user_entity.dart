class UserEntity {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final String role;
  final String? bloodGroup;
  final String? gender;
  final String? dob;
  final double? weight;
  final String? city;
  final String? state;
  final double? latitude;
  final double? longitude;
  final bool isAvailable;
  final bool isVerified;
  final int totalDonations;
  final String? lastDonationDate;
  final int rewardPoints;
  final String badge;

  const UserEntity({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    required this.role,
    this.bloodGroup,
    this.gender,
    this.dob,
    this.weight,
    this.city,
    this.state,
    this.latitude,
    this.longitude,
    this.isAvailable = true,
    this.isVerified = false,
    this.totalDonations = 0,
    this.lastDonationDate,
    this.rewardPoints = 0,
    this.badge = 'New',
  });

  bool get isDonorEligible {
    if (lastDonationDate == null) return true;
    final last = DateTime.tryParse(lastDonationDate!);
    if (last == null) return true;
    return DateTime.now().difference(last).inDays >= 90;
  }
}

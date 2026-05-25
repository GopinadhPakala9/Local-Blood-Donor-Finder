class BloodRequestEntity {
  final String id;
  final String patientName;
  final String bloodGroup;
  final int unitsRequired;
  final String hospitalName;
  final String contactNumber;
  final String? requiredDate;
  final String urgency;
  final String status;
  final String? city;
  final double? latitude;
  final double? longitude;
  final String? distance;
  final String? requesterName;
  final String createdAt;

  const BloodRequestEntity({
    required this.id,
    required this.patientName,
    required this.bloodGroup,
    required this.unitsRequired,
    required this.hospitalName,
    required this.contactNumber,
    this.requiredDate,
    required this.urgency,
    required this.status,
    this.city,
    this.latitude,
    this.longitude,
    this.distance,
    this.requesterName,
    required this.createdAt,
  });

  factory BloodRequestEntity.fromJson(Map<String, dynamic> json) => BloodRequestEntity(
        id: json['id'],
        patientName: json['patient_name'],
        bloodGroup: json['blood_group'],
        unitsRequired: json['units_required'] ?? 1,
        hospitalName: json['hospital_name'],
        contactNumber: json['contact_number'],
        requiredDate: json['required_date'],
        urgency: json['urgency'] ?? 'Normal',
        status: json['status'] ?? 'Open',
        city: json['city'],
        latitude: double.tryParse(json['latitude']?.toString() ?? ''),
        longitude: double.tryParse(json['longitude']?.toString() ?? ''),
        distance: json['distance_km'] != null ? '${json['distance_km']} km' : null,
        requesterName: json['requester']?['name'],
        createdAt: json['created_at'] ?? DateTime.now().toIso8601String(),
      );
}

import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/whatsapp_utils.dart';
import '../../../domain/entities/blood_request_entity.dart';
import 'blood_group_badge.dart';

class RequestCard extends StatelessWidget {
  final BloodRequestEntity request;
  const RequestCard({super.key, required this.request});

  Color get _urgencyColor => switch (request.urgency) {
    'Critical' => AppTheme.urgencyCritical,
    'Urgent' => AppTheme.urgencyUrgent,
    _ => AppTheme.urgencyNormal,
  };

  String get _urgencyEmoji => switch (request.urgency) {
    'Critical' => '🚨',
    'Urgent' => '⚠️',
    _ => '✅',
  };

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border(left: BorderSide(color: _urgencyColor, width: 4)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                BloodGroupBadge(bloodGroup: request.bloodGroup, size: 44),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: _urgencyColor, borderRadius: BorderRadius.circular(8)),
                      child: Text('$_urgencyEmoji ${request.urgency}', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                    ),
                    const Spacer(),
                    if (request.distance != null)
                      Row(children: [
                        const Icon(Icons.location_on, size: 13, color: AppTheme.primary),
                        Text(request.distance!, style: const TextStyle(color: AppTheme.primary, fontSize: 12, fontWeight: FontWeight.w500)),
                      ]),
                  ]),
                  const SizedBox(height: 4),
                  Text(request.patientName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                ])),
              ]),
              const SizedBox(height: 10),
              _infoRow(Icons.local_hospital, request.hospitalName),
              const SizedBox(height: 4),
              _infoRow(Icons.bloodtype, '${request.unitsRequired} unit${request.unitsRequired > 1 ? 's' : ''} needed'),
              if (request.city != null) ...[
                const SizedBox(height: 4),
                _infoRow(Icons.location_city, request.city!),
              ],
              const SizedBox(height: 10),
              Row(children: [
                Expanded(child: OutlinedButton.icon(
                  icon: const Icon(Icons.phone, size: 16),
                  label: const Text('Call', style: TextStyle(fontSize: 13)),
                  onPressed: () => WhatsAppUtils.makeCall(request.contactNumber),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.green,
                    side: const BorderSide(color: Colors.green),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                )),
                const SizedBox(width: 8),
                Expanded(child: ElevatedButton.icon(
                  icon: const Icon(Icons.chat, size: 16),
                  label: const Text('WhatsApp', style: TextStyle(fontSize: 13)),
                  onPressed: () => WhatsAppUtils.openWhatsApp(request.contactNumber, 'Hi, I can help with ${request.bloodGroup} blood for ${request.patientName} at ${request.hospitalName}'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF25D366),
                    padding: const EdgeInsets.symmetric(vertical: 8),
                  ),
                )),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) => Row(children: [
    Icon(icon, size: 14, color: Colors.grey),
    const SizedBox(width: 6),
    Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: Colors.grey), overflow: TextOverflow.ellipsis)),
  ]);
}

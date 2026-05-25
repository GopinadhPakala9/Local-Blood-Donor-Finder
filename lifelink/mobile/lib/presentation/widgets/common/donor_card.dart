import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/whatsapp_utils.dart';
import 'blood_group_badge.dart';

class DonorCard extends StatelessWidget {
  final Map<String, dynamic> donor;
  const DonorCard({super.key, required this.donor});

  @override
  Widget build(BuildContext context) {
    final name = donor['name'] as String? ?? '';
    final bloodGroup = donor['blood_group'] as String? ?? '';
    final city = donor['city'] as String? ?? '';
    final distance = donor['distance'] as String?;
    final isAvailable = donor['is_available'] as bool? ?? true;
    final totalDonations = int.tryParse(donor['total_donations']?.toString() ?? '0') ?? 0;
    final badge = donor['badge'] as String? ?? 'New';
    final phone = donor['phone'] as String?;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => context.push('/donor/${donor['id']}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              BloodGroupBadge(bloodGroup: bloodGroup, size: 52),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15), overflow: TextOverflow.ellipsis)),
                      _availabilityDot(isAvailable),
                    ]),
                    const SizedBox(height: 4),
                    Row(children: [
                      const Icon(Icons.location_on, size: 13, color: Colors.grey),
                      Text(city, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                      if (distance != null) ...[
                        Text(' • ', style: TextStyle(color: Colors.grey[400])),
                        Text(distance, style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w500, fontSize: 12)),
                      ],
                    ]),
                    const SizedBox(height: 4),
                    Row(children: [
                      const Icon(Icons.favorite, size: 13, color: AppTheme.primary),
                      const SizedBox(width: 3),
                      Text('$totalDonations donations', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                      const SizedBox(width: 8),
                      _badgeChip(badge),
                    ]),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              if (phone != null)
                Column(children: [
                  _actionButton(Icons.phone, Colors.green, () => WhatsAppUtils.makeCall(phone)),
                  const SizedBox(height: 6),
                  _actionButton(Icons.chat, const Color(0xFF25D366), () => WhatsAppUtils.openWhatsApp(phone, 'Hi, I need blood urgently. Can you help?')),
                ]),
            ],
          ),
        ),
      ),
    );
  }

  Widget _availabilityDot(bool available) => Container(
    width: 10, height: 10,
    decoration: BoxDecoration(color: available ? Colors.green : Colors.red, shape: BoxShape.circle),
  );

  Widget _badgeChip(String badge) {
    final color = badge == 'Hero' ? Colors.purple : badge == 'Gold' ? Colors.orange : badge == 'Silver' ? Colors.grey : badge == 'Bronze' ? const Color(0xFFCD7F32) : Colors.blue;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: color.withOpacity(0.15), borderRadius: BorderRadius.circular(10)),
      child: Text(badge, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
    );
  }

  Widget _actionButton(IconData icon, Color color, VoidCallback onTap) => InkWell(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
      child: Icon(icon, color: color, size: 18),
    ),
  );
}

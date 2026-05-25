import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/whatsapp_utils.dart';
import '../../providers/donor_provider.dart';
import '../../widgets/common/blood_group_badge.dart';
import '../../widgets/common/loading_widget.dart';

class DonorDetailScreen extends ConsumerWidget {
  final String donorId;
  const DonorDetailScreen({super.key, required this.donorId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final donorAsync = ref.watch(donorProfileProvider(donorId));

    return Scaffold(
      appBar: AppBar(title: const Text('Donor Profile')),
      body: donorAsync.when(
        data: (donor) => SingleChildScrollView(
          child: Column(
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(colors: [AppTheme.primary, AppTheme.primaryDark]),
                  borderRadius: BorderRadius.only(bottomLeft: Radius.circular(32), bottomRight: Radius.circular(32)),
                ),
                child: Column(
                  children: [
                    BloodGroupBadge(bloodGroup: donor.bloodGroup, size: 80),
                    const SizedBox(height: 12),
                    Text(donor.name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                    const SizedBox(height: 4),
                    if (donor.city != null)
                      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.location_on, size: 14, color: Colors.white70),
                        const SizedBox(width: 4),
                        Text(donor.city!, style: const TextStyle(color: Colors.white70)),
                      ]),
                    const SizedBox(height: 8),
                    if (donor.distance != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                        child: Text('📍 ${donor.distance} away', style: const TextStyle(color: Colors.white)),
                      ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        _infoCard('${donor.totalDonations}', 'Donations', Icons.favorite),
                        const SizedBox(width: 12),
                        _infoCard(donor.badge, 'Badge', Icons.emoji_events),
                        const SizedBox(width: 12),
                        _infoCard(donor.isAvailable ? 'Yes' : 'No', 'Available', Icons.check_circle,
                            color: donor.isAvailable ? Colors.green : Colors.red),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (donor.isVerified)
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.green[50], borderRadius: BorderRadius.circular(12)),
                        child: const Row(children: [
                          Icon(Icons.verified, color: Colors.green, size: 18),
                          SizedBox(width: 8),
                          Text('Verified Donor', style: TextStyle(color: Colors.green, fontWeight: FontWeight.w600)),
                        ]),
                      ),
                    const SizedBox(height: 24),
                    if (donor.phone != null) ...[
                      ElevatedButton.icon(
                        icon: const Icon(Icons.call),
                        label: const Text('Call Donor'),
                        onPressed: () => WhatsAppUtils.makeCall(donor.phone!),
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton.icon(
                        icon: const Icon(Icons.chat),
                        label: const Text('WhatsApp Donor'),
                        onPressed: () => WhatsAppUtils.openWhatsApp(
                          donor.phone!,
                          WhatsAppUtils.donorRequestMessage(donor.bloodGroup, ''),
                        ),
                        style: OutlinedButton.styleFrom(foregroundColor: const Color(0xFF25D366), side: const BorderSide(color: Color(0xFF25D366))),
                      ),
                    ] else
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: Colors.orange[50], borderRadius: BorderRadius.circular(12)),
                        child: const Row(children: [
                          Icon(Icons.lock, color: Colors.orange, size: 16),
                          SizedBox(width: 8),
                          Expanded(child: Text('Contact info is shared when you send a request', style: TextStyle(fontSize: 13))),
                        ]),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
        loading: () => const LoadingWidget(),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  Widget _infoCard(String value, String label, IconData icon, {Color? color}) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 6, offset: const Offset(0, 2))],
      ),
      child: Column(children: [
        Icon(icon, color: color ?? AppTheme.primary, size: 20),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: color ?? Colors.black87)),
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      ]),
    ),
  );
}

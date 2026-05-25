import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common/blood_group_badge.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).value;
    if (user == null) return const Center(child: CircularProgressIndicator());

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppTheme.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(colors: [AppTheme.primary, AppTheme.primaryDark], begin: Alignment.topLeft, end: Alignment.bottomRight),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Stack(alignment: Alignment.bottomRight, children: [
                        CircleAvatar(
                          radius: 40,
                          backgroundColor: Colors.white.withOpacity(0.2),
                          child: Text(user.name.isNotEmpty ? user.name[0].toUpperCase() : '?', style: const TextStyle(fontSize: 32, color: Colors.white, fontWeight: FontWeight.bold)),
                        ),
                        if (user.bloodGroup != null) BloodGroupBadge(bloodGroup: user.bloodGroup!, size: 28),
                      ]),
                      const SizedBox(height: 8),
                      Text(user.name, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w700)),
                      Text(user.phone, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                      if (user.city != null) Text('📍 ${user.city}', style: const TextStyle(color: Colors.white60, fontSize: 12)),
                    ],
                  ),
                ),
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined, color: Colors.white),
                onPressed: () => context.push('/notifications'),
              ),
            ],
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _statsRow(user),
                  const SizedBox(height: 16),
                  _menuCard(context, ref, user),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statsRow(user) => Row(children: [
    _statBox('${user.totalDonations}', 'Donations', Icons.favorite, AppTheme.primary),
    const SizedBox(width: 12),
    _statBox('${user.rewardPoints}', 'Points', Icons.star, Colors.orange),
    const SizedBox(width: 12),
    _statBox(user.badge, 'Badge', Icons.emoji_events, Colors.purple),
  ]);

  Widget _statBox(String value, String label, IconData icon, Color color) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 6, offset: const Offset(0, 2))],
      ),
      child: Column(children: [
        Icon(icon, color: color, size: 22),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
      ]),
    ),
  );

  Widget _menuCard(BuildContext context, WidgetRef ref, user) {
    final items = [
      if (user.role != 'donor') {'icon': Icons.volunteer_activism, 'label': 'Register as Donor', 'route': '/register-donor', 'color': Colors.red},
      {'icon': Icons.favorite_border, 'label': 'My Donations', 'route': '/home', 'color': Colors.red},
      {'icon': Icons.emoji_events, 'label': 'Rewards & Badges', 'route': '/home', 'color': Colors.orange},
      {'icon': Icons.edit, 'label': 'Edit Profile', 'route': '/home', 'color': Colors.blue},
      {'icon': Icons.settings, 'label': 'Settings', 'route': '/home', 'color': Colors.grey},
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8)],
      ),
      child: Column(
        children: [
          ...items.map((item) => ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: (item['color'] as Color).withOpacity(0.1), shape: BoxShape.circle),
              child: Icon(item['icon'] as IconData, color: item['color'] as Color, size: 20),
            ),
            title: Text(item['label'] as String, style: const TextStyle(fontWeight: FontWeight.w500)),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
            onTap: () => context.push(item['route'] as String),
          )),
          const Divider(height: 1),
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), shape: BoxShape.circle),
              child: const Icon(Icons.logout, color: Colors.red, size: 20),
            ),
            title: const Text('Logout', style: TextStyle(fontWeight: FontWeight.w500, color: Colors.red)),
            onTap: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
      ),
    );
  }
}

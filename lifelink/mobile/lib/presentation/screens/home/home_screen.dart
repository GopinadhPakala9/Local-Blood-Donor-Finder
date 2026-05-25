import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/notification_provider.dart';
import '../../providers/blood_request_provider.dart';
import '../../../core/utils/location_utils.dart';
import '../../widgets/common/request_card.dart';

class HomeTab extends ConsumerWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).value;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 140,
            pinned: true,
            backgroundColor: AppTheme.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(colors: [AppTheme.primary, AppTheme.primaryDark], begin: Alignment.topLeft, end: Alignment.bottomRight),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('Hello, ${user?.name.split(' ').first ?? 'Friend'} 👋',
                                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 4),
                              const Text('Save a life today', style: TextStyle(color: Colors.white70, fontSize: 13)),
                            ],
                          ),
                        ),
                        if (user?.bloodGroup != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Colors.white30),
                            ),
                            child: Text(user!.bloodGroup!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildQuickActions(context),
                  const SizedBox(height: 24),
                  if (user?.role == 'donor') _buildDonorStats(user!),
                  if (user?.role == 'donor') const SizedBox(height: 24),
                  _buildNearbyRequests(context, ref),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      {'icon': Icons.search, 'label': 'Find Donor', 'color': const Color(0xFFE53935), 'route': '/home/search'},
      {'icon': Icons.bloodtype, 'label': 'Request Blood', 'color': const Color(0xFFE65100), 'route': '/create-request'},
      {'icon': Icons.local_hospital, 'label': 'Blood Banks', 'color': const Color(0xFF1565C0), 'route': '/home'},
      {'icon': Icons.medical_services, 'label': 'Hospitals', 'color': const Color(0xFF2E7D32), 'route': '/home'},
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.4,
      children: actions.map((a) => GestureDetector(
        onTap: () => context.go(a['route'] as String),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: (a['color'] as Color).withOpacity(0.12), shape: BoxShape.circle),
                child: Icon(a['icon'] as IconData, color: a['color'] as Color, size: 28),
              ),
              const SizedBox(height: 8),
              Text(a['label'] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            ],
          ),
        ),
      )).toList(),
    );
  }

  Widget _buildDonorStats(dynamic user) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFFFFEBEE), Color(0xFFFCE4EC)]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.primary.withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.star, color: AppTheme.primary, size: 18),
            const SizedBox(width: 6),
            const Text('Your Impact', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          ]),
          const SizedBox(height: 12),
          Row(
            children: [
              _statItem('${user.totalDonations}', 'Donations', Icons.favorite),
              const SizedBox(width: 16),
              _statItem(user.badge ?? 'New', 'Badge', Icons.emoji_events),
              const SizedBox(width: 16),
              _statItem(user.isDonorEligible ? 'Yes' : 'No', 'Eligible', Icons.check_circle),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statItem(String value, String label, IconData icon) => Expanded(
    child: Column(children: [
      Icon(icon, color: AppTheme.primary, size: 20),
      const SizedBox(height: 4),
      Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      Text(label, style: TextStyle(fontSize: 11, color: Colors.grey[600])),
    ]),
  );

  Widget _buildNearbyRequests(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Nearby Requests', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            TextButton(onPressed: () => context.go('/home/requests'), child: const Text('See All')),
          ],
        ),
        const SizedBox(height: 8),
        FutureBuilder(
          future: LocationUtils.getCurrentLocation(),
          builder: (ctx, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()));
            }
            if (snapshot.data == null) {
              return _locationPermissionCard(context);
            }
            final pos = snapshot.data!;
            final requestsAsync = ref.watch(nearbyRequestsProvider((lat: pos.latitude, lng: pos.longitude)));
            return requestsAsync.when(
              data: (requests) => requests.isEmpty
                  ? const _EmptyRequests()
                  : Column(children: requests.take(3).map((r) => RequestCard(request: r)).toList()),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text('Could not load requests: $e'),
            );
          },
        ),
      ],
    );
  }

  Widget _locationPermissionCard(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: Colors.orange[50], borderRadius: BorderRadius.circular(12)),
    child: Row(children: [
      const Icon(Icons.location_off, color: Colors.orange),
      const SizedBox(width: 12),
      const Expanded(child: Text('Enable location to see nearby requests', style: TextStyle(fontSize: 13))),
    ]),
  );
}

class _EmptyRequests extends StatelessWidget {
  const _EmptyRequests();
  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.all(16),
    child: Center(child: Text('No active requests nearby', style: TextStyle(color: Colors.grey))),
  );
}

class HomeScreen extends ConsumerWidget {
  final Widget child;
  const HomeScreen({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;
    final unread = ref.watch(unreadCountProvider);
    final index = switch (location) {
      '/home/search' => 1,
      '/home/requests' => 2,
      '/home/profile' => 3,
      _ => 0,
    };

    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: index,
        onTap: (i) {
          switch (i) {
            case 0: context.go('/home'); break;
            case 1: context.go('/home/search'); break;
            case 2: context.go('/home/requests'); break;
            case 3: context.go('/home/profile'); break;
          }
        },
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          const BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Search'),
          const BottomNavigationBarItem(icon: Icon(Icons.bloodtype), label: 'Requests'),
          BottomNavigationBarItem(
            icon: Badge(
              isLabelVisible: unread > 0,
              label: Text('$unread'),
              child: const Icon(Icons.person),
            ),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

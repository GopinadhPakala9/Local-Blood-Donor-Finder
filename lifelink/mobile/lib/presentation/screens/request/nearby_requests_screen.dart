import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/location_utils.dart';
import '../../providers/blood_request_provider.dart';
import '../../widgets/common/request_card.dart';
import '../../widgets/common/loading_widget.dart';

class NearbyRequestsScreen extends ConsumerStatefulWidget {
  const NearbyRequestsScreen({super.key});

  @override
  ConsumerState<NearbyRequestsScreen> createState() => _NearbyRequestsScreenState();
}

class _NearbyRequestsScreenState extends ConsumerState<NearbyRequestsScreen> {
  String? _filterBloodGroup;
  String? _filterUrgency;
  double? _lat, _lng;

  @override
  void initState() {
    super.initState();
    LocationUtils.getCurrentLocation().then((pos) {
      if (pos != null && mounted) setState(() { _lat = pos.latitude; _lng = pos.longitude; });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Blood Requests'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/create-request'),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(12),
            child: Row(children: [
              Expanded(child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(children: [
                  _filterChip('All', null, isBloodGroup: true),
                  ...AppConstants.bloodGroups.map((bg) => _filterChip(bg, bg, isBloodGroup: true)),
                ]),
              )),
              const SizedBox(width: 8),
              PopupMenuButton<String?>(
                icon: const Icon(Icons.filter_list),
                onSelected: (v) => setState(() => _filterUrgency = v),
                itemBuilder: (_) => [
                  const PopupMenuItem(value: null, child: Text('All Urgency')),
                  ...AppConstants.urgencyLevels.map((u) => PopupMenuItem(value: u, child: Text(u))),
                ],
              ),
            ]),
          ),
          Expanded(
            child: _lat == null
                ? _buildLocationPrompt()
                : Consumer(builder: (ctx, ref, _) {
                    final requestsAsync = ref.watch(nearbyRequestsProvider((lat: _lat!, lng: _lng!)));
                    return requestsAsync.when(
                      data: (requests) {
                        var filtered = requests;
                        if (_filterBloodGroup != null) filtered = filtered.where((r) => r.bloodGroup == _filterBloodGroup).toList();
                        if (_filterUrgency != null) filtered = filtered.where((r) => r.urgency == _filterUrgency).toList();
                        if (filtered.isEmpty) return _buildEmpty();
                        return RefreshIndicator(
                          onRefresh: () async => ref.refresh(nearbyRequestsProvider((lat: _lat!, lng: _lng!))),
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: filtered.length,
                            itemBuilder: (_, i) => RequestCard(request: filtered[i]),
                          ),
                        );
                      },
                      loading: () => const LoadingWidget(),
                      error: (e, _) => Center(child: Text('Error: $e')),
                    );
                  }),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/create-request'),
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.add),
        label: const Text('Request Blood'),
      ),
    );
  }

  Widget _filterChip(String label, String? value, {bool isBloodGroup = false}) => Padding(
    padding: const EdgeInsets.only(right: 6),
    child: FilterChip(
      label: Text(label, style: const TextStyle(fontSize: 12)),
      selected: (isBloodGroup ? _filterBloodGroup : _filterUrgency) == value,
      onSelected: (_) => setState(() { if (isBloodGroup) _filterBloodGroup = value; else _filterUrgency = value; }),
      selectedColor: AppTheme.primary,
      labelStyle: TextStyle(color: (isBloodGroup ? _filterBloodGroup : _filterUrgency) == value ? Colors.white : null),
    ),
  );

  Widget _buildLocationPrompt() => Center(
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      const Icon(Icons.location_off, size: 64, color: Colors.grey),
      const SizedBox(height: 12),
      const Text('Enable location for nearby requests'),
      const SizedBox(height: 12),
      ElevatedButton(onPressed: () async {
        final pos = await LocationUtils.getCurrentLocation();
        if (pos != null && mounted) setState(() { _lat = pos.latitude; _lng = pos.longitude; });
      }, child: const Text('Enable Location')),
    ]),
  );

  Widget _buildEmpty() => Center(
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      const Icon(Icons.bloodtype, size: 64, color: Colors.grey),
      const SizedBox(height: 12),
      const Text('No requests found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
      Text('No active blood requests nearby', style: TextStyle(color: Colors.grey[600])),
    ]),
  );
}

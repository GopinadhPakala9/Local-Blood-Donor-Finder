import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/location_utils.dart';
import '../../providers/donor_provider.dart';
import '../../widgets/common/donor_card.dart';
import '../../widgets/common/loading_widget.dart';

final _searchParamsProvider = StateProvider<DonorSearchParams>((ref) => DonorSearchParams());

class DonorSearchScreen extends ConsumerStatefulWidget {
  const DonorSearchScreen({super.key});

  @override
  ConsumerState<DonorSearchScreen> createState() => _DonorSearchScreenState();
}

class _DonorSearchScreenState extends ConsumerState<DonorSearchScreen> {
  String? _selectedBloodGroup;
  int _radius = 10;
  Position? _position;
  bool _locationLoading = false;

  Future<void> _getLocation() async {
    setState(() => _locationLoading = true);
    final pos = await LocationUtils.getCurrentLocation();
    if (mounted) setState(() { _position = pos; _locationLoading = false; });
    _applyFilters();
  }

  void _applyFilters() {
    ref.read(_searchParamsProvider.notifier).state = DonorSearchParams(
      bloodGroup: _selectedBloodGroup,
      radius: _radius,
      latitude: _position?.latitude,
      longitude: _position?.longitude,
    );
  }

  @override
  void initState() {
    super.initState();
    _getLocation();
  }

  @override
  Widget build(BuildContext context) {
    final params = ref.watch(_searchParamsProvider);
    final searchAsync = ref.watch(donorSearchProvider(params));

    return Scaffold(
      appBar: AppBar(title: const Text('Find Blood Donors')),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Blood Group', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _filterChip('All', null),
                      ...AppConstants.bloodGroups.map((bg) => _filterChip(bg, bg)),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.social_distance, size: 16, color: Colors.grey),
                    const SizedBox(width: 6),
                    Text('Radius: ${_radius}km', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                    const Spacer(),
                    TextButton.icon(
                      onPressed: _locationLoading ? null : _getLocation,
                      icon: _locationLoading
                          ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                          : Icon(_position != null ? Icons.location_on : Icons.location_off, size: 16),
                      label: Text(_position != null ? 'Location on' : 'Enable location', style: const TextStyle(fontSize: 12)),
                    ),
                  ],
                ),
                Slider(
                  value: _radius.toDouble(),
                  min: 5, max: 50, divisions: 9,
                  activeColor: AppTheme.primary,
                  label: '${_radius}km',
                  onChanged: (v) { setState(() => _radius = v.round()); _applyFilters(); },
                ),
              ],
            ),
          ),
          Expanded(
            child: searchAsync.when(
              data: (data) {
                final donors = data['donors'] as List;
                final total = data['total'] as int;
                if (donors.isEmpty) return const Center(child: _EmptyDonors());
                return RefreshIndicator(
                  onRefresh: () async => ref.refresh(donorSearchProvider(params)),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Align(alignment: Alignment.centerLeft, child: Text('$total donors found', style: TextStyle(color: Colors.grey[600], fontSize: 13))),
                      ),
                      Expanded(
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: donors.length,
                          itemBuilder: (_, i) => DonorCard(donor: donors[i]),
                        ),
                      ),
                    ],
                  ),
                );
              },
              loading: () => const LoadingWidget(),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String label, String? value) => Padding(
    padding: const EdgeInsets.only(right: 8),
    child: FilterChip(
      label: Text(label),
      selected: _selectedBloodGroup == value,
      onSelected: (_) { setState(() => _selectedBloodGroup = value); _applyFilters(); },
      selectedColor: AppTheme.primary,
      labelStyle: TextStyle(
        color: _selectedBloodGroup == value ? Colors.white : Colors.black87,
        fontWeight: FontWeight.w500,
      ),
    ),
  );
}

class _EmptyDonors extends StatelessWidget {
  const _EmptyDonors();
  @override
  Widget build(BuildContext context) => Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      const Icon(Icons.search_off, size: 64, color: Colors.grey),
      const SizedBox(height: 12),
      const Text('No donors found', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
      const SizedBox(height: 8),
      Text('Try expanding the search radius', style: TextStyle(color: Colors.grey[600])),
    ],
  );
}

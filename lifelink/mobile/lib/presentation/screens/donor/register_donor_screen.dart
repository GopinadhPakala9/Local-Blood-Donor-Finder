import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/location_utils.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/common/blood_group_badge.dart';
import '../../../data/datasources/remote/donor_remote_datasource.dart';

class RegisterDonorScreen extends ConsumerStatefulWidget {
  const RegisterDonorScreen({super.key});

  @override
  ConsumerState<RegisterDonorScreen> createState() => _RegisterDonorScreenState();
}

class _RegisterDonorScreenState extends ConsumerState<RegisterDonorScreen> {
  final _pageController = PageController();
  int _step = 0;
  bool _isLoading = false;

  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();

  String? _selectedBloodGroup;
  String _gender = 'male';
  DateTime? _dob;
  double _weight = 60;
  bool _isAvailable = true;
  double? _lat, _lng;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).value;
    if (user != null) { _nameCtrl.text = user.name; _emailCtrl.text = user.email ?? ''; }
  }

  Future<void> _submit() async {
    setState(() => _isLoading = true);
    try {
      await DonorRemoteDataSource().registerDonor({
        'name': _nameCtrl.text.trim(),
        'blood_group': _selectedBloodGroup,
        'gender': _gender,
        'dob': _dob?.toIso8601String().split('T').first,
        'weight': _weight,
        'city': _cityCtrl.text.trim(),
        'state': _stateCtrl.text.trim(),
        'is_available': _isAvailable,
        if (_lat != null) 'latitude': _lat,
        if (_lng != null) 'longitude': _lng,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Registered as donor!'), backgroundColor: Colors.green));
        context.pop();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register as Donor')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: List.generate(3, (i) => Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: i < 2 ? 8 : 0),
                  decoration: BoxDecoration(
                    color: i <= _step ? AppTheme.primary : Colors.grey[200],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              )),
            ),
          ),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [_buildStep1(), _buildStep2(), _buildStep3()],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              if (_step > 0) Expanded(child: OutlinedButton(onPressed: () { setState(() => _step--); _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut); }, child: const Text('Back'))),
              if (_step > 0) const SizedBox(width: 12),
              Expanded(child: ElevatedButton(
                onPressed: _isLoading ? null : () async {
                  if (_step < 2) {
                    setState(() => _step++);
                    _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                  } else {
                    await _submit();
                  }
                },
                child: _isLoading ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : Text(_step < 2 ? 'Next' : 'Register'),
              )),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildStep1() => SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(children: [
    const Text('Personal Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
    const SizedBox(height: 20),
    TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person))),
    const SizedBox(height: 12),
    TextFormField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'Email (optional)', prefixIcon: Icon(Icons.email))),
    const SizedBox(height: 12),
    DropdownButtonFormField<String>(value: _gender, decoration: const InputDecoration(labelText: 'Gender'),
      items: ['male', 'female', 'other'].map((g) => DropdownMenuItem(value: g, child: Text(g.toUpperCase()))).toList(),
      onChanged: (v) => setState(() => _gender = v!)),
    const SizedBox(height: 12),
    ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.cake),
      title: Text(_dob == null ? 'Select Date of Birth' : _dob!.toString().split(' ').first),
      onTap: () async {
        final d = await showDatePicker(context: context, initialDate: DateTime(1990), firstDate: DateTime(1930), lastDate: DateTime.now().subtract(const Duration(days: 365 * 18)));
        if (d != null) setState(() => _dob = d);
      },
    ),
    const SizedBox(height: 12),
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Weight: ${_weight.round()} kg', style: const TextStyle(fontWeight: FontWeight.w600)),
      Slider(value: _weight, min: 45, max: 150, activeColor: AppTheme.primary, onChanged: (v) => setState(() => _weight = v)),
      Text('Minimum 45 kg required to donate', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
    ]),
  ]));

  Widget _buildStep2() => SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(children: [
    const Text('Blood Group & Location', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
    const SizedBox(height: 20),
    const Text('Select Your Blood Group', style: TextStyle(fontWeight: FontWeight.w600)),
    const SizedBox(height: 12),
    GridView.count(
      crossAxisCount: 4, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 8, mainAxisSpacing: 8, childAspectRatio: 1.2,
      children: AppConstants.bloodGroups.map((bg) => GestureDetector(
        onTap: () => setState(() => _selectedBloodGroup = bg),
        child: Container(
          decoration: BoxDecoration(
            color: _selectedBloodGroup == bg ? AppTheme.bloodGroupColors[bg] ?? AppTheme.primary : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _selectedBloodGroup == bg ? AppTheme.primary : Colors.grey[200]!, width: 1.5),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 4)],
          ),
          child: Center(child: Text(bg, style: TextStyle(fontWeight: FontWeight.bold, color: _selectedBloodGroup == bg ? Colors.white : Colors.black87))),
        ),
      )).toList(),
    ),
    const SizedBox(height: 20),
    TextFormField(controller: _cityCtrl, decoration: const InputDecoration(labelText: 'City', prefixIcon: Icon(Icons.location_city))),
    const SizedBox(height: 12),
    TextFormField(controller: _stateCtrl, decoration: const InputDecoration(labelText: 'State', prefixIcon: Icon(Icons.map))),
  ]));

  Widget _buildStep3() => SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(children: [
    const Text('Location & Availability', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
    const SizedBox(height: 20),
    ElevatedButton.icon(
      icon: Icon(_lat != null ? Icons.location_on : Icons.location_off),
      label: Text(_lat != null ? 'Location captured ✓' : 'Get My Location'),
      onPressed: () async {
        final pos = await LocationUtils.getCurrentLocation();
        if (pos != null) setState(() { _lat = pos.latitude; _lng = pos.longitude; });
      },
    ),
    const SizedBox(height: 16),
    SwitchListTile(
      title: const Text('Available for Donation', style: TextStyle(fontWeight: FontWeight.w600)),
      subtitle: const Text('Turn off if you are not currently available to donate'),
      value: _isAvailable,
      activeColor: AppTheme.primary,
      onChanged: (v) => setState(() => _isAvailable = v),
    ),
    const SizedBox(height: 16),
    Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(12)),
      child: const Row(children: [
        Icon(Icons.info, color: Colors.blue, size: 18),
        SizedBox(width: 8),
        Expanded(child: Text('Your exact location will never be shared publicly. Only approximate distance (e.g. "2.3 km away") is shown.', style: TextStyle(fontSize: 12))),
      ]),
    ),
  ]));
}

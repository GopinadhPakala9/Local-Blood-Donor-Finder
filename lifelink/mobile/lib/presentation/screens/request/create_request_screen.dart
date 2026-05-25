import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/location_utils.dart';
import '../../providers/blood_request_provider.dart';

class CreateRequestScreen extends ConsumerStatefulWidget {
  const CreateRequestScreen({super.key});

  @override
  ConsumerState<CreateRequestScreen> createState() => _CreateRequestScreenState();
}

class _CreateRequestScreenState extends ConsumerState<CreateRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _patientNameCtrl = TextEditingController();
  final _hospitalCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  String? _bloodGroup;
  int _units = 1;
  String _urgency = 'Normal';
  DateTime? _requiredDate;
  bool _isLoading = false;
  double? _lat, _lng;

  @override
  void initState() {
    super.initState();
    LocationUtils.getCurrentLocation().then((pos) {
      if (pos != null && mounted) setState(() { _lat = pos.latitude; _lng = pos.longitude; });
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate() || _bloodGroup == null) {
      if (_bloodGroup == null) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select blood group')));
      return;
    }
    setState(() => _isLoading = true);
    try {
      await ref.read(createRequestProvider.notifier).createRequest({
        'patient_name': _patientNameCtrl.text.trim(),
        'blood_group': _bloodGroup,
        'units_required': _units,
        'hospital_name': _hospitalCtrl.text.trim(),
        'contact_number': _contactCtrl.text.trim(),
        'urgency': _urgency,
        'city': _cityCtrl.text.trim(),
        if (_requiredDate != null) 'required_date': DateFormat('yyyy-MM-dd').format(_requiredDate!),
        if (_lat != null) 'latitude': _lat,
        if (_lng != null) 'longitude': _lng,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Emergency request created! Nearby donors are being notified.'), backgroundColor: Colors.green));
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
      appBar: AppBar(title: const Text('Request Blood')),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _urgencySelector(),
              const SizedBox(height: 20),
              const Text('Patient & Hospital Details', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              const SizedBox(height: 12),
              TextFormField(controller: _patientNameCtrl, decoration: const InputDecoration(labelText: 'Patient Name *', prefixIcon: Icon(Icons.person)),
                validator: (v) => v?.isEmpty == true ? 'Required' : null),
              const SizedBox(height: 12),
              TextFormField(controller: _hospitalCtrl, decoration: const InputDecoration(labelText: 'Hospital Name *', prefixIcon: Icon(Icons.local_hospital)),
                validator: (v) => v?.isEmpty == true ? 'Required' : null),
              const SizedBox(height: 12),
              TextFormField(controller: _contactCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Contact Number *', prefixIcon: Icon(Icons.phone)),
                validator: (v) => v?.isEmpty == true ? 'Required' : null),
              const SizedBox(height: 12),
              TextFormField(controller: _cityCtrl, decoration: const InputDecoration(labelText: 'City', prefixIcon: Icon(Icons.location_city))),
              const SizedBox(height: 20),
              const Text('Blood Requirement', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              const SizedBox(height: 12),
              const Text('Blood Group *', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8, runSpacing: 8,
                children: AppConstants.bloodGroups.map((bg) => GestureDetector(
                  onTap: () => setState(() => _bloodGroup = bg),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: _bloodGroup == bg ? AppTheme.primary : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: _bloodGroup == bg ? AppTheme.primary : Colors.grey[300]!),
                    ),
                    child: Text(bg, style: TextStyle(color: _bloodGroup == bg ? Colors.white : Colors.black87, fontWeight: FontWeight.w600)),
                  ),
                )).toList(),
              ),
              const SizedBox(height: 16),
              Row(children: [
                const Text('Units Required:', style: TextStyle(fontWeight: FontWeight.w600)),
                const Spacer(),
                IconButton(onPressed: () { if (_units > 1) setState(() => _units--); }, icon: const Icon(Icons.remove_circle_outline)),
                Text('$_units', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                IconButton(onPressed: () { if (_units < 10) setState(() => _units++); }, icon: const Icon(Icons.add_circle_outline)),
              ]),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.calendar_today),
                title: Text(_requiredDate == null ? 'Required Date (optional)' : DateFormat('dd MMM yyyy').format(_requiredDate!)),
                onTap: () async {
                  final d = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 30)));
                  if (d != null) setState(() => _requiredDate = d);
                },
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: _urgency == 'Critical' ? Colors.red[900] : _urgency == 'Urgent' ? Colors.orange[800] : AppTheme.primary,
                ),
                child: _isLoading
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('🆘 Create Emergency Request'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _urgencySelector() => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text('Urgency Level', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
      const SizedBox(height: 8),
      Row(children: AppConstants.urgencyLevels.map((u) {
        final color = u == 'Critical' ? Colors.red : u == 'Urgent' ? Colors.orange : Colors.green;
        return Expanded(child: GestureDetector(
          onTap: () => setState(() => _urgency = u),
          child: Container(
            margin: EdgeInsets.only(right: u != 'Critical' ? 8 : 0),
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: _urgency == u ? color : color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: color),
            ),
            child: Column(children: [
              Text(u == 'Critical' ? '🚨' : u == 'Urgent' ? '⚠️' : '✅', style: const TextStyle(fontSize: 20)),
              const SizedBox(height: 4),
              Text(u, style: TextStyle(fontWeight: FontWeight.w600, color: _urgency == u ? Colors.white : color)),
            ]),
          ),
        ));
      }).toList()),
    ],
  );
}

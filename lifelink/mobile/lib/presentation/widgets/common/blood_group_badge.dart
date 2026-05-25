import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

class BloodGroupBadge extends StatelessWidget {
  final String bloodGroup;
  final double size;
  final bool showLabel;

  const BloodGroupBadge({super.key, required this.bloodGroup, this.size = 40, this.showLabel = false});

  @override
  Widget build(BuildContext context) {
    final color = AppTheme.bloodGroupColors[bloodGroup] ?? AppTheme.primary;
    final radius = size / 2;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: color.withOpacity(0.35), blurRadius: 8, offset: const Offset(0, 3))],
          ),
          child: Center(
            child: Text(bloodGroup, style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: size * 0.32)),
          ),
        ),
        if (showLabel) ...[
          const SizedBox(height: 4),
          Text('Blood Group', style: TextStyle(fontSize: 11, color: Colors.grey[600])),
        ],
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

class LoadingWidget extends StatelessWidget {
  final bool isList;
  const LoadingWidget({super.key, this.isList = true});

  @override
  Widget build(BuildContext context) {
    if (!isList) return const Center(child: CircularProgressIndicator());
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (_, __) => Shimmer.fromColors(
        baseColor: Colors.grey[300]!,
        highlightColor: Colors.grey[100]!,
        child: Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Container(
            height: 110,
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Container(width: 52, height: 52, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(height: 14, width: double.infinity, color: Colors.white),
                const SizedBox(height: 8),
                Container(height: 12, width: 150, color: Colors.white),
                const SizedBox(height: 8),
                Container(height: 12, width: 100, color: Colors.white),
              ])),
            ]),
          ),
        ),
      ),
    );
  }
}

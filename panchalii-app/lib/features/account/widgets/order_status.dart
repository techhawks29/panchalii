import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Customer-facing wording and colour for each order status.
class OrderStatusStyle {
  final String label;
  final Color color;
  const OrderStatusStyle(this.label, this.color);

  static const _styles = {
    'pending': OrderStatusStyle('Awaiting payment', Color(0xFFE0B354)),
    'confirmed': OrderStatusStyle('Confirmed', Color(0xFFC9A96E)),
    'processing': OrderStatusStyle('Being prepared', Color(0xFFC9A96E)),
    'shipped': OrderStatusStyle('On its way', Color(0xFF8FB8DE)),
    'delivered': OrderStatusStyle('Delivered', Color(0xFF7FC79A)),
    'cancelled': OrderStatusStyle('Cancelled', Color(0xFFE5797D)),
    'refunded': OrderStatusStyle('Refunded', Color(0xFFB8A98A)),
  };

  static OrderStatusStyle of(String? status) =>
      _styles[status] ??
      OrderStatusStyle(status ?? 'Unknown', const Color(0xFFB8A98A));
}

class OrderStatusBadge extends StatelessWidget {
  final String? status;
  const OrderStatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final s = OrderStatusStyle.of(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: s.color.withOpacity(0.12),
        border: Border.all(color: s.color.withOpacity(0.45)),
      ),
      child: Text(
        s.label.toUpperCase(),
        style: GoogleFonts.instrumentSans(
          fontSize: 8.5,
          letterSpacing: 1.8,
          fontWeight: FontWeight.w600,
          color: s.color,
        ),
      ),
    );
  }
}

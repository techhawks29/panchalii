import 'package:intl/intl.dart';

final _rupees = NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 0,
);
final _date = DateFormat('d MMM yyyy');
final _dateTime = DateFormat('d MMM, h:mm a');

/// ₹18,49,900 — Indian digit grouping, no paise.
String inr(num v) => _rupees.format(v);

String piecesLabel(int n) => n == 1 ? '1 PIECE' : '$n PIECES';

DateTime? parseDate(Object? v) =>
    v is String ? DateTime.tryParse(v)?.toLocal() : null;

/// 23 Nov 2026
String dateLabel(DateTime d) => _date.format(d);

/// 23 Nov, 3:38 PM
String dateTimeLabel(DateTime d) => _dateTime.format(d);

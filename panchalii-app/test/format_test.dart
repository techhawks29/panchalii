import 'package:flutter_test/flutter_test.dart';
import 'package:panchalii_app/core/utils/format.dart';

void main() {
  test('rupees use Indian digit grouping without paise', () {
    expect(inr(999), '₹999');
    expect(inr(18499), '₹18,499');
    expect(inr(1849900), '₹18,49,900');
    expect(inr(1299.6), '₹1,300');
  });

  test('piece counts are singular for one', () {
    expect(piecesLabel(1), '1 PIECE');
    expect(piecesLabel(3), '3 PIECES');
  });

  test('dates from the API are parsed to local time', () {
    expect(parseDate(null), isNull);
    expect(parseDate('not a date'), isNull);
    expect(dateLabel(DateTime(2026, 11, 23)), '23 Nov 2026');
  });
}

final _emailPattern = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

String? validateEmail(String? v) {
  final value = v?.trim() ?? '';
  if (value.isEmpty) return 'Enter your email';
  if (!_emailPattern.hasMatch(value)) return 'Enter a valid email address';
  return null;
}

String? validateIndianPhone(String? v) {
  final digits = (v ?? '').replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return 'Enter your phone number';
  if (digits.length != 10) return 'Enter a 10-digit mobile number';
  return null;
}

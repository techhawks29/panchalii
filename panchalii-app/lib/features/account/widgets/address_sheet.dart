import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/messages.dart';
import '../../../core/utils/validators.dart';
import '../../../core/widgets/form_widgets.dart';
import '../../auth/providers/auth_provider.dart';

/// Opens the address form to add a new address, or edit [existing]; resolves to the saved address, or null if dismissed.
Future<Map<String, dynamic>?> showAddressSheet(
  BuildContext context, {
  String? defaultName,
  Map<String, dynamic>? existing,
}) {
  return showModalBottomSheet<Map<String, dynamic>>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: AppColors.bgDark,
    shape: const Border(top: BorderSide(color: AppColors.border)),
    builder: (_) => _AddressSheet(defaultName: defaultName, existing: existing),
  );
}

class _AddressSheet extends ConsumerStatefulWidget {
  final String? defaultName;
  final Map<String, dynamic>? existing;
  const _AddressSheet({this.defaultName, this.existing});
  @override
  ConsumerState<_AddressSheet> createState() => _AddressSheetState();
}

class _AddressSheetState extends ConsumerState<_AddressSheet> {
  static const _labels = ['Home', 'Work', 'Other'];

  final _formKey = GlobalKey<FormState>();
  Map<String, dynamic>? get _e => widget.existing;
  bool get _editing => _e != null;
  String _v(String k) => (_e?[k] as String?) ?? '';

  late final _name = TextEditingController(
    text: _editing ? _v('name') : widget.defaultName,
  );
  late final _phone = TextEditingController(text: _v('phone'));
  late final _line1 = TextEditingController(text: _v('line1'));
  late final _line2 = TextEditingController(text: _v('line2'));
  late final _city = TextEditingController(text: _v('city'));
  late final _state = TextEditingController(text: _v('state'));
  late final _pincode = TextEditingController(text: _v('pincode'));
  late String _label = _labels.contains(_v('label')) ? _v('label') : 'Home';
  late bool _makeDefault = _editing ? _e!['isDefault'] == true : true;
  bool _saving = false;

  @override
  void dispose() {
    for (final c in [_name, _phone, _line1, _line2, _city, _state, _pincode]) {
      c.dispose();
    }
    super.dispose();
  }

  String? _required(String? v, String what) =>
      (v?.trim().isEmpty ?? true) ? 'Enter $what' : null;

  Future<void> _save() async {
    if (_saving || !(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    setState(() => _saving = true);
    try {
      final dio = ref.read(dioProvider);
      final data = {
        'label': _label,
        'name': _name.text.trim(),
        'phone': _phone.text.replaceAll(RegExp(r'\D'), ''),
        'line1': _line1.text.trim(),
        'line2': _line2.text.trim(),
        'city': _city.text.trim(),
        'state': _state.text.trim(),
        'pincode': _pincode.text.trim(),
        'isDefault': _makeDefault,
      };
      final res = _editing
          ? await dio.patch('/me/addresses/${_e!['_id']}', data: data)
          : await dio.post('/me/addresses', data: data);
      if (mounted)
        Navigator.of(context)
            .pop(Map<String, dynamic>.from(res.data['data'] as Map));
    } catch (e) {
      if (mounted) showAppMessage(context, apiErrorMessage(e), isError: true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 28),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(width: 40, height: 3, color: AppColors.border),
              ),
              const SizedBox(height: 20),
              Text(
                _editing ? 'EDIT ADDRESS' : 'NEW ADDRESS',
                textAlign: TextAlign.center,
                style: GoogleFonts.instrumentSans(
                  fontSize: 10,
                  letterSpacing: 3.5,
                  color: AppColors.gold,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Where shall we deliver?',
                textAlign: TextAlign.center,
                style: GoogleFonts.cormorantGaramond(
                  fontSize: 28,
                  color: AppColors.cream,
                ),
              ),
              const SizedBox(height: 22),
              Row(
                children: [
                  for (final l in _labels) ...[
                    Expanded(
                      child: _LabelChip(
                        text: l,
                        selected: _label == l,
                        onTap: () => setState(() => _label = l),
                      ),
                    ),
                    if (l != _labels.last) const SizedBox(width: 8),
                  ],
                ],
              ),
              const SizedBox(height: 20),
              LabeledField(
                label: 'Full name',
                controller: _name,
                keyboardType: TextInputType.name,
                autofillHints: const [AutofillHints.name],
                validator: (v) => _required(v, 'the recipient\'s name'),
              ),
              const SizedBox(height: 16),
              LabeledField(
                label: 'Mobile number',
                controller: _phone,
                hint: 'For delivery updates',
                keyboardType: TextInputType.phone,
                autofillHints: const [AutofillHints.telephoneNumberNational],
                validator: validateIndianPhone,
              ),
              const SizedBox(height: 16),
              LabeledField(
                label: 'Flat, house, building',
                controller: _line1,
                keyboardType: TextInputType.streetAddress,
                autofillHints: const [AutofillHints.streetAddressLine1],
                validator: (v) => _required(v, 'your address'),
              ),
              const SizedBox(height: 16),
              LabeledField(
                label: 'Area, landmark (optional)',
                controller: _line2,
                keyboardType: TextInputType.streetAddress,
                autofillHints: const [AutofillHints.streetAddressLine2],
              ),
              const SizedBox(height: 16),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: LabeledField(
                      label: 'City',
                      controller: _city,
                      autofillHints: const [AutofillHints.addressCity],
                      validator: (v) => _required(v, 'city'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: LabeledField(
                      label: 'Pincode',
                      controller: _pincode,
                      keyboardType: TextInputType.number,
                      autofillHints: const [AutofillHints.postalCode],
                      validator: (v) =>
                          RegExp(r'^\d{6}$').hasMatch(v?.trim() ?? '')
                          ? null
                          : '6-digit pincode',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              LabeledField(
                label: 'State',
                controller: _state,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.addressState],
                validator: (v) => _required(v, 'state'),
                onSubmitted: (_) => _save(),
              ),
              const SizedBox(height: 14),
              // Already the default: to change it, make another address the default instead
              if (!(_editing && _e!['isDefault'] == true))
                InkWell(
                  onTap: () => setState(() => _makeDefault = !_makeDefault),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      children: [
                        _Tick(on: _makeDefault),
                        const SizedBox(width: 12),
                        Text(
                          'Use as my default address',
                          style: GoogleFonts.instrumentSans(
                            fontSize: 13,
                            color: AppColors.creamMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 18),
              GoldButton(
                label: _editing ? 'Save changes →' : 'Save address →',
                loading: _saving,
                onPressed: _save,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LabelChip extends StatelessWidget {
  final String text;
  final bool selected;
  final VoidCallback onTap;
  const _LabelChip({
    required this.text,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => Semantics(
    selected: selected,
    button: true,
    child: InkWell(
      onTap: onTap,
      child: Container(
        height: 40,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected
              ? AppColors.gold.withOpacity(0.12)
              : Colors.transparent,
          border: Border.all(
            color: selected ? AppColors.gold : AppColors.border,
          ),
        ),
        child: Text(
          text.toUpperCase(),
          style: GoogleFonts.instrumentSans(
            fontSize: 10,
            letterSpacing: 2.2,
            fontWeight: FontWeight.w600,
            color: selected ? AppColors.gold : AppColors.creamMuted,
          ),
        ),
      ),
    ),
  );
}

class _Tick extends StatelessWidget {
  final bool on;
  const _Tick({required this.on});
  @override
  Widget build(BuildContext context) => Container(
    width: 18,
    height: 18,
    decoration: BoxDecoration(
      color: on ? AppColors.gold : Colors.transparent,
      border: Border.all(color: AppColors.gold),
    ),
    child: on
        ? const Icon(Icons.check, size: 14, color: AppColors.bgDark)
        : null,
  );
}

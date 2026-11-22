import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:panchalii_app/core/theme/app_theme.dart';
import 'package:panchalii_app/features/auth/screens/login_screen.dart';
import 'package:panchalii_app/features/auth/screens/register_screen.dart';
import 'package:panchalii_app/core/utils/messages.dart';
import 'package:panchalii_app/core/utils/validators.dart';

import 'test_helpers.dart';

Widget _wrap(Widget screen) => ProviderScope(
  child: MaterialApp(theme: buildAppTheme(), home: screen),
);

Future<void> _tapText(WidgetTester tester, String text) async {
  await tester.ensureVisible(find.text(text));
  await tester.tap(find.text(text));
  await tester.pump();
}

void main() {
  useBundledFonts();

  group('validators', () {
    test('email', () {
      expect(validateEmail(''), 'Enter your email');
      expect(validateEmail('meera@'), 'Enter a valid email address');
      expect(validateEmail('  meera@panchalii.in '), isNull);
    });

    test('Indian mobile number', () {
      expect(validateIndianPhone(''), 'Enter your phone number');
      expect(validateIndianPhone('98765'), 'Enter a 10-digit mobile number');
      expect(validateIndianPhone('98765 43210'), isNull);
    });
  });

  group('apiErrorMessage', () {
    final request = RequestOptions(path: '/public/auth/login');

    test('shows the API message when there is one', () {
      final error = DioException(
        requestOptions: request,
        type: DioExceptionType.badResponse,
        response: Response(
          requestOptions: request,
          statusCode: 401,
          data: {'message': 'Invalid credentials'},
        ),
      );
      expect(apiErrorMessage(error), 'Invalid credentials');
    });

    test('explains connection problems', () {
      final error = DioException(
        requestOptions: request,
        type: DioExceptionType.connectionError,
      );
      expect(apiErrorMessage(error), contains("Can't reach Panchalii"));
    });

    test('falls back to a generic message', () {
      expect(
        apiErrorMessage(StateError('boom')),
        'Something went wrong. Please try again.',
      );
    });
  });

  group('sign-in screen', () {
    testWidgets('shows field errors instead of submitting an empty form', (
      tester,
    ) async {
      usePhoneSurface(tester);
      await tester.pumpWidget(_wrap(const LoginScreen()));

      await _tapText(tester, 'SIGN IN →');

      expect(find.text('Enter your email'), findsOneWidget);
      expect(find.text('Enter your password'), findsOneWidget);
    });

    testWidgets('phone mode asks for a 10-digit number before sending a code', (
      tester,
    ) async {
      usePhoneSurface(tester);
      await tester.pumpWidget(_wrap(const LoginScreen()));

      await _tapText(tester, 'PHONE OTP');
      expect(find.text('MOBILE NUMBER'), findsOneWidget);
      expect(find.text('SEND CODE →'), findsOneWidget);

      await tester.enterText(find.byType(TextFormField), '98765');
      await _tapText(tester, 'SEND CODE →');

      expect(find.text('Enter a 10-digit mobile number'), findsOneWidget);
    });
  });

  group('register screen', () {
    testWidgets('requires a password of at least 8 characters', (tester) async {
      usePhoneSurface(tester);
      await tester.pumpWidget(_wrap(const RegisterScreen()));

      final fields = find.byType(TextFormField);
      await tester.enterText(fields.at(0), 'Meera Iyer');
      await tester.enterText(fields.at(1), 'meera@panchalii.in');
      await tester.enterText(fields.at(2), '9876543210');
      await tester.enterText(fields.at(3), 'short');
      await _tapText(tester, 'CREATE ACCOUNT →');

      expect(find.text('Use at least 8 characters'), findsOneWidget);
      expect(find.text('Enter your name'), findsNothing);
      expect(
        find.text('Verify Email'),
        findsNothing,
        reason: 'must not move to the code step',
      );
    });
  });
}

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_theme.dart';

/// Turns API/network errors into a short sentence for the user.
String apiErrorMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map &&
        data['message'] is String &&
        (data['message'] as String).isNotEmpty)
      return data['message'] as String;
    if (error.type == DioExceptionType.connectionError ||
        error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout) {
      return "Can't reach Panchalii right now. Check your connection and try again.";
    }
  }
  return 'Something went wrong. Please try again.';
}

void showAppMessage(
  BuildContext context,
  String message, {
  bool isError = false,
}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        backgroundColor: AppColors.bgDark,
        behavior: SnackBarBehavior.floating,
        shape: Border(
          left: BorderSide(
            color: isError ? const Color(0xFFE5484D) : AppColors.gold,
            width: 3,
          ),
        ),
        content: Text(
          message,
          style: GoogleFonts.instrumentSans(
            fontSize: 13,
            color: AppColors.cream,
          ),
        ),
      ),
    );
}

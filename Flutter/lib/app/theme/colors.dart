import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Brand ──────────────────────────────────────────────────────────────
  static const Color primary   = Color(0xFF6366F1); // Indigo
  static const Color secondary = Color(0xFF0EA5E9); // Sky blue

  // ── Backgrounds ────────────────────────────────────────────────────────
  static const Color background = Color(0xFF0A0D1A); // Deep navy (matches diagram)
  static const Color surface    = Color(0xFF111827); // Card/panel surface

  // ── Text ───────────────────────────────────────────────────────────────
  static const Color textPrimary   = Color(0xFFF9FAFB);
  static const Color textSecondary = Color(0xFF6B7280);

  // ── Status ─────────────────────────────────────────────────────────────
  static const Color success = Color(0xFF22C55E);
  static const Color error   = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info    = Color(0xFF3B82F6);

  // ── Accents (mirrors architecture diagram nodes) ───────────────────────
  static const Color redis   = Color(0xFFFF4444); // Redis red
  static const Color mongo   = Color(0xFF00ED64); // MongoDB green
  static const Color nodeJs  = Color(0xFF68A063); // Node.js green
  static const Color flutter = Color(0xFF54C5F8); // Flutter sky blue
}

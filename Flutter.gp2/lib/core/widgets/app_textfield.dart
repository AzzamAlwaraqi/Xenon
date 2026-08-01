import 'package:flutter/material.dart';

class AppTextField extends StatelessWidget {
  final String hint;
  final bool isPassword;
  final TextEditingController? controller;

  const AppTextField({
    super.key,
    required this.hint,
    this.isPassword = false,
    this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: isPassword,
      decoration: InputDecoration(
        hintText: hint,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }
}

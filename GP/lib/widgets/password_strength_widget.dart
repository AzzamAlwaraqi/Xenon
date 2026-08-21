import 'package:flutter/material.dart';
import 'package:gp/theme/colors.dart';

class PasswordStrengthWidget extends StatefulWidget {
  final TextEditingController passwordController;
  
  const PasswordStrengthWidget({
    super.key, 
    required this.passwordController,
  });

  @override
  State<PasswordStrengthWidget> createState() => _PasswordStrengthWidgetState();
}

class _PasswordStrengthWidgetState extends State<PasswordStrengthWidget> {
  bool hasMinLength = false;
  bool hasCapital = false;
  bool hasNumber = false;
  bool hasSpecial = false;

  @override
  void initState() {
    super.initState();
    widget.passwordController.addListener(_checkPasswordStrength);
  }

  @override
  void dispose() {
    widget.passwordController.removeListener(_checkPasswordStrength);
    super.dispose();
  }

  void _checkPasswordStrength() {
    final password = widget.passwordController.text;
    setState(() {
      hasMinLength = password.length >= 8;
      hasCapital = password.contains(RegExp(r'[A-Z]'));
      hasNumber = password.contains(RegExp(r'[0-9]'));
      hasSpecial = password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'));
    });
  }

  int get strengthLevel {
    int level = 0;
    if (hasMinLength) level++;
    if (hasCapital && hasNumber) level++;
    if (hasSpecial) level++;
    return level;
  }

  @override
  Widget build(BuildContext context) {
    if (widget.passwordController.text.isEmpty) {
      return const SizedBox.shrink();
    }
    
    final level = strengthLevel;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: _buildStrengthSegment(level >= 1, level)),
            const SizedBox(width: 4),
            Expanded(child: _buildStrengthSegment(level >= 2, level)),
            const SizedBox(width: 4),
            Expanded(child: _buildStrengthSegment(level >= 3, level)),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          _getStrengthText(level),
          style: TextStyle(
            color: _getStrengthColor(level), 
            fontSize: 12, 
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        _buildChecklistItem('At least 8 characters', hasMinLength),
        _buildChecklistItem('At least 1 capital letter', hasCapital),
        _buildChecklistItem('At least 1 number', hasNumber),
        _buildChecklistItem('At least 1 special character', hasSpecial),
      ],
    );
  }

  Widget _buildStrengthSegment(bool isActive, int level) {
    return Container(
      height: 4,
      decoration: BoxDecoration(
        color: isActive ? _getStrengthColor(level) : Colors.grey[300],
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  Color _getStrengthColor(int level) {
    if (level == 1) return Colors.red;
    if (level == 2) return Colors.orange;
    if (level == 3) return Colors.green;
    return Colors.transparent;
  }

  String _getStrengthText(int level) {
    if (level == 1) return 'Weak';
    if (level == 2) return 'Medium';
    if (level == 3) return 'Strong';
    return '';
  }

  Widget _buildChecklistItem(String text, bool isMet) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        children: [
          Icon(
            isMet ? Icons.check_circle : Icons.circle_outlined, 
            size: 14, 
            color: isMet ? Colors.green : Colors.grey[400],
          ),
          const SizedBox(width: 8),
          Text(
            text, 
            style: TextStyle(
              color: isMet ? Colors.green : AppColors.textSecondaryLight, 
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

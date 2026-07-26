import 'package:flutter/material.dart';
import 'package:graduation_project/core/widgets/app_button.dart';
import 'package:graduation_project/core/widgets/app_textfield.dart';

class SignUpPage extends StatelessWidget {
  const SignUpPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Theme.of(context).textTheme.bodyLarge?.color),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 20),
                Text(
                  'Create Account',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Fill in the details below to get started',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey,
                      ),
                ),
                const SizedBox(height: 40),
                const AppTextField(hint: 'Full Name'),
                const SizedBox(height: 16),
                const AppTextField(hint: 'Phone Number'),
                const SizedBox(height: 16),
                const AppTextField(hint: 'Email (Gmail)'),
                const SizedBox(height: 16),
                const AppTextField(
                  hint: 'Password',
                  isPassword: true,
                ),
                const SizedBox(height: 16),
                const AppTextField(
                  hint: 'Confirm Password',
                  isPassword: true,
                ),
                const SizedBox(height: 32),
                AppButton(
                  text: 'Sign Up',
                  onPressed: () {
                    // Handle sign up logic
                  },
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("Already have an account?"),
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Sign In'),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

# Fix "No Directionality widget found" and related issues

The app is failing with a "No Directionality widget found" error because `LoginPage` is being run directly in `main.dart` without a `MaterialApp` ancestor. Additionally, some UI elements like social buttons are not interactive, and the new `withValues` API might cause compatibility issues.

## Proposed Changes

### [Component Name] Core App Setup

#### [MODIFY] [main.dart](file:///C:/Users/anasm/OneDrive/Desktop/Xenon/GP/lib/main.dart)
- Change `runApp(const LoginPage())` to `runApp(const MyApp())` so that the app starts with the `MaterialApp` defined in `app.dart`.

### [Component Name] Auth Feature

#### [MODIFY] [login_page.dart](file:///C:/Users/anasm/OneDrive/Desktop/Xenon/GP/lib/features/auth/presentation/pages/login_page.dart)
- Replace `withValues(alpha: ...)` with `withOpacity(...)` for broader compatibility.
- Wrap social buttons in `InkWell` or `GestureDetector` to make them interactive.

## Verification Plan

### Manual Verification
- Run the app and verify the Login screen appears without the "No Directionality" error.
- Verify that the "Sign In" button and "Join Voyage" link work.
- Verify that social buttons provide visual feedback when tapped.

# RTL and Arabic Support + Image Fixes

The goal is to implement full RTL support when the app language is set to Arabic, translate the settings (Profile) page, and fix broken images across the app.

## Proposed Changes

### Localization Setup
#### [MODIFY] [pubspec.yaml](file:///C:/Xenon/GP/pubspec.yaml)
- Already added `flutter_localizations`.

#### [MODIFY] [app.dart](file:///C:/Xenon/GP/lib/app/app.dart)
- Already added `localizationsDelegates` and `supportedLocales`.

### UI Logic & RTL
#### [MODIFY] [main_layout.dart](file:///C:/Xenon/GP/lib/app/main_layout.dart)
- Ensure the layout respects the locale globally.

#### [MODIFY] [profile_page.dart](file:///C:/Xenon/GP/lib/features/profile/presentation/pages/profile_page.dart)
- Fully translate the page to Arabic when the locale is 'ar'.
- Fix alignment for section headers.

#### [MODIFY] [home_page.dart](file:///C:/Xenon/GP/lib/features/home/presentation/pages/home_page.dart)
#### [MODIFY] [explore_page.dart](file:///C:/Xenon/GP/lib/features/explore/presentation/pages/explore_page.dart)
#### [MODIFY] [bookings_page.dart](file:///C:/Xenon/GP/lib/features/bookings/presentation/pages/bookings_page.dart)
- Remove manual `Directionality` widgets as they are redundant if `MaterialApp` is configured correctly, but keep them if they provide specific value. Actually, I will remove them to simplify and let the system handle it.
- Fix broken image URLs or add `errorBuilder` to all `Image.network` calls.

### Image Fixes
#### [MODIFY] [bookings_page.dart](file:///C:/Xenon/GP/lib/features/bookings/presentation/pages/bookings_page.dart)
- Replace `i.pravatar.cc` with more reliable image sources or placeholders.

#### [MODIFY] [login_page.dart](file:///C:/Xenon/GP/lib/features/auth/presentation/pages/login_page.dart)
- Replace background image with a more stable Unsplash URL.

## Verification Plan

### Manual Verification
1. Open the app and go to the Profile tab.
2. Change the language to Arabic.
3. Verify that:
   - The entire UI flips to RTL (e.g., drawer, back buttons, text alignment).
   - The BottomNavigationBar labels change to Arabic.
   - The Profile page content is translated.
   - Images load correctly on all pages (Home, Explore, Bookings).
4. Change the language back to English and verify everything reverts correctly.

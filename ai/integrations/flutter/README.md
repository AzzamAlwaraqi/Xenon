# Flutter transport adapter

This directory is a small API client, not a Flutter application. Copy `xenon_ai_client.dart` into the mobile project and add `http` to that project's `pubspec.yaml`.

```dart
final ai = XenonAiClient(
  baseUri: Uri.parse('http://10.0.2.2:3000'),
  accessTokenProvider: () => secureStorage.read(key: 'accessToken'),
);
final result = await ai.recommend('Family cultural trip, below 60% humidity');
print(result.reply);
```

Use `10.0.2.2` from the Android emulator, the development computer's LAN address from a physical phone, and the appropriate host address for iOS Simulator. Android cleartext HTTP is suitable only for local development; production must use HTTPS.

The adapter calls the authenticated backend endpoint `/api/v1/ai/chat`. It sends the user's normal JWT and never connects to the internal AI port or receives `AI_SERVICE_API_KEY`. The returned conversation token is user-bound and can safely be sent with subsequent prompts through this same backend endpoint.

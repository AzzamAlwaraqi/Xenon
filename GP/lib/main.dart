import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:gp/app.dart';

import 'firebase_options.dart'; // You must run `flutterfire configure` to generate this

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  runApp(const MyApp());
}

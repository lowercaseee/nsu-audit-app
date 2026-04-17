# NSU Audit Flutter App

A mobile app for NSU Student Audit System built with Flutter.

## Features

- Login with API key (generated from server)
- Capture transcript from camera
- Choose image from gallery
- View Level 1/2/3 audit results
- View history with user email
- View certificates
- Server URL configuration

## Files

```
flutter_app/
├── lib/
│   └── main.dart          # All app code
├── pubspec.yaml           # Dependencies
├── android/
│   └── app/
│       └── src/main/
│           └── AndroidManifest.xml
└── README.md
```

## Build APK

### Prerequisites
- Flutter SDK installed

### Build Commands

```bash
cd D:\Opencode\Project 1\project 2\flutter_app

# Get dependencies
flutter pub get

# Build debug APK
flutter build apk --debug

# Build release APK
flutter build apk --release
```

The APK will be at: `build/app/outputs/flutter-apk/app-release.apk`

## Alternative: Build Without Flutter Installed

1. Go to https://flutter.dev/docs/get-started/install
2. Download Flutter SDK
3. Extract and add to PATH
4. Run the build commands above

## Server Required

The app requires the NSU Audit server to be running:

```powershell
cd D:\Opencode\Project 1\project 2\nsu-audit-mcp
python server.py
```

Server runs on port 5000 by default.

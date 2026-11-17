# KINETIQ

**Move. Track. Improve.**

KINETIQ is an offline-first fitness tracking mobile application built with **Flutter and Dart**. It aims to make strength training and basic cardio logging simple, with workout history and progress insights—without mandatory accounts or hosted infrastructure.

> **Project status:** Early development. Flutter setup, the welcome screen, branding assets, and an initial widget test are in place. Workout tracking, local database persistence, and progress charts are planned features, not yet implemented.

## About

KINETIQ is an independent, public portfolio project focused on a fast, focused training experience. Its first release is planned for Android, with future iOS support through Flutter.

### Principles

- **Offline-first:** Core features should work without internet access.
- **Private by design:** Data will be stored locally instead of in a hosted database.
- **Focused:** Make everyday logging easy without unnecessary features.
- **Accessible:** Use clear navigation, legible text, and comfortable touch targets.
- **Maintainable:** Prefer feature-based organization and tested components.

## Planned Features

### Strength Training

Create workout routines, select or add exercises, log sets, repetitions and weights, and track workout duration. A rest timer will support active sessions.

### Basic Cardio

Log running, walking, and cycling sessions with duration and optional distance. GPS route recording is outside the initial scope.

### Workout History

Review completed training sessions and their exercises, sets, durations and dates. Editing and deleting logged sessions is planned.

### Progress Tracking

Review training frequency, exercise performance, and personal records using simple summaries and charts.

### Local Storage

Persist data in SQLite, provide on-device settings, and eventually offer manual backup and restore. Version 1.0 does not include accounts or multi-device synchronization.

## Technology Stack

| Technology | Purpose | Status |
| --- | --- | --- |
| Flutter | Cross-platform app framework | In use |
| Dart | Programming language | In use |
| Material UI | Interface components and theming | In use |
| Flutter Test | Automated widget testing | In use |
| SQLite + Drift | Local database and typed queries | Planned |
| Riverpod | State management | Planned |
| GoRouter | Application navigation | Planned |
| fl_chart | Progress charts | Planned |

Planned packages will be introduced as features are built, rather than added preemptively.

## Design Direction

KINETIQ uses a dark visual style with electric-lime accents, bold typography, and simple, reusable components.

| Token | Color |
| --- | --- |
| Background | `#101416` |
| Accent | `#C5F26B` |
| Surface | `#202B27` |
| Primary text | `#FFFFFF` |
| Secondary text | `#B1BDB7` |

The app currently has a branded welcome screen. Its planned primary navigation is **Home**, **Workouts**, **History**, and **Progress**.

## Project Structure

KINETIQ is evolving toward a feature-first architecture:

```text
kinetiq/
├── android/             # Android platform configuration
├── ios/                 # iOS platform configuration
├── assets/              # Images and branding
├── blueprint/           # Development reference booklet
├── lib/
│   ├── main.dart        # Application entry point
│   ├── app/             # Planned theme and app configuration
│   ├── core/            # Planned shared code and database layer
│   └── features/        # Planned feature modules
├── test/
├── pubspec.yaml
└── README.md
```

Some directories in this diagram describe the intended organization and may not exist yet.

## Getting Started

### Prerequisites

Install [Flutter](https://docs.flutter.dev/install), the Android SDK, and Android Studio or VS Code with Flutter/Dart support. Start an Android emulator or connect an Android device.

### Run the App

Clone the repository containing KINETIQ, then navigate to its directory. In the current larger project repository, the relative path is `mobile-apps/kinetiq`.

```bash
cd mobile-apps/kinetiq
flutter pub get
flutter doctor
flutter devices
flutter run
```

To target a particular device:

```bash
flutter run -d <device-id>
```

### Code Quality

```bash
flutter analyze
flutter test
```

Both checks passed during initial project setup. Run them again against the latest code before submitting changes.

## Development Roadmap

### Phase 1 — Foundation and Interface

Establish the Flutter application, visual identity, reusable theme, navigation structure, and main screen layouts. The initial welcome screen is implemented; architectural organization and the main app interface are next.

### Phase 2 — Local Database

Introduce SQLite and Drift, model exercises and sessions, add repositories and schema migrations, and verify persistence through automated tests.

### Phase 3 — Strength Workout Tracking

Implement the exercise library, workout routine management, active-session logging, set and weight entry, rest timers, and session completion.

### Phase 4 — Cardio and History

Add manual cardio tracking and a unified training history with detailed, editable session records.

### Phase 5 — Progress and Insights

Build training frequency summaries, personal-record tracking, and charts based on actual saved workout data.

### Phase 6 — Polish and Release

Improve accessibility and resilience, extend testing, add manual export/restore, and prepare Android release assets and documentation. iOS testing and builds will require a compatible macOS environment.

This roadmap describes development priorities, not fixed delivery dates.

## Testing Strategy

KINETIQ will use unit tests for business logic and calculations, widget tests for interface behavior, database tests for storage and migrations, and integration tests for complete workout flows. Offline use and persistence across app restarts are key test scenarios.

## Privacy and Data

The planned app stores training data on the user's device and does not require an account or hosted database. Because local data may be lost if an app is uninstalled or a device fails, manual backup and restore are part of the planned release scope.

## Documentation

See [`blueprint/`](./blueprint/) for the detailed KINETIQ development booklet covering feature scope, architecture, data design, UX, and implementation milestones.

## Contributing

KINETIQ is an independent portfolio project in active development. Feedback and bug reports are welcome; contribution guidelines may be added as the project matures.

## License

A license has not yet been selected. Public availability of source code does not automatically grant permission to copy, modify, or redistribute it.

---

**KINETIQ — Move. Track. Improve.**

*Built with Flutter. Designed for consistency.*
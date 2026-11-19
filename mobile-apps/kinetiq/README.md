# KINETIQ 2.0 — Flutter + offline storage + optional accounts

**Train. Fuel. Evolve.** This is the revised source project from the *KINETIQ 2.0 Master Development Blueprint* (19 November 2026). The AI/KAI capability is **deliberately excluded**: no AI screens, prompts, SDKs, inference routes or API keys are present. The app is built from reusable, prop-driven Flutter widgets, including **one universal `KHeader`** shared across screens.

**Important limitations:** This is an extended developer build, **not a certified release or a fully completed commercial product**. The optional self-hosted account server, manual cloud backup and email workflows require setup. Production subscriptions, automatic two-way cloud sync, commercial food data, scheduled OS notifications and various deferred or unselected blueprint features are not claimed as complete. See [`docs/BLUEPRINT_COVERAGE.md`](docs/BLUEPRINT_COVERAGE.md) for the full status inventory.

## Install and run on Windows

Have Flutter with Dart >=3.13 and the `material_ui` package-compatible SDK (the Flutter 3.47+ toolchain that reports the replacement for deprecated `flutter/material.dart`), Android Studio and Android SDK installed.

From the **root of this extracted folder**, in PowerShell:

```powershell
flutter doctor
flutter create --platforms=android --project-name kinetiq .
flutter pub get
flutter analyze
flutter test
flutter run
```

`flutter create` adds host-platform files, while preserving the app `lib/`, tests and `pubspec.yaml`. This archive includes `test/widget_test.dart` so Flutter's default nonexistent `MyApp` test will not be left behind. For iOS generation and builds use macOS with Xcode.

If you already have a local database from **this standalone v1 app**, the app supplies a non-destructive v1→v2 migration. **It does not migrate the older private KINETIQ Drift v4 database**. Back up either app before switching or attempting import.

### Optional accounts on local emulator

The app starts and works fully offline as a guest **without running the server**. To test login/sign-up manually, open a separate terminal in `server/`:

```powershell
python kinetiq_server.py
```

Then launch Flutter on the Android emulator (Android host loopback is `10.0.2.2`):

```powershell
flutter run --dart-define=KINETIQ_API_BASE_URL=http://10.0.2.2:8765 --dart-define=KINETIQ_ALLOW_DEV_HTTP=true
```

For **Android debug HTTP only**, Android may block cleartext traffic by default; use a local HTTPS tunnel/reverse proxy, or add `android:usesCleartextTraffic="true"` to your **debug-only** `android/app/src/debug/AndroidManifest.xml` application element. Do **not** enable cleartext traffic in a release build. For a deployed backend use HTTPS and **omit** `KINETIQ_ALLOW_DEV_HTTP`. `server/README.md` explains SMTP configuration for email verification and password reset; without SMTP, those actions fail explicitly. The server is a developer reference implementation, not a production-ready public service.

## Included modules

- **Welcome & onboarding:** branded loading/welcome, Get Started, Explore as Guest, Sign In, Sign Up, Forgot Password, six-step optional and resumable onboarding.
- **Guest and account:** free-account login/registration with an optional server, session tokens in secure mobile storage, verification and password change/reset UI, account deletion, sign out, account-to-guest data retention, explicitly reviewed backup merge and confirmed manual upload.
- **Home:** actual statistics, active-session resume, training week, nutrition preview, and meaningful empty states.
- **Training:** exercise library with custom entries, favorite/archive, routine create/edit/duplicate/favorite/archive, targets and ordering, standalone workout or routine snapshot, actual set logging, notes, optional set kinds/RPE/RIR, rest countdown, finish/discard/resume, history and explicit historical set corrections, manual cardio and weekly training programs.
- **Nutrition:** manual source-labeled foods, day/category food diary, edit/delete/copy previous day, saved meals, recipe ingredients, macro calculations that preserve unknowns, hydration, optional nutrition targets.
- **Progress:** deterministic completed-session counts, volume and fitness/chart summaries without invented stats.
- **Profile and data:** editable experience/schedule/equipment/goals/units, guest/local data export to JSON, file-based or pasted JSON import with duplicate/conflict preview, no destructive overwrite, and local clear confirmation.
- **Backend:** Python standard-library SQLite account and manual backup server under `server/` with distinct tests. No AI endpoints.

### Component structure

`lib/shared/widgets/` provides `KHeader`, `KScreen`, `KButton`, `KCard`, `KSection`, `KChoice`, `KNumberField`, `KTextField`, `KEmptyState`, `KDialog`, `KListTile`, `KStat`, `KProgressBar`. Domain-specific reusable widgets are in each feature's `widgets/` folder (for example `SetRow`, `ExercisePicker`, `RestTimerPanel`, `CompletedSetEditor`, `MealCard`, `MacroSummary`, and `AccountForm`). All screens compose these widgets with props rather than redefining headers.

### Tests

**Flutter/Dart suite:** `flutter test` contains pure domain fixtures, widget tests, an HTTP client test harness, and 50 SQLite repository tests (routines, sessions, snapshot safety, imports, nutrition and persistence). `flutter analyze` and `flutter test` **could not be run in the authoring environment**, because the Flutter SDK is not installed. Do not treat the test suite as verified until it passes in your SDK.

**Python service suite:** from `server/` run `python -m unittest discover -s tests -v`. **35 Python tests passed** in the authoring environment, including migration constraints, authentication, token expiry, password recovery and backup conflict handling.

Read [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md) for manual device workflows and [`docs/BLUEPRINT_COVERAGE.md`](docs/BLUEPRINT_COVERAGE.md) for outstanding release gates.

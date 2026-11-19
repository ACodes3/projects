# Test coverage and reproducible manual checks

## Automated

From the Flutter project root:

```
flutter pub get
flutter analyze
flutter test
```

Test files cover: deterministic workout and nutrition calculations; units, date boundaries and missing data; reusable header/buttons/fields/forms; HTTPS account client behavior; 50 concrete in-memory Drift repository tests for routines, exercises, sessions, completed sets, history snapshots, cardio, diary, saved meals, goals, export/import and conflict prevention.

From `server/`:

```
python -m unittest discover -s tests -v
```

35 Python service tests passed in the authoring container. The Dart suite has **not** been run here: no Flutter SDK or Android emulator is available.

## Device QA checklist (run before trusting local data)

- [ ] Fresh install → Welcome → Guest; change/replay onboarding without losing history
- [ ] Create 3 guest routines, confirm 4th blocked and logged sessions unlimited
- [ ] Create a routine, reorder and edit sets/rest/notes, duplicate and archive
- [ ] Start workout, record weights/reps, edit set details, leave/reopen app, verify actuals and rest timer
- [ ] Finish workout twice, see one session; correct historical set, verify volume changes, template remains unchanged
- [ ] Force stop, reopen, resume draft; discard other draft with confirmation
- [ ] Add manual running/cycling and inspect progress without invented pace/PR data
- [ ] Create food with known and unknown nutrients; log/edit meal, saved meal, recipe, hydration, copy yesterday
- [ ] Set nutrition goals; switch imperial/metric, ensure canonical DB values unchanged
- [ ] Export JSON; import after wiping local records; inspect duplication and conflicting-ID block
- [ ] Start optional server; register/login/signout; confirm guest records retained; upload revision-checked backup
- [ ] Restore to another fresh device **only through reviewed backup import**; verify cloud conflicts do not overwrite
- [ ] Verify email/password recovery using configured SMTP (or explicit error if absent)
- [ ] Check no AI tab/SDK/API keys; subscription screen does not allow fake payment
- [ ] Test screen-reader text, narrow Android display, large fonts, landscape, background timer and keyboard

Never uninstall the app before exporting its only local data. Normal guest records are not synced automatically.

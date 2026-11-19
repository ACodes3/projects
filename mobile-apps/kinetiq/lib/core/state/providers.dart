import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import '../database/app_database.dart';
import '../repository/kinetiq_repository.dart';
import 'app_controller.dart';
import '../network/account_api.dart';
import 'account_controller.dart';

final databaseProvider = Provider<KinetiqDatabase>((ref) {
  final db = KinetiqDatabase();
  ref.onDispose(() {
    unawaited(db.close());
  });
  return db;
});
final repositoryProvider = Provider<KinetiqRepository>(
  (ref) => KinetiqRepository(ref.watch(databaseProvider)),
);
final appControllerProvider = ChangeNotifierProvider<AppController>((ref) {
  final controller = AppController(ref.watch(repositoryProvider));
  unawaited(controller.initialize());
  return controller;
});

final accountApiProvider = Provider<AccountApi>((ref) {
  final api = AccountApi();
  ref.onDispose(api.close);
  return api;
});
final accountControllerProvider = ChangeNotifierProvider<AccountController>((
  ref,
) {
  final controller = AccountController(
    ref.watch(accountApiProvider),
    ref.watch(repositoryProvider),
  );
  unawaited(controller.initialize());
  return controller;
});

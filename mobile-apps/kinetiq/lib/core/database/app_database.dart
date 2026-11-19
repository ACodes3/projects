import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';

import 'schema.dart';
import 'schema_v2.dart';

/// Drift-backed SQLite database using explicit, reviewable SQL.
/// No generated files or build_runner step required.
class KinetiqDatabase extends GeneratedDatabase {
  KinetiqDatabase() : super(driftDatabase(name: 'kinetiq_v2'));
  KinetiqDatabase.test(super.executor);

  @override
  int get schemaVersion => 2;

  @override
  Iterable<DatabaseSchemaEntity> get allSchemaEntities => const [];

  @override
  Iterable<TableInfo<Table, dynamic>> get allTables => const [];

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) async {
      for (final statement in [...schemaV1, ...schemaV2]) {
        await customStatement(statement);
      }
    },
    onUpgrade: (m, from, to) async {
      if (from == 1 && to == 2) {
        for (final statement in schemaV2) {
          await customStatement(statement);
        }
        return;
      }
      // Never silently drop or replace existing user data.
      throw StateError('No migration implemented from schema $from to $to');
    },
    beforeOpen: (details) async {
      await customStatement('PRAGMA foreign_keys = ON');
    },
  );

  Future<List<Map<String, dynamic>>> query(
    String sql, [
    List<Object?> args = const [],
  ]) async {
    final vars = args.map<Variable<Object>>((value) {
      if (value == null) return const Variable<String>(null);
      if (value is int) return Variable<int>(value);
      if (value is double) return Variable<double>(value);
      return Variable<String>(value.toString());
    }).toList();
    final rows = await customSelect(sql, variables: vars).get();
    return rows.map((e) => e.data).toList();
  }

  Future<void> execute(String sql, [List<Object?> args = const []]) =>
      customStatement(sql, args);
}

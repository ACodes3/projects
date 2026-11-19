import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../network/account_api.dart';
import '../repository/kinetiq_repository.dart';

class AccountController extends ChangeNotifier {
  AccountController(this.api, this.repository, {FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();
  final AccountApi api;
  final KinetiqRepository repository;
  final FlutterSecureStorage _storage;
  String? _token;
  String? email;
  String? userId;
  bool verified = false;
  bool ready = false;
  bool busy = false;
  String? error;
  int? lastConfirmedRevision;
  DateTime? lastBackupAt;

  bool get signedIn => _token != null && userId != null;
  bool get serverConfigured => api.configured;
  String get accountLabel => signedIn
      ? (verified ? 'Free account' : 'Free account · verify email')
      : 'Local guest';

  Future<void> initialize() async {
    try {
      _token = await _storage.read(key: 'kinetiq_session');
      if (_token != null) {
        try {
          final me = await api.request('GET', '/auth/me', token: _token);
          userId = me['id'] as String?;
          email = me['email'] as String?;
          verified = me['verified'] == true;
          if (userId != null) {
            await repository.setPreference('connected_account_id', userId!);
          }
        } catch (_) {
          // Leave local training records untouched. Connection may be offline.
          error = 'Cannot verify account session. Training and nutrition still work locally.';
        }
      }
    } finally {
      ready = true;
      notifyListeners();
    }
  }

  Future<T> _run<T>(Future<T> Function() action) async {
    if (busy) throw StateError('An account action is already running.');
    busy = true;
    error = null;
    notifyListeners();
    try {
      return await action();
    } catch (e) {
      error = e.toString();
      rethrow;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> signIn(String email, String password, {bool register = false}) =>
      _run(() async {
        final result = await api.request(
          'POST',
          register ? '/auth/register' : '/auth/login',
          body: {'email': email.trim(), 'password': password},
        );
        final token = result['token'] as String?;
        final id = result['id'] as String?;
        if (token == null || id == null) {
          throw StateError('Account server returned an invalid session.');
        }
        final originalOwner = await repository.preference(
          'local_data_account_id',
        );
        if (originalOwner != null &&
            originalOwner.isNotEmpty &&
            originalOwner != id) {
          throw StateError(
            'Local data belongs to another signed-in account. Export it and clear this local profile before switching accounts. No records were uploaded.',
          );
        }
        await _storage.write(key: 'kinetiq_session', value: token);
        _token = token;
        userId = id;
        this.email = result['email'] as String?;
        verified = result['verified'] == true;
        await repository.setPreference('connected_account_id', id);
        await repository.setPreference('local_data_account_id', id);
        // Critically, no local data is deleted or uploaded on sign-in.
      });

  Future<void> signOut() => _run(() async {
    if (_token != null && api.configured) {
      try {
        await api.request('POST', '/auth/logout', token: _token, body: {});
      } catch (_) {
        // Local sign-out revokes this device token, server token expires.
      }
    }
    await _storage.delete(key: 'kinetiq_session');
    await repository.setPreference('connected_account_id', '');
    _token = null;
    userId = null;
    email = null;
    verified = false;
    lastConfirmedRevision = null;
    lastBackupAt = null;
  });

  Future<Map<String, dynamic>> getRemoteBackup() async {
    if (!signedIn) throw StateError('Sign in first.');
    return api.request('GET', '/backup', token: _token);
  }

  Future<int> backupWithRevision(int expectedRevision) => _run(() async {
    if (!signedIn) throw StateError('Sign in first.');
    final data =
        jsonDecode(await repository.exportJson()) as Map<String, dynamic>;
    final response = await api.request(
      'PUT',
      '/backup',
      token: _token,
      body: {'expectedRevision': expectedRevision, 'snapshot': data},
    );
    if (response['status'] != 'confirmed') {
      throw StateError('Server did not confirm backup.');
    }
    lastConfirmedRevision = (response['revision'] as num).toInt();
    lastBackupAt = DateTime.now();
    return lastConfirmedRevision!;
  });

  Future<ImportPreview> previewRemoteBackup(Map<String, dynamic> remote) async {
    final snapshot = remote['snapshot'];
    if (snapshot == null) return const ImportPreview(0, 0, 0);
    return repository.previewImport(jsonEncode(snapshot));
  }

  Future<ImportPreview> mergeRemoteBackup(Map<String, dynamic> remote) =>
      _run(() async {
        if (!signedIn) throw StateError('Sign in first.');
        final snapshot = remote['snapshot'];
        if (snapshot == null) return const ImportPreview(0, 0, 0);
        return repository.importJson(jsonEncode(snapshot));
      });

  Future<void> requestReset(String email) async {
    await api.request('POST', '/auth/reset/request', body: {'email': email});
  }

  Future<void> confirmReset(String code, String password) async {
    await api.request(
      'POST',
      '/auth/reset/confirm',
      body: {'code': code, 'password': password},
    );
  }

  Future<void> requestVerification() async {
    if (!signedIn) throw StateError('Sign in first.');
    await api.request(
      'POST',
      '/auth/verify/request',
      token: _token,
      body: {'email': email},
    );
  }

  Future<void> confirmVerification(String code) => _run(() async {
    await api.request('POST', '/auth/verify/confirm', body: {'code': code});
    verified = true;
  });
  Future<void> changePassword(String oldPassword, String newPassword) async {
    await api.request(
      'POST',
      '/auth/password/change',
      token: _token,
      body: {'oldPassword': oldPassword, 'newPassword': newPassword},
    );
  }

  Future<void> deleteAccount() => _run(() async {
    if (!signedIn) throw StateError('Sign in first.');
    await api.request('DELETE', '/account', token: _token);
    await _storage.delete(key: 'kinetiq_session');
    await repository.setPreference('connected_account_id', '');
    _token = null;
    userId = null;
    email = null;
    verified = false;
    lastConfirmedRevision = null;
    // Local training records are intentionally kept for independent export.
  });
}

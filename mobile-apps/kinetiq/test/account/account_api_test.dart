import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kinetiq/core/network/account_api.dart';

void main() {
  test('without a backend the app keeps guest mode available', () async {
    final api = AccountApi(baseUrl: '');
    addTearDown(api.close);
    expect(api.configured, isFalse);
    await expectLater(api.request('GET', '/auth/me'), throwsStateError);
  });
  test('rejects unencrypted public account endpoints by default', () async {
    final api = AccountApi(baseUrl: 'http://example.org/');
    addTearDown(api.close);
    await expectLater(api.request('GET', '/auth/me'), throwsStateError);
  });
  test('uses HTTPS and JSON for account registration', () async {
    final client = MockClient((request) async {
      expect(request.url.scheme, 'https');
      expect(request.url.path, '/auth/register');
      expect(request.method, 'POST');
      expect(jsonDecode(request.body)['email'], 'test@example.com');
      return http.Response(
        jsonEncode({
          'id': 'account-1',
          'token': 'secret',
          'email': 'test@example.com',
          'verified': false,
        }),
        200,
      );
    });
    final api = AccountApi(
      baseUrl: 'https://accounts.example.org/',
      client: client,
    );
    addTearDown(api.close);
    final response = await api.request(
      'POST',
      '/auth/register',
      body: {'email': 'test@example.com', 'password': 'very-long-password'},
    );
    expect(response['id'], 'account-1');
    expect(response['verified'], isFalse);
  });
  test('uses bearer authorization only when a token is supplied', () async {
    final client = MockClient((request) async {
      expect(request.headers['Authorization'], 'Bearer device-token');
      return http.Response('{"id":"example"}', 200);
    });
    final api = AccountApi(
      baseUrl: 'https://accounts.example.org/',
      client: client,
    );
    addTearDown(api.close);
    expect(
      (await api.request('GET', '/auth/me', token: 'device-token'))['id'],
      'example',
    );
  });
  test('failed backend requests cannot be mistaken for success', () async {
    final client = MockClient(
      (request) async => http.Response('{"error":"Invalid credentials"}', 401),
    );
    final api = AccountApi(
      baseUrl: 'https://accounts.example.org/',
      client: client,
    );
    addTearDown(api.close);
    await expectLater(
      api.request('POST', '/auth/login', body: {'email': 'a@b.com'}),
      throwsStateError,
    );
  });
  test('non-JSON server responses fail safely', () async {
    final client = MockClient(
      (request) async => http.Response('<html>error</html>', 500),
    );
    final api = AccountApi(
      baseUrl: 'https://accounts.example.org/',
      client: client,
    );
    addTearDown(api.close);
    await expectLater(api.request('GET', '/auth/me'), throwsStateError);
  });
}

import 'dart:convert';

import 'package:http/http.dart' as http;

/// All connected operations are opt-in; no AI endpoints exist.
/// Configure an HTTPS backend using --dart-define=KINETIQ_API_BASE_URL=https://...
class AccountApi {
  AccountApi({http.Client? client, String? baseUrl})
    : _client = client ?? http.Client(),
      baseUrl = baseUrl ?? const String.fromEnvironment('KINETIQ_API_BASE_URL');

  final http.Client _client;
  final String baseUrl;
  static const _allowDevHttp = bool.fromEnvironment('KINETIQ_ALLOW_DEV_HTTP');
  bool get configured => baseUrl.trim().isNotEmpty;

  Future<Map<String, dynamic>> request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    String? token,
  }) async {
    if (!configured) {
      throw StateError(
        'Account server is not configured. Guest mode remains available.',
      );
    }
    final base = Uri.tryParse(baseUrl);
    if (base == null ||
        !base.hasAuthority ||
        (base.scheme != 'https' && !(_allowDevHttp && base.scheme == 'http'))) {
      throw StateError(
        'Account server requires HTTPS (except explicitly enabled local development).',
      );
    }
    final uri = base.resolve(path.startsWith('/') ? path.substring(1) : path);
    final headers = <String, String>{'Accept': 'application/json'};
    if (token != null) headers['Authorization'] = 'Bearer $token';
    if (body != null) headers['Content-Type'] = 'application/json';
    late http.Response response;
    try {
      final future = switch (method) {
        'GET' => _client.get(uri, headers: headers),
        'POST' => _client.post(
          uri,
          headers: headers,
          body: jsonEncode(body ?? {}),
        ),
        'PUT' => _client.put(
          uri,
          headers: headers,
          body: jsonEncode(body ?? {}),
        ),
        'DELETE' => _client.delete(uri, headers: headers),
        _ => throw ArgumentError.value(
          method,
          'method',
          'Unsupported HTTP method',
        ),
      };
      response = await future.timeout(const Duration(seconds: 20));
    } catch (_) {
      rethrow; // Nothing is marked as backed up or signed in after transport failure.
    }
    Map<String, dynamic> data;
    try {
      data = (jsonDecode(response.body) as Map).cast<String, dynamic>();
    } catch (_) {
      throw StateError(
        'Invalid response from account server (${response.statusCode}).',
      );
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw StateError(
        data['error']?.toString() ??
            'Account request failed (${response.statusCode}).',
      );
    }
    return data;
  }

  void close() => _client.close();
}

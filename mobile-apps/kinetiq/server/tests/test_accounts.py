import json
import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from kinetiq_server import AccountService, ApiError


class AccountTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.current = 1700000000
        self.messages = []
        self.service = AccountService(str(Path(self.tmp.name) / 'accounts.sqlite3'),
            clock=lambda: self.current,
            send_email=lambda to, subject, body: self.messages.append((to, subject, body)))

    def tearDown(self):
        self.tmp.cleanup()

    def register(self, email='hello@example.com', password='long-password-123'):
        return self.service.register(email, password)

    def assertApiError(self, status, fn):
        with self.assertRaises(ApiError) as ctx:
            fn()
        self.assertEqual(ctx.exception.status, status)

    def test_register_and_login(self):
        result = self.register('HELLO@EXAMPLE.COM')
        self.assertEqual(result['email'], 'hello@example.com')
        self.assertFalse(result['verified'])
        self.assertNotEqual(result['token'], 'long-password-123')
        self.assertEqual(self.service.user(result['token'])['email'], 'hello@example.com')
        other = self.service.login('HELLO@example.com', 'long-password-123')
        self.assertNotEqual(other['token'], result['token'])

    def test_hash_stored_not_password(self):
        self.register()
        with self.service.connection() as db:
            stored = db.execute('SELECT password_hash FROM users').fetchone()[0]
        self.assertTrue(stored.startswith('pbkdf2_sha256$'))
        self.assertNotIn('long-password-123', stored)

    def test_duplicate_account(self):
        self.register()
        self.assertApiError(409, lambda: self.register('Hello@Example.com'))

    def test_bad_emails(self):
        for bad in ['', 'bad', 'hello@', '@example.com', 'a b@z.net', None, 4]:
            with self.subTest(bad=bad):
                self.assertApiError(400, lambda: self.service.register(bad, 'long-password-123'))

    def test_bad_passwords(self):
        for pwd in ['', 'short', 'a'*11, 'x'*257, None]:
            with self.subTest(pwd=str(pwd)[:20]):
                self.assertApiError(400, lambda: self.service.register('hello@example.com', pwd))

    def test_wrong_password_and_unknown_user(self):
        self.register()
        for email, pwd in [('hello@example.com','nope'), ('nobody@example.com','long-password-123')]:
            with self.subTest(email=email):
                self.assertApiError(401, lambda: self.service.login(email, pwd))

    def test_missing_token(self):
        for token in [None, '', 'invalid', 4]:
            with self.subTest(token=token):
                self.assertApiError(401, lambda: self.service.user(token))

    def test_expired_token(self):
        token = self.register()['token']
        self.current += 8*86400
        self.assertApiError(401, lambda: self.service.user(token))

    def test_logout_revokes_one_session(self):
        a = self.register()['token']
        b = self.service.login('hello@example.com', 'long-password-123')['token']
        self.service.logout(a)
        self.assertApiError(401, lambda: self.service.user(a))
        self.assertEqual(self.service.user(b)['email'], 'hello@example.com')

    def test_password_reset_round_trip(self):
        old_token = self.register()['token']
        self.service.request_one_time('hello@example.com', 'password_reset')
        self.assertEqual(len(self.messages), 1)
        code = self.messages[0][2].split('code is: ')[1].splitlines()[0]
        self.assertApiError(400, lambda: self.service.consume_one_time(code, 'password_reset', 'short'))
        self.service.consume_one_time(code, 'password_reset', 'new-password-456')
        self.assertApiError(400, lambda: self.service.consume_one_time(code, 'password_reset', 'new-password-456'))
        self.assertApiError(401, lambda: self.service.user(old_token))
        self.assertApiError(401, lambda: self.service.login('hello@example.com', 'long-password-123'))
        self.assertIsNotNone(self.service.login('hello@example.com', 'new-password-456')['token'])

    def test_password_reset_expired(self):
        self.register()
        self.service.request_one_time('hello@example.com', 'password_reset')
        code = self.messages[0][2].split('code is: ')[1].splitlines()[0]
        self.current += 1801
        self.assertApiError(400, lambda: self.service.consume_one_time(code, 'password_reset', 'new-password-456'))

    def test_unknown_address_no_reset_email(self):
        self.register()
        self.service.request_one_time('missing@example.com', 'password_reset')
        self.assertEqual(self.messages, [])

    def test_email_verification(self):
        t = self.register()['token']
        self.service.request_one_time('hello@example.com', 'email_verify')
        code = self.messages[-1][2].split('code is: ')[1].splitlines()[0]
        self.service.consume_one_time(code, 'email_verify')
        self.assertTrue(self.service.user(t)['verified'])

    def test_wrong_code_purpose(self):
        self.register()
        self.service.request_one_time('hello@example.com', 'email_verify')
        code = self.messages[-1][2].split('code is: ')[1].splitlines()[0]
        self.assertApiError(400, lambda: self.service.consume_one_time(code, 'password_reset', 'new-password-456'))

    def test_invalid_code(self):
        self.assertApiError(400, lambda: self.service.consume_one_time('bad', 'email_verify'))
        self.assertApiError(400, lambda: self.service.consume_one_time('', 'email_verify'))

    def test_change_password(self):
        t = self.register()['token']
        other = self.service.login('hello@example.com', 'long-password-123')['token']
        self.assertApiError(403, lambda: self.service.change_password(t, 'wrong', 'new-password-456'))
        self.assertApiError(400, lambda: self.service.change_password(t, 'long-password-123', 'short'))
        self.service.change_password(t, 'long-password-123', 'new-password-456')
        self.assertApiError(401, lambda: self.service.user(other))
        self.assertIsNotNone(self.service.user(t))
        self.assertIsNotNone(self.service.login('hello@example.com', 'new-password-456'))

    def test_missing_email_service_is_explicit_error(self):
        self.register()
        self.service.send_email = None
        self.assertApiError(503, lambda: self.service.request_one_time('hello@example.com', 'password_reset'))

    def sample_backup(self):
        return {'format':'kinetiq-offline-export','schemaVersion':2,
                'exercises':[], 'routines':[], 'sessions':[], 'session_sets':[],
                'foods':[], 'meal_entries':[]}

    def test_empty_backup(self):
        token = self.register()['token']
        self.assertEqual(self.service.get_backup(token)['revision'], 0)
        self.assertIsNone(self.service.get_backup(token)['snapshot'])

    def test_backup_upload_roundtrip(self):
        token = self.register()['token']
        one = self.service.put_backup(token, 0, self.sample_backup())
        self.assertEqual(one['status'], 'confirmed')
        self.assertEqual(one['revision'], 1)
        self.assertEqual(self.service.get_backup(token)['snapshot'], self.sample_backup())
        self.assertEqual(self.service.put_backup(token, 1, self.sample_backup())['revision'], 2)

    def test_stale_revision_conflict(self):
        token = self.register()['token']
        self.service.put_backup(token, 0, self.sample_backup())
        self.assertApiError(409, lambda: self.service.put_backup(token, 0, self.sample_backup()))
        self.assertEqual(self.service.get_backup(token)['revision'], 1)

    def test_bad_revision(self):
        token = self.register()['token']
        for bad in [None,-1,'0',True,1.0]:
            with self.subTest(bad=bad):
                self.assertApiError(400, lambda: self.service.put_backup(token, bad, self.sample_backup()))

    def test_invalid_backup_format(self):
        token = self.register()['token']
        for bad in [{}, [], None, {'format':'other','schemaVersion':2},
                    {'format':'kinetiq-offline-export','schemaVersion':99}]:
            with self.subTest(bad=bad):
                self.assertApiError(400, lambda: self.service.put_backup(token, 0, bad))

    def test_missing_backup_table(self):
        token = self.register()['token']
        backup = self.sample_backup()
        del backup['meal_entries']
        self.assertApiError(400, lambda: self.service.put_backup(token, 0, backup))

    def test_backup_limit(self):
        token = self.register()['token']
        backup = self.sample_backup()
        backup['extra'] = 'x' * 8_100_000
        self.assertApiError(413, lambda: self.service.put_backup(token, 0, backup))

    def test_account_isolation(self):
        a = self.register()['token']
        b = self.register('other@example.com')['token']
        self.service.put_backup(a, 0, self.sample_backup())
        self.assertEqual(self.service.get_backup(b)['revision'], 0)
        self.assertIsNone(self.service.get_backup(b)['snapshot'])

    def test_delete_account_removes_backup_and_sessions(self):
        t = self.register()['token']
        self.service.put_backup(t, 0, self.sample_backup())
        self.service.delete_account(t)
        self.assertApiError(401, lambda: self.service.user(t))
        with self.service.connection() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM backups').fetchone()[0], 0)
            self.assertEqual(db.execute('SELECT COUNT(*) FROM tokens').fetchone()[0], 0)
            self.assertEqual(db.execute('SELECT COUNT(*) FROM users').fetchone()[0], 0)

    def test_duplicate_reset_request_invalidates_first_code(self):
        self.register()
        self.service.request_one_time('hello@example.com','password_reset')
        first = self.messages[-1][2].split('code is: ')[1].splitlines()[0]
        self.service.request_one_time('hello@example.com','password_reset')
        second = self.messages[-1][2].split('code is: ')[1].splitlines()[0]
        self.assertNotEqual(first,second)
        self.assertApiError(400, lambda: self.service.consume_one_time(first,'password_reset','new-password-456'))

if __name__ == '__main__':
    unittest.main()

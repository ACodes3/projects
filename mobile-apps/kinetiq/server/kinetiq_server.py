"""KINETIQ optional self-hosted account/backup API (Python 3.11+, stdlib only).

Default HTTP listener is for localhost development ONLY. Put behind HTTPS and
configure SMTP, rate limits, secrets, monitoring, and account/privacy policy
before any public deployment. It implements accounts and revisioned backup,
NOT multi-entity two-way sync or store billing.
"""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import smtplib
import sqlite3
import threading
import time
from email.message import EmailMessage
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from contextlib import contextmanager
from urllib.parse import urlsplit

DB_PATH = os.environ.get('KINETIQ_SERVER_DB', 'kinetiq_server.sqlite3')
_EMAIL = re.compile(r'^[^\s@]{1,100}@[^\s@]{1,100}\.[^\s@]{2,40}$')
MAX_BACKUP = 8_000_000
PBKDF_ITERATIONS = 350_000

class ApiError(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message
        super().__init__(message)

class AccountService:
    def __init__(self, database_path=DB_PATH, *, clock=time.time, send_email=None):
        self.path = str(database_path)
        self.clock = clock
        self.send_email = send_email
        self.lock = threading.RLock()
        self._initialize()

    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.path, timeout=30, check_same_thread=False)
        try:
            db.row_factory = sqlite3.Row
            db.execute('PRAGMA foreign_keys=ON')
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def _initialize(self):
        with self.connection() as db:
            db.executescript('''
                CREATE TABLE IF NOT EXISTS users (
                  id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE,
                  password_hash TEXT NOT NULL, verified INTEGER NOT NULL DEFAULT 0,
                  created_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS tokens (
                  hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                  purpose TEXT NOT NULL, expires INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS backups (
                  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                  revision INTEGER NOT NULL, content TEXT NOT NULL,
                  updated_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS ix_tokens_expiry ON tokens(expires);
            ''')

    def _now(self):
        return int(self.clock())

    def _hash_password(self, password, salt=None):
        salt = salt or secrets.token_bytes(16)
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf8'), salt, PBKDF_ITERATIONS)
        return f'pbkdf2_sha256${PBKDF_ITERATIONS}${salt.hex()}${key.hex()}'

    def _valid_password(self, password, encoded):
        try:
            method, count, salt, expected = encoded.split('$')
            if method != 'pbkdf2_sha256':
                return False
            key = hashlib.pbkdf2_hmac('sha256', password.encode('utf8'), bytes.fromhex(salt), int(count))
            return hmac.compare_digest(key, bytes.fromhex(expected))
        except (ValueError, TypeError):
            return False

    def _token(self, db, user_id, purpose, duration):
        token = secrets.token_urlsafe(40)
        digest = hashlib.sha256(token.encode()).hexdigest()
        db.execute('INSERT INTO tokens(hash,user_id,purpose,expires) VALUES(?,?,?,?)',
                   (digest, user_id, purpose, self._now() + duration))
        return token

    def _notify(self, email, subject, message):
        if self.send_email:
            self.send_email(email, subject, message)
            return
        host = os.environ.get('KINETIQ_SMTP_HOST')
        sender = os.environ.get('KINETIQ_SMTP_FROM')
        if not host or not sender:
            raise ApiError(503, 'Email delivery is not configured. Contact the service administrator.')
        mail = EmailMessage()
        mail['From'], mail['To'], mail['Subject'] = sender, email, subject
        mail.set_content(message)
        with smtplib.SMTP(host, int(os.environ.get('KINETIQ_SMTP_PORT', '587')), timeout=15) as smtp:
            smtp.starttls()
            username, password = os.environ.get('KINETIQ_SMTP_USER'), os.environ.get('KINETIQ_SMTP_PASS')
            if username and password:
                smtp.login(username, password)
            smtp.send_message(mail)

    def register(self, email, password):
        if not isinstance(email, str) or not _EMAIL.fullmatch(email.strip()):
            raise ApiError(400, 'Enter a valid email address.')
        if not isinstance(password, str) or len(password) < 12 or len(password) > 256:
            raise ApiError(400, 'Password must have between 12 and 256 characters.')
        email = email.strip().lower()
        with self.lock, self.connection() as db:
            if db.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone():
                raise ApiError(409, 'An account with that email already exists.')
            user_id = secrets.token_hex(16)
            db.execute('INSERT INTO users VALUES(?,?,?,?,?)', (user_id, email, self._hash_password(password), 0, self._now()))
            token = self._token(db, user_id, 'session', 7*86400)
            # No unverified user is granted privileged abilities; training is still local.
            return {'token': token, 'email': email, 'verified': False, 'id': user_id}

    def login(self, email, password):
        if not isinstance(email, str) or not isinstance(password, str):
            raise ApiError(401, 'Invalid email or password.')
        with self.lock, self.connection() as db:
            row = db.execute('SELECT * FROM users WHERE email=?', (email.strip().lower(),)).fetchone()
            if row is None or not self._valid_password(password, row['password_hash']):
                raise ApiError(401, 'Invalid email or password.')
            token = self._token(db, row['id'], 'session', 7*86400)
            return {'token': token, 'email': row['email'], 'verified': bool(row['verified']), 'id': row['id']}

    def user(self, token):
        if not isinstance(token, str) or not token:
            raise ApiError(401, 'Sign in to continue.')
        digest = hashlib.sha256(token.encode()).hexdigest()
        with self.connection() as db:
            row = db.execute('''SELECT u.id,u.email,u.verified FROM tokens t JOIN users u ON u.id=t.user_id
              WHERE t.hash=? AND t.purpose='session' AND t.expires>?''', (digest, self._now())).fetchone()
        if not row:
            raise ApiError(401, 'Session expired. Sign in again.')
        return dict(row)

    def logout(self, token):
        with self.lock, self.connection() as db:
            db.execute('DELETE FROM tokens WHERE hash=?', (hashlib.sha256(token.encode()).hexdigest(),))
        return {'success': True}

    def request_one_time(self, email, purpose):
        if purpose not in ('password_reset', 'email_verify'):
            raise ApiError(400, 'Unknown verification action.')
        if not isinstance(email, str):
            raise ApiError(400, 'Invalid email.')
        with self.lock, self.connection() as db:
            row = db.execute('SELECT id,email FROM users WHERE email=?', (email.strip().lower(),)).fetchone()
            if row:
                # Avoid invalidating prior tokens if SMTP delivery is not configured.
                if not (self.send_email or (os.environ.get('KINETIQ_SMTP_HOST') and os.environ.get('KINETIQ_SMTP_FROM'))):
                    raise ApiError(503, 'Email delivery is not configured. Contact the service administrator.')
                db.execute('DELETE FROM tokens WHERE user_id=? AND purpose=?', (row['id'], purpose))
                token = self._token(db, row['id'], purpose, 1800)
                self._notify(row['email'], 'KINETIQ account verification' if purpose == 'email_verify' else 'KINETIQ password reset',
                             f'Your single-use code is: {token}\nThis code expires in 30 minutes.')
        return {'message': 'If the address exists, a code has been sent.'}

    def consume_one_time(self, token, purpose, password=None):
        if not isinstance(token, str) or not token:
            raise ApiError(400, 'A code is required.')
        if purpose == 'password_reset' and (not isinstance(password, str) or not 12 <= len(password) <= 256):
            raise ApiError(400, 'Password must have between 12 and 256 characters.')
        with self.lock, self.connection() as db:
            digest = hashlib.sha256(token.encode()).hexdigest()
            row = db.execute('SELECT user_id FROM tokens WHERE hash=? AND purpose=? AND expires>?',
                             (digest, purpose, self._now())).fetchone()
            if not row:
                raise ApiError(400, 'Code is invalid or expired.')
            if purpose == 'password_reset':
                db.execute('UPDATE users SET password_hash=? WHERE id=?', (self._hash_password(password), row['user_id']))
                db.execute('DELETE FROM tokens WHERE user_id=?', (row['user_id'],))
            else:
                db.execute('UPDATE users SET verified=1 WHERE id=?', (row['user_id'],))
                db.execute('DELETE FROM tokens WHERE hash=?', (digest,))
        return {'success': True}

    def change_password(self, token, old_password, new_password):
        user = self.user(token)
        if not isinstance(new_password, str) or not 12 <= len(new_password) <= 256:
            raise ApiError(400, 'Password must have between 12 and 256 characters.')
        with self.lock, self.connection() as db:
            row = db.execute('SELECT password_hash FROM users WHERE id=?', (user['id'],)).fetchone()
            if not self._valid_password(old_password or '', row['password_hash']):
                raise ApiError(403, 'Current password is incorrect.')
            db.execute('UPDATE users SET password_hash=? WHERE id=?', (self._hash_password(new_password), user['id']))
            db.execute('DELETE FROM tokens WHERE user_id=? AND hash!=?', (user['id'], hashlib.sha256(token.encode()).hexdigest()))
        return {'success': True}

    def delete_account(self, token):
        user = self.user(token)
        with self.lock, self.connection() as db:
            db.execute('DELETE FROM users WHERE id=?', (user['id'],))
        return {'success': True}

    @staticmethod
    def _validate_backup(document):
        if not isinstance(document, dict) or document.get('format') != 'kinetiq-offline-export' or document.get('schemaVersion') not in (1,2):
            raise ApiError(400, 'Incompatible KINETIQ backup format.')
        for table in ('exercises', 'routines', 'sessions', 'session_sets', 'foods', 'meal_entries'):
            if not isinstance(document.get(table), list):
                raise ApiError(400, f'Backup is missing {table}.')
        encoded = json.dumps(document, separators=(',', ':'))
        if len(encoded.encode()) > MAX_BACKUP:
            raise ApiError(413, 'Backup is too large (max 8 MB).')
        return encoded

    def get_backup(self, token):
        user = self.user(token)
        with self.connection() as db:
            row = db.execute('SELECT revision,content,updated_at FROM backups WHERE user_id=?', (user['id'],)).fetchone()
        return {'revision': row['revision'], 'snapshot': json.loads(row['content']), 'updatedAt': row['updated_at']} if row else {'revision': 0, 'snapshot': None}

    def put_backup(self, token, expected_revision, snapshot):
        user = self.user(token)
        if not isinstance(expected_revision, int) or isinstance(expected_revision, bool) or expected_revision < 0:
            raise ApiError(400, 'An expectedRevision number is required.')
        encoded = self._validate_backup(snapshot)
        with self.lock, self.connection() as db:
            row = db.execute('SELECT revision FROM backups WHERE user_id=?', (user['id'],)).fetchone()
            revision = row['revision'] if row else 0
            if revision != expected_revision:
                raise ApiError(409, 'Cloud copy changed. Review the latest backup before uploading.')
            db.execute('''INSERT INTO backups(user_id,revision,content,updated_at) VALUES(?,?,?,?)
              ON CONFLICT(user_id) DO UPDATE SET revision=excluded.revision,content=excluded.content,updated_at=excluded.updated_at''',
              (user['id'], revision + 1, encoded, self._now()))
        return {'revision': revision + 1, 'status': 'confirmed', 'updatedAt': self._now()}

class RequestHandler(BaseHTTPRequestHandler):
    service = None
    _limit = 8_100_000

    def _data(self):
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if size <= 0 or size > self._limit:
                raise ApiError(413, 'Request body missing or too large.')
            body = json.loads(self.rfile.read(size))
            if not isinstance(body, dict):
                raise ValueError()
            return body
        except (ValueError, json.JSONDecodeError):
            raise ApiError(400, 'Expected a JSON object.')

    def _token(self):
        value = self.headers.get('Authorization', '')
        if not value.startswith('Bearer '):
            raise ApiError(401, 'Sign in to continue.')
        return value[len('Bearer '):]

    def _respond(self, status, payload):
        body = json.dumps(payload).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _dispatch(self):
        route = urlsplit(self.path).path
        data = self._data() if self.command in ('POST','PUT') else {}
        srv = self.service
        if route == '/health' and self.command == 'GET':
            return 200, {'status':'ok'}
        if route == '/auth/register' and self.command == 'POST':
            return 201, srv.register(data.get('email'), data.get('password'))
        if route == '/auth/login' and self.command == 'POST':
            return 200, srv.login(data.get('email'), data.get('password'))
        if route == '/auth/me' and self.command == 'GET':
            user = srv.user(self._token())
            return 200, {'email':user['email'],'verified':bool(user['verified']),'id':user['id']}
        if route == '/auth/logout' and self.command == 'POST':
            return 200, srv.logout(self._token())
        if route == '/auth/reset/request' and self.command == 'POST':
            return 200, srv.request_one_time(data.get('email'), 'password_reset')
        if route == '/auth/reset/confirm' and self.command == 'POST':
            return 200, srv.consume_one_time(data.get('code'), 'password_reset', data.get('password'))
        if route == '/auth/verify/request' and self.command == 'POST':
            srv.user(self._token())
            return 200, srv.request_one_time(data.get('email'), 'email_verify')
        if route == '/auth/verify/confirm' and self.command == 'POST':
            return 200, srv.consume_one_time(data.get('code'), 'email_verify')
        if route == '/auth/password/change' and self.command == 'POST':
            return 200, srv.change_password(self._token(), data.get('oldPassword'), data.get('newPassword'))
        if route == '/backup' and self.command == 'GET':
            return 200, srv.get_backup(self._token())
        if route == '/backup' and self.command == 'PUT':
            return 200, srv.put_backup(self._token(), data.get('expectedRevision'), data.get('snapshot'))
        if route == '/account' and self.command == 'DELETE':
            return 200, srv.delete_account(self._token())
        if route == '/billing/status' and self.command == 'GET':
            srv.user(self._token())
            return 200, {'plan':'free','purchasesEnabled':False, 'reason':'Billing integration is not configured.'}
        raise ApiError(404, 'Endpoint not found.')

    def _handle(self):
        try:
            status, result = self._dispatch()
            self._respond(status, result)
        except ApiError as exc:
            self._respond(exc.status, {'error':exc.message})
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            self._respond(500, {'error':'Internal server error.'})

    do_GET = do_POST = do_PUT = do_DELETE = _handle
    def log_message(self, format, *args):
        pass  # Avoid logging tokens, emails, routes or private data by default.


def main():
    host = os.environ.get('KINETIQ_HOST','127.0.0.1')
    port = int(os.environ.get('KINETIQ_PORT','8765'))
    if host not in ('127.0.0.1','localhost','::1') and os.environ.get('KINETIQ_ALLOW_UNSAFE_HTTP') != 'I_UNDERSTAND':
        raise SystemExit('Refusing public HTTP bind. Deploy behind TLS reverse proxy first.')
    RequestHandler.service = AccountService()
    server = ThreadingHTTPServer((host,port), RequestHandler)
    print(f'KINETIQ development account API on http://{host}:{port} (not a public deployment)')
    try:
        server.serve_forever()
    finally:
        server.server_close()

if __name__ == '__main__':
    main()

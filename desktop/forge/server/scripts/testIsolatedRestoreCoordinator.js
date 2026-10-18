/**
 * FORGE Step 31.8 — isolated Express/SQLite restore coordinator test.
 *
 * Run from forge/server:
 *   node scripts/testIsolatedRestoreCoordinator.js "C:\\Users\\aspas\\Downloads\\forge-backup-2026-10-18.sqlite"
 *
 * The production DB is opened READ-ONLY to create a temporary SQLite snapshot.
 * Express ONLY receives a temporary FORGE_DB_PATH and a separate test PORT.
 * restoreDatabase() ONLY targets temporary files.
 */
import Database from 'better-sqlite3';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { validateDatabaseBackup } from '../src/services/restoreService.js';
import { restoreDatabase } from '../src/services/restoreDatabase.js';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEntry = path.join(serverDir, 'src', 'server.js');
const livePath = path.resolve(serverDir, '..', 'db', 'forge.sqlite');
const backupPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getFreePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function startIsolatedBackend(target, port) {
  let log = '';
  const child = spawn(process.execPath, [serverEntry], {
    cwd: serverDir,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      FORGE_DB_PATH: target,
      PORT: String(port),
    },
  });
  child.stdout.on('data', (chunk) => { log += chunk.toString(); });
  child.stderr.on('data', (chunk) => { log += chunk.toString(); });
  child.on('error', (error) => { log += `\nProcess error: ${error.message}`; });
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Isolated backend exited early.\n${log}`);
    }
    // Require this child to announce its own listener before probing the API.
    if (log.includes(`FORGE API running at http://localhost:${port}`)) {
      try {
        const health = await fetch(`http://127.0.0.1:${port}/api/health`, {
          signal: AbortSignal.timeout(1500),
        });
        const exercises = await fetch(`http://127.0.0.1:${port}/api/exercises`, {
          signal: AbortSignal.timeout(1500),
        });
        if (health.ok && exercises.ok) {
          await exercises.json(); // Confirm that the real exercise endpoint responds with JSON.
          return child;
        }
      } catch { /* Wait for this backend to become ready. */ }
    }
    await delay(100);
  }
  await stopBackend(child);
  throw new Error(`Isolated backend never became ready.\n${log}`);
}

async function stopBackend(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise((resolve, reject) => {
    child.once('exit', resolve);
    child.once('error', reject);
  });
  if (!child.kill()) throw new Error('Could not stop isolated backend.');
  await Promise.race([
    exited,
    delay(10000).then(() => { throw new Error('Isolated backend shutdown timed out.'); }),
  ]);
}

async function main() {
  if (!backupPath) throw new Error('Supply an absolute path to a FORGE .sqlite backup.');
  const sourceInfo = validateDatabaseBackup(backupPath);
  const liveInfo = validateDatabaseBackup(livePath);
  const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'forge-coordinator-test-'));
  const targetPath = path.join(temporaryDir, 'target.sqlite');
  const safetyPath = path.join(temporaryDir, 'safety.sqlite');
  const port = await getFreePort();
  let backend = null;
  let safeToClean = true;

  console.log('Backup:', sourceInfo);
  console.log('Live database (read-only validation):', liveInfo);
  console.log('Temporary test folder:', temporaryDir);
  console.log('Isolated test port:', port);

  try {
    // SQLite's backup API creates a consistent snapshot even if WAL is active.
    const live = new Database(livePath, { readonly: true, fileMustExist: true });
    try { await live.backup(targetPath); } finally { live.close(); }
    const original = validateDatabaseBackup(targetPath);
    console.log('Temporary database before restore:', original);

    backend = await startIsolatedBackend(targetPath, port);
    console.log('Isolated backend and GET /api/exercises: OK');
    await stopBackend(backend);
    backend = null;
    console.log('Isolated backend stopped before restoration.');

    const result = await restoreDatabase(backupPath, targetPath, safetyPath);
    const restored = validateDatabaseBackup(targetPath);
    const safety = validateDatabaseBackup(safetyPath);
    if (restored.exercises !== sourceInfo.exercises || restored.workouts !== sourceInfo.workouts) {
      throw new Error('Restored temporary database counts do not match selected backup.');
    }
    if (safety.exercises !== original.exercises || safety.workouts !== original.workouts) {
      throw new Error('Safety backup does not match the original temporary database.');
    }
    console.log('Restored temporary database:', restored);
    console.log('Temporary safety backup:', safety);
    console.log('Restore service:', result.restored === true ? 'OK' : 'Unexpected result');

    backend = await startIsolatedBackend(targetPath, port);
    console.log('Restarted isolated backend and GET /api/exercises: OK');
    console.log('ISOLATED RESTORE COORDINATOR TEST PASSED.');
    console.log('Live database was never used as a restore target.');
  } finally {
    if (backend && backend.exitCode === null && backend.signalCode === null) {
      try { await stopBackend(backend); } catch (error) {
        safeToClean = false;
        console.error('Could not confirm backend shutdown:', error.message);
      }
    }
    if (safeToClean) {
      fs.rmSync(temporaryDir, { recursive: true, force: true });
      console.log('Temporary files cleaned up.');
    } else {
      console.error('Temporary files retained at:', temporaryDir);
    }
  }
}

main().catch((error) => {
  console.error('ISOLATED TEST FAILED:', error.message);
  process.exitCode = 1;
});
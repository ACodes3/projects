import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { spawn, execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(currentDir, "../server");
const serverEntry = path.join(serverDir, "src/server.js");
const validateScript = path.join(serverDir, "scripts/validateBackup.js");
const isolatedRestoreScript = path.join(serverDir, "scripts/testIsolatedRestoreCoordinator.js");
const frontendEntry = path.resolve(currentDir, "../client/dist/index.html");
const healthUrl = "http://127.0.0.1:5000/api/health";
const databasePath = path.resolve(currentDir, "../db/forge.sqlite");
// Unique per Electron launch; helps distinguish our backend on fixed port 5000.
const instanceId = randomUUID();

let backendProcess = null;
let selectedBackupPath = null;
let lifecycleBusy = false;
let restoreDryRunBusy = false;
let restorePreparationBusy = false;
let liveRestoreBusy = false;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function startBackend() {
  if (backendProcess) throw new Error("FORGE backend is already running.");

  const child = spawn("node", [serverEntry], {
    cwd: serverDir,
    stdio: "inherit",
    windowsHide: true,
    env: { ...process.env, PORT: "5000", FORGE_DB_PATH: databasePath, FORGE_INSTANCE_ID: instanceId },
  });

  backendProcess = child;
  child.on("error", (error) => {
    console.error("Failed to start FORGE backend:", error);
  });
  child.on("exit", (code, signal) => {
    console.log(`FORGE backend exited (code: ${code}, signal: ${signal}).`);
    if (backendProcess === child) backendProcess = null;
  });
  return child;
}

async function isBackendReachable() {
  try {
    const response = await fetch(healthUrl, {
      signal: AbortSignal.timeout(1000),
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForBackend(child) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (backendProcess !== child || child.exitCode !== null || child.signalCode !== null) {
      throw new Error("FORGE backend process stopped during startup.");
    }
    try {
      const response = await fetch(healthUrl, {
        signal: AbortSignal.timeout(1000),
        cache: "no-store",
      });
      if (response.ok) {
        const health = await response.json();
        if (health.instanceId !== instanceId) {
          throw new Error("A different API process is using port 5000.");
        }
        console.log("FORGE backend is ready (instance verified).");
        return;
      }
    } catch (error) {
      if (error.message === "A different API process is using port 5000.") throw error;
      // API not listening yet.
    }
    await delay(200);
  }
  throw new Error("FORGE backend startup timed out.");
}

async function stopBackend() {
  const child = backendProcess;
  if (!child) throw new Error("There is no managed backend process to stop.");

  if (child.exitCode !== null || child.signalCode !== null) {
    backendProcess = null;
    return;
  }

  // Register listeners BEFORE signaling the process so we cannot miss its exit.
  await new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timeout);
      child.off("exit", onExit);
      child.off("error", onError);
    };
    const onExit = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const onError = (error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const timeout = setTimeout(() => onError(new Error("Timed out waiting for backend to stop.")), 10000);
    child.once("exit", onExit);
    child.once("error", onError);

    try {
      if (!child.kill()) onError(new Error("Could not signal backend to stop."));
    } catch (error) {
      onError(error);
    }
  });

  if (backendProcess === child) backendProcess = null;

  // In particular, do not continue if an unrelated server still owns port 5000.
  for (let attempt = 0; attempt < 20; attempt++) {
    if (!(await isBackendReachable())) return;
    await delay(200);
  }
  throw new Error("Port 5000 is still serving a FORGE API after backend shutdown.");
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    backgroundColor: "#101214",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(currentDir, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  mainWindow.loadFile(frontendEntry);
}

function assertForgeWindow(event) {
  const window = BrowserWindow.fromWebContents(event.sender);
  if (
    !window ||
    window.isDestroyed() ||
    event.sender.getURL().split("#")[0] !== pathToFileURL(frontendEntry).href
  ) {
    throw new Error("Request did not originate from the FORGE application window.");
  }
  return window;
}

function registerBackupHandlers() {
  ipcMain.handle("forge:backup:select", async (event) => {
    const parentWindow = assertForgeWindow(event);
    if (liveRestoreBusy) return { success: false, message: "A restore is in progress." };
    const result = await dialog.showOpenDialog(parentWindow, {
      title: "Select FORGE SQLite Backup",
      buttonLabel: "Select Backup",
      properties: ["openFile"],
      filters: [{ name: "SQLite Backup", extensions: ["sqlite"] }],
    });
    if (result.canceled || result.filePaths.length === 0) {
      selectedBackupPath = null;
      return null;
    }
    selectedBackupPath = result.filePaths[0];
    return { name: path.basename(selectedBackupPath) };
  });

  ipcMain.handle("forge:backup:validate", async (event) => {
    assertForgeWindow(event);
    if (liveRestoreBusy) return { success: false, message: "A restore is in progress." };
    if (!selectedBackupPath) {
      return { success: false, message: "Select a backup first." };
    }
    try {
      const { stdout } = await execFileAsync("node", [validateScript, selectedBackupPath], {
        cwd: serverDir,
        windowsHide: true,
        timeout: 15000,
        maxBuffer: 1024 * 1024,
      });
      const result = JSON.parse(stdout.trim());
      return {
        success: result.success === true,
        valid: result.valid === true,
        exercises: result.exercises,
        workouts: result.workouts,
      };
    } catch (error) {
      let message = "Backup validation failed.";
      if (typeof error.stdout === "string") {
        try {
          const parsed = JSON.parse(error.stdout.trim());
          if (typeof parsed.message === "string") message = parsed.message;
        } catch {
          // Script may have failed before producing JSON.
        }
      }
      if (typeof error.stderr === "string" && error.stderr.trim()) {
        console.error("Backup validation diagnostic:", error.stderr.trim());
      }
      return { success: false, message };
    }
  });

  // Read-only preparation: checks the selected backup and current database.
  // Does not stop Express, create backups, or replace database files.
  ipcMain.handle("forge:restore:prepare", async (event) => {
    assertForgeWindow(event);
    if (lifecycleBusy || restoreDryRunBusy || restorePreparationBusy || liveRestoreBusy) {
      return { success: false, message: "Another backend operation is in progress." };
    }
    if (!selectedBackupPath) {
      return { success: false, message: "Select a backup first." };
    }

    restorePreparationBusy = true;
    try {
      const source = fs.realpathSync(selectedBackupPath);
      const target = fs.realpathSync(databasePath);
      if (process.platform === "win32"
        ? source.toLowerCase() === target.toLowerCase()
        : source === target) {
        throw new Error("The selected backup is the active FORGE database.");
      }

      // The selected file can change after a previous validation, so check again.
      async function validate(filePath) {
        const { stdout } = await execFileAsync("node", [validateScript, filePath], {
          cwd: serverDir,
          windowsHide: true,
          timeout: 15000,
          maxBuffer: 1024 * 1024,
        });
        const result = JSON.parse(stdout.trim());
        if (result.success !== true || result.valid !== true) {
          throw new Error(result.message || "Database validation failed.");
        }
        return { exercises: result.exercises, workouts: result.workouts };
      }

      const selectedPath = selectedBackupPath;
      const backup = await validate(source);
      const current = await validate(target);
      if (selectedBackupPath !== selectedPath) {
        throw new Error("Backup selection changed during preparation. Try again.");
      }

      const safetyDirectory = path.join(app.getPath("userData"), "backups");
      fs.accessSync(safetyDirectory, fs.constants.W_OK);

      return {
        success: true,
        message: "Restore preparation passed. No database was changed.",
        backupName: path.basename(source),
        backup,
        current,
      };
    } catch (error) {
      console.error("Restore preparation failed:", error);
      return { success: false, message: error.message || "Restore preparation failed." };
    } finally {
      restorePreparationBusy = false;
    }
  });

  // Development-only dry-run: isolated process, temporary DB and separate API port.
  // It does NOT stop or replace the Electron-managed live database.
  ipcMain.handle("forge:restore:dry-run", async (event) => {
    assertForgeWindow(event);
    if (restoreDryRunBusy || lifecycleBusy || restorePreparationBusy || liveRestoreBusy) {
      return { success: false, message: "Another test is in progress." };
    }
    if (!selectedBackupPath) {
      return { success: false, message: "Select a backup first." };
    }
    restoreDryRunBusy = true;
    try {
      const { stdout, stderr } = await execFileAsync(
        "node",
        [isolatedRestoreScript, selectedBackupPath],
        {
          cwd: serverDir,
          windowsHide: true,
          timeout: 120000,
          maxBuffer: 2 * 1024 * 1024,
          env: { ...process.env, FORGE_DB_PATH: databasePath },
        }
      );
      if (stderr.trim()) console.warn("Restore dry-run diagnostics:", stderr.trim());
      if (!stdout.includes("ISOLATED RESTORE COORDINATOR TEST PASSED.")) {
        throw new Error("The isolated test did not report a successful result.");
      }
      console.log(stdout.trim());
      return {
        success: true,
        message: "Isolated restore test passed. The live database was not replaced.",
        log: stdout.trim(),
      };
    } catch (error) {
      console.error("Restore dry-run failed:", error);
      return {
        success: false,
        message: error.killed ? "The isolated test timed out." : "Isolated restore test failed. See the Electron terminal for details.",
        log: [error.stdout, error.stderr].filter(Boolean).join("\n").slice(-10000),
      };
    } finally {
      restoreDryRunBusy = false;
    }
  });

  // Live restore: irreversible replacement is possible ONLY after a native
  // confirmation dialog. No JS caller may supply arbitrary filesystem paths.
  ipcMain.handle("forge:restore:execute", async (event) => {
    const parentWindow = assertForgeWindow(event);
    if (liveRestoreBusy || lifecycleBusy || restoreDryRunBusy || restorePreparationBusy) {
      return { success: false, message: "Another backend operation is in progress." };
    }
    if (!selectedBackupPath) {
      return { success: false, message: "Select a backup first." };
    }

    liveRestoreBusy = true;
    let backendStopped = false;
    let restored = false;
    let safetyBackupPath = null;
    let outcome = null;

    try {
      const source = fs.realpathSync(selectedBackupPath);
      const target = fs.realpathSync(databasePath);
      const samePath = process.platform === "win32"
        ? source.toLowerCase() === target.toLowerCase()
        : source === target;
      if (samePath) throw new Error("Cannot restore the active database from itself.");

      const validate = async (file) => {
        const { stdout } = await execFileAsync("node", [validateScript, file], {
          cwd: serverDir, windowsHide: true, timeout: 15000, maxBuffer: 1024 * 1024,
        });
        const info = JSON.parse(stdout.trim());
        if (!info.success || !info.valid) throw new Error(info.message || "Invalid FORGE database.");
        return info;
      };

      const backupInfo = await validate(source);
      const currentInfo = await validate(target);

      const confirmation = await dialog.showMessageBox(parentWindow, {
        type: "warning",
        title: "Restore FORGE backup?",
        message: "Replace your current FORGE data with this backup?",
        detail: `Backup: ${path.basename(source)}\nBackup workouts: ${backupInfo.workouts}\nCurrent workouts: ${currentInfo.workouts}\n\nYour current database will be saved in a separate safety backup. This operation replaces workouts, nutrition, profile and other stored data.`,
        buttons: ["Cancel", "Restore Database"],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
      });
      if (confirmation.response !== 1) {
        return { success: false, canceled: true, message: "Restore canceled." };
      }

      if (selectedBackupPath !== source && fs.realpathSync(selectedBackupPath) !== source) {
        throw new Error("Backup selection changed; select and validate it again.");
      }

      const safetyDir = ensureSafetyBackupDirectory();
      safetyBackupPath = path.join(safetyDir, `forge-before-restore-${Date.now()}-${randomUUID()}.sqlite`);

      await stopBackend();
      backendStopped = true;

      // Run SQLite native bindings in regular Node, not Electron's runtime.
      // restoreBackupCli validates source again and writes the persistent safety copy.
      const { stdout } = await execFileAsync("node", [
        path.join(serverDir, "scripts/restoreBackupCli.js"),
        source, target, safetyBackupPath,
      ], {
        cwd: serverDir, windowsHide: true, timeout: 120000,
        maxBuffer: 2 * 1024 * 1024,
        env: { ...process.env, FORGE_DB_PATH: target },
      });
      const result = JSON.parse(stdout.trim());
      if (!result.success) throw new Error(result.message || "Restore CLI reported failure.");
      restored = true;
      outcome = { success: true, message: "Database restored successfully.", safetyBackupPath };
    } catch (error) {
      console.error("FORGE restore failed:", error);
      outcome = {
        success: false,
        message: `Restore failed: ${error.message || "Unknown error"}. Check the safety backup before retrying.`,
        safetyBackupPath,
      };
    } finally {
      if (backendStopped) {
        try {
          // Never reopen a database that fails validation after restore/recovery.
          const { stdout } = await execFileAsync("node", [validateScript, databasePath], {
            cwd: serverDir, windowsHide: true, timeout: 15000,
            maxBuffer: 1024 * 1024,
          });
          const info = JSON.parse(stdout.trim());
          if (!info.success || !info.valid) throw new Error("Database is invalid after restoration.");
          const child = startBackend();
          await waitForBackend(child);
          if (restored && !parentWindow.isDestroyed()) {
            // Allow IPC response to resolve before reloading the renderer.
            setTimeout(() => {
              if (!parentWindow.isDestroyed()) parentWindow.webContents.reload();
            }, 500);
          }
        } catch (restartError) {
          console.error("FORGE backend recovery/restart failed:", restartError);
          outcome = {
            success: false,
            message: `Backend could not safely restart: ${restartError.message}. Keep the safety backup and seek manual recovery.`,
            safetyBackupPath,
          };
        }
      }
      liveRestoreBusy = false;
    }
    return outcome;
  });

  // Temporary development-only lifecycle test. Does not restore database files.
  ipcMain.handle("forge:backend:test-restart", async (event) => {
    const window = assertForgeWindow(event);
    if (lifecycleBusy || restoreDryRunBusy || restorePreparationBusy || liveRestoreBusy) return { success: false, message: "Another backend operation is in progress." };
    lifecycleBusy = true;
    try {
      await stopBackend();
      console.log("FORGE backend stopped and released port 5000.");
      const child = startBackend();
      await waitForBackend(child);
      return { success: true, message: "Backend stopped and restarted successfully." };
    } catch (error) {
      console.error("Backend lifecycle test failed:", error);
      // If the backend stopped, try bringing it back without touching SQLite files.
      if (!backendProcess) {
        try {
          const child = startBackend();
          await waitForBackend(child);
          console.log("FORGE backend recovered after lifecycle test failure.");
        } catch (recoveryError) {
          console.error("Backend recovery failed:", recoveryError);
        }
      }
      return { success: false, message: error.message };
    } finally {
      lifecycleBusy = false;
    }
  });
}

// Persist future safety backups outside temporary and project directories.
// This step creates the folder only; it never writes or restores a database.
function ensureSafetyBackupDirectory() {
  const backupDirectory = path.join(app.getPath("userData"), "backups");
  fs.mkdirSync(backupDirectory, { recursive: true });
  console.log(`FORGE safety backup directory ready: ${backupDirectory}`);
  return backupDirectory;
}

// Only one FORGE Electron instance may manage this development database.
// This does not prevent unrelated tools from opening the SQLite file.
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  console.log("FORGE is already running. Focusing the existing window.");
  app.quit();
} else {
  app.on("second-instance", () => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    ensureSafetyBackupDirectory();
    registerBackupHandlers();
    try {
      if (await isBackendReachable()) {
        throw new Error("Port 5000 already has an API. Stop the other backend first.");
      }
      const child = startBackend();
      await waitForBackend(child);
      createWindow();
    } catch (error) {
      console.error("Could not launch FORGE:", error);
      app.quit();
      return;
    }
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("before-quit", () => {
  if (backendProcess) backendProcess.kill();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
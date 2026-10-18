import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { spawn, execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(currentDir, "../server");
const serverEntry = path.join(serverDir, "src/server.js");
const validateScript = path.join(serverDir, "scripts/validateBackup.js");
const frontendEntry = path.resolve(currentDir, "../client/dist/index.html");
const healthUrl = "http://127.0.0.1:5000/api/health";

let backendProcess = null;
let selectedBackupPath = null;
let lifecycleBusy = false;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function startBackend() {
  if (backendProcess) throw new Error("FORGE backend is already running.");

  const child = spawn("node", [serverEntry], {
    cwd: serverDir,
    stdio: "inherit",
    windowsHide: true,
    env: { ...process.env, PORT: "5000" },
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
    if (await isBackendReachable()) {
      console.log("FORGE backend is ready.");
      return;
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

  // Temporary development-only lifecycle test. Does not restore database files.
  ipcMain.handle("forge:backend:test-restart", async (event) => {
    const window = assertForgeWindow(event);
    if (lifecycleBusy) return { success: false, message: "Backend lifecycle test already running." };
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

app.whenReady().then(async () => {
  registerBackupHandlers();
  const child = startBackend();
  try {
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

app.on("before-quit", () => {
  if (backendProcess) backendProcess.kill();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
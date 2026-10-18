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

let backendProcess = null;
let selectedBackupPath = null;

function startBackend() {
  backendProcess = spawn("node", [serverEntry], {
    cwd: serverDir,
    stdio: "inherit",
    windowsHide: true,
    env: { ...process.env, PORT: "5000" },
  });

  backendProcess.on("error", (error) => {
    console.error("Failed to start FORGE backend:", error);
  });

  backendProcess.on("exit", (code) => {
    console.log(`FORGE backend exited with code ${code}`);
    backendProcess = null;
  });
}

async function waitForBackend() {
  const healthUrl = "http://127.0.0.1:5000/api/health";

  for (let attempt = 0; attempt < 50; attempt++) {
    if (backendProcess === null) {
      throw new Error("FORGE backend process stopped.");
    }

    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        console.log("FORGE backend is ready.");
        return;
      }
    } catch {
      // Backend may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error("FORGE backend startup timed out.");
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
  if (!window || window.isDestroyed() || event.sender.getURL().split("#")[0] !== pathToFileURL(frontendEntry).href) {
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
      const { stdout } = await execFileAsync(
        "node",
        [validateScript, selectedBackupPath],
        {
          cwd: serverDir,
          windowsHide: true,
          timeout: 15000,
          maxBuffer: 1024 * 1024,
        }
      );
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
          // The script may have failed before producing JSON.
        }
      }
      if (typeof error.stderr === "string" && error.stderr.trim()) {
        console.error("Backup validation diagnostic:", error.stderr.trim());
      }
      return { success: false, message };
    }
  });
}

app.whenReady().then(async () => {
  registerBackupHandlers();
  startBackend();

  try {
    await waitForBackend();
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
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
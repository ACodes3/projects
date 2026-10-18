const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("forgeDesktop", {
  selectBackup: () => ipcRenderer.invoke("forge:backup:select"),
  validateBackup: () => ipcRenderer.invoke("forge:backup:validate"),
  prepareRestore: () => ipcRenderer.invoke("forge:restore:prepare"),
  restoreBackup: () => ipcRenderer.invoke("forge:restore:execute"),
  testRestoreDryRun: () => ipcRenderer.invoke("forge:restore:dry-run"),
  // Temporary lifecycle test: no restore or database file changes.
  testBackendRestart: () => ipcRenderer.invoke("forge:backend:test-restart"),
});
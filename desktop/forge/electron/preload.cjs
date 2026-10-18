const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("forgeDesktop", {
  selectBackup: () => ipcRenderer.invoke("forge:backup:select"),
  validateBackup: () => ipcRenderer.invoke("forge:backup:validate"),
  // Temporary lifecycle test: no restore or database file changes.
  testBackendRestart: () => ipcRenderer.invoke("forge:backend:test-restart"),
});
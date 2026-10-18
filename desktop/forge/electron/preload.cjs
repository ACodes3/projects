const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("forgeDesktop", {
  selectBackup: () => ipcRenderer.invoke("forge:backup:select"),
  validateBackup: () => ipcRenderer.invoke("forge:backup:validate"),
});
import { contextBridge, ipcRenderer } from "electron";
import type { ElectronAPI } from "./types/electron-api-d";

const api: ElectronAPI = {
    selectFile: () => ipcRenderer.invoke("select-file"),
    saveFile: (inputPath, mode) => ipcRenderer.invoke("save-file", inputPath, mode),
    encrypt: (input, output, pass, confirm) => ipcRenderer.invoke("encrypt", input, output, pass, confirm),
    decrypt: (input, output, pass) => ipcRenderer.invoke("decrypt", input, output, pass),
    openExternal: (url) => ipcRenderer.send("open-external", url),
    showItemInFolder: (filePath) => ipcRenderer.send("show-item", filePath),
    onShortcutNavigate: (callback) =>
        ipcRenderer.on("shortcut-navigate", (event, mode) => {
            callback(event, mode as "home" | "encrypt" | "decrypt" | "done");
        }),
};

contextBridge.exposeInMainWorld("electronAPI", api);

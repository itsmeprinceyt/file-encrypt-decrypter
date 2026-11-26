import { contextBridge, ipcRenderer } from "electron";
import type {
    DecryptPayload,
    ElectronAPI,
    EncryptPayload,
    ProgressInfo,
} from "./types/electron-api-d";

const api: ElectronAPI = {
    selectFile: (kind) => ipcRenderer.invoke("select-file", kind),
    saveFile: (inputPath, mode) => ipcRenderer.invoke("save-file", inputPath, mode),
    inspectFile: (inputPath) => ipcRenderer.invoke("inspect-file", inputPath),
    generateRecoveryKey: () => ipcRenderer.invoke("generate-recovery-key"),
    validateRecoveryKey: (recoveryKey) => ipcRenderer.invoke("validate-recovery-key", recoveryKey),
    copyRecoveryKey: (recoveryKey) => ipcRenderer.invoke("copy-recovery-key", recoveryKey),
    saveRecoveryKey: (recoveryKey) => ipcRenderer.invoke("save-recovery-key", recoveryKey),
    encrypt: (payload: EncryptPayload) => ipcRenderer.invoke("encrypt", payload),
    decrypt: (payload: DecryptPayload) => ipcRenderer.invoke("decrypt", payload),
    openExternal: (url) => {
        void ipcRenderer.invoke("open-external", url);
    },
    showItemInFolder: (filePath) => ipcRenderer.send("show-item", filePath),
    onProgress: (callback) => {
        const listener = (_event: unknown, info: ProgressInfo) => callback(info);
        ipcRenderer.on("operation-progress", listener);
        return () => {
            ipcRenderer.removeListener("operation-progress", listener);
        };
    },
    onShortcutNavigate: (callback) =>
        ipcRenderer.on("shortcut-navigate", (event, mode) => {
            callback(event, mode as "home" | "encrypt" | "decrypt" | "done");
        }),
};

contextBridge.exposeInMainWorld("electronAPI", api);

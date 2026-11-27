import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
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
    selectRecoveryKeyFile: () => ipcRenderer.invoke("select-recovery-key-file"),
    copyRecoveryKey: (recoveryKey) => ipcRenderer.invoke("copy-recovery-key", recoveryKey),
    saveRecoveryKey: (recoveryKey, sourcePath) => ipcRenderer.invoke("save-recovery-key", recoveryKey, sourcePath),
    encrypt: (payload: EncryptPayload) => ipcRenderer.invoke("encrypt", payload),
    decrypt: (payload: DecryptPayload) => ipcRenderer.invoke("decrypt", payload),
    openExternal: (url) => {
        void ipcRenderer.invoke("open-external", url);
    },
    showItemInFolder: (filePath) => ipcRenderer.invoke("show-item", filePath),
    onProgress: (callback) => {
        const listener = (_event: unknown, info: ProgressInfo) => callback(info);
        ipcRenderer.on("operation-progress", listener);
        return () => {
            ipcRenderer.removeListener("operation-progress", listener);
        };
    },
    onShortcutNavigate: (callback) => {
        const listener = (event: IpcRendererEvent, mode: "home" | "encrypt" | "decrypt" | "done") =>
            callback(event, mode);
        ipcRenderer.on("shortcut-navigate", listener);
        return () => {
            ipcRenderer.removeListener("shortcut-navigate", listener);
        };
    },
};

contextBridge.exposeInMainWorld("electronAPI", api);

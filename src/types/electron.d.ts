import { ElectronAPI } from "../../electron/types/electron-api-d";

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export { };

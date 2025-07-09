import { IpcRendererEvent } from "electron";

export interface ElectronAPI {
    selectFile: () => Promise<string>;
    saveFile: (inputPath: string, mode: "encrypt" | "decrypt") => Promise<string>;
    encrypt: (input: string, output: string, pass: string, confirm: string) => Promise<void>;
    decrypt: (input: string, output: string, pass: string) => Promise<void>;
    openExternal: (url: string) => void;
    showItemInFolder: (filePath: string) => void;
    onShortcutNavigate: (
        callback: (event: IpcRendererEvent, mode: "home" | "encrypt" | "decrypt" | "done") => void
    ) => void;
}
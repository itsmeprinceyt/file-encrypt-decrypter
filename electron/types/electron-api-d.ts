import type { IpcRendererEvent } from "electron";

export interface FileFormatInfo {
    version: 1 | 2;
}

export interface DecryptResult {
    legacy: boolean;
}

export interface ProgressInfo {
    processed: number;
    total: number;
}

export interface EncryptPayload {
    inputPath: string;
    outputPath: string;
    passphrase: string;
    confirmPassphrase: string;
    recoveryKey: string;
}

export interface DecryptPayload {
    inputPath: string;
    outputPath: string;
    passphrase?: string;
    recoveryKey?: string;
    password?: string;
}

export interface ElectronAPI {
    selectFile: (kind: "encrypt" | "decrypt") => Promise<string | null>;
    saveFile: (inputPath: string, mode: "encrypt" | "decrypt") => Promise<string | null>;
    inspectFile: (inputPath: string) => Promise<FileFormatInfo>;
    generateRecoveryKey: () => Promise<string>;
    validateRecoveryKey: (recoveryKey: string) => Promise<boolean>;
    copyRecoveryKey: (recoveryKey: string) => Promise<void>;
    saveRecoveryKey: (recoveryKey: string) => Promise<string | null>;
    encrypt: (payload: EncryptPayload) => Promise<void>;
    decrypt: (payload: DecryptPayload) => Promise<DecryptResult>;
    openExternal: (url: string) => void;
    showItemInFolder: (filePath: string) => Promise<{ ok: boolean; error?: string }>;
    onProgress: (callback: (info: ProgressInfo) => void) => () => void;
    onShortcutNavigate: (
        callback: (event: IpcRendererEvent, mode: "home" | "encrypt" | "decrypt" | "done") => void
    ) => void;
}

import { app, BrowserWindow, ipcMain, dialog, Menu, shell, clipboard } from "electron";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { CLIPBOARD_CLEAR_MS, DECRYPTION_ERROR_MESSAGE, ENCRYPTED_EXTENSION, MIN_PASSPHRASE_LENGTH } from "./constants";
import { DecryptionError, decryptFile, encryptFile, inspectFileFormat, type DecryptResult } from "./cryptoHandler";
import { generateRecoveryKey, isValidRecoveryKey } from "./recoveryKey";

let mainWindow: BrowserWindow | null = null;
let clipboardClearTimer: NodeJS.Timeout | null = null;
let lastCopiedRecoveryKey: string | null = null;

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["https:"]);
const ALLOWED_EXTERNAL_HOSTS = new Set([
    "github.com",
    "www.youtube.com",
    "youtube.com",
    "file-encrypt-decrypter-website.vercel.app",
]);

function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            spellcheck: false,
        },
        icon: path.join(__dirname, "assets", "logo.ico"),
    });

    mainWindow.maximize();
    const startUrl = app.isPackaged
        ? path.join(__dirname, "out", "index.html")
        : "http://localhost:3000";

    if (app.isPackaged) {
        mainWindow.loadFile(startUrl);
    } else {
        mainWindow.loadURL(startUrl);
    }

    const webContents = mainWindow!.webContents;

    webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    webContents.on("will-navigate", (event, url) => {
        const allowed = app.isPackaged
            ? url.startsWith("file://")
            : url.startsWith("http://localhost:3000");
        if (!allowed) event.preventDefault();
    });

    const zoomStep = 0.1;

    webContents.on("before-input-event", (_, input) => {
        if (input.control && input.type === "keyDown") {
            const current = webContents.getZoomFactor();
            if (input.key === "=" || input.key === "+") {
                webContents.setZoomFactor(Math.min(current + zoomStep, 3));
            }
            if (input.key === "-") {
                webContents.setZoomFactor(Math.max(current - zoomStep, 0.3));
            }
            if (input.key === "0") {
                webContents.setZoomFactor(1.0);
            }
            const key = input.key.toLowerCase();
            if (key === "e") webContents.send("shortcut-navigate", "encrypt");
            if (key === "d") webContents.send("shortcut-navigate", "decrypt");
            if (key === "h") webContents.send("shortcut-navigate", "home");
        }
    });
}


const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
        label: "App",
        submenu: [
            {
                label: "Learn More",
                click: () => {
                    dialog
                        .showMessageBox({
                            type: "info",
                            title: "About",
                            message: `🔐 File Encrypter Decrypter v1.0`,
                            detail: `I wanted a secure way to protect my sensitive files like .env configs, so I built this tool using AES-256-GCM encryption — one of the live saving thing I made.\n\nAlso, this is the first software which I made so it may not be upto the mark but I tried my best.\n\nIf you'd like to check out my social profiles or repositories, feel free to use the buttons below. Stay safe, stay encrypted.`,
                            buttons: ["YouTube", "GitHub Profile", "Repo", "Close"],
                            noLink: true,
                        })
                        .then((res) => {
                            const links = [
                                "https://www.youtube.com/@itsmeprinceyt",
                                "https://github.com/itsmeprinceyt",
                                "https://github.com/itsmeprinceyt/file-encrypt-decrypter",
                            ];
                            if (res.response < 3) shell.openExternal(links[res.response]);
                        });
                },
            },
            {
                label: "Shortcuts",
                click: () => {
                    dialog
                        .showMessageBox({
                            type: "info",
                            title: "Shortcuts",
                            message: `File Encrypter Decrypter - Keyboard Shortcuts`,
                            detail: `Encrypt a file: Ctrl + E\nDecrypt a file: Ctrl + D\nHome: Ctrl + H`,
                        });
                },
            },
            { type: "separator" },
            { role: "reload" },
            { type: "separator" },
            {
                label: "Zoom In",
                accelerator: "CmdOrCtrl+=",
                click: () => {
                    if (mainWindow) {
                        const current = mainWindow.webContents.getZoomFactor();
                        mainWindow.webContents.setZoomFactor(Math.min(current + 0.1, 3));
                    }
                },
            },
            {
                label: "Zoom Out",
                accelerator: "CmdOrCtrl+-",
                click: () => {
                    if (mainWindow) {
                        const current = mainWindow.webContents.getZoomFactor();
                        mainWindow.webContents.setZoomFactor(Math.max(current - 0.1, 0.3));
                    }
                },
            },
            {
                label: "Reset Zoom",
                accelerator: "CmdOrCtrl+0",
                click: () => {
                    if (mainWindow) {
                        mainWindow.webContents.setZoomFactor(1.0);
                    }
                },
            },
            { type: "separator" },
            { role: "togglefullscreen" },
            { role: "quit" },
        ],
    },
];

function asRecord(payload: unknown): Record<string, unknown> {
    if (typeof payload !== "object" || payload === null) {
        throw new Error("Invalid request.");
    }
    return payload as Record<string, unknown>;
}

function assertString(value: unknown, field: string): string {
    if (typeof value !== "string" || value.length === 0 || value.length > 4096) {
        throw new Error(`Invalid ${field}.`);
    }
    return value;
}

function assertExistingFile(value: unknown, field: string): string {
    const filePath = assertString(value, field);
    try {
        if (!fs.statSync(filePath).isFile()) throw new Error();
    } catch {
        throw new Error(`Invalid ${field}.`);
    }
    return filePath;
}

async function clearClipboardIfUnchanged(value: string): Promise<void> {
    try {
        const current = await clipboard.readText();
        if (current === value) clipboard.clear();
    } catch {
        void 0;
    }
}

async function rememberRecoveryKey(value: string): Promise<void> {
    await clipboard.writeText(value);
    lastCopiedRecoveryKey = value;
    if (clipboardClearTimer) clearTimeout(clipboardClearTimer);
    clipboardClearTimer = setTimeout(() => {
        clipboardClearTimer = null;
        void clearClipboardIfUnchanged(value);
    }, CLIPBOARD_CLEAR_MS);
    clipboardClearTimer.unref();
}

function progressFor(event: Electron.IpcMainInvokeEvent) {
    const window = BrowserWindow.fromWebContents(event.sender);
    return (info: { processed: number; total: number }) => {
        if (window && !window.isDestroyed()) {
            window.webContents.send("operation-progress", info);
        }
    };
}

async function runDecryption(task: () => Promise<DecryptResult>): Promise<DecryptResult> {
    try {
        return await task();
    } catch (error) {
        if (error instanceof DecryptionError) throw new Error(DECRYPTION_ERROR_MESSAGE);
        const code = (error as NodeJS.ErrnoException).code;
        if (code === "EACCES" || code === "EPERM" || code === "ENOSPC" || code === "EROFS") {
            throw new Error("Unable to write the decrypted file. Check the destination folder and try again.");
        }
        throw error;
    }
}

app.whenReady().then(() => {
    console.log("✅ Electron app ready");
    createWindow();
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
    if (clipboardClearTimer) {
        clearTimeout(clipboardClearTimer);
        clipboardClearTimer = null;
    }
    if (lastCopiedRecoveryKey) {
        void clearClipboardIfUnchanged(lastCopiedRecoveryKey);
        lastCopiedRecoveryKey = null;
    }
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

ipcMain.handle("open-external", async (_, rawUrl) => {
    if (typeof rawUrl !== "string") return;
    let parsed: URL;
    try {
        parsed = new URL(rawUrl);
    } catch {
        return;
    }
    if (!ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)) return;
    if (!ALLOWED_EXTERNAL_HOSTS.has(parsed.hostname)) return;
    await shell.openExternal(parsed.toString());
});

function revealInFileManager(target: string): void {
    if (process.platform === "win32") {
        // On Windows 11, shell.showItemInFolder opens Explorer behind the app
        // window, which looks like nothing happened. Launching Explorer itself
        // brings the folder to the foreground and selects the file.
        spawn("explorer.exe", [`/select,${target}`], { detached: true, stdio: "ignore" }).unref();
        return;
    }
    shell.showItemInFolder(target);
}

async function openFolder(folder: string): Promise<boolean> {
    if (process.platform === "win32") {
        spawn("explorer.exe", [folder], { detached: true, stdio: "ignore" }).unref();
        return true;
    }
    return (await shell.openPath(folder)) === "";
}

ipcMain.handle("show-item", async (_, filePath) => {
    if (typeof filePath !== "string" || filePath.length === 0) {
        return { ok: false, error: "There is no file location to show." };
    }
    const target = path.normalize(path.resolve(filePath));
    if (fs.existsSync(target)) {
        revealInFileManager(target);
        return { ok: true };
    }
    const folder = path.dirname(target);
    if (fs.existsSync(folder)) {
        const opened = await openFolder(folder);
        return opened ? { ok: true } : { ok: false, error: "Could not open the folder." };
    }
    return { ok: false, error: "That file is no longer at this location." };
});

ipcMain.handle("select-file", async (_, kind) => {
    const filters =
        kind === "decrypt"
            ? [{ name: "Encrypted files", extensions: ["prince"] }]
            : undefined;
    const result = await dialog.showOpenDialog({ properties: ["openFile"], filters });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
});

ipcMain.handle("inspect-file", async (_, inputPath) => {
    const filePath = assertExistingFile(inputPath, "input file");
    return { version: inspectFileFormat(filePath) };
});

ipcMain.handle("generate-recovery-key", async () => generateRecoveryKey());

ipcMain.handle("validate-recovery-key", async (_, recoveryKey) => isValidRecoveryKey(recoveryKey));

ipcMain.handle("copy-recovery-key", async (_, recoveryKey) => {
    if (!isValidRecoveryKey(recoveryKey)) throw new Error("Invalid Recovery Key.");
    await rememberRecoveryKey(recoveryKey as string);
});

ipcMain.handle("save-recovery-key", async (_, recoveryKey) => {
    if (!isValidRecoveryKey(recoveryKey)) throw new Error("Invalid Recovery Key.");
    const result = await dialog.showSaveDialog({
        title: "Save Recovery Key",
        defaultPath: path.join(app.getPath("documents"), "prince-recovery-key.key"),
        filters: [{ name: "Recovery Key", extensions: ["key"] }],
    });
    if (result.canceled || !result.filePath) return null;
    const target = result.filePath.toLowerCase().endsWith(".key")
        ? result.filePath
        : `${result.filePath}.key`;
    fs.writeFileSync(target, `${recoveryKey}\n`, { mode: 0o600 });
    return target;
});

ipcMain.handle("encrypt", async (event, payload) => {
    const request = asRecord(payload);
    const inputPath = assertExistingFile(request.inputPath, "input file");
    const outputPath = assertString(request.outputPath, "output path");
    if (!outputPath.toLowerCase().endsWith(ENCRYPTED_EXTENSION)) {
        throw new Error(`Output file must use the ${ENCRYPTED_EXTENSION} extension.`);
    }
    if (path.resolve(inputPath) === path.resolve(outputPath)) {
        throw new Error("Output file must be different from the input file.");
    }
    const passphrase = assertString(request.passphrase, "passphrase");
    if (passphrase.length < MIN_PASSPHRASE_LENGTH) {
        throw new Error(`Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters.`);
    }
    const confirmPassphrase = assertString(request.confirmPassphrase, "passphrase confirmation");
    if (passphrase !== confirmPassphrase) throw new Error("Passphrases do not match.");
    if (!isValidRecoveryKey(request.recoveryKey)) throw new Error("Invalid Recovery Key.");
    await encryptFile(inputPath, outputPath, passphrase, request.recoveryKey as string, {
        onProgress: progressFor(event),
    });
});

ipcMain.handle("decrypt", async (event, payload) => {
    const request = asRecord(payload);
    const inputPath = assertExistingFile(request.inputPath, "input file");
    const outputPath = assertString(request.outputPath, "output path");
    if (path.resolve(inputPath) === path.resolve(outputPath)) {
        throw new Error("Output file must be different from the input file.");
    }

    if (inspectFileFormat(inputPath) === 2) {
        const passphrase = assertString(request.passphrase, "passphrase");
        if (!isValidRecoveryKey(request.recoveryKey)) throw new Error(DECRYPTION_ERROR_MESSAGE);
        const recoveryKey = request.recoveryKey as string;
        return runDecryption(() =>
            decryptFile(
                inputPath,
                outputPath,
                { kind: "v2", passphrase, recoveryKey },
                { onProgress: progressFor(event) }
            )
        );
    }

    const password = assertString(request.password, "password");
    return runDecryption(() =>
        decryptFile(inputPath, outputPath, { kind: "legacy", password }, { onProgress: progressFor(event) })
    );
});

ipcMain.handle("save-file", async (_, inputPath, mode: "encrypt" | "decrypt") => {
    if (typeof inputPath !== "string" || inputPath.length === 0) throw new Error("Invalid input file.");
    if (mode !== "encrypt" && mode !== "decrypt") throw new Error("Invalid save mode.");
    const baseName = path.basename(inputPath);

    const dir = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (dir.canceled || !dir.filePaths[0]) return null;

    const saveName =
        mode === "encrypt"
            ? baseName + ENCRYPTED_EXTENSION
            : baseName.endsWith(ENCRYPTED_EXTENSION)
                ? baseName.slice(0, -ENCRYPTED_EXTENSION.length)
                : baseName;

    return path.join(dir.filePaths[0], saveName);
});

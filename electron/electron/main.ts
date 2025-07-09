import { app, BrowserWindow, ipcMain, dialog, Menu, shell, globalShortcut } from "electron";
import path from "path";
import { encryptFile, decryptFile } from "./cryptoHandler";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
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

    const zoomStep = 0.1;
    const webContents = mainWindow!.webContents;

    webContents.on("before-input-event", (_, input) => {
        if (input.control && input.type === "keyDown") {
            let current = webContents.getZoomFactor();
            if (input.key === "=" || input.key === "+") {
                webContents.setZoomFactor(Math.min(current + zoomStep, 3));
            }
            if (input.key === "-") {
                webContents.setZoomFactor(Math.max(current - zoomStep, 0.3));
            }
            if (input.key === "0") {
                webContents.setZoomFactor(1.0);
            }
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

app.whenReady().then(() => {
    console.log("✅ Electron app ready");
    createWindow();
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });

    globalShortcut.register("CommandOrControl+E", () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
            win.webContents.send("shortcut-navigate", "encrypt");
        }
    });
    globalShortcut.register("CommandOrControl+D", () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
            win.webContents.send("shortcut-navigate", "decrypt");
        }
    });
    globalShortcut.register("CommandOrControl+H", () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
            win.webContents.send("shortcut-navigate", "home");
        }
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

ipcMain.on("open-external", (_, url) => {
    shell.openExternal(url);
});

ipcMain.on("show-item", (_, filePath) => {
    shell.showItemInFolder(filePath);
});


ipcMain.handle("select-file", async () => {
    const result = await dialog.showOpenDialog({ properties: ["openFile"] });
    return result.filePaths[0];
});

ipcMain.handle("encrypt", async (_, inputPath, outputPath, password, confirmPassword) => {
    if (password !== confirmPassword) throw new Error("Passwords do not match.");
    encryptFile(inputPath, outputPath, password);
});

ipcMain.handle("decrypt", async (_, inputPath, outputPath, password) => {
    decryptFile(inputPath, outputPath, password);
});

ipcMain.handle("save-file", async (_, inputPath, mode: "encrypt" | "decrypt") => {
    const baseName = path.basename(inputPath);

    const dir = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (dir.canceled || !dir.filePaths[0]) return null;

    const saveName =
        mode === "encrypt"
            ? baseName + ".prince"
            : baseName.endsWith(".prince")
                ? baseName.slice(0, -7)
                : baseName;

    return path.join(dir.filePaths[0], saveName);
});
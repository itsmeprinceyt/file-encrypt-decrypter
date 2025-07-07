import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from "electron";
import path from "path";
import { encryptFile, decryptFile } from "./cryptoHandler";

function createWindow() {
    const win = new BrowserWindow({
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
        icon: path.join(__dirname, 'assets', 'logo-ico.ico'),
    });

    win.maximize();
    
    const startUrl = app.isPackaged
        ? path.join(__dirname, "out", "index.html")
        : "http://localhost:3000";

    if (app.isPackaged) {
        win.loadFile(startUrl);
    } else {
        win.loadURL(startUrl);
    }
}

const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
        label: "Open",
        submenu: [
            {
                label: "Learn More",
                click: () => {
                    dialog.showMessageBox({
                        type: "info",
                        title: "About Prince's Encryptor",
                        message: `🔐 Prince's File Encryptor v1.0`,
                        detail:
                            "Created by ItsMe Prince\nA secure AES-GCM based file encryptor built with Electron + Next.js.\n\nChoose a button below to explore more:",
                        buttons: ["YouTube", "GitHub Profile", "GitHub Repo", "Close"],
                        noLink: true,
                    }).then((result) => {
                        switch (result.response) {
                            case 0:
                                shell.openExternal("https://www.youtube.com/@itsmeprinceyt");
                                break;
                            case 1:
                                shell.openExternal("https://github.com/itsmeprinceyt");
                                break;
                            case 2:
                                shell.openExternal("https://github.com/itsmeprinceyt/file-encrypt-decrypter/tree/main/electron");
                                break;
                            default:
                                break;
                        }
                    });
                },
            },
            { type: "separator" },
            { label: "Reload", role: "reload" },
            { type: "separator" },
            { label: "Zoom In", role: "zoomIn" },
            { label: "Zoom Out", role: "zoomOut" },
            { type: "separator" },
            { label: "Minimize", role: "minimize" },
            { label: "Toggle Fullscreen", role: "togglefullscreen" },
            { type: "separator" },
            { label: "Exit", role: "quit" },
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
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
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
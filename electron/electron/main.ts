import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "path";
import { encryptFile, decryptFile } from "./cryptoHandler";

function createWindow() {
    const win = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    const startUrl = app.isPackaged
        ? `file://${path.join(__dirname, "../out/index.html")}`
        : "http://localhost:3000";

    win.loadURL(startUrl);
}

app.whenReady().then(() => {
    console.log("✅ Electron app ready");
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

ipcMain.on("hello", () => {
    console.log("👋 Hello from Renderer (Next.js)!");
});

ipcMain.handle("get-version", () => {
    return app.getVersion();
});

ipcMain.handle("select-file", async () => {
    const result = await dialog.showOpenDialog({ properties: ["openFile"] });
    return result.filePaths[0];
});

ipcMain.handle(
    "encrypt",
    async (
        _,
        inputPath: string,
        outputPath: string,
        password: string,
        confirmPassword: string
    ) => {
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        encryptFile(inputPath, outputPath, password);
    }
);

ipcMain.handle(
    "decrypt",
    async (_, inputPath: string, outputPath: string, password: string) => {
        decryptFile(inputPath, outputPath, password);
    }
);


ipcMain.handle("save-file", async (_, inputPath: string, mode: "encrypt" | "decrypt") => {
    const defaultName = path.basename(inputPath);

    if (mode === "encrypt") {
        // Save encrypted version in same folder with .prince suffix
        const dir = await dialog.showOpenDialog({ properties: ["openDirectory"] });
        if (dir.canceled || !dir.filePaths[0]) return null;
        return path.join(dir.filePaths[0], defaultName + ".prince");
    }

    if (mode === "decrypt") {
        // Remove .prince and save in same folder
        const originalName = defaultName.endsWith(".prince")
            ? defaultName.slice(0, -7)
            : defaultName;

        const dir = await dialog.showOpenDialog({ properties: ["openDirectory"] });
        if (dir.canceled || !dir.filePaths[0]) return null;
        return path.join(dir.filePaths[0], originalName);
    }

    return null;
});
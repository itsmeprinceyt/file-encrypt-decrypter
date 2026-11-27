const fs = require("fs-extra");
const path = require("path");

(async () => {
    const src = path.join(__dirname, "electron", "assets");
    const dest = path.join(__dirname, "electron", "dist", "assets");

    console.log("📁 Copying 'assets' folder to 'electron/dist'...");

    if (!fs.existsSync(src)) {
        console.warn("⚠️ 'assets' folder not found at:", src);
        return;
    }

    await fs.ensureDir(path.dirname(dest));

    if (fs.existsSync(dest)) {
        await fs.remove(dest);
    }

    await fs.copy(src, dest);
    console.log("✅ 'assets' successfully copied to 'electron/dist/assets'");
})();

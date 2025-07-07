const fs = require("fs-extra");
const path = require("path");

const src = path.join(__dirname, "out");
const dest = path.join(__dirname, "electron", "dist", "out");

(async () => {
    console.log("📦 Moving 'out' folder...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!fs.existsSync(src)) {
        console.warn("⚠️ 'out' folder not found at:", src);
        return;
    }

    await fs.ensureDir(path.dirname(dest));

    if (fs.existsSync(dest)) {
        await fs.remove(dest);
    }

    await fs.move(src, dest);
    console.log("✅ Moved 'out' to 'electron/dist/out'");
})();

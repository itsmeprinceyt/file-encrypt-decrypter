# ⚡ Electron + Next.js + TailwindCSS + TypeScript Project Template

A modern template combining Electron with Next.js (App Router), styled using TailwindCSS and built with TypeScript. Ideal for creating cross-platform desktop applications using web technologies.

---

## 🧱 Tech Stack

- **⚛ Next.js** — React framework for frontend (with App Directory support)
- **🖥 Electron** — Native desktop shell
- **🎨 TailwindCSS** — Utility-first CSS framework
- **📘 TypeScript** — Strongly typed JavaScript
- **📦 electron-builder** — Package your app into platform-native installers

---

## 📜 NPM Scripts

| Script              | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| `dev`               | Starts Next.js in development mode at `localhost:3000`                      |
| `build:next`        | Builds and exports static Next.js files into the `out/` folder              |
| `build:electron`    | Compiles Electron TypeScript (`main.ts`, `preload.ts`) into `electron/dist` |
| `dev:electron`      | Runs both Next.js and Electron together with live reload for frontend       |
| `build:app`         | Builds both Next.js + Electron and creates platform installer using `electron-builder` |

---

## 🔗 Build Config (electron-builder)

```json
"build": {
  "appId": "com.example.myapp",
  "files": [
    "electron/dist/**/*",
    "out/**/*",
    "package.json"
  ],
  "directories": {
    "buildResources": "assets"
  },
  "win": {
    "target": "nsis"
  }
}
```

## 📁 Output
After building, your .exe or app installer will be available in the dist/ folder.

## 🚀 Get Started

```bash
npm install
npm run build:electron
npm run dev:electron
```

# Good luck 🫡
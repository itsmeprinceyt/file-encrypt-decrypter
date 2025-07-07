# ⚡ Electron + Next.js + TailwindCSS + TypeScript Project Template

This template includes:
- Next.js
- Electron.js
- TailwindCSS
- Typescript
- Electron-builder
---

## 📜 NPM Scripts

| Script              | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| `dev`               | Starts Next.js in development mode at `localhost:3000`                      |
| `build:next`        | Builds and exports static Next.js files into the `out/` folder              |
| `move:out`          | Copies the `out` folder into `electron/dist/` for it to be included in build|
| `build:electron`    | Compiles Electron TypeScript (`main.ts`, `preload.ts`) into `electron/dist` |
| `dev:electron`      | Runs both Next.js and Electron together with live reload for frontend       |
| `build:app`         | Builds both Next.js + Electron and creates platform installer using `electron-builder` |

---

## 🔗 Build Config(change if needed) for `package.json` for (electron-builder)

```json
  "build": {
    "appId": "com.yourcompany.yourapp",
    "productName": "productName",
    "files": [
      "electron/dist/**/*",
      "out/**/*",
      "package.json"
    ],
    "directories": {
      "buildResources": "assets"
    },
    "win": {
      "target": [
        "portable",
        "nsis"
      ],
      "icon": "assets/icon.ico"
    }
  },
```

## 📁 Output
After building, your .exe or app installer will be available in the `dist/` root folder.

## 🚀 Get Started for development

```bash
npm install
npm run build:electron
npm run dev:electron
```

## 🚀 For building exe

```bash
npm run build:app
```

# Good luck 🫡
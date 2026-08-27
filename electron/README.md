# File Encrypter & Decrypter - Desktop App

This is a powerful cross-platform desktop application built with:

- **Next.js** (UI frontend)
- **Electron.js** (Desktop runtime)
- **TailwindCSS** (UI styling)
- **TypeScript** (Type safety)
- **Electron-Builder** (Builds portable `.exe` or installer)

Easily encrypt or decrypt files using the **AES-GCM** algorithm for secure file sharing and storage.

---

## Features

- AES-GCM 256-bit secure encryption
- Password-based encryption with confirmation
- Friendly prompts and alerts
- Modern UI built with Tailwind
- Fast and responsive desktop app

---

## Folder Structure
```bash
project-root/
├── electron/ # Electron-specific code
│ ├── main.ts # Main Electron process
│ ├── preload.ts # Preload scripts
│ ├── dist/ # Compiled Electron files
│ └── assets/ # Icons and build assets
├── src/ # Next.js app
│ └── app/ # Frontend logic
│ └── assets/ # Which are used in front-end
├── out/ # Exported Next.js files
├── dist/ # Final app output
├── move-out.js # For putting  `out/` into `electron/dist/`
└── move-assets.js # Copies static files to Electron dist
```
---
## NPM Scripts

| Script              | Description                                                                 |
|---------------------|-----------------------------------------------------------------------------|
| `dev`               | Starts Next.js in development mode at `localhost:3000`                      |
| `build:next`        | Builds and exports static Next.js files into the `out/` folder              |
| `move:out`          | Copies the `out` folder into `electron/dist/` for it to be included in build|
| `build:electron`    | Compiles Electron TypeScript (`main.ts`, `preload.ts`) into `electron/dist` |
| `dev:electron`      | Runs both Next.js and Electron together with live reload for frontend       |
| `build:app`         | Builds both Next.js + Electron and creates platform installer using `electron-builder` |

---

## Build Config (change if needed) for `package.json` (electron-builder)

```json
  "build": {
    "appId": "com.company.appid",
    "productName": "Proper Software name without any unallowed characters", // dont add stuff like "/" , "|" , "$" [all the unallowed characters should not be used here or in any product name variable]
    "files": [
      "electron/dist/**/*",
      "out/**/*",
      "package.json"
    ],
    "directories": {
      "buildResources": "electron/assets" // it finds all the license and stuff from here
    },
    "win": {
      "target": [
        "portable",
        "nsis"
      ],
      "icon": "electron/assets/logo.ico" // icon where it is situated in the context oc package.json
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "Proper Software name without any unallowed characters"
    }
  }
```

## Output
After building, your .exe or app installer will be available in the `dist/` root folder.

## Get Started for Development

```bash
npm install # Installs all the necessary files 
npm run build:electron # Run so that your electron is compiled into `dist` folder
npm run dev:electron # Launch Electron pointing to frontend
```

## Building the Executable
To create an installer or `.exe` portable app:
```bash
npm run build:app
```
Output will be inside the root-level `/dist` folder.

## How It Works
1. Start Screen: Choose between Encrypt or Decrypt.
2. File Picker: Browse and select the file to process.
3. Password Flow:
    - For encryption: Enter and confirm a password.
    - For decryption: Enter the original password.
4. Processing:
    - Files are encrypted/decrypted using AES-GCM with random IV and auth tag.
5. Save Location:
    - Choose where to save the resulting file.
6. Completion: App returns a successful prompt and button which will take you to the encrypted/decrypted file.

## Shortcuts
- Home: `Ctrl + H`
- Encrypt: `Ctrl + E`
- Decrypt: `Ctrl + D`

## Encryption Format (Under the Hood)
- Algorithm: aes-256-gcm
- Structure:
    - iv (12 bytes) + encrypted data + auth tag (16 bytes)
- Encrypted files will have `.prince` appended to the file name.
- Decrypted file: restores original extension and removes `.prince`

## Notes
- Do not lose the password used during encryption — the app cannot recover encrypted files without it.
- All file reads and writes are handled locally; no data is sent externally.

## Dependencies
- next
- react
- tailwindcss
- electron
- electron-builder
- typescript
- crypto (Node.js module)

## Important Links

1. Website: https://file-encrypt-decrypter-website.vercel.app/
2. Website Repository: https://github.com/itsmeprinceyt/file-encrypt-decrypter-website
3. Main Repository: https://github.com/itsmeprinceyt/file-encrypt-decrypter
4. Software Repository: https://github.com/itsmeprinceyt/file-encrypt-decrypter/tree/main/electron
5. Latest Release: https://github.com/itsmeprinceyt/file-encrypt-decrypter/releases/tag/latest

## Video Explanation

https://www.youtube.com/watch?v=e7MSCbvnSZs

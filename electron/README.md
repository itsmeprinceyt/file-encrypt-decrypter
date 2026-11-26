# File Encrypter / Decrypter

A local-first Electron desktop app with a Next.js interface. It encrypts one file at a time using AES-256-GCM, a passphrase and a separate 256-bit Recovery Key. Files are processed on your device and are never uploaded.

## Development

From this `electron/` directory:

```bash
npm install
npm run dev:electron
```

This starts the Next.js development server and opens the Electron desktop app with its preload APIs enabled. Keep that terminal running while developing. For a browser-only view of the interface, use `npm run dev` and open `http://localhost:3000`; browser-only mode does not provide native file dialogs or desktop crypto APIs.

## Checks

```bash
npm test
npm run lint
npm run smoke
```

`npm test` builds the Electron main process and runs the crypto/format and CLI-interop test suite. The command-line tools are not shipped as project applications; CLI interop tests exercise file-format compatibility only. `npm run smoke` builds the static UI and drives an encrypt/decrypt operation through the real Electron preload bridge.

## Package the desktop app

```bash
npm run build:app
```

The Windows portable app and installer are written to `electron/dist/` according to the electron-builder configuration.

## How encryption works

- AES-256-GCM with authenticated format metadata.
- A memory-hard passphrase KDF plus a random Recovery Key combined using HKDF-SHA256.
- Streaming file processing with progress reporting.
- Decryption uses a temporary file; the destination is replaced only after authentication succeeds.
- Legacy `.prince` files are still supported for decryption.

Do not lose either recovery factor. Keep the Recovery Key separate from the encrypted file. The full byte-level specification is in [`docs/FORMAT.md`](docs/FORMAT.md).

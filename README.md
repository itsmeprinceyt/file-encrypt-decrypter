# File Encrypter / Decrypter

A local-first Electron desktop app for protecting files with a passphrase and a separate Recovery Key. Encryption and decryption happen on your device; files are not uploaded.

## Desktop app

See [`electron/README.md`](electron/README.md) for installation, development and packaging instructions.

## Security

The current `.prince` format uses AES-256-GCM with a memory-hard passphrase KDF and a 256-bit Recovery Key. Keep the Recovery Key separate from the encrypted file; both it and the passphrase are required to decrypt. Older `.prince` files remain readable where supported by the desktop app.

Full format specification: [`electron/docs/FORMAT.md`](electron/docs/FORMAT.md).

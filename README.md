# File Encrypter/Decrypter
This project is a simple command-line tool for encrypting and decrypting files using a symmetric key derived from a user-provided password.

# `Purpose`
As an active open-source developer, managing `.env` files securely is crucial for me. Storing these sensitive files solely on my local machine feels risky—what if my computer crashes or gets lost? To mitigate this risk, I created a simple Python script and same in node to encrypt my `.env` files. This allows me to safely push encrypted files to public repositories without worrying about exposing my secrets. I believe this is an effective and free solution to keep my environment variables secure while maintaining easy access and version control.

## Features
File Encryption: Securely encrypts files using a password.
File Decryption: Decrypts previously encrypted files using the correct password.
Password-Derived Key: Generates a strong encryption key from the password using SHA-256 hashing.
## Python Usage
### Prerequisites
Make sure you have Python installed and the necessary libraries. You can install the `cryptography` library using pip:

```bash
pip install cryptography
```
## Encrypting a File
To encrypt a file, use the encrypt action followed by the path to the file you want to encrypt and ensure the file is in the same directory as `main.py`:

```bash
python main.py encrypt .env
```
After running the command, you'll be prompted to enter your "Handshake" (password):
```bash
Handshake:
```
Upon successful encryption, a new file with a `.prince` extension will be created (e.g., `.env.prince`).

## Decrypting a File
To decrypt a file, use the `decrypt` action followed by the path to the encrypted file (which should have the `.prince` extension):

```bash
python main.py decrypt .env.prince
```
Again, you'll be prompted for your "Handshake" (password):

> `It won't show any visual effect when typing so type blindly ig`
```bash
Handshake:
```
## Node Usage
### Prerequisites

Make sure you have **Node.js** installed on your system. You also need to install the `readline-sync` package for handling password input.

Install the required dependency by running:

```bash
npm install readline-sync
```

### Encrypting a File
To encrypt a file, use the encrypt action followed by the path to the file you want to encrypt. Make sure the file is in the same directory as encryptor.js (or provide the full path):
```bash
node main.js encrypt .env
```
You'll be prompted to enter your "Handshake" (password) and confirm it:
```bash
Handshake: ********
Confirm handshake: ********
```
If the passwords match, the file will be encrypted and a new file with a .prince extension will be created, for example:
```bash
.env.prince
```
### Decrypting a File
To decrypt a previously encrypted file (ending in .prince), use the decrypt action:
```bash
node main.js decrypt .env.prince
```
You'll again be prompted for the Handshake (password):
```bash
Handshake: ********
```

- Do not forget your password! If you lose it, you cannot decrypt the file.
- If the password is correct, the original file will be restored by removing the `.prince` extension. If the password is incorrect, you'll see a `"nuh uh"` message.
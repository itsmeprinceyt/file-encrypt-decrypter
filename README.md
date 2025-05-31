# File Encrypter/Decrypter
This project provides a simple command-line tool for encrypting and decrypting files using a symmetric key derived from a user-provided password. It leverages the `cryptography` library's Fernet implementation for secure encryption.

# `Purpose`
As an active open-source developer, managing .env files securely is crucial for me. Storing these sensitive files only on my local machine feels risky—what if my computer crashes or is lost? To mitigate this, I decided to create a simple Python script that encrypts my .env files. This way, I can safely push the encrypted files to my public repositories without worrying about exposing my secrets. I believe this is an effective and free solution to keep my environment variables secure while maintaining easy access and version control.

## Features
File Encryption: Securely encrypts any file using a password.
File Decryption: Decrypts previously encrypted files using the correct password.
Password-Derived Key: Generates a strong encryption key from your password using SHA256 hashing.
## Usage
### Prerequisites
Make sure you have Python installed and the necessary libraries. You can install the `cryptography` library using pip:

```bash
pip install cryptography
```
## Encrypting a File
To encrypt a file, use the encrypt action followed by the path to the file you want to encrypt and make sure your file is in the same directory in the `main.py`:

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

```bash
Handshake:
```
If the password is correct, the original file will be restored (the `.prince` extension will be removed). If the password is incorrect, you'll see a `"nuh uh"` message.
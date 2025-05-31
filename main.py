import base64
import hashlib
from cryptography.fernet import Fernet
from getpass import getpass
import sys

def derive_key(password: str) -> bytes:
    return base64.urlsafe_b64encode(hashlib.sha256(password.encode()).digest())

def encrypt_file(input_file: str, output_file: str, password: str):
    key = derive_key(password)
    f = Fernet(key)
    with open(input_file, 'rb') as file:
        data = file.read()
    encrypted = f.encrypt(data)
    with open(output_file, 'wb') as file:
        file.write(encrypted)
    print(f"✅ Handshake done {output_file}")

def decrypt_file(input_file: str, output_file: str, password: str):
    key = derive_key(password)
    f = Fernet(key)
    with open(input_file, 'rb') as file:
        encrypted = file.read()
    try:
        decrypted = f.decrypt(encrypted)
    except Exception:
        print("nuh uh")
        return
    with open(output_file, 'wb') as file:
        file.write(decrypted)
    print(f"✅ Handshake undone {output_file}")

if __name__ == "__main__":
    action = sys.argv[1]
    input_path = sys.argv[2]

    if action == "encrypt":
        password = getpass("Handshake: ")
        confirm_password = getpass("Confirm handshake: ")
        if password != confirm_password:
            print("Handshake not completed ... going far away!")
            sys.exit(1)
        encrypt_file(input_path, input_path + ".prince", password)
    elif action == "decrypt":
        password = getpass("Handshake: ")
        decrypt_file(input_path, input_path.replace(".prince", ""), password)
    else:
        print("nuh uh")
import fs from "fs";
import crypto from "crypto";

export function deriveKey(password: string): Buffer {
    return crypto.createHash("sha256").update(password).digest();
}

export function encryptFile(inputFile: string, outputFile: string, password: string) {
    const key = deriveKey(password);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const data = fs.readFileSync(inputFile);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();
    const result = Buffer.concat([iv, authTag, encrypted]);

    fs.writeFileSync(outputFile, result);
}

export function decryptFile(inputFile: string, outputFile: string, password: string) {
    const key = deriveKey(password);
    const data = fs.readFileSync(inputFile);

    if (data.length < 28) {
        throw new Error("Invalid or corrupted file.");
    }

    const iv = data.slice(0, 12);
    const authTag = data.slice(12, 28);
    const encrypted = data.slice(28);

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    try {
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        fs.writeFileSync(outputFile, decrypted);
    } catch (err) {
        throw new Error("Incorrect password.");
    }
}
const crypto = require('crypto');
const fs = require('fs');
const readlineSync = require('readline-sync');
const path = require('path');

function deriveKey(password) {
    return crypto.createHash('sha256').update(password).digest();
}

function encryptFile(inputFile, outputFile, password) {
    const key = deriveKey(password);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const data = fs.readFileSync(inputFile);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const result = Buffer.concat([iv, authTag, encrypted]);
    fs.writeFileSync(outputFile, result);
    console.log(`✅ Handshake done ${outputFile}`);
}

function decryptFile(inputFile, outputFile, password) {
    const key = deriveKey(password);
    const fileData = fs.readFileSync(inputFile);

    const iv = fileData.slice(0, 12);
    const authTag = fileData.slice(12, 28);
    const encrypted = fileData.slice(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    try {
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        fs.writeFileSync(outputFile, decrypted);
        console.log(`✅ Handshake undone ${outputFile}`);
    } catch (err) {
        console.log("nuh uh");
    }
}

const args = process.argv.slice(2);
const action = args[0];
const inputPath = args[1];

if (!action || !inputPath) {
    console.log("Usage: node main.js <encrypt|decrypt> <file with extension🤡>");
    process.exit(1);
}

if (action === 'encrypt') {
    const password = readlineSync.question('Handshake: ', { hideEchoBack: true });
    const confirmPassword = readlineSync.question('Confirm handshake: ', { hideEchoBack: true });
    if (password !== confirmPassword) {
        console.log("Handshake not completed ... going far away!");
        process.exit(1);
    }
    encryptFile(inputPath, inputPath + ".prince", password);
} else if (action === 'decrypt') {
    const password = readlineSync.question('Handshake: ', { hideEchoBack: true });
    decryptFile(inputPath, inputPath.replace(".prince", ""), password);
} else {
    console.log("nuh uh");
}
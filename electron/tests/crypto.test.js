const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
    encryptFile,
    decryptFile,
    inspectFileFormat,
} = require("../electron/dist/cryptoHandler.js");
const {
    generateRecoveryKey,
    isValidRecoveryKey,
    decodeRecoveryKey,
} = require("../electron/dist/recoveryKey.js");

const GENERIC_ERROR = "Decryption failed. Wrong passphrase or key, or the file is corrupted.";
const PASSPHRASE = "correct horse battery staple";
const OTHER_PASSPHRASE = "another sufficiently long passphrase";
const PLAINTEXT = Buffer.from(
    "DATABASE_URL=postgres://user:pass@localhost:5432/app\nSECRET_KEY=6f1c0f0f9a\n",
    "utf8"
);
const HEADER_LENGTH = 45;
const MAGIC = "PRINCE";
const CHUNK = 1024 * 1024;

let workDir;
let inputPath;
let sharedEncrypted;
let recoveryKey;

function out(name) {
    return path.join(workDir, name);
}

function writeLegacyFile(target, password, plaintext) {
    const key = crypto.createHash("sha256").update(password).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    fs.writeFileSync(target, Buffer.concat([iv, cipher.getAuthTag(), ciphertext]));
}

before(async () => {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "prince-v2-"));
    inputPath = out("sample.env");
    fs.writeFileSync(inputPath, PLAINTEXT);
    recoveryKey = generateRecoveryKey();
    sharedEncrypted = out("shared.prince");
    await encryptFile(inputPath, sharedEncrypted, PASSPHRASE, recoveryKey);
});

after(() => {
    fs.rmSync(workDir, { recursive: true, force: true });
});

describe("prince v2 encryption", () => {
    test("round trip returns the original bytes", async () => {
        const decrypted = out("roundtrip.env");
        const result = await decryptFile(sharedEncrypted, decrypted, {
            kind: "v2",
            passphrase: PASSPHRASE,
            recoveryKey,
        });
        assert.equal(result.legacy, false);
        assert.deepEqual(fs.readFileSync(decrypted), PLAINTEXT);
    });

    test("output starts with the PRINCE magic and version 2", () => {
        const data = fs.readFileSync(sharedEncrypted);
        assert.equal(data.subarray(0, MAGIC.length).toString("ascii"), MAGIC);
        assert.equal(data.readUInt8(6), 2);
        assert.equal(inspectFileFormat(sharedEncrypted), 2);
        assert.equal(data.length, HEADER_LENGTH + PLAINTEXT.length + 16);
    });

    test("same plaintext and credentials produce different ciphertext", async () => {
        const first = out("repeat-one.prince");
        const second = out("repeat-two.prince");
        await encryptFile(inputPath, first, PASSPHRASE, recoveryKey);
        await encryptFile(inputPath, second, PASSPHRASE, recoveryKey);
        assert.notDeepEqual(fs.readFileSync(first), fs.readFileSync(second));

        const decrypted = out("repeat.env");
        await decryptFile(second, decrypted, { kind: "v2", passphrase: PASSPHRASE, recoveryKey });
        assert.deepEqual(fs.readFileSync(decrypted), PLAINTEXT);
    });

    test("forced scrypt files round trip and record their own KDF", async () => {
        const scryptFile = out("scrypt.prince");
        await encryptFile(inputPath, scryptFile, PASSPHRASE, recoveryKey, { kdfId: 1 });
        assert.equal(fs.readFileSync(scryptFile).readUInt8(7), 1);
        assert.equal(fs.readFileSync(scryptFile).readUInt8(16), 1);

        const decrypted = out("scrypt.env");
        const result = await decryptFile(scryptFile, decrypted, {
            kind: "v2",
            passphrase: PASSPHRASE,
            recoveryKey,
        });
        assert.equal(result.legacy, false);
        assert.deepEqual(fs.readFileSync(decrypted), PLAINTEXT);
    });

    test("short passphrases are refused", async () => {
        await assert.rejects(
            encryptFile(inputPath, out("short.prince"), "elevenchars", recoveryKey),
            /at least 12 characters/
        );
        assert.equal(fs.existsSync(out("short.prince")), false);
    });

    test("empty files round trip as header plus tag only", async () => {
        const emptyPath = out("empty.bin");
        fs.writeFileSync(emptyPath, Buffer.alloc(0));
        const encrypted = out("empty.prince");
        await encryptFile(emptyPath, encrypted, PASSPHRASE, recoveryKey);
        assert.equal(fs.statSync(encrypted).size, HEADER_LENGTH + 16);

        const decrypted = out("empty.out");
        await decryptFile(encrypted, decrypted, { kind: "v2", passphrase: PASSPHRASE, recoveryKey });
        assert.equal(fs.statSync(decrypted).size, 0);
    });

    test("multi-chunk files stream with monotonic progress", async () => {
        const size = 3 * CHUNK + 137;
        const large = Buffer.alloc(size);
        for (let index = 0; index < size; index++) large[index] = index % 251;
        const largePath = out("large.bin");
        fs.writeFileSync(largePath, large);

        const encrypted = out("large.bin.prince");
        const encryptEvents = [];
        await encryptFile(largePath, encrypted, PASSPHRASE, recoveryKey, {
            onProgress: (info) => encryptEvents.push(info),
        });

        assert.ok(encryptEvents.length >= 3, `expected several progress events, got ${encryptEvents.length}`);
        assert.deepEqual(encryptEvents[0], { processed: 0, total: size });
        assert.deepEqual(encryptEvents[encryptEvents.length - 1], { processed: size, total: size });
        for (let index = 1; index < encryptEvents.length; index++) {
            assert.ok(encryptEvents[index].processed >= encryptEvents[index - 1].processed);
        }

        const decrypted = out("large.out");
        const decryptEvents = [];
        await decryptFile(
            encrypted,
            decrypted,
            { kind: "v2", passphrase: PASSPHRASE, recoveryKey },
            { onProgress: (info) => decryptEvents.push(info) }
        );

        assert.deepEqual(fs.readFileSync(decrypted), large);
        assert.deepEqual(decryptEvents[decryptEvents.length - 1], { processed: size, total: size });
        for (let index = 1; index < decryptEvents.length; index++) {
            assert.ok(decryptEvents[index].processed >= decryptEvents[index - 1].processed);
        }
    });
});

describe("prince v2 failure handling", () => {
    test("wrong passphrase fails with the generic message", async () => {
        const target = out("wrong-pass.env");
        await assert.rejects(
            decryptFile(sharedEncrypted, target, {
                kind: "v2",
                passphrase: OTHER_PASSPHRASE,
                recoveryKey,
            }),
            { message: GENERIC_ERROR }
        );
        assert.equal(fs.existsSync(target), false);
    });

    test("wrong recovery key fails with the generic message", async () => {
        const target = out("wrong-key.env");
        await assert.rejects(
            decryptFile(sharedEncrypted, target, {
                kind: "v2",
                passphrase: PASSPHRASE,
                recoveryKey: generateRecoveryKey(),
            }),
            { message: GENERIC_ERROR }
        );
        assert.equal(fs.existsSync(target), false);
    });

    test("both factors wrong fail with the generic message", async () => {
        await assert.rejects(
            decryptFile(sharedEncrypted, out("both-wrong.env"), {
                kind: "v2",
                passphrase: OTHER_PASSPHRASE,
                recoveryKey: generateRecoveryKey(),
            }),
            { message: GENERIC_ERROR }
        );
    });

    test("tampered header is rejected", async () => {
        const tampered = Buffer.from(fs.readFileSync(sharedEncrypted));
        tampered[20] ^= 0xff;
        const tamperedPath = out("tampered-header.prince");
        fs.writeFileSync(tamperedPath, tampered);

        await assert.rejects(
            decryptFile(tamperedPath, out("tampered-header.env"), {
                kind: "v2",
                passphrase: PASSPHRASE,
                recoveryKey,
            }),
            { message: GENERIC_ERROR }
        );
    });

    test("tampered ciphertext is rejected", async () => {
        const tampered = Buffer.from(fs.readFileSync(sharedEncrypted));
        tampered[HEADER_LENGTH + 1] ^= 0x01;
        const tamperedPath = out("tampered-body.prince");
        fs.writeFileSync(tamperedPath, tampered);

        const target = out("tampered-body.env");
        await assert.rejects(
            decryptFile(tamperedPath, target, { kind: "v2", passphrase: PASSPHRASE, recoveryKey }),
            { message: GENERIC_ERROR }
        );
        assert.equal(fs.existsSync(target), false);
    });

    test("tampered multi-chunk ciphertext leaves no partial output", async () => {
        const source = fs.readFileSync(out("large.bin.prince"));
        source[HEADER_LENGTH + CHUNK + 10] ^= 0x01;
        const tamperedPath = out("large-tampered.prince");
        fs.writeFileSync(tamperedPath, source);

        const target = out("large-tampered.out");
        await assert.rejects(
            decryptFile(tamperedPath, target, { kind: "v2", passphrase: PASSPHRASE, recoveryKey }),
            { message: GENERIC_ERROR }
        );
        assert.equal(fs.existsSync(target), false);
    });

    test("truncated file is rejected", async () => {
        const truncatedPath = out("truncated.prince");
        fs.writeFileSync(truncatedPath, fs.readFileSync(sharedEncrypted).subarray(0, 20));

        await assert.rejects(
            decryptFile(truncatedPath, out("truncated.env"), {
                kind: "v2",
                passphrase: PASSPHRASE,
                recoveryKey,
            }),
            { message: GENERIC_ERROR }
        );
    });

    test("failed decryption leaves no temporary plaintext behind", async () => {
        const target = out("cleanup.env");
        await assert.rejects(
            decryptFile(sharedEncrypted, target, {
                kind: "v2",
                passphrase: OTHER_PASSPHRASE,
                recoveryKey,
            }),
            { message: GENERIC_ERROR }
        );
        const leftovers = fs.readdirSync(workDir).filter((name) => name.endsWith(".tmp"));
        assert.deepEqual(leftovers, []);
        assert.equal(fs.existsSync(target), false);
    });
});

describe("legacy compatibility", () => {
    test("legacy files still decrypt with the original password", async () => {
        const legacyPath = out("legacy.prince");
        writeLegacyFile(legacyPath, "old-password", PLAINTEXT);
        assert.equal(inspectFileFormat(legacyPath), 1);

        const decrypted = out("legacy.env");
        const result = await decryptFile(legacyPath, decrypted, {
            kind: "legacy",
            password: "old-password",
        });
        assert.equal(result.legacy, true);
        assert.deepEqual(fs.readFileSync(decrypted), PLAINTEXT);
    });

    test("legacy files reject the wrong password with the generic message", async () => {
        const legacyPath = out("legacy-bad.prince");
        writeLegacyFile(legacyPath, "old-password", PLAINTEXT);

        await assert.rejects(
            decryptFile(legacyPath, out("legacy-bad.env"), { kind: "legacy", password: "wrong-password" }),
            { message: GENERIC_ERROR }
        );
    });

    test("legacy empty payloads are handled", async () => {
        const legacyPath = out("legacy-empty.prince");
        writeLegacyFile(legacyPath, "old-password", Buffer.alloc(0));

        const decrypted = out("legacy-empty.out");
        await decryptFile(legacyPath, decrypted, { kind: "legacy", password: "old-password" });
        assert.equal(fs.statSync(decrypted).size, 0);
    });

    test("a v2 file is not treated as legacy", async () => {
        await assert.rejects(
            decryptFile(sharedEncrypted, out("mismatch.env"), { kind: "legacy", password: PASSPHRASE }),
            { message: GENERIC_ERROR }
        );
    });
});

describe("recovery key encoding", () => {
    test("generated keys are grouped, valid and 256-bit", () => {
        const key = generateRecoveryKey();
        assert.match(key, /^([0-9A-Z]{4}-){13}[0-9A-Z]{4}$/);
        assert.equal(isValidRecoveryKey(key), true);
        assert.equal(decodeRecoveryKey(key).length, 32);
    });

    test("a single character typo is rejected by the checksum", () => {
        const compact = recoveryKey.replace(/-/g, "");
        const original = compact[3];
        const replacement = original === "7" ? "8" : "7";
        const typo = compact.slice(0, 3) + replacement + compact.slice(4);

        assert.equal(isValidRecoveryKey(recoveryKey), true);
        assert.equal(isValidRecoveryKey(typo), false);
        assert.throws(() => decodeRecoveryKey(typo), /Invalid Recovery Key/);
    });

    test("parsing is tolerant of spacing and case", () => {
        const sloppy = `  ${recoveryKey.toLowerCase().replace(/-/g, " ")}  `;
        assert.equal(isValidRecoveryKey(sloppy), true);
        assert.deepEqual(decodeRecoveryKey(sloppy), decodeRecoveryKey(recoveryKey));
    });
});

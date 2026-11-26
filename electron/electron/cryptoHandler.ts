import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import {
    ARGON2_MEMORY_KIB,
    ARGON2_MEMORY_KIB_MAX,
    ARGON2_PASSES,
    ARGON2_PASSES_MAX,
    ARGON2_PARALLELISM,
    AUTH_TAG_LENGTH,
    DECRYPTION_ERROR_MESSAGE,
    FORMAT_MAGIC_BYTES,
    FORMAT_VERSION_LEGACY,
    FORMAT_VERSION_V2,
    HEADER_KDF_COST1_OFFSET,
    HEADER_KDF_COST2_OFFSET,
    HEADER_KDF_ID_OFFSET,
    HEADER_KDF_PARALLELISM_OFFSET,
    HEADER_LENGTH,
    HEADER_NONCE_OFFSET,
    HEADER_SALT_OFFSET,
    HEADER_VERSION_OFFSET,
    HKDF_INFO,
    KDF_ID_ARGON2ID,
    KDF_ID_SCRYPT,
    KDF_PARALLELISM_MAX,
    KEY_LENGTH,
    LEGACY_AUTH_TAG_LENGTH,
    LEGACY_IV_LENGTH,
    LEGACY_MIN_LENGTH,
    MIN_PASSPHRASE_LENGTH,
    NONCE_LENGTH,
    PROGRESS_MIN_INTERVAL_MS,
    PROGRESS_MIN_STEP,
    SALT_LENGTH,
    SCRYPT_LOG_N,
    SCRYPT_LOG_N_MAX,
    SCRYPT_LOG_N_MIN,
    SCRYPT_MAX_MEM,
    SCRYPT_P,
    SCRYPT_R,
    SCRYPT_R_MAX,
    STREAM_CHUNK_SIZE,
} from "./constants";
import { decodeRecoveryKey } from "./recoveryKey";

export type PrinceFormatVersion = typeof FORMAT_VERSION_LEGACY | typeof FORMAT_VERSION_V2;
export type KdfId = typeof KDF_ID_SCRYPT | typeof KDF_ID_ARGON2ID;

export type DecryptCredential =
    | { kind: "v2"; passphrase: string; recoveryKey: string }
    | { kind: "legacy"; password: string };

export interface DecryptResult {
    legacy: boolean;
}

export interface ProgressInfo {
    processed: number;
    total: number;
}

export type ProgressCallback = (info: ProgressInfo) => void;

export interface EncryptOptions {
    kdfId?: KdfId;
    onProgress?: ProgressCallback;
}

export interface DecryptOptions {
    onProgress?: ProgressCallback;
}

interface KdfDescriptor {
    id: KdfId;
    cost1: number;
    cost2: number;
    parallelism: number;
}

interface ProgressReporter {
    report(processed: number): void;
    complete(): void;
}

type Argon2Function = (
    algorithm: string,
    parameters: {
        message: string;
        nonce: Buffer;
        parallelism: number;
        tagLength: number;
        memory: number;
        passes: number;
    },
    callback: (error: Error | null, derivedKey: Buffer) => void
) => void;

export class DecryptionError extends Error {
    constructor() {
        super(DECRYPTION_ERROR_MESSAGE);
        this.name = "DecryptionError";
    }
}

export class UnsupportedKdfError extends Error {
    constructor() {
        super("This file was encrypted with Argon2id, which this build does not support. Update the app to open it.");
        this.name = "UnsupportedKdfError";
    }
}

function zero(buffer: Buffer | null | undefined): void {
    if (buffer && buffer.length > 0) buffer.fill(0);
}

function isFileSystemError(error: unknown): boolean {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    return typeof code === "string" && /^E[A-Z]+$/.test(code);
}

function asCryptoError(error: unknown): Error {
    if (error instanceof DecryptionError || error instanceof UnsupportedKdfError) return error;
    if (isFileSystemError(error)) return error as Error;
    return new DecryptionError();
}

function getArgon2(): Argon2Function | null {
    const candidate = (crypto as unknown as { argon2?: unknown }).argon2;
    if (typeof candidate !== "function") return null;
    if (typeof process.versions.electron === "string") return null;
    return candidate as Argon2Function;
}

function scryptDescriptor(): KdfDescriptor {
    return { id: KDF_ID_SCRYPT, cost1: SCRYPT_LOG_N, cost2: SCRYPT_R, parallelism: SCRYPT_P };
}

function argon2Descriptor(): KdfDescriptor {
    return {
        id: KDF_ID_ARGON2ID,
        cost1: ARGON2_MEMORY_KIB,
        cost2: ARGON2_PASSES,
        parallelism: ARGON2_PARALLELISM,
    };
}

function preferredKdf(): KdfDescriptor {
    return getArgon2() ? argon2Descriptor() : scryptDescriptor();
}

function requestedKdf(kdfId: KdfId | undefined): KdfDescriptor {
    if (kdfId === KDF_ID_SCRYPT) return scryptDescriptor();
    if (kdfId === KDF_ID_ARGON2ID) {
        if (!getArgon2()) throw new UnsupportedKdfError();
        return argon2Descriptor();
    }
    return preferredKdf();
}

function buildHeader(kdf: KdfDescriptor, salt: Buffer, nonce: Buffer): Buffer {
    const header = Buffer.alloc(HEADER_LENGTH);
    FORMAT_MAGIC_BYTES.copy(header, 0);
    header.writeUInt8(FORMAT_VERSION_V2, HEADER_VERSION_OFFSET);
    header.writeUInt8(kdf.id, HEADER_KDF_ID_OFFSET);
    header.writeUInt32BE(kdf.cost1, HEADER_KDF_COST1_OFFSET);
    header.writeUInt32BE(kdf.cost2, HEADER_KDF_COST2_OFFSET);
    header.writeUInt8(kdf.parallelism, HEADER_KDF_PARALLELISM_OFFSET);
    salt.copy(header, HEADER_SALT_OFFSET);
    nonce.copy(header, HEADER_NONCE_OFFSET);
    return header;
}

function parseKdf(header: Buffer): KdfDescriptor {
    const id = header.readUInt8(HEADER_KDF_ID_OFFSET);
    const cost1 = header.readUInt32BE(HEADER_KDF_COST1_OFFSET);
    const cost2 = header.readUInt32BE(HEADER_KDF_COST2_OFFSET);
    const parallelism = header.readUInt8(HEADER_KDF_PARALLELISM_OFFSET);

    if (parallelism < 1 || parallelism > KDF_PARALLELISM_MAX) {
        throw new DecryptionError();
    }

    if (id === KDF_ID_SCRYPT) {
        if (cost1 < SCRYPT_LOG_N_MIN || cost1 > SCRYPT_LOG_N_MAX) throw new DecryptionError();
        if (cost2 < 1 || cost2 > SCRYPT_R_MAX) throw new DecryptionError();
        if (128 * 2 ** cost1 * cost2 > SCRYPT_MAX_MEM) throw new DecryptionError();
        return { id, cost1, cost2, parallelism };
    }

    if (id === KDF_ID_ARGON2ID) {
        if (!getArgon2()) throw new UnsupportedKdfError();
        if (cost1 < 8 * parallelism || cost1 > ARGON2_MEMORY_KIB_MAX) throw new DecryptionError();
        if (cost2 < 1 || cost2 > ARGON2_PASSES_MAX) throw new DecryptionError();
        return { id, cost1, cost2, parallelism };
    }

    throw new DecryptionError();
}

async function scryptAsync(passphrase: string, salt: Buffer, kdf: KdfDescriptor): Promise<Buffer> {
    const N = 2 ** kdf.cost1;
    return new Promise<Buffer>((resolve, reject) => {
        crypto.scrypt(
            passphrase,
            salt,
            KEY_LENGTH,
            { N, r: kdf.cost2, p: kdf.parallelism, maxmem: 128 * N * kdf.cost2 * 2 },
            (error, derivedKey) => {
                if (error) reject(error);
                else resolve(derivedKey);
            }
        );
    });
}

async function argon2Async(passphrase: string, salt: Buffer, kdf: KdfDescriptor): Promise<Buffer> {
    const argon2 = getArgon2();
    if (!argon2) throw new UnsupportedKdfError();
    return new Promise<Buffer>((resolve, reject) => {
        argon2(
            "argon2id",
            {
                message: passphrase,
                nonce: salt,
                parallelism: kdf.parallelism,
                tagLength: KEY_LENGTH,
                memory: kdf.cost1,
                passes: kdf.cost2,
            },
            (error, derivedKey) => {
                if (error) reject(error);
                else resolve(Buffer.from(derivedKey));
            }
        );
    });
}

function derivePassphraseKey(passphrase: string, salt: Buffer, kdf: KdfDescriptor): Promise<Buffer> {
    if (kdf.id === KDF_ID_ARGON2ID) return argon2Async(passphrase, salt, kdf);
    return scryptAsync(passphrase, salt, kdf);
}

function deriveFinalKey(passphraseKey: Buffer, recoveryKeyBytes: Buffer, salt: Buffer): Buffer {
    const inputKeyMaterial = Buffer.concat([passphraseKey, recoveryKeyBytes]);
    try {
        const derived = crypto.hkdfSync("sha256", inputKeyMaterial, salt, HKDF_INFO, KEY_LENGTH);
        return Buffer.from(derived);
    } finally {
        zero(inputKeyMaterial);
    }
}

function createProgressReporter(total: number, onProgress?: ProgressCallback): ProgressReporter {
    let lastRatio = -1;
    let lastTime = 0;
    return {
        report(processed: number): void {
            if (!onProgress) return;
            const now = Date.now();
            const ratio = total > 0 ? Math.min(processed / total, 1) : 1;
            if (ratio >= 1) return;
            if (lastRatio >= 0 && ratio - lastRatio < PROGRESS_MIN_STEP && now - lastTime < PROGRESS_MIN_INTERVAL_MS) {
                return;
            }
            lastRatio = ratio;
            lastTime = now;
            onProgress({ processed, total });
        },
        complete(): void {
            if (onProgress) onProgress({ processed: total, total });
        },
    };
}

function createProgressTap(onBytes: (bytes: number) => void): Transform {
    return new Transform({
        transform(chunk: Buffer, _encoding, callback) {
            onBytes(chunk.length);
            callback(null, chunk);
        },
    });
}

function createHeaderFrame(header: Buffer, cipher: crypto.CipherGCM): Transform {
    let headerSent = false;
    return new Transform({
        transform(chunk: Buffer, _encoding, callback) {
            if (!headerSent) {
                headerSent = true;
                this.push(header);
            }
            callback(null, chunk);
        },
        flush(callback) {
            if (!headerSent) {
                headerSent = true;
                this.push(header);
            }
            this.push(cipher.getAuthTag());
            callback();
        },
    });
}

function createTempPath(destination: string): string {
    return path.join(
        path.dirname(destination),
        `.prince-${crypto.randomBytes(8).toString("hex")}.tmp`
    );
}

function commitTempFile(temporaryPath: string, destination: string): void {
    try {
        fs.renameSync(temporaryPath, destination);
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== "EEXIST" && code !== "EPERM" && code !== "ENOTEMPTY") throw error;
        fs.rmSync(destination, { force: true });
        fs.renameSync(temporaryPath, destination);
    }
}

function discardFile(target: string): void {
    try {
        fs.rmSync(target, { force: true });
    } catch {
        void 0;
    }
}

function readRange(inputFile: string, start: number, length: number): Buffer {
    const buffer = Buffer.alloc(length);
    if (length === 0) return buffer;
    const descriptor = fs.openSync(inputFile, "r");
    let read = 0;
    try {
        read = fs.readSync(descriptor, buffer, 0, length, start);
    } finally {
        fs.closeSync(descriptor);
    }
    if (read !== length) throw new DecryptionError();
    return buffer;
}

export function deriveKey(password: string): Buffer {
    return crypto.createHash("sha256").update(password).digest();
}

export function isV2Header(probe: Buffer, fileSize: number): boolean {
    if (fileSize < HEADER_LENGTH + AUTH_TAG_LENGTH) return false;
    if (probe.length < HEADER_LENGTH) return false;
    if (!probe.subarray(0, FORMAT_MAGIC_BYTES.length).equals(FORMAT_MAGIC_BYTES)) return false;
    return probe.readUInt8(HEADER_VERSION_OFFSET) === FORMAT_VERSION_V2;
}

export function isV2File(data: Buffer): boolean {
    return isV2Header(data, data.length);
}

export function inspectFileFormat(inputFile: string): PrinceFormatVersion {
    const size = fs.statSync(inputFile).size;
    const probe = readRange(inputFile, 0, Math.min(size, HEADER_LENGTH));
    return isV2Header(probe, size) ? FORMAT_VERSION_V2 : FORMAT_VERSION_LEGACY;
}

export async function encryptFile(
    inputFile: string,
    outputFile: string,
    passphrase: string,
    recoveryKey: string,
    options: EncryptOptions = {}
): Promise<void> {
    if (typeof passphrase !== "string" || passphrase.length < MIN_PASSPHRASE_LENGTH) {
        throw new Error(`Passphrase must be at least ${MIN_PASSPHRASE_LENGTH} characters.`);
    }

    const kdf = requestedKdf(options.kdfId);
    const salt = crypto.randomBytes(SALT_LENGTH);
    const nonce = crypto.randomBytes(NONCE_LENGTH);
    const header = buildHeader(kdf, salt, nonce);
    const recoveryKeyBytes = decodeRecoveryKey(recoveryKey);
    const size = fs.statSync(inputFile).size;
    const progress = createProgressReporter(size, options.onProgress);
    const temporaryPath = createTempPath(outputFile);

    let passphraseKey: Buffer | null = null;
    let finalKey: Buffer | null = null;
    try {
        passphraseKey = await derivePassphraseKey(passphrase, salt, kdf);
        finalKey = deriveFinalKey(passphraseKey, recoveryKeyBytes, salt);

        const cipher = crypto.createCipheriv("aes-256-gcm", finalKey, nonce) as crypto.CipherGCM;
        cipher.setAAD(header);

        let consumed = 0;
        progress.report(0);
        await pipeline(
            fs.createReadStream(inputFile, { highWaterMark: STREAM_CHUNK_SIZE }),
            createProgressTap((bytes) => {
                consumed += bytes;
                progress.report(consumed);
            }),
            cipher,
            createHeaderFrame(header, cipher),
            fs.createWriteStream(temporaryPath, { flags: "wx", mode: 0o600 })
        );

        commitTempFile(temporaryPath, outputFile);
        progress.complete();
    } catch (error) {
        discardFile(temporaryPath);
        throw error;
    } finally {
        zero(recoveryKeyBytes);
        zero(passphraseKey);
        zero(finalKey);
    }
}

async function decryptStreamToFile(
    inputFile: string,
    start: number,
    length: number,
    decipher: crypto.DecipherGCM,
    outputFile: string,
    onProgress?: ProgressCallback
): Promise<void> {
    const progress = createProgressReporter(length, onProgress);
    const temporaryPath = createTempPath(outputFile);
    try {
        progress.report(0);
        if (length === 0) {
            const plain = decipher.final();
            try {
                fs.writeFileSync(temporaryPath, plain, { mode: 0o600 });
            } finally {
                zero(plain);
            }
        } else {
            let consumed = 0;
            await pipeline(
                fs.createReadStream(inputFile, {
                    start,
                    end: start + length - 1,
                    highWaterMark: STREAM_CHUNK_SIZE,
                }),
                createProgressTap((bytes) => {
                    consumed += bytes;
                    progress.report(consumed);
                }),
                decipher,
                fs.createWriteStream(temporaryPath, { flags: "wx", mode: 0o600 })
            );
        }

        commitTempFile(temporaryPath, outputFile);
        progress.complete();
    } catch (error) {
        discardFile(temporaryPath);
        throw error;
    }
}

async function decryptV2(
    inputFile: string,
    size: number,
    outputFile: string,
    credential: { passphrase: string; recoveryKey: string },
    onProgress?: ProgressCallback
): Promise<DecryptResult> {
    let recoveryKeyBytes: Buffer | null = null;
    let passphraseKey: Buffer | null = null;
    let finalKey: Buffer | null = null;
    try {
        const header = readRange(inputFile, 0, HEADER_LENGTH);
        const kdf = parseKdf(header);
        const salt = Buffer.from(header.subarray(HEADER_SALT_OFFSET, HEADER_SALT_OFFSET + SALT_LENGTH));
        const nonce = Buffer.from(header.subarray(HEADER_NONCE_OFFSET, HEADER_NONCE_OFFSET + NONCE_LENGTH));
        const authTag = readRange(inputFile, size - AUTH_TAG_LENGTH, AUTH_TAG_LENGTH);
        const ciphertextLength = size - HEADER_LENGTH - AUTH_TAG_LENGTH;

        recoveryKeyBytes = decodeRecoveryKey(credential.recoveryKey);
        passphraseKey = await derivePassphraseKey(credential.passphrase, salt, kdf);
        finalKey = deriveFinalKey(passphraseKey, recoveryKeyBytes, salt);

        const decipher = crypto.createDecipheriv("aes-256-gcm", finalKey, nonce) as crypto.DecipherGCM;
        decipher.setAAD(header);
        decipher.setAuthTag(authTag);

        await decryptStreamToFile(inputFile, HEADER_LENGTH, ciphertextLength, decipher, outputFile, onProgress);
        return { legacy: false };
    } catch (error) {
        throw asCryptoError(error);
    } finally {
        zero(recoveryKeyBytes);
        zero(passphraseKey);
        zero(finalKey);
    }
}

async function decryptLegacy(
    inputFile: string,
    size: number,
    outputFile: string,
    password: string,
    onProgress?: ProgressCallback
): Promise<DecryptResult> {
    if (size < LEGACY_MIN_LENGTH) throw new DecryptionError();
    const iv = readRange(inputFile, 0, LEGACY_IV_LENGTH);
    const authTag = readRange(inputFile, LEGACY_IV_LENGTH, LEGACY_AUTH_TAG_LENGTH);
    const key = deriveKey(password);
    try {
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv) as crypto.DecipherGCM;
        decipher.setAuthTag(authTag);
        await decryptStreamToFile(inputFile, LEGACY_MIN_LENGTH, size - LEGACY_MIN_LENGTH, decipher, outputFile, onProgress);
        return { legacy: true };
    } catch (error) {
        throw asCryptoError(error);
    } finally {
        zero(key);
    }
}

export async function decryptFile(
    inputFile: string,
    outputFile: string,
    credential: DecryptCredential,
    options: DecryptOptions = {}
): Promise<DecryptResult> {
    const size = fs.statSync(inputFile).size;
    const probe = readRange(inputFile, 0, Math.min(size, HEADER_LENGTH));

    if (isV2Header(probe, size)) {
        if (credential.kind !== "v2") throw new DecryptionError();
        return decryptV2(
            inputFile,
            size,
            outputFile,
            { passphrase: credential.passphrase, recoveryKey: credential.recoveryKey },
            options.onProgress
        );
    }

    if (credential.kind !== "legacy") throw new DecryptionError();
    return decryptLegacy(inputFile, size, outputFile, credential.password, options.onProgress);
}

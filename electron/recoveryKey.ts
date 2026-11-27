import crypto from "crypto";
import {
    RECOVERY_KEY_ALPHABET,
    RECOVERY_KEY_BYTES,
    RECOVERY_KEY_CHECKSUM_BYTES,
    RECOVERY_KEY_GROUP_SIZE,
    RECOVERY_KEY_SEPARATOR,
} from "./constants";

const ENCODED_PAYLOAD_LENGTH = Math.ceil((RECOVERY_KEY_BYTES * 8) / 5);
const CHECKSUM_LENGTH = Math.ceil((RECOVERY_KEY_CHECKSUM_BYTES * 8) / 5);
const NORMALIZED_LENGTH = ENCODED_PAYLOAD_LENGTH + CHECKSUM_LENGTH;

const DECODE_MAP = new Map<string, number>();
for (let index = 0; index < RECOVERY_KEY_ALPHABET.length; index++) {
    DECODE_MAP.set(RECOVERY_KEY_ALPHABET[index], index);
}
DECODE_MAP.set("I", 1);
DECODE_MAP.set("L", 1);
DECODE_MAP.set("O", 0);

export const INVALID_RECOVERY_KEY_MESSAGE = "Invalid Recovery Key.";
export const INVALID_RECOVERY_KEY_CHECKSUM_MESSAGE = "Invalid Recovery Key checksum.";

function encodeBase32(data: Buffer): string {
    let output = "";
    let bits = 0;
    let value = 0;
    for (const byte of data) {
        value = (value << 8) | byte;
        bits += 8;
        while (bits >= 5) {
            bits -= 5;
            output += RECOVERY_KEY_ALPHABET[(value >>> bits) & 31];
            value &= (1 << bits) - 1;
        }
    }
    if (bits > 0) {
        output += RECOVERY_KEY_ALPHABET[(value << (5 - bits)) & 31];
    }
    return output;
}

function decodeBase32(input: string): Buffer {
    const bytes: number[] = [];
    let bits = 0;
    let value = 0;
    for (const character of input) {
        const index = DECODE_MAP.get(character);
        if (index === undefined) {
            throw new Error(INVALID_RECOVERY_KEY_MESSAGE);
        }
        value = (value << 5) | index;
        bits += 5;
        if (bits >= 8) {
            bits -= 8;
            bytes.push((value >>> bits) & 0xff);
            value &= (1 << bits) - 1;
        }
    }
    if (bits >= 5 || value !== 0) {
        throw new Error(INVALID_RECOVERY_KEY_MESSAGE);
    }
    return Buffer.from(bytes);
}

function checksumFor(payload: Buffer): string {
    const digest = crypto.createHash("sha256").update(payload).digest();
    return encodeBase32(digest.subarray(0, RECOVERY_KEY_CHECKSUM_BYTES));
}

function group(encoded: string): string {
    const blocks: string[] = [];
    for (let index = 0; index < encoded.length; index += RECOVERY_KEY_GROUP_SIZE) {
        blocks.push(encoded.slice(index, index + RECOVERY_KEY_GROUP_SIZE));
    }
    return blocks.join(RECOVERY_KEY_SEPARATOR);
}

export function normalizeRecoveryKey(input: string): string {
    return input.toUpperCase().replace(/[\s-]/g, "");
}

export function formatRecoveryKey(payload: Buffer): string {
    if (payload.length !== RECOVERY_KEY_BYTES) {
        throw new Error(INVALID_RECOVERY_KEY_MESSAGE);
    }
    return group(encodeBase32(payload) + checksumFor(payload));
}

export function generateRecoveryKey(): string {
    const payload = crypto.randomBytes(RECOVERY_KEY_BYTES);
    try {
        return formatRecoveryKey(payload);
    } finally {
        payload.fill(0);
    }
}

export function decodeRecoveryKey(input: unknown): Buffer {
    if (typeof input !== "string") {
        throw new Error(INVALID_RECOVERY_KEY_MESSAGE);
    }
    const normalized = normalizeRecoveryKey(input);
    if (normalized.length !== NORMALIZED_LENGTH) {
        throw new Error(INVALID_RECOVERY_KEY_MESSAGE);
    }
    const payloadPart = normalized.slice(0, ENCODED_PAYLOAD_LENGTH);
    const checksumPart = normalized.slice(ENCODED_PAYLOAD_LENGTH);
    const payload = decodeBase32(payloadPart);
    if (payload.length !== RECOVERY_KEY_BYTES) {
        throw new Error(INVALID_RECOVERY_KEY_MESSAGE);
    }
    if (checksumFor(payload) !== checksumPart) {
        throw new Error(INVALID_RECOVERY_KEY_CHECKSUM_MESSAGE);
    }
    return payload;
}

export function isValidRecoveryKey(input: unknown): boolean {
    try {
        decodeRecoveryKey(input).fill(0);
        return true;
    } catch {
        return false;
    }
}

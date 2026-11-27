export const FORMAT_MAGIC = "PRINCE";
export const FORMAT_MAGIC_BYTES = Buffer.from(FORMAT_MAGIC, "ascii");
export const FORMAT_VERSION_V2 = 2 as const;
export const FORMAT_VERSION_LEGACY = 1 as const;

export const KDF_ID_SCRYPT = 1;
export const KDF_ID_ARGON2ID = 2;

export const KEY_LENGTH = 32;
export const SALT_LENGTH = 16;
export const NONCE_LENGTH = 12;
export const AUTH_TAG_LENGTH = 16;

export const HEADER_VERSION_OFFSET = 6;
export const HEADER_KDF_ID_OFFSET = 7;
export const HEADER_KDF_COST1_OFFSET = 8;
export const HEADER_KDF_COST2_OFFSET = 12;
export const HEADER_KDF_PARALLELISM_OFFSET = 16;
export const HEADER_SALT_OFFSET = 17;
export const HEADER_NONCE_OFFSET = 33;
export const HEADER_LENGTH = 45;

export const HKDF_INFO = "prince-v2-aes-256-gcm";

export const SCRYPT_LOG_N = 17;
export const SCRYPT_R = 8;
export const SCRYPT_P = 1;
export const SCRYPT_N = 2 ** SCRYPT_LOG_N;
export const SCRYPT_MAX_MEM = 512 * 1024 * 1024;

export const SCRYPT_LOG_N_MIN = 10;
export const SCRYPT_LOG_N_MAX = 21;
export const SCRYPT_R_MAX = 32;

export const ARGON2_MEMORY_KIB = 65536;
export const ARGON2_PASSES = 3;
export const ARGON2_PARALLELISM = 1;
export const ARGON2_MEMORY_KIB_MAX = 262144;
export const ARGON2_PASSES_MAX = 16;

export const KDF_PARALLELISM_MAX = 16;

export const LEGACY_IV_LENGTH = 12;
export const LEGACY_AUTH_TAG_LENGTH = 16;
export const LEGACY_MIN_LENGTH = LEGACY_IV_LENGTH + LEGACY_AUTH_TAG_LENGTH;

export const ENCRYPTED_EXTENSION = ".prince";
export const MIN_PASSPHRASE_LENGTH = 12;

export const DECRYPTION_ERROR_MESSAGE =
    "Decryption failed. Wrong passphrase or key, or the file is corrupted.";

export const RECOVERY_KEY_BYTES = 32;
export const RECOVERY_KEY_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const RECOVERY_KEY_CHECKSUM_BYTES = 2;
export const RECOVERY_KEY_GROUP_SIZE = 4;
export const RECOVERY_KEY_SEPARATOR = "-";

export const CLIPBOARD_CLEAR_MS = 60000;

export const STREAM_CHUNK_SIZE = 1024 * 1024;
export const PROGRESS_MIN_INTERVAL_MS = 120;
export const PROGRESS_MIN_STEP = 0.01;

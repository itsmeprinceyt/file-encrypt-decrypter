# `.prince` file format

Two formats share the `.prince` extension. A reader detects the format from the first bytes of the file.

- **v2 (current)** — two-factor, purely symmetric: a passphrase **and** a Recovery Key are both required.
- **legacy (v1)** — the original single-password format. Read-only: still decrypted, never produced.

## v2 layout

All integers are big-endian. There is no padding and no trailing metadata: the file is exactly
`header || ciphertext || authTag`.

| Offset | Size | Field | Notes |
| --- | --- | --- | --- |
| 0 | 6 | `magic` | ASCII `PRINCE` |
| 6 | 1 | `version` | `0x02` |
| 7 | 1 | `kdfId` | `1` = scrypt, `2` = Argon2id |
| 8 | 4 | `kdfCost1` | scrypt: `log2(N)`; Argon2id: memory in KiB |
| 12 | 4 | `kdfCost2` | scrypt: `r`; Argon2id: iterations `t` |
| 16 | 1 | `kdfParallelism` | scrypt: `p`; Argon2id: `p` |
| 17 | 16 | `salt` | CSPRNG, fresh per file |
| 33 | 12 | `nonce` | CSPRNG, fresh per file, GCM nonce |
| 45 | n | `ciphertext` | AES-256-GCM ciphertext, same length as the plaintext |
| 45 + n | 16 | `authTag` | GCM authentication tag |

`HEADER_LENGTH = 45`. The whole header (`bytes 0..44`) is passed to the cipher as **AAD**, so any
change to the magic, version, KDF id, KDF parameters, salt or nonce is detected by tag verification.
The tag itself is authenticated by GCM in the usual way.

### Key schedule

```
recoveryKeyBytes = 32 random bytes, encoded as text (see below)
salt             = 16 random bytes, stored in the header

passphraseKey = KDF(passphrase, salt,
                    scrypt: N = 2^17, r = 8, p = 1, maxmem = 256 MiB, dkLen = 32
                    argon2id: memory = 64 MiB, t = 3, p = 1, tagLength = 32)
finalKey      = HKDF-SHA256(ikm = passphraseKey || recoveryKeyBytes,
                            salt = salt,
                            info = "prince-v2-aes-256-gcm",
                            length = 32)

aesKey = finalKey, cipher = AES-256-GCM, aad = header, nonce = header nonce
```

The KDF is chosen at encryption time. Node runtimes with a functioning `crypto.argon2` use Argon2id;
otherwise the built-in scrypt is used. Electron builds currently use scrypt because Electron's bundled
Node may expose `crypto.argon2` without a working implementation. The identifier and every cost
parameter are stored in the header, so a file always decrypts with the KDF and cost it was created
with, and parameters can be raised in a later release without breaking old ciphertexts. Header-declared cost is capped at 512 MiB
of scrypt memory (and 256 MiB of Argon2id memory) so a crafted header cannot force an unbounded
allocation while still leaving room to raise the defaults above today's N = 2^17 / 64 MiB.

Both factors are mandatory. `finalKey` is the HKDF output over the concatenation of *both* 32-byte
values, so neither the passphrase alone nor the Recovery Key alone can produce it.

### Recovery Key encoding

- 32 random bytes from `crypto.randomBytes(32)`.
- Crockford base32 (`0123456789ABCDEFGHJKMNPQRSTVWXYZ`), no padding: 52 characters.
- Checksum: first 2 bytes of `SHA-256(payload)` encoded in the same base32: 4 characters.
- Both parts are formatted in groups of 4 separated by `-` (14 groups, 69 characters total), e.g.
  `AB12-CD34-...`. Whitespace and dashes are ignored on input; `I`/`L` read as `1` and `O` as `0`.
- The checksum is validated before any key derivation runs, so a typo is reported immediately instead
  of turning into an indistinguishable decryption failure.
- A saved `.key` file contains exactly that string plus a trailing newline.

### Safety behaviour

- Encryption and decryption stream file contents in bounded chunks in the main process; progress is reported during processing.
- Decryption streams plaintext into a temporary file in the destination directory (mode `0600`) and
  renames it over the destination only after the GCM tag has verified. Any failure removes the
  temporary file, so unauthenticated plaintext is never left on disk and the destination is never
  written on failure.
- Key material (`passphraseKey`, `finalKey`, decoded Recovery Key, legacy SHA-256 key) is zeroed after
  use on a best-effort basis.
- Every decryption failure surfaces the same message: `Decryption failed. Wrong passphrase or key, or
  the file is corrupted.` The failing factor is never identified.

## Legacy layout (v1, read-only)

```
iv (12 bytes) || authTag (16 bytes) || ciphertext
key = SHA-256(password)             // 32 bytes, no salt, no stretching
```

No magic bytes and no header. A file is treated as legacy when it does not start with `PRINCE`
followed by version `0x02`. Legacy decryption is unchanged from the original implementation: the tag
is verified before plaintext reaches the destination, and a successful legacy decryption raises a
non-blocking prompt recommending re-encryption with v2. Original files are never rewritten or deleted.

## Why this design

- **Symmetric only.** AES-256-GCM, SHA-256/HKDF, scrypt or Argon2id. No RSA, ECC, Diffie-Hellman,
  signatures or key wrapping anywhere, so no primitive that a quantum computer can break is part of
  the scheme. Security rests on the 256-bit AES key and the 256-bit Recovery Key.
- **Full 256-bit key strength.** The AES key is the output of HKDF-SHA256, 32 bytes, and its input key
  material contains the full 256-bit Recovery Key. A 128-bit cipher or a truncated key is never used.
- **Two independent factors.** An attacker must defeat both the memory-hard passphrase KDF and the
  Recovery Key. Neither is stored on disk; the salt and nonce are, and they are public.
- **Per-file uniqueness.** A fresh salt and nonce per file mean two encryptions of the same plaintext
  with identical credentials produce unrelated keys and unrelated ciphertext.
- **Authenticated header.** Passing the header as AAD makes the KDF parameters tamper-evident, which
  blocks downgrade games such as rewriting the cost fields to something cheap.

## Algorithm list (v2)

| Purpose | Algorithm | Parameters |
| --- | --- | --- |
| Archive encryption | AES-256-GCM | 12-byte nonce, 16-byte tag, header as AAD |
| Passphrase KDF (preferred) | Argon2id | 64 MiB, t = 3, p = 1, 32-byte output |
| Passphrase KDF (fallback) | scrypt | N = 2^17, r = 8, p = 1, 32-byte output |
| Key combiner | HKDF-SHA256 | per-file salt, info `prince-v2-aes-256-gcm`, 32-byte output |
| Recovery Key | CSPRNG + Crockford base32 + SHA-256 checksum | 256-bit key |
| Randomness | `crypto.randomBytes` (OS CSPRNG) | all salts, nonces and keys |

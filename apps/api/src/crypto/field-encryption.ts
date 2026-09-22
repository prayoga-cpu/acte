import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Field-level encryption for 🔒 columns (docs/02-architecture/DATA_MODEL.md) and
 * per-firm key wrapping (docs/02-architecture/ARCHITECTURE.md "Keys").
 *
 * AES-256-GCM. Wire format for both a wrapped data key and an encrypted field
 * is the same: iv (12 bytes) || authTag (16 bytes) || ciphertext, base64-encoded
 * for text columns or raw for the bytea `data_key_wrapped` column.
 */
const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;

function seal(plaintext: Buffer, key: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]);
}

function open(sealed: Buffer, key: Buffer): Buffer {
  const iv = sealed.subarray(0, IV_LENGTH);
  const authTag = sealed.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = sealed.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** Generates a fresh random 32-byte per-firm data key. */
export function generateDataKey(): Buffer {
  return randomBytes(32);
}

/** Wraps a firm's data key with the master key (env `ENCRYPTION_MASTER_KEY`, hex, 32 bytes). */
export function wrapDataKey(dataKey: Buffer, masterKey: Buffer): Buffer {
  return seal(dataKey, masterKey);
}

/** Unwraps a firm's data key using the master key. */
export function unwrapDataKey(wrapped: Buffer, masterKey: Buffer): Buffer {
  return open(wrapped, masterKey);
}

/** Encrypts a 🔒 field value with the firm's data key. Returns base64 for text storage. */
export function encryptField(plaintext: string, dataKey: Buffer): string {
  return seal(Buffer.from(plaintext, "utf8"), dataKey).toString("base64");
}

/** Decrypts a 🔒 field value with the firm's data key. Throws if the key or ciphertext do not match (GCM auth tag). */
export function decryptField(ciphertextBase64: string, dataKey: Buffer): string {
  return open(Buffer.from(ciphertextBase64, "base64"), dataKey).toString("utf8");
}

export function loadMasterKey(hex: string): Buffer {
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_MASTER_KEY must be 32 bytes (64 hex characters)");
  }
  return key;
}

import { describe, expect, it } from "vitest";
import {
  decryptField,
  encryptField,
  generateDataKey,
  loadMasterKey,
  unwrapDataKey,
  wrapDataKey,
} from "./field-encryption";

describe("field encryption", () => {
  it("round-trips a field value", () => {
    const key = generateDataKey();
    const ciphertext = encryptField("Bône c/ SCI Alma", key);
    expect(ciphertext).not.toContain("Bône");
    expect(decryptField(ciphertext, key)).toBe("Bône c/ SCI Alma");
  });

  it("fails to decrypt with the wrong key (tamper-evident via GCM auth tag)", () => {
    const key = generateDataKey();
    const otherKey = generateDataKey();
    const ciphertext = encryptField("Delcourt c/ Mutuelle Azur", key);
    expect(() => decryptField(ciphertext, otherKey)).toThrow();
  });

  it("produces different ciphertext for the same plaintext each time (random IV)", () => {
    const key = generateDataKey();
    const a = encryptField("Non facturable", key);
    const b = encryptField("Non facturable", key);
    expect(a).not.toBe(b);
  });

  it("wraps and unwraps a per-firm data key with the master key", () => {
    const masterKey = loadMasterKey("00".repeat(32));
    const dataKey = generateDataKey();
    const wrapped = wrapDataKey(dataKey, masterKey);
    expect(unwrapDataKey(wrapped, masterKey)).toEqual(dataKey);
  });

  it("rejects an unwrap with the wrong master key", () => {
    const masterKey = loadMasterKey("00".repeat(32));
    const wrongMasterKey = loadMasterKey("11".repeat(32));
    const dataKey = generateDataKey();
    const wrapped = wrapDataKey(dataKey, masterKey);
    expect(() => unwrapDataKey(wrapped, wrongMasterKey)).toThrow();
  });

  it("loadMasterKey rejects a key that is not exactly 32 bytes", () => {
    expect(() => loadMasterKey("00")).toThrow();
  });
});

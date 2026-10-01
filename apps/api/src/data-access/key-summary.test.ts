import { ActivationKeySummary } from "@acte/contracts";
import { describe, expect, it } from "vitest";
import { toKeySummary } from "./key-summary";

describe("toKeySummary (BUG-6)", () => {
  const row = {
    id: "01a0f243-519c-7e4d-831b-346cb5b997e5",
    memberId: "01a0f240-6847-7977-b8d8-036d9e2185a4",
    prefix: "ACTE-VC-23B3-",
    keyHash: "a".repeat(64),
    createdAt: new Date("2026-09-30T12:00:00.000Z"),
    revokedAt: null,
  };

  it("returns only the contract's fields — never the hash or the member id", () => {
    const summary = toKeySummary(row);
    expect(Object.keys(summary).sort()).toEqual(["createdAt", "id", "prefix", "revokedAt"]);
    expect(JSON.stringify(summary)).not.toContain(row.keyHash);
    expect(ActivationKeySummary.strict().safeParse(summary).success).toBe(true);
  });

  it("serialises a revocation date", () => {
    expect(toKeySummary({ ...row, revokedAt: new Date("2026-10-01T08:00:00.000Z") }).revokedAt).toBe("2026-10-01T08:00:00.000Z");
  });
});

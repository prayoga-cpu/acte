import { describe, expect, it } from "vitest";
import { IngestActivity } from "./ingest";

const valid = {
  clientActivityId: "0190e1a2-7b3c-7d4e-8f90-a1b2c3d4e5f6",
  source: "word", startedAt: "2026-07-08T07:15:00Z", endedAt: "2026-07-08T08:32:00Z",
  durationMin: 77, dossierId: null, confidence: 97, activityKind: "drafting",
};

describe("IngestActivity allowlist", () => {
  it("accepts metadata only", () => {
    expect(IngestActivity.safeParse(valid).success).toBe(true);
  });
  it("rejects a filename", () => {
    expect(IngestActivity.safeParse({ ...valid, filename: "Conclusions_Delcourt_v3.docx" }).success).toBe(false);
  });
  it("rejects an email address", () => {
    expect(IngestActivity.safeParse({ ...valid, correspondent: "contact@sci-alma.fr" }).success).toBe(false);
  });
  it("rejects manual as a captured source", () => {
    expect(IngestActivity.safeParse({ ...valid, source: "manual" }).success).toBe(false);
  });
});

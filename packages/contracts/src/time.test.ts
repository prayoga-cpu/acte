import { describe, expect, it } from "vitest";
import { parisDateKey, parisDateTimeToIso } from "./time";

describe("parisDateTimeToIso", () => {
  it("converts a summer (CEST, UTC+2) time", () => {
    expect(parisDateTimeToIso("2026-09-30", "09:15")).toBe("2026-09-30T07:15:00.000Z");
  });

  it("converts a winter (CET, UTC+1) time", () => {
    expect(parisDateTimeToIso("2026-12-15", "09:15")).toBe("2026-12-15T08:15:00.000Z");
  });

  it("keeps late-evening entries on the same Paris day (BUG-1)", () => {
    for (const [day, time] of [
      ["2026-09-30", "22:00"],
      ["2026-09-30", "23:30"],
      ["2026-12-15", "23:30"],
    ] as const) {
      const iso = parisDateTimeToIso(day, time);
      expect(parisDateKey(new Date(iso))).toBe(day);
    }
    expect(parisDateTimeToIso("2026-09-30", "23:30")).toBe("2026-09-30T21:30:00.000Z");
    expect(parisDateTimeToIso("2026-12-15", "23:30")).toBe("2026-12-15T22:30:00.000Z");
  });

  it("handles midnight and the days the clocks change", () => {
    expect(parisDateTimeToIso("2026-09-30", "00:00")).toBe("2026-09-29T22:00:00.000Z");
    // 25 Oct 2026: clocks go back at 03:00 Paris. 01:30 is still CEST, 04:00 is CET.
    expect(parisDateTimeToIso("2026-10-25", "01:30")).toBe("2026-10-24T23:30:00.000Z");
    expect(parisDateTimeToIso("2026-10-25", "04:00")).toBe("2026-10-25T03:00:00.000Z");
    // 29 Mar 2026: clocks go forward at 02:00 Paris.
    expect(parisDateTimeToIso("2026-03-29", "12:00")).toBe("2026-03-29T10:00:00.000Z");
  });

  it("rejects malformed input", () => {
    expect(() => parisDateTimeToIso("2026-9-30", "09:15")).toThrow();
    expect(() => parisDateTimeToIso("2026-09-30", "25:00")).toThrow();
  });
});

describe("parisDateKey", () => {
  it("buckets by the Paris calendar day, not the UTC one", () => {
    expect(parisDateKey(new Date("2026-09-30T22:30:00.000Z"))).toBe("2026-10-01");
    expect(parisDateKey(new Date("2026-09-30T21:30:00.000Z"))).toBe("2026-09-30");
  });
});

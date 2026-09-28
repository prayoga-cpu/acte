import { describe, expect, it } from "vitest";
import { ChatRequest, LlmChatContext } from "./llm";

const d = (h: number, min: number) => ({ h, min });

const valid = {
  todayDate: "2026-09-28",
  today: { captured: d(6, 20), validated: d(3, 10), pending: d(3, 10) },
  thisWeekValidated: {
    total: d(3, 10),
    days: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => ({ day, validated: d(0, 0) })),
  },
  month: { securedRevenueEur: 887, hourlyRateEur: 280 },
  journal: { pendingCount: 3, pendingTotal: d(3, 10), lowConfidenceCount: 1 },
  dossiers: [
    { ref: "D1", status: "progress", billable: true, validated: d(20, 33), pending: d(1, 17), budget: d(35, 0), budgetLeft: d(14, 27), budgetUsedPct: 59 },
  ],
};

describe("LlmChatContext allowlist (D-015)", () => {
  it("accepts aggregates and opaque dossier refs", () => {
    expect(LlmChatContext.safeParse(valid).success).toBe(true);
  });
  it("rejects a dossier name", () => {
    const withName = { ...valid, dossiers: [{ ...valid.dossiers[0], name: "Delcourt c/ Mutuelle Azur" }] };
    expect(LlmChatContext.safeParse(withName).success).toBe(false);
  });
  it("rejects a dossier ref that is not an opaque token", () => {
    const leaky = { ...valid, dossiers: [{ ...valid.dossiers[0], ref: "Delcourt" }] };
    expect(LlmChatContext.safeParse(leaky).success).toBe(false);
  });
  it("rejects an extra top-level field", () => {
    expect(LlmChatContext.safeParse({ ...valid, taskTitles: ["Rédaction de conclusions"] }).success).toBe(false);
  });
});

describe("ChatRequest", () => {
  it("rejects an empty message", () => {
    expect(ChatRequest.safeParse({ message: "   " }).success).toBe(false);
  });
  it("defaults history to empty", () => {
    expect(ChatRequest.parse({ message: "Résumé de ma journée" }).history).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { OnboardingState } from "./onboarding";

const valid = {
  completedAt: null,
  checklist: { hourlyRateSet: false, hasDossier: true, hasTask: true, hasValidatedTask: false, hasInvitedMember: false },
};

describe("OnboardingState (D-021)", () => {
  it("accepts a member who has not seen the welcome yet", () => {
    expect(OnboardingState.safeParse(valid).success).toBe(true);
  });
  it("accepts a completion timestamp", () => {
    expect(OnboardingState.safeParse({ ...valid, completedAt: "2026-10-01T08:30:00.000Z" }).success).toBe(true);
  });
  it("rejects a missing checklist item", () => {
    const { hasTask: _hasTask, ...rest } = valid.checklist;
    expect(OnboardingState.safeParse({ ...valid, checklist: rest }).success).toBe(false);
  });
  it("rejects anything but booleans in the checklist — it must never carry a name", () => {
    const leaky = { ...valid, checklist: { ...valid.checklist, hasDossier: "Delcourt c/ Mutuelle Azur" } };
    expect(OnboardingState.safeParse(leaky).success).toBe(false);
  });
  it("rejects an extra field at either level", () => {
    expect(OnboardingState.safeParse({ ...valid, firstDossierName: "Delcourt" }).success).toBe(false);
    expect(OnboardingState.safeParse({ ...valid, checklist: { ...valid.checklist, lastTaskTitle: "Conclusions" } }).success).toBe(false);
  });
});

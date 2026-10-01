import { describe, expect, it, vi } from "vitest";
import { NotFoundException } from "@nestjs/common";
import type { FirmContext } from "../data-access/firm-context.js";
import type { OnboardingRepository } from "../data-access/onboarding.repository.js";
import { OnboardingService } from "./onboarding.service.js";

// OnboardingService only needs this as an injection token; the real module opens a DB connection on import.
vi.mock("../data-access/onboarding.repository.js", () => ({ OnboardingRepository: class {} }));

const admin: FirmContext = { firmId: "firm-1", memberId: "member-1", isAdmin: true };
const lawyer: FirmContext = { firmId: "firm-1", memberId: "member-2", isAdmin: false };

/** An in-memory stand-in for the repository: one member row plus the facts the checklist asks about. */
function fakeRepo(initial: Partial<{ onboardedAt: Date | null; hourlyRateCents: number; hasDossier: boolean; hasTask: boolean; hasValidatedTask: boolean; hasTeam: boolean }> = {}) {
  const row = { onboardedAt: initial.onboardedAt ?? null, hourlyRateCents: initial.hourlyRateCents ?? 0 };
  const repo = {
    findOwn: vi.fn(async () => ({ ...row })),
    markOnboarded: vi.fn(async () => {
      if (!row.onboardedAt) row.onboardedAt = new Date("2026-10-01T08:30:00.000Z");
    }),
    hasDossier: vi.fn(async () => initial.hasDossier ?? false),
    ownTaskFlags: vi.fn(async () => ({ hasTask: initial.hasTask ?? false, hasValidatedTask: initial.hasValidatedTask ?? false })),
    hasOtherMemberOrInvitation: vi.fn(async () => initial.hasTeam ?? false),
  };
  return { repo, service: new OnboardingService(repo as unknown as OnboardingRepository) };
}

describe("OnboardingService (D-021)", () => {
  it("a brand-new founder has not seen the welcome and has nothing ticked", async () => {
    const { service } = fakeRepo();
    expect(await service.state(admin)).toEqual({
      completedAt: null,
      checklist: { hourlyRateSet: false, hasDossier: false, hasTask: false, hasValidatedTask: false, hasInvitedMember: false },
    });
  });

  it("ticks each item from the member's real data", async () => {
    const { service } = fakeRepo({ hourlyRateCents: 280_00, hasDossier: true, hasTask: true, hasValidatedTask: true, hasTeam: true });
    expect((await service.state(admin)).checklist).toEqual({
      hourlyRateSet: true,
      hasDossier: true,
      hasTask: true,
      hasValidatedTask: true,
      hasInvitedMember: true,
    });
  });

  it("does not look at the team for a non-admin, and reports the item as not done", async () => {
    const { repo, service } = fakeRepo({ hasTeam: true });
    expect((await service.state(lawyer)).checklist.hasInvitedMember).toBe(false);
    expect(repo.hasOtherMemberOrInvitation).not.toHaveBeenCalled();
  });

  it("completing stamps the date once: a second call keeps the first date", async () => {
    const { repo, service } = fakeRepo();
    const first = await service.complete(admin);
    expect(first.completedAt).toBe("2026-10-01T08:30:00.000Z");
    const second = await service.complete(admin);
    expect(second.completedAt).toBe(first.completedAt);
    expect(repo.markOnboarded).toHaveBeenCalledTimes(2);
  });

  it("every read is scoped to the caller's own firm and member", async () => {
    const { repo, service } = fakeRepo();
    await service.complete(lawyer);
    for (const call of [repo.findOwn, repo.markOnboarded, repo.hasDossier, repo.ownTaskFlags]) {
      for (const args of call.mock.calls as unknown as [FirmContext][]) expect(args[0]).toBe(lawyer);
    }
  });

  it("answers 404 when the member row is gone", async () => {
    const { repo, service } = fakeRepo();
    repo.findOwn.mockResolvedValueOnce(null as never);
    await expect(service.state(admin)).rejects.toBeInstanceOf(NotFoundException);
  });
});

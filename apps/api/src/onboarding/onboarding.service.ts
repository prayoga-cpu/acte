import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { OnboardingState } from "@acte/contracts";
import type { FirmContext } from "../data-access/firm-context.js";
import { OnboardingRepository } from "../data-access/onboarding.repository.js";

/**
 * First-run welcome state and the "Premiers pas" checklist (D-021). The
 * checklist is recomputed from the member's real rows on every read, so it
 * can't drift from what they actually did and needs no storage of its own.
 */
@Injectable()
export class OnboardingService {
  constructor(@Inject(OnboardingRepository) private readonly onboarding: OnboardingRepository) {}

  async state(ctx: FirmContext): Promise<OnboardingState> {
    const member = await this.onboarding.findOwn(ctx);
    if (!member) throw new NotFoundException();

    const [hasDossier, taskFlags, hasInvitedMember] = await Promise.all([
      this.onboarding.hasDossier(ctx),
      this.onboarding.ownTaskFlags(ctx),
      // Who is in the team is admin information (D-014): not looked up for anyone else.
      ctx.isAdmin ? this.onboarding.hasOtherMemberOrInvitation(ctx) : false,
    ]);

    // Parsed on the way out: the schema is strict, so a field added here by mistake fails instead of shipping.
    return OnboardingState.parse({
      completedAt: member.onboardedAt ? member.onboardedAt.toISOString() : null,
      checklist: { hourlyRateSet: member.hourlyRateCents > 0, hasDossier, ...taskFlags, hasInvitedMember },
    });
  }

  async complete(ctx: FirmContext): Promise<OnboardingState> {
    await this.onboarding.markOnboarded(ctx);
    return this.state(ctx);
  }
}

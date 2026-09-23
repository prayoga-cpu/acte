import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { HomeSummary, Member, SourceSettings, StatsSummary, WeekSummary } from "@acte/contracts";
import { MembersRepository } from "../data-access/members.repository.js";
import { TasksRepository } from "../data-access/tasks.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { parisDateKey, parisMonthKey, startOfParisWeek } from "../lib/time.js";

/**
 * Placeholder heuristic for "minutes recovered vs manual entry" (PRODUCT_SPEC.md
 * Home ROI widget). No methodology has been agreed with the client — flagged in
 * STATUS.md. Each automatically captured task (non-manual) is assumed to save
 * this many minutes of manual time-entry overhead.
 */
const MANUAL_ENTRY_OVERHEAD_MIN = 3;

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

@Injectable()
export class MeService {
  constructor(
    @Inject(TasksRepository) private readonly tasks: TasksRepository,
    @Inject(MembersRepository) private readonly members: MembersRepository,
  ) {}

  async profile(ctx: FirmContext): Promise<Member> {
    const member = await this.members.findById(ctx.firmId, ctx.memberId);
    if (!member) throw new NotFoundException();
    return {
      id: member.id,
      firmId: member.firmId,
      email: member.email,
      displayName: member.displayName,
      initials: member.initials,
      role: member.role,
      isPartner: member.isPartner,
      isAdmin: member.isAdmin,
      hourlyRateCents: member.hourlyRateCents,
      status: member.status,
    };
  }

  async summary(ctx: FirmContext): Promise<HomeSummary> {
    const member = await this.members.findById(ctx.firmId, ctx.memberId);
    if (!member) throw new NotFoundException();

    const all = await this.tasks.listForMember(ctx);
    const now = new Date();
    const todayKey = parisDateKey(now);
    const monthKey = parisMonthKey(now);

    const todays = all.filter((t) => parisDateKey(new Date(t.startedAt)) === todayKey);
    const capturedTodayMin = todays.reduce((s, t) => s + t.durationMin, 0);
    const validatedTodayMin = todays.filter((t) => t.status === "validated").reduce((s, t) => s + t.durationMin, 0);
    const pendingTodayMin = todays.filter((t) => t.status === "pending").reduce((s, t) => s + t.durationMin, 0);

    const securedRevenueMonthCents = all
      .filter((t) => t.status === "validated" && parisMonthKey(new Date(t.startedAt)) === monthKey)
      .reduce((s, t) => s + Math.round((t.durationMin / 60) * member.hourlyRateCents), 0);

    const roiMinutesToday = todays.filter((t) => t.source !== "manual").length * MANUAL_ENTRY_OVERHEAD_MIN;

    return {
      capturedTodayMin,
      validatedTodayMin,
      pendingTodayMin,
      securedRevenueMonthCents,
      averageRateCents: member.hourlyRateCents,
      roiMinutesToday,
    };
  }

  async week(ctx: FirmContext): Promise<WeekSummary> {
    const all = await this.tasks.listForMember(ctx);
    const monday = startOfParisWeek(new Date());

    const days = WEEKDAY_LABELS.map((label, i) => {
      const day = new Date(monday);
      day.setUTCDate(day.getUTCDate() + i);
      const dayKey = parisDateKey(day);
      const minutes = all
        .filter((t) => t.status === "validated" && parisDateKey(new Date(t.startedAt)) === dayKey)
        .reduce((s, t) => s + t.durationMin, 0);
      return { label, minutes };
    });

    return { days, totalMin: days.reduce((s, d) => s + d.minutes, 0) };
  }

  async stats(ctx: FirmContext): Promise<StatsSummary> {
    const member = await this.members.findById(ctx.firmId, ctx.memberId);
    if (!member) throw new NotFoundException();

    const all = await this.tasks.listForMember(ctx);
    const validated = all.filter((t) => t.status === "validated");

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
      const key = parisMonthKey(d);
      const label = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "Europe/Paris" }).format(d);
      const revenueCents = validated
        .filter((t) => parisMonthKey(new Date(t.startedAt)) === key)
        .reduce((s, t) => s + Math.round((t.durationMin / 60) * member.hourlyRateCents), 0);
      return { label, revenueCents };
    });

    const bySource = new Map<string, number>();
    for (const t of validated) {
      bySource.set(t.source, (bySource.get(t.source) ?? 0) + t.durationMin);
    }

    return {
      months,
      sourceBreakdown: [...bySource.entries()].map(([source, minutes]) => ({
        source: source as StatsSummary["sourceBreakdown"][number]["source"],
        minutes,
      })),
    };
  }

  async sources(ctx: FirmContext): Promise<SourceSettings> {
    const member = await this.members.findById(ctx.firmId, ctx.memberId);
    if (!member) throw new NotFoundException();
    return member.sourceSettings as SourceSettings;
  }

  async updateSources(ctx: FirmContext, settings: SourceSettings): Promise<SourceSettings> {
    const updated = await this.members.updateSourceSettings(ctx.memberId, settings);
    if (!updated) throw new NotFoundException();
    return updated.sourceSettings as SourceSettings;
  }
}

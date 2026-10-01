import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { HomeSummary, MemberProfile, SourceSettings, StatsSummary, UpdatePreferencesBody, WeekSummary } from "@acte/contracts";
import { DossiersRepository } from "../data-access/dossiers.repository.js";
import { FirmsRepository } from "../data-access/firms.repository.js";
import { MembersRepository } from "../data-access/members.repository.js";
import { TasksRepository, type TaskRecord } from "../data-access/tasks.repository.js";
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

/** "Sauvées de l'oubli" (prototype Profile view): tasks shorter than this are the ones nobody logs by hand. */
const SHORT_TASK_MIN = 10;

/** A validated task is worth its own stamped rate; one validated before rates were stamped falls back to the member's current rate. */
const revenueCents = (t: TaskRecord, fallbackRateCents: number) => Math.round((t.durationMin / 60) * (t.rateCents ?? fallbackRateCents));

@Injectable()
export class MeService {
  constructor(
    @Inject(TasksRepository) private readonly tasks: TasksRepository,
    @Inject(MembersRepository) private readonly members: MembersRepository,
    @Inject(FirmsRepository) private readonly firms: FirmsRepository,
    @Inject(DossiersRepository) private readonly dossiers: DossiersRepository,
  ) {}

  async profile(ctx: FirmContext): Promise<MemberProfile> {
    const [member, firmName] = await Promise.all([this.members.findById(ctx.firmId, ctx.memberId), this.firms.findNameById(ctx.firmId)]);
    if (!member) throw new NotFoundException();
    return {
      firmName: firmName ?? "",
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
      theme: member.theme,
      alertEmails: member.alertEmails,
    };
  }

  async updatePreferences(ctx: FirmContext, body: UpdatePreferencesBody): Promise<MemberProfile> {
    const updated = await this.members.updatePreferences(ctx, body);
    if (!updated) throw new NotFoundException();
    return this.profile(ctx);
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
      .reduce((s, t) => s + revenueCents(t, member.hourlyRateCents), 0);

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

    const [all, dossierList] = await Promise.all([this.tasks.listForMember(ctx), this.dossiers.list(ctx)]);
    const validated = all.filter((t) => t.status === "validated");
    const dossierById = new Map(dossierList.map((d) => [d.id, d]));

    const now = new Date();
    const monthKey = parisMonthKey(now);
    const [year, month] = monthKey.split("-").map(Number) as [number, number];
    const months = Array.from({ length: 6 }, (_, i) => {
      // Mid-month, so the Paris month is the same as the UTC one whatever the offset.
      const d = new Date(Date.UTC(year, month - 1 - (5 - i), 15));
      const key = parisMonthKey(d);
      const label = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "Europe/Paris" }).format(d);
      const revenue = validated.filter((t) => parisMonthKey(new Date(t.startedAt)) === key).reduce((s, t) => s + revenueCents(t, member.hourlyRateCents), 0);
      return { label, revenueCents: revenue };
    });

    const thisMonth = all.filter((t) => parisMonthKey(new Date(t.startedAt)) === monthKey);
    const validatedThisMonth = thisMonth.filter((t) => t.status === "validated");

    const bySource = new Map<string, number>();
    for (const t of validatedThisMonth) {
      bySource.set(t.source, (bySource.get(t.source) ?? 0) + t.durationMin);
    }

    const capturedMonthMin = thisMonth.reduce((s, t) => s + t.durationMin, 0);
    // Unassigned time isn't billable to anyone yet; neither is time on a non-billable dossier.
    const billableMin = thisMonth.filter((t) => t.dossierId && dossierById.get(t.dossierId)?.isBillable).reduce((s, t) => s + t.durationMin, 0);

    const byDay = new Map<string, number>();
    const byDossier = new Map<string, number>();
    for (const t of thisMonth) {
      const day = parisDateKey(new Date(t.startedAt));
      byDay.set(day, (byDay.get(day) ?? 0) + t.durationMin);
      if (t.dossierId) byDossier.set(t.dossierId, (byDossier.get(t.dossierId) ?? 0) + t.durationMin);
    }
    const bestDay = [...byDay.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    const topDossier = [...byDossier.entries()].sort((a, b) => b[1] - a[1])[0];
    const topDossierName = topDossier ? dossierById.get(topDossier[0])?.name : undefined;

    return {
      months,
      sourceBreakdown: [...bySource.entries()].map(([source, minutes]) => ({
        source: source as StatsSummary["sourceBreakdown"][number]["source"],
        minutes,
      })),
      capturedMonthMin,
      billableMonthPct: capturedMonthMin > 0 ? Math.round((billableMin / capturedMonthMin) * 100) : 0,
      highlights: {
        bestDay: bestDay ? { date: bestDay[0], minutes: bestDay[1] } : null,
        topDossier: topDossier && topDossierName ? { name: topDossierName, pct: Math.round((topDossier[1] / capturedMonthMin) * 100) } : null,
        shortTasksCount: thisMonth.filter((t) => t.durationMin < SHORT_TASK_MIN).length,
      },
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

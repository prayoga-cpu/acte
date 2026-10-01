"use client";

import type { Member, StatsSummary } from "@acte/contracts";
import { useI18n } from "@/i18n/locale-context";
import { fmtEurFromCents, fmtMin } from "@/lib/format";
import { dateKeyToDate } from "@/lib/time";
import { ROLE_LABEL } from "@/lib/role-label";
import { ActivationKeys } from "@/components/profile/activation-keys";

export function ProfileView({ member, stats }: { member: Member; stats: StatsSummary }) {
  const { t, locale } = useI18n();
  const { bestDay, topDossier, shortTasksCount } = stats.highlights;
  const dayLabel = (dateKey: string) =>
    new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" }).format(
      dateKeyToDate(dateKey),
    );
  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="mb-4">
        <p className="eyebrow">{t.profile.title}</p>
        <h2 className="mt-1 font-display text-[16px] font-extrabold uppercase tracking-[0.05em] text-ivory">{member.displayName}</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <section className="glass fade-up p-5" data-tour="profile-card">
          <div className="flex items-center gap-3.5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-pale to-gold-deep font-display text-[22px] font-semibold text-noir">
              {member.initials}
            </span>
            <div className="min-w-0">
              <p className="font-display text-[19px] font-semibold leading-tight text-ivory">{member.displayName}</p>
              <p className="mt-0.5 text-[12px] text-ash">{ROLE_LABEL[member.role]}</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 border-t border-white/[0.06] pt-4 text-[12.5px]">
            <div className="flex items-center justify-between">
              <span className="text-ash">{t.profile.hourlyRate}</span>
              <span className="font-mono text-gold-pale">{fmtEurFromCents(member.hourlyRateCents)} / h</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="shrink-0 text-ash">{t.profile.contact}</span>
              <span className="truncate font-mono text-[11px] text-ivory/80">{member.email}</span>
            </div>
          </div>
        </section>

        <section className="glass fade-up relative overflow-hidden border-gold/[0.22] p-5 md:col-span-2" data-tour="profile-report">
          <span
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full"
            style={{ background: "radial-gradient(circle, rgb(var(--c-accent) / 0.08), transparent 70%)" }}
          />
          <p className="eyebrow !text-gold-pale/80">{t.profile.personalReportTitle}</p>
          <p className="mt-3 max-w-[520px] font-display text-[19px] font-medium leading-snug text-ivory">{t.profile.personalReportBody}</p>
        </section>

        {/* Prototype "Vos temps forts du mois", from the member's own tasks this month. */}
        <section className="glass fade-up p-5 md:col-span-3" style={{ animationDelay: "0.12s" }} data-tour="profile-highlights">
          <p className="eyebrow">{t.profile.highlightsTitle}</p>
          <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="glass-soft rounded-xl px-4 py-3">
              <p className="text-[11px] text-ash">{t.profile.bestDay}</p>
              <p className="mt-1 text-[13px] text-ivory/95">
                {bestDay ? (
                  <>
                    <span className="capitalize">{dayLabel(bestDay.date)}</span> · <span className="font-mono text-gold-pale">{fmtMin(bestDay.minutes)}</span>
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>
            <div className="glass-soft rounded-xl px-4 py-3">
              <p className="text-[11px] text-ash">{t.profile.topDossier}</p>
              <p className="mt-1 truncate text-[13px] text-ivory/95">
                {topDossier ? (
                  <>
                    {topDossier.name} · <span className="font-mono text-gold-pale">{topDossier.pct} %</span> {t.profile.ofTime}
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>
            <div className="glass-soft rounded-xl px-4 py-3">
              <p className="text-[11px] text-ash">{t.profile.savedFromOblivion}</p>
              <p className="mt-1 text-[13px] text-ivory/95">
                <span className="font-mono text-gold-pale">{shortTasksCount}</span> {t.profile.shortTasks}
              </p>
            </div>
          </div>
        </section>

        <ActivationKeys />
      </div>
    </div>
  );
}

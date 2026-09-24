"use client";

import { useState } from "react";
import type { MemberRole, TeamMemberSummary } from "@acte/contracts";
import { fmtEurFromCents, fmtMin } from "@/lib/format";
import { useI18n } from "@/i18n/locale-context";
import { isRecentReminder } from "@/lib/reminders";
import { MemberMenu } from "@/components/admin/member-menu";
import { InviteMemberModal } from "@/components/admin/invite-member-modal";
import { EditMemberModal } from "@/components/admin/edit-member-modal";
import { SubscriptionTab } from "@/components/admin/subscription-tab";

type AdminTab = "team" | "subscription";

export function AdminView({
  team,
  firmName,
  onInvite,
  onResendInvitation,
  onCancelInvitation,
  onUpdateMember,
  onRemind,
  onSuspend,
  onReactivate,
  onToast,
  complianceClaimsEnabled,
}: {
  team: TeamMemberSummary[];
  firmName: string;
  complianceClaimsEnabled: boolean;
  onInvite: (email: string, role: MemberRole) => Promise<void>;
  onResendInvitation: (memberId: string) => Promise<void>;
  onCancelInvitation: (memberId: string) => Promise<void>;
  onUpdateMember: (memberId: string, patch: { role?: MemberRole; hourlyRateCents?: number }) => Promise<void>;
  onRemind: (memberId: string) => Promise<void>;
  onSuspend: (memberId: string) => Promise<void>;
  onReactivate: (memberId: string) => Promise<void>;
  onToast: (msg: string) => void;
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState<AdminTab>("team");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamMemberSummary | null>(null);

  const real = team.filter((m) => m.status !== "invited");
  const totalMin = real.reduce((s, m) => s + m.capturedMin, 0);
  const totalCa = real.reduce((s, m) => s + (m.capturedMin / 60) * (m.hourlyRateCents / 100), 0);
  const actives = real.filter((m) => m.status !== "suspended").length;
  const suspendedCount = real.length - actives;

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t.admin.title}</p>
          <h2 className="mt-1 font-display text-[16px] font-extrabold uppercase tracking-[0.05em] text-ivory">{firmName || t.admin.heading}</h2>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-3.5 py-1.5 text-[11.5px] font-medium text-emerald-300">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          {t.admin.encryptionBadge}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <section className="glass fade-up p-5">
          <p className="eyebrow">{t.admin.volumeLabel}</p>
          <p className="mt-2 font-display text-[23px] font-bold leading-none tracking-tight text-ivory">{fmtMin(totalMin)}</p>
          <p className="mt-[24px] text-[12px] text-ash">{t.admin.volumeSub}</p>
        </section>
        <section className="glass fade-up p-5" style={{ animationDelay: "0.06s" }}>
          <p className="eyebrow">{t.admin.revenueLabel}</p>
          <p className="mt-2 font-display text-[23px] font-bold leading-none tracking-tight text-gold-grad">{fmtEurFromCents(Math.round(totalCa * 100))}</p>
          <p className="mt-[24px] text-[12px] text-ash">{t.admin.revenueSub}</p>
        </section>
        <section className="glass fade-up p-5" style={{ animationDelay: "0.12s" }}>
          <p className="eyebrow">{t.admin.activeMembersLabel}</p>
          <p className="mt-2 font-display text-[23px] font-bold leading-none tracking-tight text-ivory">
            {actives} <span className="text-[20px] text-ash">/ {real.length}</span>
          </p>
          <p className="mt-[24px] text-[12px] text-ash">{suspendedCount > 0 ? t.admin.suspendedCount(suspendedCount) : t.admin.captureRunning}</p>
        </section>

        {/* relative z-10: this card's fade-up transform makes its own stacking context, so the last row's member menu would otherwise render under the encryption card below. */}
        <section className="glass fade-up relative z-10 md:col-span-3" style={{ animationDelay: "0.18s" }}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3">
            <div className="flex items-center gap-1.5" role="tablist" aria-label={t.admin.sectionsAria}>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "team"}
                onClick={() => setTab("team")}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] transition ${tab === "team" ? "bg-gold/10 text-gold-pale" : "text-ash hover:text-ivory"}`}
              >
                {t.admin.tabTeam}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "subscription"}
                onClick={() => setTab("subscription")}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] transition ${tab === "subscription" ? "bg-gold/10 text-gold-pale" : "text-ash hover:text-ivory"}`}
              >
                {t.admin.tabSubscription}
              </button>
            </div>
            {tab === "team" ? (
              <div className="flex items-center gap-3">
                <p className="font-mono text-[11px] text-ash">{t.admin.memberCount(team.length)}</p>
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="cursor-pointer rounded-full bg-gradient-to-r from-gold to-gold-deep px-3.5 py-1.5 text-[12px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
                >
                  + {t.admin.inviteMember}
                </button>
              </div>
            ) : (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] px-3 py-1 text-[11px] font-medium text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                {t.admin.subscription.subscriptionActive}
              </span>
            )}
          </div>

          {tab === "team" ? (
            <div>
              {team.map((m, i) => {
                const pending = m.status === "invited";
                const suspended = m.status === "suspended";
                return (
                  <div key={m.id}>
                    {i > 0 && <div className="border-t border-white/[0.05]" />}
                    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 ${suspended ? "opacity-50" : ""}`}>
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[13px] font-semibold ${
                          m.isPartner ? "bg-gradient-to-br from-gold-pale to-gold-deep text-noir" : "border border-white/[0.12] bg-white/[0.05] text-ivory/85"
                        }`}
                      >
                        {m.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-ivory/95">{m.displayName}</p>
                        <p className="mt-0.5 truncate text-[11.5px] text-ash">
                          {t.admin.roles[m.role]}
                          {pending && ` · ${t.admin.pendingSuffix}`}
                          {!pending && isRecentReminder(m.remindedAt) && (
                            <>
                              {" · "}
                              <span className="text-emerald-300">{t.admin.remindedSuffix}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="hidden w-16 shrink-0 text-right md:block">
                        <p className="font-mono text-[13px] text-ivory">{Math.round(m.hourlyRateCents / 100)} €</p>
                        <p className="text-[10px] text-ash">{t.admin.rateLabel}</p>
                      </div>
                      <div className="w-24 shrink-0 text-right">
                        <p className="font-mono text-[13px] text-ivory">{pending ? "—" : fmtMin(m.capturedMin)}</p>
                        <p className="text-[10px] text-ash">{t.admin.capturedLabel}</p>
                      </div>
                      <div className="hidden w-16 shrink-0 text-right sm:block">
                        <p className="font-mono text-[13px] text-gold-pale">{pending ? "—" : `${m.validationRate} %`}</p>
                        <p className="text-[10px] text-ash">{t.admin.validatedLabel}</p>
                      </div>
                      {pending && m.invitationExpired ? (
                        <span className="flex w-28 shrink-0 items-center justify-end gap-1.5 text-[11.5px] text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                          {t.admin.invitationExpired}
                        </span>
                      ) : pending ? (
                        <span className="flex w-28 shrink-0 items-center justify-end gap-1.5 text-[11.5px] text-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          {t.admin.statusInvited}
                        </span>
                      ) : suspended ? (
                        <span className="flex w-28 shrink-0 items-center justify-end gap-1.5 text-[11.5px] text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                          {t.admin.statusSuspended}
                        </span>
                      ) : m.status === "in_court" ? (
                        <span className="flex w-28 shrink-0 items-center justify-end gap-1.5 text-[11.5px] text-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          {t.admin.statusInCourt}
                        </span>
                      ) : (
                        <span className="flex w-28 shrink-0 items-center justify-end gap-1.5 text-[11.5px] text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" />
                          {t.admin.statusActive}
                        </span>
                      )}
                      <MemberMenu
                        member={m}
                        onEdit={() => setEditTarget(m)}
                        onRemind={() => onRemind(m.id)}
                        onSuspend={() => onSuspend(m.id)}
                        onReactivate={() => onReactivate(m.id)}
                        onResendInvitation={() => onResendInvitation(m.id)}
                        onCancelInvitation={() => onCancelInvitation(m.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <SubscriptionTab team={team} firmName={firmName} onToast={onToast} onAddSeat={() => setInviteOpen(true)} />
          )}
        </section>

        <section className="glass fade-up flex items-start gap-3.5 p-5 md:col-span-3" style={{ animationDelay: "0.24s" }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <div>
            <p className="text-[13px] font-medium text-ivory/95">{t.admin.encryptionTitle}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ash">
              {t.admin.encryptionBody}
              {/* CLAUDE.md §1: this prototype sentence (line ~1763) renders only behind COMPLIANCE_CLAIMS_ENABLED — not true today (B3, D-008). */}
              {complianceClaimsEnabled && <> {t.admin.isoClaim}</>}
            </p>
          </div>
        </section>
      </div>

      {inviteOpen && <InviteMemberModal onClose={() => setInviteOpen(false)} onInvite={onInvite} />}
      {editTarget && (
        <EditMemberModal
          member={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(patch) => onUpdateMember(editTarget.id, patch)}
        />
      )}
    </div>
  );
}

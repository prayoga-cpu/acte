"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ActivityEntry,
  BrainInsight,
  ChatReply,
  ChatTurn,
  ClientInvoiceSummary,
  DossierUsage,
  HomeSummary,
  StatsSummary,
  Task,
  TeamMemberSummary,
} from "@acte/contracts";
import { api, ApiError } from "@/lib/api-client";
import { fmtEurFromCents, fmtMin } from "@/lib/format";
import { useI18n, type Dictionary } from "@/i18n/locale-context";
import { isRecentReminder } from "@/lib/reminders";

type PanelView = "home" | "journal" | "dossiers" | "stats" | "billing" | "profile" | "cloud" | "settings" | "admin";

interface ChatMessage {
  id: string;
  who: "user" | "ai";
  text: string;
  /** An AI bubble still showing the typing dots; its text is filled in place (prototype sendChat). */
  pending?: boolean;
  /** For an LLM reply: the same reply with refs instead of names, which is what goes back as history (D-015). */
  history?: string;
}

/**
 * Deterministic, templated replies from real data (PROTOTYPE_MAP.md
 * "botReply"). The fallback whenever the API's LLM chat (D-015) is disabled
 * or fails.
 *
 * The three data-templated sentences below have no dictionary entry (they're
 * composed from live numbers, not static copy) and stay French-only, same as
 * the keyword matching against the question itself; only `fallback` (the
 * catch-all reply) comes from the locale dictionary.
 */
function botReply(question: string, summary: HomeSummary, dossiers: DossierUsage[], fallback: string): string {
  const q = question.toLowerCase();
  // Whole words only: "ca" must not match "cause", and a dossier's first word must not match inside another word.
  const words = new Set(q.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
  if (q.includes("résumé") || q.includes("resume") || q.includes("journée")) {
    return `Aujourd'hui : ${fmtMin(summary.capturedTodayMin)} capturées, dont ${fmtMin(summary.validatedTodayMin)} validées et ${fmtMin(summary.pendingTodayMin)} en attente.`;
  }
  const named = dossiers.find((d) => {
    const first = d.name.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean)[0] ?? "";
    return first.length >= 3 && words.has(first);
  });
  if (named) {
    return `Dossier ${named.name} : ${fmtMin(named.monthMinutes)} validées ce mois-ci, ${fmtMin(named.pendingMinutes)} en attente de validation.`;
  }
  if (q.includes("factur") || q.includes("honoraire") || words.has("ca")) {
    return `CA sécurisé ce mois-ci : ${fmtEurFromCents(summary.securedRevenueMonthCents)}.`;
  }
  return fallback;
}

/**
 * Prototype `updateInsight`: the "Analyse IA" card says something about the
 * view that is open. Every sentence is templated from numbers already on
 * screen — nothing is invented and nothing leaves the browser.
 */
function viewInsight(
  t: Dictionary,
  view: PanelView,
  data: {
    pending: Task[];
    hourlyRateCents: number;
    dossiers: DossierUsage[];
    invoices: ClientInvoiceSummary[];
    stats: StatsSummary;
  },
): string {
  const { pending, hourlyRateCents, dossiers, stats } = data;
  const pendingMin = pending.reduce((sum, x) => sum + x.durationMin, 0);
  const pendingEur = Math.round((pendingMin / 60) * (hourlyRateCents / 100)).toLocaleString("fr-FR");
  const dayLine = pending.length ? t.brain.insight.pendingDay(pending.length, fmtMin(pendingMin), pendingEur) : t.brain.insight.dayDone;

  switch (view) {
    case "dossiers": {
      const top = [...dossiers].filter((d) => d.status !== "archived" && d.monthMinutes > 0).sort((a, b) => b.monthMinutes - a.monthMinutes)[0];
      if (!top) return t.brain.insight.dossiersEmpty;
      const pct = top.budgetMinutes ? Math.round((top.usedMinutes / top.budgetMinutes) * 100) : null;
      return t.brain.insight.dossiers(top.name, fmtMin(top.monthMinutes), pct);
    }
    case "stats": {
      const current = stats.months[stats.months.length - 1];
      const previous = stats.months[stats.months.length - 2];
      const topSource = [...stats.sourceBreakdown].sort((a, b) => b.minutes - a.minutes)[0];
      const total = stats.sourceBreakdown.reduce((sum, b) => sum + b.minutes, 0);
      if (!current || !topSource || total === 0) return t.brain.insight.statsEmpty;
      const growth = previous && previous.revenueCents > 0 ? Math.round(((current.revenueCents - previous.revenueCents) / previous.revenueCents) * 100) : null;
      const sourceName =
        topSource.source === "word" ? t.settingsView.wordName : topSource.source === "outlook" ? t.settingsView.outlookName : topSource.source === "web" ? t.settingsView.webName : t.journal.manualEntry;
      return t.brain.insight.stats(fmtEurFromCents(current.revenueCents), growth, previous?.label ?? "", sourceName, Math.round((topSource.minutes / total) * 100));
    }
    case "billing": {
      const ready = dossiers.filter((d) => d.isBillable && d.status !== "archived" && d.uninvoicedMinutes > 0 && d.pendingMinutes === 0);
      if (ready.length) return t.brain.insight.billingReady(ready.length, fmtMin(ready.reduce((sum, d) => sum + d.uninvoicedMinutes, 0)));
      // Validated time exists, but every dossier that has some also has time still waiting in the Journal.
      const blocked = dossiers.filter((d) => d.isBillable && d.status !== "archived" && d.uninvoicedMinutes > 0).length;
      return blocked ? t.brain.insight.billingBlocked(blocked) : t.brain.insight.billingDone;
    }
    case "profile":
      return t.brain.insight.profile(fmtMin(stats.capturedMonthMin), stats.billableMonthPct);
    case "cloud":
      return t.brain.insight.cloud;
    case "settings":
      return t.brain.insight.settings;
    default:
      return dayLine;
  }
}

/**
 * Prototype "bone-card", for any dossier (PROTOTYPE_MAP: "Generalise it to
 * any dossier"): the dossier with the most time waiting in the Journal, with
 * one click to validate it all or to go and look at the rows.
 */
function DossierCard({
  pending,
  dossiers,
  onValidate,
  onSeeTasks,
}: {
  pending: Task[];
  dossiers: DossierUsage[];
  onValidate: (taskIds: string[]) => void | Promise<void>;
  onSeeTasks: (dossierId: string) => void;
}) {
  const { t } = useI18n();
  const byDossier = new Map<string, Task[]>();
  for (const task of pending) {
    if (!task.dossierId) continue;
    byDossier.set(task.dossierId, [...(byDossier.get(task.dossierId) ?? []), task]);
  }
  const top = [...byDossier.entries()]
    .map(([dossierId, list]) => ({ dossierId, list, minutes: list.reduce((sum, x) => sum + x.durationMin, 0) }))
    .sort((a, b) => b.minutes - a.minutes)[0];
  const dossier = top ? dossiers.find((d) => d.id === top.dossierId) : undefined;
  if (!top || !dossier) return null;

  return (
    <div className="glass-soft fade-up rounded-2xl p-3.5" data-tour="brain-dossier-card">
      <p className="eyebrow !text-gold-pale/80">{t.brain.dossierCard.title}</p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ivory/90">{t.brain.dossierCard.body(fmtMin(top.minutes), dossier.name, top.list.length)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onValidate(top.list.map((x) => x.id))}
          className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-3.5 py-1.5 text-[11.5px] font-semibold text-noir transition hover:brightness-110"
        >
          {t.brain.dossierCard.integrate(fmtMin(top.minutes))}
        </button>
        <button
          type="button"
          onClick={() => onSeeTasks(top.dossierId)}
          className="rounded-full border border-white/[0.12] px-3.5 py-1.5 text-[11.5px] text-ivory/80 transition hover:border-gold/35 hover:text-gold-pale"
        >
          {t.brain.dossierCard.seeTasks}
        </button>
      </div>
    </div>
  );
}

/**
 * "Insights Cabinet" (prototype `feed-cabinet`, shown only while the admin
 * console is open) — PRODUCT_SPEC.md "Firm insight: lowest validation rate,
 * totals". From live team/dossier data; the prototype's "moyenne des
 * cabinets équipés d'ACTE : 84 %" benchmark is dropped — no such data exists.
 */
function CabinetInsights({
  team,
  currentMemberId,
  dossiers,
  onRemind,
  onSeeDossiers,
}: {
  team: TeamMemberSummary[];
  currentMemberId: string;
  dossiers: DossierUsage[];
  onRemind: (memberId: string) => Promise<void>;
  onSeeDossiers: () => void;
}) {
  const { t } = useI18n();
  const [sending, setSending] = useState(false);
  const measured = team.filter((m) => m.status !== "invited" && m.status !== "suspended" && m.capturedMin > 0);
  if (measured.length === 0) return null;

  const totalCaptured = measured.reduce((s, m) => s + m.capturedMin, 0);
  const firmRate = Math.round(measured.reduce((s, m) => s + m.validationRate * m.capturedMin, 0) / totalCaptured);
  const top = [...measured].sort((a, b) => b.validationRate - a.validationRate)[0]!;
  // Nudge someone else — never suggest the admin remind themselves.
  const lowest = [...measured].filter((m) => m.id !== currentMemberId).sort((a, b) => a.validationRate - b.validationRate)[0];
  const nearLimit = dossiers
    .filter((d) => d.status !== "archived" && d.budgetMinutes)
    .map((d) => ({ d, pct: Math.round((d.usedMinutes / d.budgetMinutes!) * 100) }))
    .filter((x) => x.pct >= 70)
    .sort((a, b) => b.pct - a.pct)[0];

  return (
    <div className="space-y-3">
      <div className="glass-soft fade-up rounded-2xl border-gold/[0.2] p-3.5">
        <p className="eyebrow !text-gold-pale/80">{t.brain.cabinet.analysisTitle}</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ivory/90">{t.brain.cabinet.analysisBody(firmRate, top.displayName, top.validationRate)}</p>
      </div>
      {nearLimit && (
        <div className="glass-soft fade-up rounded-2xl p-3.5">
          <p className="eyebrow !text-amber-400/90">{t.brain.cabinet.attentionTitle}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ivory/90">{t.brain.cabinet.attentionBody(nearLimit.d.name, nearLimit.pct)}</p>
          <button
            type="button"
            onClick={onSeeDossiers}
            className="mt-3 cursor-pointer rounded-full border border-amber-500/35 px-3.5 py-1.5 text-[11.5px] text-amber-300 transition hover:bg-amber-500/10"
          >
            {t.brain.cabinet.seeDossier}
          </button>
        </div>
      )}
      {lowest && lowest.id !== top.id && (
        <div className="glass-soft fade-up rounded-2xl p-3.5">
          <p className="eyebrow !text-gold-pale/80">{t.brain.cabinet.suggestionTitle}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-ivory/90">{t.brain.cabinet.suggestionBody(lowest.displayName, lowest.validationRate)}</p>
          {isRecentReminder(lowest.remindedAt) ? (
            // Prototype's refreshCabinetCards: the button becomes a non-interactive confirmation.
            <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-emerald-300">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {t.brain.cabinet.remindedTo(lowest.displayName)}
            </p>
          ) : (
            <button
              type="button"
              disabled={sending}
              onClick={async () => {
                setSending(true);
                try {
                  await onRemind(lowest.id);
                } finally {
                  setSending(false);
                }
              }}
              className="mt-3 cursor-pointer rounded-full bg-gradient-to-r from-gold to-gold-deep px-3.5 py-1.5 text-[11.5px] font-semibold text-noir transition hover:brightness-110 disabled:opacity-60"
            >
              {t.brain.cabinet.sendReminder}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function BrainPanel({
  open,
  onClose,
  view,
  summary,
  tasks,
  backlog,
  dossiers,
  invoices,
  stats,
  hourlyRateCents,
  insights,
  activity,
  cabinet,
  onValidateDossier,
  onSeeDossierTasks,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  view: PanelView;
  summary: HomeSummary;
  /** The Journal's day, and the earlier days' pending tasks — what "en attente" means in the insight and the dossier card. */
  tasks: Task[];
  backlog: Task[];
  dossiers: DossierUsage[];
  invoices: ClientInvoiceSummary[];
  stats: StatsSummary;
  hourlyRateCents: number;
  insights: BrainInsight[];
  activity: ActivityEntry[];
  onValidateDossier: (taskIds: string[]) => void | Promise<void>;
  onSeeDossierTasks: (dossierId: string) => void;
  cabinet: { team: TeamMemberSummary[]; currentMemberId: string; onRemind: (memberId: string) => Promise<void>; onSeeDossiers: () => void } | null;
  onToast: (message: string) => void;
}) {
  const { t } = useI18n();
  const pending = [...tasks.filter((x) => x.status === "pending"), ...backlog];
  // The server's low-confidence line stays; the day line is rebuilt here so it matches what the Journal shows.
  const lowConfidence = insights.find((i) => i.id === "low-confidence");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const thinking = messages.some((m) => m.pending);
  // Set once the API says the LLM chat is off (D-015), so we stop asking.
  const llmDisabled = useRef(false);
  const feedRef = useRef<HTMLDivElement>(null);

  // Prototype addBubble: keep the newest bubble in view.
  useEffect(() => {
    const feed = feedRef.current;
    if (feed && messages.length > 0) feed.scrollTop = feed.scrollHeight;
  }, [messages]);

  const answer = async (text: string, history: ChatTurn[]): Promise<{ reply: string; history?: string }> => {
    const local = () => ({ reply: botReply(text, summary, dossiers, t.brain.fallbackReply) });
    if (!llmDisabled.current) {
      try {
        return await api.post<ChatReply>("/v1/me/chat", { message: text, history });
      } catch (e) {
        if (e instanceof ApiError && e.code === "llm_disabled") llmDisabled.current = true;
        else return local();
      }
    }
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    return local();
  };

  // Set synchronously, so a click landing before React re-renders can't start a second send.
  const sending = useRef(false);
  const send = async (text: string) => {
    if (!text.trim() || thinking || sending.current) return;
    sending.current = true;
    // Only LLM exchanges, with the reply as the model wrote it (refs, no names): restored names never go back (D-015).
    const history: ChatTurn[] = messages
      .flatMap((m, k) => {
        const question = messages[k - 1];
        return m.who === "ai" && m.history && question?.who === "user" && question.text.length <= 4000 && m.history.length <= 4000
          ? [{ role: "user" as const, content: question.text }, { role: "assistant" as const, content: m.history }]
          : [];
      })
      .slice(-8);
    const replyId = crypto.randomUUID();
    setMessages((m) => [...m, { id: crypto.randomUUID(), who: "user", text }, { id: replyId, who: "ai", text: "", pending: true }]);
    setInput("");
    const { reply, history: replyHistory } = await answer(text.slice(0, 500), history);
    setMessages((m) => m.map((msg) => (msg.id === replyId ? { ...msg, text: reply, history: replyHistory, pending: false } : msg)));
    sending.current = false;
  };
  // The dictation timeout below must use the latest send and input, not the ones from the render that started it.
  const sendRef = useRef(send);
  const inputRef = useRef(input);
  useEffect(() => {
    sendRef.current = send;
    inputRef.current = input;
  });

  /**
   * Simulated voice dictation — exactly like the prototype's mic-btn
   * (no real microphone access, no Web Speech API; a fixed fake transcript
   * after a delay). Built at Darwin's explicit request overriding the
   * "voice capture" exclusion in CLAUDE.md for this session — see
   * DECISIONS.md D-011.
   */
  const startListening = () => {
    if (listening || thinking) return;
    setListening(true);
    setInput("");
    onToast(t.brain.voiceSimulated);
    window.setTimeout(() => setInput(t.brain.chipSummary), 1300);
    window.setTimeout(() => {
      setListening(false);
      // Like the prototype, send what is in the input now: empty if the member already sent it by hand.
      void sendRef.current(inputRef.current);
    }, 2100);
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`pointer-events-none fixed inset-0 z-30 bg-black/60 transition-opacity xl:hidden ${open ? "pointer-events-auto opacity-100" : "opacity-0"}`}
      />
      <aside
        data-tour="brain"
        className={`fixed inset-y-0 right-0 z-40 flex min-h-0 w-[340px] max-w-[92vw] flex-col border-l border-white/[0.06] bg-[#0b0b0e]/95 backdrop-blur-xl transition-transform xl:static xl:z-auto xl:w-auto xl:max-w-none xl:translate-x-0 xl:bg-black/40 xl:backdrop-blur-md ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <p className="font-display text-[13px] font-extrabold uppercase tracking-[0.06em] text-ivory">
              {t.brain.title} <span className="ml-1 align-top font-body text-[9px] uppercase tracking-widest text-gold">β</span>
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ash">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-dot" /> {t.brain.standbyShort}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t.brain.closePanel}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-ash transition hover:border-gold/30 hover:text-gold-pale xl:hidden"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div ref={feedRef} className="scroll-thin flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <div className="glass-soft rounded-2xl border-l-2 border-l-gold/60 p-3.5" data-tour="brain-insights">
            <p className="eyebrow !text-gold-pale/80">{t.brain.aiAnalysis}</p>
            <div className="mt-1.5 space-y-2 text-[12.5px] leading-relaxed text-ivory/90">
              <p>{viewInsight(t, view, { pending, hourlyRateCents, dossiers, invoices, stats })}</p>
              {(view === "home" || view === "journal") && lowConfidence && <p>{lowConfidence.message}</p>}
            </div>
          </div>

          {(view === "home" || view === "journal") && (
            <DossierCard pending={pending} dossiers={dossiers} onValidate={onValidateDossier} onSeeTasks={onSeeDossierTasks} />
          )}

          {cabinet && (
            <CabinetInsights
              team={cabinet.team}
              currentMemberId={cabinet.currentMemberId}
              dossiers={dossiers}
              onRemind={cabinet.onRemind}
              onSeeDossiers={cabinet.onSeeDossiers}
            />
          )}

          {activity.length > 0 && (
            <div className="glass-soft rounded-2xl p-3.5" data-tour="brain-activity">
              <p className="eyebrow">{t.brain.activityTitle}</p>
              <ul className="mt-2 space-y-2">
                {activity.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex gap-2 text-[12px] leading-snug text-ivory/85">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold/70" />
                    <span className="min-w-0">
                      {a.message}
                      <span className="ml-1.5 font-mono text-[10.5px] text-ash">
                        {new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(a.createdAt))}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`fade-up flex ${m.who === "user" ? "justify-end" : "justify-start"}`}>
              {m.who === "user" ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-gold/90 to-gold-deep px-3.5 py-2.5 text-[12.5px] font-medium leading-relaxed text-noir">
                  {m.text}
                </div>
              ) : (
                <div className="glass-soft max-w-[90%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ivory/90">
                  {m.pending ? (
                    // Prototype sendChat's typing dots; the reply replaces them in this same bubble.
                    <span className="inline-flex gap-1">
                      <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-ash" />
                      <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-ash" />
                      <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-ash" />
                    </span>
                  ) : (
                    m.text
                  )}
                </div>
              )}
            </div>
          ))}

        </div>

        <div className="border-t border-white/[0.06] p-3.5" data-tour="brain-chat">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => void send(t.brain.chipSummary)}
              disabled={listening || thinking}
              className="rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1 text-[11.5px] text-ash transition hover:border-gold/30 hover:text-gold-pale"
            >
              {t.brain.chipSummary}
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              maxLength={500}
              placeholder={listening ? t.brain.listeningPlaceholder : t.brain.placeholder}
              autoComplete="off"
              disabled={listening}
              className="min-w-0 flex-1 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory placeholder-ash/70 outline-none transition focus:border-gold/40 disabled:opacity-70"
            />
            <button
              type="button"
              onClick={startListening}
              disabled={thinking}
              aria-label={t.brain.voiceAria}
              title={t.brain.voiceAria}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-ash transition hover:border-gold/35 hover:text-gold-pale active:scale-95 ${
                listening ? "border-gold/55 bg-gold/10 text-gold pulse-gold" : "border-white/[0.09] bg-white/[0.04]"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </button>
            <button
              type="submit"
              aria-label={t.brain.send}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-gold-deep text-noir transition hover:brightness-110 active:scale-95"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 14-7-7 14-2-5-5-2z" />
              </svg>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

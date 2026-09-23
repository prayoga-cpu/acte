"use client";

import { useState } from "react";
import type { BrainInsight, DossierUsage, HomeSummary } from "@acte/contracts";
import { fmtEurFromCents, fmtMin } from "@/lib/format";
import { useI18n } from "@/i18n/locale-context";

interface ChatMessage {
  id: string;
  who: "user" | "ai";
  text: string;
}

/**
 * Deterministic, templated replies from real data — no LLM before stage 5
 * (docs/02-architecture/AI_MATCHING.md, PROTOTYPE_MAP.md "botReply").
 *
 * The three data-templated sentences below have no dictionary entry (they're
 * composed from live numbers, not static copy) and stay French-only, same as
 * the keyword matching against the question itself; only `fallback` (the
 * catch-all reply) comes from the locale dictionary.
 */
function botReply(question: string, summary: HomeSummary, dossiers: DossierUsage[], fallback: string): string {
  const q = question.toLowerCase();
  if (q.includes("résumé") || q.includes("resume") || q.includes("journée")) {
    return `Aujourd'hui : ${fmtMin(summary.capturedTodayMin)} capturées, dont ${fmtMin(summary.validatedTodayMin)} validées et ${fmtMin(summary.pendingTodayMin)} en attente.`;
  }
  const named = dossiers.find((d) => q.includes(d.name.toLowerCase().split(" ")[0] ?? ""));
  if (named) {
    return `Dossier ${named.name} : ${fmtMin(named.usedMinutes)} capturées ce mois-ci, ${fmtMin(named.pendingMinutes)} en attente de validation.`;
  }
  if (q.includes("factur") || q.includes("honoraire") || q.includes("ca")) {
    return `CA sécurisé ce mois-ci : ${fmtEurFromCents(summary.securedRevenueMonthCents)}.`;
  }
  return fallback;
}

export function BrainPanel({
  open,
  onClose,
  summary,
  dossiers,
  insights,
  onToast,
}: {
  open: boolean;
  onClose: () => void;
  summary: HomeSummary;
  dossiers: DossierUsage[];
  insights: BrainInsight[];
  onToast: (message: string) => void;
}) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), who: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    window.setTimeout(() => {
      setMessages((m) => [...m, { id: crypto.randomUUID(), who: "ai", text: botReply(text, summary, dossiers, t.brain.fallbackReply) }]);
    }, 400);
  };

  /**
   * Simulated voice dictation — exactly like the prototype's mic-btn
   * (no real microphone access, no Web Speech API; a fixed fake transcript
   * after a delay). Built at Darwin's explicit request overriding the
   * "voice capture" exclusion in CLAUDE.md for this session — see
   * DECISIONS.md D-011.
   */
  const startListening = () => {
    if (listening) return;
    setListening(true);
    setInput("");
    onToast(t.brain.voiceSimulated);
    window.setTimeout(() => setInput(t.brain.chipSummary), 1300);
    window.setTimeout(() => {
      setListening(false);
      send(t.brain.chipSummary);
    }, 2100);
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`pointer-events-none fixed inset-0 z-30 bg-black/60 transition-opacity xl:hidden ${open ? "pointer-events-auto opacity-100" : "opacity-0"}`}
      />
      <aside
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

        <div className="scroll-thin flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <div className="glass-soft rounded-2xl border-l-2 border-l-gold/60 p-3.5">
            <p className="eyebrow !text-gold-pale/80">{t.brain.aiAnalysis}</p>
            <div className="mt-1.5 space-y-2 text-[12.5px] leading-relaxed text-ivory/90">
              {insights.map((i) => (
                <p key={i.id}>{i.message}</p>
              ))}
            </div>
          </div>

          {messages.map((m) => (
            <div key={m.id} className={`fade-up flex ${m.who === "user" ? "justify-end" : "justify-start"}`}>
              {m.who === "user" ? (
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-gold/90 to-gold-deep px-3.5 py-2.5 text-[12.5px] font-medium leading-relaxed text-noir">
                  {m.text}
                </div>
              ) : (
                <div className="glass-soft max-w-[90%] rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ivory/90">{m.text}</div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.06] p-3.5">
          <div className="mb-2.5 flex flex-wrap gap-1.5">
            <button
              onClick={() => send(t.brain.chipSummary)}
              className="rounded-full border border-white/[0.09] bg-white/[0.03] px-3 py-1 text-[11.5px] text-ash transition hover:border-gold/30 hover:text-gold-pale"
            >
              {t.brain.chipSummary}
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              placeholder={listening ? t.brain.listeningPlaceholder : t.brain.placeholder}
              autoComplete="off"
              disabled={listening}
              className="min-w-0 flex-1 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory placeholder-ash/70 outline-none transition focus:border-gold/40 disabled:opacity-70"
            />
            <button
              type="button"
              onClick={startListening}
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

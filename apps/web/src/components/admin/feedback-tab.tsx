"use client";

import { useState } from "react";
import type { FeedbackCategory, FeedbackEntry } from "@acte/contracts";
import { useI18n } from "@/i18n/locale-context";

const CATEGORIES: FeedbackCategory[] = ["idea", "bug", "other"];

/**
 * "Feedback" tab of the admin console (PRODUCT_SPEC "Feedback (new)",
 * ROADMAP stage 6 — built early under D-019). Not in the prototype: laid out
 * with the prototype's own cards, pills and form fields.
 */
export function FeedbackTab({ entries, onSend }: { entries: FeedbackEntry[]; onSend: (category: FeedbackCategory, message: string) => Promise<void> }) {
  const { t, locale } = useI18n();
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const when = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

  const send = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      await onSend(category, message.trim());
      setMessage("");
    } catch {
      setError(t.admin.feedback.sendError);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
      <div>
        <p className="text-[13px] font-medium text-ivory/95">{t.admin.feedback.title}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-ash">{t.admin.feedback.intro}</p>

        <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label={t.admin.feedback.categoryLabel}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={category === c}
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1 text-[11.5px] transition ${
                category === c ? "border-gold/35 bg-gold/10 text-gold-pale" : "border-white/[0.09] bg-white/[0.03] text-ash hover:text-ivory"
              }`}
            >
              {t.admin.feedback.categories[c]}
            </button>
          ))}
        </div>

        <label className="mt-3.5 block text-[11.5px] text-ash" htmlFor="feedback-message">
          {t.admin.feedback.messageLabel}
        </label>
        <textarea
          id="feedback-message"
          value={message}
          maxLength={2000}
          rows={5}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.admin.feedback.placeholder}
          className="mt-1.5 w-full resize-none rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] leading-relaxed text-ivory placeholder-ash/50 outline-none transition focus:border-gold/40"
        />
        <p className="mt-2 text-[11px] leading-relaxed text-ash">{t.admin.feedback.privacyNote}</p>
        {error && <p className="mt-2 text-[11.5px] text-red-400">{error}</p>}
        <button
          type="button"
          onClick={send}
          disabled={sending || !message.trim()}
          className="mt-3 rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-1.5 text-[12.5px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {t.admin.feedback.send}
        </button>
      </div>

      <div>
        <p className="eyebrow">{t.admin.feedback.historyTitle}</p>
        {entries.length === 0 ? (
          <p className="mt-3 text-[12.5px] text-ash">{t.admin.feedback.empty}</p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {entries.map((e) => (
              <li key={e.id} className="glass-soft rounded-xl px-4 py-3">
                <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-ash">
                  <span className="rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 font-mono text-[10.5px] text-gold-pale">{t.admin.feedback.categories[e.category]}</span>
                  <span>{e.authorName}</span>
                  <span className="font-mono text-[10.5px]">{when.format(new Date(e.createdAt))}</span>
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-ivory/90">{e.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

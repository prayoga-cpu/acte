"use client";

import { Modal, ModalActions, ModalPrimaryButton } from "@/components/modal";
import { useHelpCopy } from "@/i18n/help";

/**
 * The first-run welcome (D-021): shown once to a member who has never seen
 * it, and again on request from the help centre. Not in the prototype —
 * built from its modal, eyebrow and chip styles.
 */
export function WelcomeModal({ onStartTour, onLater }: { onStartTour: () => void; onLater: () => void }) {
  const copy = useHelpCopy();
  const c = copy.welcome;

  return (
    <Modal onClose={onLater} size="lg">
      <p className="eyebrow">{c.eyebrow}</p>
      <h3 className="mt-1 font-display text-[22px] font-semibold text-ivory">{c.title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ash">{c.intro}</p>

      <ol className="mt-4 space-y-2">
        {c.steps.map((step, i) => (
          <li key={step.title} className="flex items-start gap-3 rounded-xl border border-white/[0.09] bg-white/[0.03] px-3.5 py-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/[0.08] font-mono text-[12px] text-gold-pale">
              {i + 1}
            </span>
            <span>
              <span className="block text-[13px] font-medium text-ivory/95">{step.title}</span>
              <span className="mt-0.5 block text-[11.5px] leading-relaxed text-ash">{step.body}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-3 text-[11.5px] leading-relaxed text-ash">{c.note}</p>

      <ModalActions>
        <button
          type="button"
          onClick={onLater}
          className="rounded-full border border-white/[0.12] px-4 py-1.5 text-[12.5px] text-ivory/80 transition hover:border-white/25"
        >
          {c.later}
        </button>
        <ModalPrimaryButton onClick={onStartTour}>{c.start}</ModalPrimaryButton>
      </ModalActions>
      <p className="mt-3 text-right text-[11px] text-ash">{c.footnote}</p>
    </Modal>
  );
}

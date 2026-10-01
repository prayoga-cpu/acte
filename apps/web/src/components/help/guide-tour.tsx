"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useHelpCopy } from "@/i18n/help";
import type { Guide, GuideStep } from "./guides";

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}
interface Layout {
  box: Box | null;
  card: { top: number; left: number };
}

const EDGE = 12; // card's minimum distance from the viewport edges
const GAP = 14; // between the spotlight and the card
const PAD = 6; // spotlight's breathing room around its target
/** How long a step waits for its target to mount (view switch, drawer sliding in) before settling for a centred card. */
const TARGET_WAIT_MS = 300;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/** The elements a step points at: its first `data-tour` key that is actually rendered. */
function findTargets(step: GuideStep): HTMLElement[] | null {
  for (const key of step.targets) {
    const rendered = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`)).filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    if (rendered.length > 0) return step.all ? rendered : [rendered[0]!];
  }
  return null;
}

function unionRect(els: HTMLElement[]): { top: number; left: number; right: number; bottom: number } {
  const rects = els.map((el) => el.getBoundingClientRect());
  return {
    top: Math.min(...rects.map((r) => r.top)),
    left: Math.min(...rects.map((r) => r.left)),
    right: Math.max(...rects.map((r) => r.right)),
    bottom: Math.max(...rects.map((r) => r.bottom)),
  };
}

/** The padded spotlight, clipped to the viewport. Null when the target is off screen (a closed drawer). */
function spotlightFor(els: HTMLElement[]): Box | null {
  const r = unionRect(els);
  const left = Math.max(4, r.left - PAD);
  const top = Math.max(4, r.top - PAD);
  const right = Math.min(window.innerWidth - 4, r.right + PAD);
  const bottom = Math.min(window.innerHeight - 4, r.bottom + PAD);
  if (right - left < 8 || bottom - top < 8) return null;
  return { top: Math.round(top), left: Math.round(left), width: Math.round(right - left), height: Math.round(bottom - top) };
}

/** Below the target if it fits, else above, beside, and as a last resort inside it. */
function placeCard(box: Box | null, cardW: number, cardH: number): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxLeft = vw - cardW - EDGE;
  const maxTop = vh - cardH - EDGE;
  if (!box) return { top: Math.round(clamp((vh - cardH) / 2, EDGE, maxTop)), left: Math.round(clamp((vw - cardW) / 2, EDGE, maxLeft)) };

  const right = box.left + box.width;
  const bottom = box.top + box.height;
  const centredLeft = clamp(box.left + box.width / 2 - cardW / 2, EDGE, maxLeft);
  const centredTop = clamp(box.top + box.height / 2 - cardH / 2, EDGE, maxTop);

  let pos: { top: number; left: number };
  if (bottom + GAP + cardH + EDGE <= vh) pos = { top: bottom + GAP, left: centredLeft };
  else if (box.top - GAP - cardH >= EDGE) pos = { top: box.top - GAP - cardH, left: centredLeft };
  else if (right + GAP + cardW + EDGE <= vw) pos = { top: centredTop, left: right + GAP };
  else if (box.left - GAP - cardW >= EDGE) pos = { top: centredTop, left: box.left - GAP - cardW };
  else pos = { top: clamp(bottom - cardH - 16, EDGE, maxTop), left: centredLeft };
  return { top: Math.round(pos.top), left: Math.round(pos.left) };
}

function sameLayout(a: Layout | null, b: Layout): boolean {
  if (!a) return false;
  if (a.card.top !== b.card.top || a.card.left !== b.card.left) return false;
  if (!a.box || !b.box) return a.box === b.box;
  return a.box.top === b.box.top && a.box.left === b.box.left && a.box.width === b.box.width && a.box.height === b.box.height;
}

/**
 * A guided tour over the live dashboard (D-021): dims the page, frames the
 * element the current step is about, and shows the step's text beside it.
 * The page underneath is shielded from clicks while the tour runs, so a
 * guide can never trigger a real action (a validation, an invitation).
 *
 * Positions are re-measured every frame while the tour is open — that one
 * loop covers resizes, scrolling, a view that is still mounting, the
 * views' fade-up animation and the Cerveau drawer sliding in, without a
 * listener for each.
 */
export function GuideTour({
  guide,
  index,
  isAdmin,
  onIndex,
  onClose,
}: {
  guide: Guide;
  index: number;
  isAdmin: boolean;
  onIndex: (index: number) => void;
  /** `finished` is true when the last step's button closed it, false when the member left early. */
  onClose: (finished: boolean) => void;
}) {
  const copy = useHelpCopy();
  const titleId = useId();
  const bodyId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  // False until the card has been placed once: it must appear in place, not fly in from the corner.
  const [entered, setEntered] = useState(false);

  const step = guide.steps[index]!;
  const isLast = index === guide.steps.length - 1;
  const text = step.text(copy, { isAdmin });

  useEffect(() => {
    if (!layout || entered) return;
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [layout, entered]);

  // The previous step's layout stays until this one is measured, so the spotlight glides from one target to the next.
  useEffect(() => {
    let frame = 0;
    let scrolledIntoView = false;
    const startedAt = performance.now();

    const measure = () => {
      frame = requestAnimationFrame(measure);
      const card = cardRef.current;
      if (!card) return;

      const targets = findTargets(step);
      if (targets && !scrolledIntoView) {
        scrolledIntoView = true;
        // "nearest" leaves an element that is already in view where it is, and otherwise scrolls each
        // container it sits in by the least needed — sideways too, where the page is wider than the screen.
        targets[0]!.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
      }
      const box = targets ? spotlightFor(targets) : null;
      if (!box && performance.now() - startedAt < TARGET_WAIT_MS) return;

      const next = { box, card: placeCard(box, card.offsetWidth, card.offsetHeight) };
      setLayout((current) => (sameLayout(current, next) ? current : next));
    };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [step]);

  // A new step moves keyboard focus to its main button, so Enter always continues.
  useEffect(() => {
    primaryRef.current?.focus({ preventScroll: true });
  }, [index, guide.id]);

  // When the tour ends, give focus back to whatever had it and put the page back where a step may have scrolled it from.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { scrollX, scrollY } = window;
    return () => {
      previous?.focus?.({ preventScroll: true });
      window.scrollTo(scrollX, scrollY);
    };
  }, []);

  const next = () => (isLast ? onClose(true) : onIndex(index + 1));
  const back = () => index > 0 && onIndex(index - 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose(false);
      } else if (e.key === "ArrowRight") {
        next();
      } else if (e.key === "ArrowLeft") {
        back();
      } else if (e.key === "Tab") {
        // The page behind is shielded from the mouse; keep the keyboard on the card too.
        const focusable = Array.from(cardRef.current?.querySelectorAll<HTMLElement>("button") ?? []);
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        const active = document.activeElement;
        if (!cardRef.current?.contains(active)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Click shield: nothing under the tour can be clicked. */}
      <div className="absolute inset-0" />

      {layout?.box ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-[14px] shadow-[0_0_0_1px_rgb(var(--c-accent)/0.55),0_0_0_9999px_rgb(var(--c-black)/0.72)] transition-all duration-200"
          style={layout.box}
        />
      ) : (
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/70" />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className={`fixed w-[340px] max-w-[calc(100vw-24px)] rounded-2xl border border-white/[0.1] bg-carbon p-4 shadow-[0_24px_70px_-18px_rgba(0,0,0,0.9)] ${
          entered ? "opacity-100 transition-[top,left,opacity] duration-200" : "opacity-0"
        }`}
        style={layout ? layout.card : { top: 0, left: 0 }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow truncate">
            {copy.tour.eyebrow} · {copy.guides[guide.id].title}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="font-mono text-[11px] text-ash">{copy.tour.progress(index + 1, guide.steps.length)}</span>
            <button
              type="button"
              onClick={() => onClose(false)}
              aria-label={copy.tour.quit}
              title={copy.tour.quit}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ash transition hover:bg-white/[0.06] hover:text-ivory"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div aria-live="polite">
          <h3 id={titleId} className="mt-2 font-display text-[16px] font-semibold leading-snug text-ivory">
            {text.title}
          </h3>
          <p id={bodyId} className="mt-1.5 text-[12.5px] leading-relaxed text-ivory/80">
            {text.body}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          {index > 0 && (
            <button
              type="button"
              onClick={back}
              className="rounded-full border border-white/[0.12] px-4 py-1.5 text-[12.5px] text-ivory/80 transition hover:border-white/25"
            >
              {copy.tour.back}
            </button>
          )}
          <button
            ref={primaryRef}
            type="button"
            onClick={next}
            className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-1.5 text-[12.5px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
          >
            {isLast ? copy.tour.done : copy.tour.next}
          </button>
        </div>
      </div>
    </div>
  );
}

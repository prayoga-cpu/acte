"use client";

import type { OnboardingState } from "@acte/contracts";
import { Modal } from "@/components/modal";
import type { View } from "@/components/shell";
import { useHelpCopy, type HelpCopy } from "@/i18n/help";
import { guidesFor, type Guide, type GuideId } from "./guides";

type ChecklistKey = keyof HelpCopy["checklist"]["items"];

interface ChecklistItem {
  key: ChecklistKey;
  done: boolean;
  /** Where "Y aller" takes the member. */
  view: View;
  optional?: boolean;
}

/** The first steps that apply to this member, in the order they are worth doing. */
function checklistFor(onboarding: OnboardingState, isAdmin: boolean): ChecklistItem[] {
  const c = onboarding.checklist;
  return [
    // Shown only while the rate is 0 € — every amount is then 0 € — and only to an admin, who is the one who can set it.
    ...(isAdmin && !c.hourlyRateSet ? [{ key: "rate" as const, done: false, view: "admin" as const }] : []),
    { key: "dossier", done: c.hasDossier, view: "dossiers" },
    { key: "task", done: c.hasTask, view: "journal" },
    { key: "validate", done: c.hasValidatedTask, view: "journal" },
    ...(isAdmin ? [{ key: "invite" as const, done: c.hasInvitedMember, view: "admin" as const, optional: true }] : []),
  ];
}

const CHECK = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// Same icons as the rail and the profile menu for the views that have one there.
const GUIDE_ICON: Record<GuideId, React.ReactNode> = {
  overview: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </>
  ),
  home: (
    <>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </>
  ),
  journal: (
    <>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </>
  ),
  dossiers: <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />,
  billing: (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </>
  ),
  stats: (
    <>
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </>
  ),
  brain: (
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  ),
  notifications: (
    <>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </>
  ),
  profile: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  cloud: <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  admin: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />,
};

/**
 * The help centre (D-021): the "Premiers pas" checklist while it has
 * something left to do, then every guide this member can follow, the
 * current view's guide first. Not in the prototype — built from its modal,
 * eyebrow, chip and menu-row styles.
 */
export function HelpCenter({
  onboarding,
  isAdmin,
  currentView,
  onClose,
  onStartGuide,
  onGoTo,
  onReplayWelcome,
}: {
  onboarding: OnboardingState | null;
  isAdmin: boolean;
  currentView: View;
  onClose: () => void;
  onStartGuide: (id: GuideId) => void;
  onGoTo: (view: View) => void;
  onReplayWelcome: () => void;
}) {
  const copy = useHelpCopy();

  const checklist = onboarding ? checklistFor(onboarding, isAdmin) : [];
  const required = checklist.filter((item) => !item.optional);
  const requiredDone = required.filter((item) => item.done).length;
  // Once every required step is done the checklist has served its purpose and leaves the panel.
  const showChecklist = required.length > 0 && requiredDone < required.length;

  const isCurrent = (g: Guide) => g.view === currentView;
  const guides = guidesFor(isAdmin);
  const ordered = [...guides.filter(isCurrent), ...guides.filter((g) => !isCurrent(g))];

  return (
    <Modal onClose={onClose} size="lg">
      <p className="eyebrow">{copy.center.eyebrow}</p>
      <h3 className="mt-1 font-display text-[20px] font-semibold text-ivory">{copy.center.title}</h3>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-ash">{copy.center.intro}</p>

      {showChecklist && (
        <section className="mt-4 rounded-2xl border border-gold/25 bg-gold/[0.04] p-3.5" aria-label={copy.checklist.title} data-testid="first-steps">
          <div className="flex items-center justify-between">
            <p className="eyebrow !text-gold-pale/80">{copy.checklist.title}</p>
            <p className="font-mono text-[11px] text-gold-pale">{copy.checklist.progress(requiredDone, required.length)}</p>
          </div>
          <ul className="mt-2.5 space-y-2">
            {checklist.map((item) => {
              const text = copy.checklist.items[item.key];
              return (
                <li key={item.key} className="flex items-start gap-2.5" data-done={item.done}>
                  <span
                    role="img"
                    aria-label={item.done ? copy.checklist.doneAria : copy.checklist.todoAria}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      item.done ? "border-emerald-400/40 bg-emerald-400/[0.12] text-emerald-300" : "border-white/[0.18]"
                    }`}
                  >
                    {item.done ? CHECK : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[12.5px] font-medium ${item.done ? "text-ash line-through" : "text-ivory/95"}`}>
                      {text.title}
                      {item.optional && <span className="ml-1.5 font-normal text-ash">· {copy.checklist.optional}</span>}
                    </span>
                    {!item.done && <span className="mt-0.5 block text-[11px] leading-relaxed text-ash">{text.hint}</span>}
                  </span>
                  {!item.done && (
                    <button
                      type="button"
                      onClick={() => onGoTo(item.view)}
                      aria-label={`${copy.checklist.go} — ${text.title}`}
                      className="shrink-0 rounded-full border border-gold/35 bg-gold/10 px-3 py-1 text-[11.5px] font-semibold text-gold-pale transition hover:bg-gold/[0.18]"
                    >
                      {copy.checklist.go}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <p className="eyebrow mt-5">{copy.center.guidesTitle}</p>
      <ul className="mt-2 overflow-hidden rounded-2xl border border-white/[0.09]">
        {ordered.map((g, i) => {
          const text = copy.guides[g.id];
          return (
            <li key={g.id} className={i > 0 ? "border-t border-white/[0.05]" : ""}>
              <button
                type="button"
                onClick={() => onStartGuide(g.id)}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-gold/10 active:bg-gold/[0.16]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/[0.08] text-gold-pale">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {GUIDE_ICON[g.id]}
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-ivory/95">
                    {text.title}
                    {isCurrent(g) && (
                      <span className="rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 font-mono text-[9.5px] font-normal text-gold-pale">
                        {copy.center.currentView}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-ash">{text.summary}</span>
                </span>
                <span className="shrink-0 font-mono text-[10.5px] text-ash">{copy.center.stepCount(g.steps.length)}</span>
                <svg className="shrink-0 text-ash" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={onReplayWelcome} className="text-[11.5px] text-ash underline-offset-2 transition hover:text-gold-pale hover:underline">
          {copy.center.replayWelcome}
        </button>
      </div>
    </Modal>
  );
}

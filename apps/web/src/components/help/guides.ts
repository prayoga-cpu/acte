import type { HelpCopy } from "@/i18n/help";
import type { View } from "@/components/shell";

export type GuideId =
  | "overview"
  | "home"
  | "journal"
  | "dossiers"
  | "billing"
  | "stats"
  | "brain"
  | "notifications"
  | "profile"
  | "cloud"
  | "settings"
  | "admin";

export interface GuideStep {
  /**
   * `data-tour` keys, in order of preference: the first one on screen is
   * spotlit. If none is (an empty Journal has no task row, a hidden column),
   * the step still shows, centred, without a spotlight.
   */
  targets: string[];
  /** Frame every element carrying the key together, not just the first one. */
  all?: boolean;
  /** View to show for this step; defaults to the guide's own view, else the current one. */
  view?: View;
  /** The step points inside the Cerveau panel, which is a closed drawer below 1280 px. */
  brain?: boolean;
  text: (copy: HelpCopy, ctx: { isAdmin: boolean }) => { title: string; body: string };
}

export interface Guide {
  id: GuideId;
  /** The view this guide documents — where it starts, and what marks it "current view" in the help centre. */
  view?: View;
  adminOnly?: boolean;
  steps: GuideStep[];
}

/**
 * Every guide of the help centre (D-021), in the order it lists them. A
 * step only names where to look (`data-tour` keys on the real elements);
 * its words live in i18n/help.{fr,en}.ts.
 */
export const GUIDES: Guide[] = [
  {
    id: "overview",
    steps: [
      { targets: ["tabs"], text: (c) => c.guides.overview.steps.tabs },
      { targets: ["rail"], text: (c) => c.guides.overview.steps.rail },
      { targets: ["home-journal"], view: "home", text: (c) => c.guides.overview.steps.journal },
      { targets: ["brain"], brain: true, text: (c) => c.guides.overview.steps.brain },
      { targets: ["bell"], text: (c) => c.guides.overview.steps.bell },
      { targets: ["prefs"], all: true, text: (c) => c.guides.overview.steps.prefs },
      {
        targets: ["profile"],
        text: (c, { isAdmin }) => {
          const s = c.guides.overview.steps.profile;
          return { title: s.title, body: isAdmin ? s.bodyAdmin : s.body };
        },
      },
      { targets: ["help"], text: (c) => c.guides.overview.steps.help },
    ],
  },
  {
    id: "home",
    view: "home",
    steps: [
      { targets: ["home-kpis"], all: true, text: (c) => c.guides.home.steps.kpis },
      { targets: ["home-journal"], text: (c) => c.guides.home.steps.journal },
      { targets: ["home-week"], text: (c) => c.guides.home.steps.week },
      { targets: ["home-capture"], text: (c) => c.guides.home.steps.capture },
    ],
  },
  {
    id: "journal",
    view: "journal",
    steps: [
      { targets: ["journal-list"], text: (c) => c.guides.journal.steps.list },
      { targets: ["journal-days", "journal-list"], all: true, text: (c) => c.guides.journal.steps.days },
      { targets: ["journal-manual"], text: (c) => c.guides.journal.steps.manual },
      { targets: ["task-dossier", "journal-list"], text: (c) => c.guides.journal.steps.dossier },
      { targets: ["task-confidence", "journal-list"], text: (c) => c.guides.journal.steps.confidence },
      { targets: ["task-validate", "journal-list"], text: (c) => c.guides.journal.steps.validate },
      { targets: ["task-menu", "journal-list"], text: (c) => c.guides.journal.steps.menu },
      { targets: ["journal-batch", "journal-list"], text: (c) => c.guides.journal.steps.batch },
      { targets: ["journal-validated", "journal-list"], text: (c) => c.guides.journal.steps.validated },
    ],
  },
  {
    id: "dossiers",
    view: "dossiers",
    steps: [
      { targets: ["dossiers-new"], text: (c) => c.guides.dossiers.steps.create },
      { targets: ["dossier-card"], text: (c) => c.guides.dossiers.steps.card },
      { targets: ["dossier-menu", "dossier-card"], text: (c) => c.guides.dossiers.steps.menu },
      { targets: ["bell"], text: (c) => c.guides.dossiers.steps.alert },
    ],
  },
  {
    id: "billing",
    view: "billing",
    steps: [
      { targets: ["billing-drafts"], text: (c) => c.guides.billing.steps.drafts },
      { targets: ["billing-drafts"], text: (c) => c.guides.billing.steps.generate },
      { targets: ["billing-total"], text: (c) => c.guides.billing.steps.total },
      { targets: ["billing-export"], text: (c) => c.guides.billing.steps.export },
    ],
  },
  {
    id: "stats",
    view: "stats",
    steps: [
      { targets: ["stats-revenue"], text: (c) => c.guides.stats.steps.revenue },
      { targets: ["stats-kpis"], all: true, text: (c) => c.guides.stats.steps.kpis },
      { targets: ["stats-sources"], text: (c) => c.guides.stats.steps.sources },
      { targets: ["stats-invisible"], text: (c) => c.guides.stats.steps.invisible },
    ],
  },
  {
    id: "brain",
    steps: [
      { targets: ["brain-insights", "brain"], brain: true, text: (c) => c.guides.brain.steps.insights },
      // The panel shows this card on Accueil and Journal only.
      { targets: ["brain-dossier-card", "brain"], view: "home", brain: true, text: (c) => c.guides.brain.steps.integrate },
      {
        targets: ["brain-activity", "brain"],
        brain: true,
        text: (c, { isAdmin }) => {
          const s = c.guides.brain.steps.activity;
          return { title: s.title, body: isAdmin ? s.bodyAdmin : s.body };
        },
      },
      { targets: ["brain-chat", "brain"], brain: true, text: (c) => c.guides.brain.steps.chat },
    ],
  },
  {
    id: "notifications",
    steps: [
      {
        targets: ["bell"],
        text: (c, { isAdmin }) => {
          const s = c.guides.notifications.steps.triggers;
          return { title: s.title, body: isAdmin ? s.bodyAdmin : s.body };
        },
      },
      { targets: ["bell"], text: (c) => c.guides.notifications.steps.read },
    ],
  },
  {
    id: "profile",
    view: "profile",
    steps: [
      { targets: ["profile-card"], text: (c) => c.guides.profile.steps.card },
      { targets: ["profile-report"], text: (c) => c.guides.profile.steps.report },
      { targets: ["profile-highlights", "profile-report"], text: (c) => c.guides.profile.steps.highlights },
      { targets: ["profile-keys"], text: (c) => c.guides.profile.steps.keys },
    ],
  },
  {
    id: "cloud",
    view: "cloud",
    steps: [
      { targets: ["cloud-devices"], text: (c) => c.guides.cloud.steps.devices },
      { targets: ["cloud-secrecy"], text: (c) => c.guides.cloud.steps.secrecy },
      { targets: ["cloud-export", "cloud-secrecy"], text: (c) => c.guides.cloud.steps.export },
    ],
  },
  {
    id: "settings",
    view: "settings",
    steps: [
      { targets: ["settings-sources"], text: (c) => c.guides.settings.steps.sources },
      { targets: ["settings-rate"], text: (c) => c.guides.settings.steps.rate },
      { targets: ["settings-alerts"], text: (c) => c.guides.settings.steps.alerts },
      { targets: ["settings-password"], text: (c) => c.guides.settings.steps.password },
      { targets: ["settings-privacy"], text: (c) => c.guides.settings.steps.privacy },
    ],
  },
  {
    id: "admin",
    view: "admin",
    adminOnly: true,
    steps: [
      { targets: ["admin-kpis"], all: true, text: (c) => c.guides.admin.steps.kpis },
      { targets: ["admin-invite", "admin-team"], text: (c) => c.guides.admin.steps.invite },
      { targets: ["admin-team"], text: (c) => c.guides.admin.steps.team },
      { targets: ["admin-tabs"], text: (c) => c.guides.admin.steps.subscription },
      { targets: ["admin-tabs"], text: (c) => c.guides.admin.steps.feedback },
    ],
  },
];

export function guidesFor(isAdmin: boolean): Guide[] {
  return GUIDES.filter((g) => isAdmin || !g.adminOnly);
}

export function findGuide(id: GuideId): Guide {
  return GUIDES.find((g) => g.id === id)!;
}

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
  ActivityEntry,
  BrainInsight,
  ClientInvoiceSummary,
  Dossier,
  DossierStatus,
  DossierUsage,
  FeedbackCategory,
  FeedbackEntry,
  HomeSummary,
  MemberProfile,
  MemberRole,
  NotificationView,
  SourceSettings,
  StatsSummary,
  Task,
  TeamMemberSummary,
  ThemePreference,
  WeekSummary,
} from "@acte/contracts";
import { api, ApiError } from "./api-client";
import { fmtMin } from "./format";
import { useI18n } from "@/i18n/locale-context";
import { todayKeyParis } from "./time";

export interface DashboardInitialData {
  member: MemberProfile;
  summary: HomeSummary;
  week: WeekSummary;
  tasks: Task[];
  backlog: Task[];
  dossiers: DossierUsage[];
  insights: BrainInsight[];
  sources: SourceSettings;
}

const EMPTY_STATS: StatsSummary = {
  months: [],
  sourceBreakdown: [],
  capturedMonthMin: 0,
  billableMonthPct: 0,
  highlights: { bestDay: null, topDossier: null, shortTasksCount: 0 },
};

/** What a validated task is worth: the rate stamped on it, or the member's current rate while it is still pending. */
const eurOf = (durationMin: number, rateCents: number) => Math.round((durationMin / 60) * (rateCents / 100));

export function useDashboard(initial: DashboardInitialData) {
  const { t } = useI18n();
  const [member, setMember] = useState(initial.member);
  const [summary, setSummary] = useState(initial.summary);
  const [week, setWeek] = useState(initial.week);
  // Today's tasks (Home, the Cerveau panel) are kept apart from the day the Journal view is browsing:
  // one shared list made a past day's rows count twice against the carry-over list, and left a dashboard
  // open past midnight stuck on yesterday.
  const [tasks, setTasks] = useState(initial.tasks);
  // The past day the Journal view is on, with its tasks; null while it is on today.
  const [browsed, setBrowsed] = useState<{ date: string; tasks: Task[] } | null>(null);
  const browsedDate = useRef<string | null>(null);
  const [backlog, setBacklog] = useState(initial.backlog);
  // The "+359 €" that floats up on the CA card after a validation (prototype floatGain).
  const [gain, setGain] = useState<{ text: string; seq: number } | null>(null);
  const [dossiers, setDossiers] = useState(initial.dossiers);
  const [insights, setInsights] = useState(initial.insights);
  const [stats, setStats] = useState<StatsSummary>(EMPTY_STATS);
  const [invoices, setInvoices] = useState<ClientInvoiceSummary[]>([]);
  const [team, setTeam] = useState<TeamMemberSummary[]>([]);
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [sources, setSources] = useState<SourceSettings>(initial.sources);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Bumped on every toast, so two identical messages in a row still count as two events.
  const [toastSeq, setToastSeq] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastSeq((n) => n + 1);
    window.setTimeout(() => setToastMessage((current) => (current === msg ? null : current)), 2600);
  }, []);

  /**
   * Refetches everything Home shows — always for today's Paris date, read
   * now, not when the page loaded — and, when the Journal view is on a past
   * day, that day's tasks. `browse` moves the Journal: a past date, or null
   * for today; left out, it stays where it is.
   */
  const refreshHome = useCallback(async (browse?: string | null) => {
    const today = todayKeyParis();
    const target = browse === undefined ? browsedDate.current : browse;
    const past = target && target < today ? target : null;
    const [nextSummary, nextWeek, nextTasks, nextBacklog, nextInsights, pastTasks] = await Promise.all([
      api.get<HomeSummary>("/v1/me/summary"),
      api.get<WeekSummary>("/v1/me/week"),
      api.get<Task[]>(`/v1/tasks?date=${today}`),
      api.get<Task[]>("/v1/tasks/backlog"),
      api.get<BrainInsight[]>("/v1/me/insights"),
      past ? api.get<Task[]>(`/v1/tasks?date=${past}`) : Promise.resolve(null),
    ]);
    // The day and its tasks change together, so a heading never sits over another day's rows.
    browsedDate.current = past;
    setBrowsed(past && pastTasks ? { date: past, tasks: pastTasks } : null);
    setSummary(nextSummary);
    setWeek(nextWeek);
    setTasks(nextTasks);
    setBacklog(nextBacklog);
    setInsights(nextInsights);
  }, []);

  /** Journal day navigation. Today or later means "today": there is nothing to validate in the future. */
  const setJournalDate = useCallback((date: string) => refreshHome(date >= todayKeyParis() ? null : date), [refreshHome]);

  // Every task currently on screen, each once: a past day's pending rows are also in the carry-over list.
  const journalTasks = browsed?.tasks ?? tasks;
  const onScreen = useMemo(() => [...new Map([...tasks, ...journalTasks, ...backlog].map((x) => [x.id, x])).values()], [tasks, journalTasks, backlog]);

  /** A failed action shows why (a toast), instead of an unhandled rejection and a screen that silently didn't change. */
  const reportTaskError = useCallback(
    (err: unknown) => {
      const code = err instanceof ApiError ? err.code : "unknown";
      const messages = t.journal.errors as Record<string, string>;
      showToast(messages[code] ?? messages.generic!);
    },
    [t, showToast],
  );

  /** Prototype floatGain. Cleared once the animation has played, so it doesn't replay when Home is opened again. */
  const gainSeq = useRef(0);
  const floatGain = useCallback((text: string) => {
    const seq = ++gainSeq.current;
    setGain({ text, seq });
    window.setTimeout(() => setGain((g) => (g?.seq === seq ? null : g)), 1400);
  }, []);

  const refreshDossiers = useCallback(async () => {
    setDossiers(await api.get<DossierUsage[]>("/v1/dossiers"));
  }, []);

  const validateTask = useCallback(
    async (id: string) => {
      const task = onScreen.find((x) => x.id === id);
      try {
        await api.post(`/v1/tasks/${id}/validate`);
      } catch (err) {
        reportTaskError(err);
        await refreshHome().catch(() => undefined);
        return;
      }
      if (task) {
        const eur = eurOf(task.durationMin, member.hourlyRateCents).toLocaleString("fr-FR");
        const dossierName = dossiers.find((d) => d.id === task.dossierId)?.name ?? t.journal.unassigned;
        floatGain(`+${eur} €`);
        showToast(t.journal.toasts.validated(fmtMin(task.durationMin), dossierName, eur));
      }
      await refreshHome();
      await refreshDossiers();
    },
    [t, onScreen, dossiers, member.hourlyRateCents, refreshHome, refreshDossiers, reportTaskError, showToast, floatGain],
  );

  /** Validates exactly `ids` — the pending tasks the Journal is showing — never "everything pending" (BUG-2). */
  const validateAll = useCallback(
    async (ids: string[]) => {
      const shown = onScreen.filter((x) => ids.includes(x.id) && x.status === "pending");
      if (!shown.length) return;
      try {
        await api.post("/v1/tasks/validate-all", { taskIds: shown.map((x) => x.id) });
      } catch (err) {
        reportTaskError(err);
        await refreshHome().catch(() => undefined);
        return;
      }
      const totalMin = shown.reduce((sum, x) => sum + x.durationMin, 0);
      const eur = shown.reduce((sum, x) => sum + eurOf(x.durationMin, member.hourlyRateCents), 0).toLocaleString("fr-FR");
      floatGain(`+${eur} €`);
      showToast(t.journal.toasts.validatedAll(shown.length, fmtMin(totalMin), eur));
      await refreshHome();
      await refreshDossiers();
    },
    [t, onScreen, member.hourlyRateCents, refreshHome, refreshDossiers, reportTaskError, showToast, floatGain],
  );

  const reassignTask = useCallback(
    async (id: string, dossierId: string) => {
      try {
        await api.patch(`/v1/tasks/${id}`, { dossierId });
      } catch (err) {
        reportTaskError(err);
        return;
      }
      const dossier = dossiers.find((d) => d.id === dossierId);
      showToast(t.journal.toasts.reassigned(dossier?.name ?? ""));
      await refreshHome();
    },
    [t, dossiers, refreshHome, reportTaskError, showToast],
  );

  /** Rethrows: the modal stays open and shows the error. */
  const createManualTask = useCallback(
    async (input: { dossierId: string | null; title: string; startedAt: string; durationMin: number }) => {
      await api.post("/v1/tasks", input);
      showToast(t.journal.toasts.added);
      await refreshHome();
    },
    [t, refreshHome, showToast],
  );

  /** Rethrows: the edit modal stays open and shows the error. */
  const updateTask = useCallback(
    async (id: string, patch: { title?: string; startedAt?: string; durationMin?: number; dossierId?: string }) => {
      await api.patch(`/v1/tasks/${id}`, patch);
      showToast(t.journal.toasts.updated);
      await refreshHome();
      await refreshDossiers();
    },
    [t, refreshHome, refreshDossiers, showToast],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await api.delete(`/v1/tasks/${id}`);
        showToast(t.journal.toasts.deleted);
      } catch (err) {
        reportTaskError(err);
      }
      await refreshHome().catch(() => undefined);
      await refreshDossiers().catch(() => undefined);
    },
    [t, refreshHome, refreshDossiers, reportTaskError, showToast],
  );

  const unvalidateTask = useCallback(
    async (id: string) => {
      try {
        await api.post(`/v1/tasks/${id}/unvalidate`);
        showToast(t.journal.toasts.unvalidated);
      } catch (err) {
        reportTaskError(err);
      }
      await refreshHome().catch(() => undefined);
      await refreshDossiers().catch(() => undefined);
    },
    [t, refreshHome, refreshDossiers, reportTaskError, showToast],
  );

  const createDossier = useCallback(
    async (input: { name: string; clientLabel: string; budgetMinutes: number | null }) => {
      const dossier = await api.post<Dossier>("/v1/dossiers", input);
      showToast(t.dossiers.toasts.created(dossier.name));
      await refreshDossiers();
    },
    [t, refreshDossiers, showToast],
  );

  /** Rethrows: the rename modal stays open and shows the error. */
  const renameDossier = useCallback(
    async (id: string, input: { name: string; clientLabel: string }) => {
      const dossier = await api.patch<Dossier>(`/v1/dossiers/${id}`, input);
      showToast(t.dossiers.toasts.renamed(dossier.name));
      await refreshDossiers();
    },
    [t, refreshDossiers, showToast],
  );

  const updateDossierBudget = useCallback(
    async (id: string, budgetMinutes: number | null) => {
      const dossier = await api.patch<Dossier>(`/v1/dossiers/${id}`, { budgetMinutes });
      showToast(t.dossiers.toasts.budgetUpdated(dossier.name));
      await refreshDossiers();
    },
    [t, refreshDossiers, showToast],
  );

  const setDossierStatus = useCallback(
    async (id: string, status: DossierStatus) => {
      const dossier = await api.patch<Dossier>(`/v1/dossiers/${id}`, { status });
      const label = status === "progress" ? t.dossiers.statusProgress : status === "ready" ? t.dossiers.statusReady : t.dossiers.statusArchived;
      showToast(t.dossiers.toasts.statusChanged(dossier.name, label));
      await refreshDossiers();
    },
    [t, refreshDossiers, showToast],
  );

  const refreshMember = useCallback(async () => {
    setMember(await api.get<MemberProfile>("/v1/me/profile"));
  }, []);

  const refreshStats = useCallback(async () => {
    setStats(await api.get<StatsSummary>("/v1/me/stats"));
  }, []);

  const refreshInvoices = useCallback(async () => {
    setInvoices(await api.get<ClientInvoiceSummary[]>("/v1/billing/invoices"));
  }, []);

  const generateInvoice = useCallback(
    async (dossierId: string) => {
      try {
        const next = await api.post<ClientInvoiceSummary[]>("/v1/billing/invoices", { dossierId });
        setInvoices(next);
        showToast(t.billing.toasts.generated);
      } catch (err) {
        const code = err instanceof ApiError ? err.code : "unknown";
        const messages = t.billing.errors as Record<string, string>;
        showToast(messages[code] ?? messages.generic!);
      }
      // What is left to invoice on each dossier has changed (or was already stale).
      await refreshDossiers().catch(() => undefined);
    },
    [t, refreshDossiers, showToast],
  );

  /** Optimistic, rolled back if the save fails. Rethrows so the caller can say so. */
  const updateSources = useCallback(
    async (next: SourceSettings) => {
      const previous = sources;
      setSources(next);
      try {
        setSources(await api.patch<SourceSettings>("/v1/me/sources", next));
      } catch (err) {
        setSources(previous);
        throw err;
      }
    },
    [sources],
  );

  /** Saved on the member, so the theme and the alert-email choice follow them to any browser. */
  const updatePreferences = useCallback(async (patch: { theme?: ThemePreference; alertEmails?: boolean }) => {
    setMember(await api.patch<MemberProfile>("/v1/me/preferences", patch));
  }, []);

  const refreshTeam = useCallback(async () => {
    setTeam(await api.get<TeamMemberSummary[]>("/v1/firm/members"));
  }, []);

  /**
   * Menu-driven admin actions report failures as a toast instead of an
   * unhandled rejection (cannot_suspend_self, already_reminded, a 404 after
   * another admin acted, email_unavailable, …), then resync the table.
   */
  const runAdminAction = useCallback(
    async (fn: () => Promise<string>) => {
      try {
        showToast(await fn());
      } catch (err) {
        const code = err instanceof ApiError ? err.code : "unknown";
        const messages = t.admin.errors as Record<string, string>;
        showToast(messages[code] ?? messages.generic!);
      }
      await refreshTeam().catch(() => undefined);
    },
    [t, refreshTeam, showToast],
  );

  /** Rethrows: the invite modal shows the error inline. */
  const inviteMember = useCallback(
    async (email: string, role: MemberRole) => {
      await api.post("/v1/firm/invitations", { email, role });
      showToast(t.admin.toasts.invited(email, t.admin.roles[role]));
      await refreshTeam();
    },
    [t, refreshTeam, showToast],
  );

  const resendInvitation = useCallback(
    (invitationId: string) =>
      runAdminAction(async () => {
        const updated = await api.post<TeamMemberSummary>(`/v1/firm/invitations/${invitationId}/resend`);
        return t.admin.toasts.resent(updated.email);
      }),
    [t, runAdminAction],
  );

  const cancelInvitation = useCallback(
    (invitationId: string) =>
      runAdminAction(async () => {
        await api.delete(`/v1/firm/invitations/${invitationId}`);
        return t.admin.toasts.cancelled;
      }),
    [t, runAdminAction],
  );

  const setMemberAdmin = useCallback(
    (memberId: string, isAdmin: boolean) =>
      runAdminAction(async () => {
        const updated = await api.patch<TeamMemberSummary>(`/v1/firm/members/${memberId}`, { isAdmin });
        // Stepping down yourself: the console closes on the next render, once the profile says so.
        if (memberId === member.id) await refreshMember().catch(() => undefined);
        return isAdmin ? t.admin.toasts.adminGranted(updated.displayName) : t.admin.toasts.adminRevoked(updated.displayName);
      }),
    [t, member.id, refreshMember, runAdminAction],
  );

  /** Rethrows: the rename modal shows the error inline. */
  const renameFirm = useCallback(
    async (name: string) => {
      await api.patch("/v1/firm", { name });
      showToast(t.admin.toasts.firmRenamed);
      await refreshMember();
    },
    [t, refreshMember, showToast],
  );

  const refreshFeedback = useCallback(async () => {
    try {
      setFeedback(await api.get<FeedbackEntry[]>("/v1/feedback"));
    } catch {
      /* keep the last good list */
    }
  }, []);

  /** Rethrows: the feedback form shows the error inline and keeps the text. */
  const sendFeedback = useCallback(
    async (category: FeedbackCategory, message: string) => {
      await api.post("/v1/feedback", { category, message });
      showToast(t.admin.feedback.sent);
      await refreshFeedback();
    },
    [t, refreshFeedback, showToast],
  );

  /** Rethrows: the edit modal shows the error inline and stays open. */
  const updateMember = useCallback(
    async (memberId: string, patch: { role?: MemberRole; hourlyRateCents?: number }) => {
      const updated = await api.patch<TeamMemberSummary>(`/v1/firm/members/${memberId}`, patch);
      showToast(t.admin.toasts.updated(updated.displayName, Math.round(updated.hourlyRateCents / 100)));
      // Editing yourself changes your own rate-based figures too. The save already succeeded,
      // so a failed refresh here must not surface as a save error in the modal.
      await Promise.all([refreshTeam(), ...(memberId === member.id ? [refreshMember(), refreshHome()] : [])]).catch(() => undefined);
    },
    [t, member.id, refreshTeam, refreshMember, refreshHome, showToast],
  );

  const remindMember = useCallback(
    (memberId: string) =>
      runAdminAction(async () => {
        const updated = await api.post<TeamMemberSummary>(`/v1/firm/members/${memberId}/remind`);
        return t.admin.toasts.reminded(updated.displayName);
      }),
    [t, runAdminAction],
  );

  const suspendMember = useCallback(
    (memberId: string) =>
      runAdminAction(async () => {
        const updated = await api.post<TeamMemberSummary>(`/v1/firm/members/${memberId}/suspend`);
        return t.admin.toasts.suspended(updated.displayName);
      }),
    [t, runAdminAction],
  );

  const reactivateMember = useCallback(
    (memberId: string) =>
      runAdminAction(async () => {
        const updated = await api.post<TeamMemberSummary>(`/v1/firm/members/${memberId}/reactivate`);
        return t.admin.toasts.reactivated(updated.displayName);
      }),
    [t, runAdminAction],
  );

  // Background refreshes: a failure (network blip, expired session) must not surface as an unhandled rejection.
  const refreshActivity = useCallback(async () => {
    try {
      setActivity(await api.get<ActivityEntry[]>("/v1/me/activity"));
    } catch {
      /* keep the last good feed */
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      setNotifications(await api.get<NotificationView[]>("/v1/notifications"));
    } catch {
      /* keep the last good list */
    }
  }, []);

  const markNotificationRead = useCallback(async (id: string) => {
    try {
      await api.post(`/v1/notifications/${id}/read`);
      setNotifications((current) => current.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    } catch {
      await refreshNotifications();
    }
  }, [refreshNotifications]);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await api.post("/v1/notifications/read-all");
      setNotifications((current) => current.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    } catch {
      await refreshNotifications();
    }
  }, [refreshNotifications]);

  return {
    member,
    summary,
    week,
    tasks,
    backlog,
    journalTasks,
    journalDate: browsed?.date ?? todayKeyParis(),
    setJournalDate,
    gain,
    dossiers,
    insights,
    stats,
    invoices,
    team,
    notifications,
    activity,
    refreshActivity,
    toastMessage,
    toastSeq,
    showToast,
    refreshHome,
    refreshDossiers,
    refreshMember,
    refreshStats,
    refreshInvoices,
    generateInvoice,
    validateTask,
    validateAll,
    reassignTask,
    createManualTask,
    updateTask,
    deleteTask,
    unvalidateTask,
    updatePreferences,
    sources,
    updateSources,
    createDossier,
    renameDossier,
    updateDossierBudget,
    setDossierStatus,
    refreshTeam,
    inviteMember,
    resendInvitation,
    cancelInvitation,
    updateMember,
    remindMember,
    suspendMember,
    reactivateMember,
    setMemberAdmin,
    renameFirm,
    feedback,
    refreshFeedback,
    sendFeedback,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  };
}

export type DashboardApi = ReturnType<typeof useDashboard>;

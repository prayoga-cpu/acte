"use client";

import { useCallback, useState } from "react";
import type {
  ActivityEntry,
  BrainInsight,
  ClientInvoiceSummary,
  Dossier,
  DossierStatus,
  DossierUsage,
  HomeSummary,
  MemberProfile,
  MemberRole,
  NotificationView,
  StatsSummary,
  Task,
  TeamMemberSummary,
  WeekSummary,
} from "@acte/contracts";
import { api, ApiError } from "./api-client";
import { useI18n } from "@/i18n/locale-context";
import { todayKeyParis } from "./time";

export interface DashboardInitialData {
  member: MemberProfile;
  summary: HomeSummary;
  week: WeekSummary;
  tasks: Task[];
  dossiers: DossierUsage[];
  insights: BrainInsight[];
}

const EMPTY_STATS: StatsSummary = { months: [], sourceBreakdown: [] };

export function useDashboard(initial: DashboardInitialData) {
  const { t } = useI18n();
  const [member, setMember] = useState(initial.member);
  const [summary, setSummary] = useState(initial.summary);
  const [week, setWeek] = useState(initial.week);
  const [tasks, setTasks] = useState(initial.tasks);
  const [dossiers, setDossiers] = useState(initial.dossiers);
  const [insights, setInsights] = useState(initial.insights);
  const [stats, setStats] = useState<StatsSummary>(EMPTY_STATS);
  const [invoices, setInvoices] = useState<ClientInvoiceSummary[]>([]);
  const [team, setTeam] = useState<TeamMemberSummary[]>([]);
  const [notifications, setNotifications] = useState<NotificationView[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Bumped on every toast, so two identical messages in a row still count as two events.
  const [toastSeq, setToastSeq] = useState(0);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastSeq((n) => n + 1);
    window.setTimeout(() => setToastMessage((current) => (current === msg ? null : current)), 2600);
  }, []);

  const refreshHome = useCallback(async () => {
    const [nextSummary, nextWeek, nextTasks, nextInsights] = await Promise.all([
      api.get<HomeSummary>("/v1/me/summary"),
      api.get<WeekSummary>("/v1/me/week"),
      api.get<Task[]>(`/v1/tasks?date=${todayKeyParis()}`),
      api.get<BrainInsight[]>("/v1/me/insights"),
    ]);
    setSummary(nextSummary);
    setWeek(nextWeek);
    setTasks(nextTasks);
    setInsights(nextInsights);
  }, []);

  const refreshDossiers = useCallback(async () => {
    setDossiers(await api.get<DossierUsage[]>("/v1/dossiers"));
  }, []);

  const validateTask = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      await api.post(`/v1/tasks/${id}/validate`);
      if (task) {
        const gainEur = Math.round((task.durationMin / 60) * (member.hourlyRateCents / 100));
        showToast(`✓ tâche validée — +${gainEur.toLocaleString("fr-FR")} € sécurisés`);
      }
      await refreshHome();
      await refreshDossiers();
    },
    [tasks, member.hourlyRateCents, refreshHome, refreshDossiers, showToast],
  );

  const validateAll = useCallback(async () => {
    const pendingCount = tasks.filter((t) => t.status === "pending").length;
    if (!pendingCount) return;
    await api.post("/v1/tasks/validate-all");
    showToast(`✓ ${pendingCount} tâche${pendingCount > 1 ? "s" : ""} intégrée${pendingCount > 1 ? "s" : ""}`);
    await refreshHome();
    await refreshDossiers();
  }, [tasks, refreshHome, refreshDossiers, showToast]);

  const reassignTask = useCallback(
    async (id: string, dossierId: string) => {
      await api.patch(`/v1/tasks/${id}`, { dossierId });
      const dossier = dossiers.find((d) => d.id === dossierId);
      showToast(`Dossier mis à jour${dossier ? " · " + dossier.name : ""}`);
      await refreshHome();
    },
    [dossiers, refreshHome, showToast],
  );

  const createManualTask = useCallback(
    async (input: { dossierId: string | null; title: string; startedAt: string; durationMin: number }) => {
      await api.post("/v1/tasks", input);
      showToast("Tâche ajoutée au journal");
      await refreshHome();
    },
    [refreshHome, showToast],
  );

  const createDossier = useCallback(
    async (input: { name: string; clientLabel: string; budgetMinutes: number | null }) => {
      const dossier = await api.post<Dossier>("/v1/dossiers", input);
      showToast(`Dossier « ${dossier.name} » créé`);
      await refreshDossiers();
    },
    [refreshDossiers, showToast],
  );

  const updateDossierBudget = useCallback(
    async (id: string, budgetMinutes: number | null) => {
      const dossier = await api.patch<Dossier>(`/v1/dossiers/${id}`, { budgetMinutes });
      showToast(`${dossier.name} · budget mis à jour`);
      await refreshDossiers();
    },
    [refreshDossiers, showToast],
  );

  const setDossierStatus = useCallback(
    async (id: string, status: DossierStatus) => {
      const dossier = await api.patch<Dossier>(`/v1/dossiers/${id}`, { status });
      const label = status === "progress" ? "En cours" : status === "ready" ? "Prêt à facturer" : "Archivé";
      showToast(`${dossier.name} · statut « ${label} »`);
      await refreshDossiers();
    },
    [refreshDossiers, showToast],
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
      const next = await api.post<ClientInvoiceSummary[]>("/v1/billing/invoices", { dossierId });
      setInvoices(next);
      showToast("Facture générée");
    },
    [showToast],
  );

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
    createDossier,
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
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  };
}

export type DashboardApi = ReturnType<typeof useDashboard>;

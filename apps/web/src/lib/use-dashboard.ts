"use client";

import { useCallback, useState } from "react";
import type {
  BrainInsight,
  ClientInvoiceSummary,
  Dossier,
  DossierStatus,
  DossierUsage,
  HomeSummary,
  Member,
  StatsSummary,
  Task,
  WeekSummary,
} from "@acte/contracts";
import { api } from "./api-client";
import { todayKeyParis } from "./time";

export interface DashboardInitialData {
  member: Member;
  summary: HomeSummary;
  week: WeekSummary;
  tasks: Task[];
  dossiers: DossierUsage[];
  insights: BrainInsight[];
}

const EMPTY_STATS: StatsSummary = { months: [], sourceBreakdown: [] };

export function useDashboard(initial: DashboardInitialData) {
  const [member, setMember] = useState(initial.member);
  const [summary, setSummary] = useState(initial.summary);
  const [week, setWeek] = useState(initial.week);
  const [tasks, setTasks] = useState(initial.tasks);
  const [dossiers, setDossiers] = useState(initial.dossiers);
  const [insights, setInsights] = useState(initial.insights);
  const [stats, setStats] = useState<StatsSummary>(EMPTY_STATS);
  const [invoices, setInvoices] = useState<ClientInvoiceSummary[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
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
    setMember(await api.get<Member>("/v1/me/profile"));
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

  return {
    member,
    summary,
    week,
    tasks,
    dossiers,
    insights,
    stats,
    invoices,
    toastMessage,
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
  };
}

export type DashboardApi = ReturnType<typeof useDashboard>;

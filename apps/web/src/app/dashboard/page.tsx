import { redirect } from "next/navigation";
import type { BrainInsight, DossierUsage, HomeSummary, MemberProfile, OnboardingState, SourceSettings, Task, WeekSummary } from "@acte/contracts";
import { apiServerFetch } from "@/lib/api-server";
import { todayKeyParis } from "@/lib/time";
import { Shell } from "@/components/shell";

export default async function DashboardPage() {
  const member = await apiServerFetch<MemberProfile>("/v1/me/profile");
  if (!member) {
    redirect("/login");
  }

  const [summary, week, tasks, backlog, dossiers, insights, sources, onboarding] = await Promise.all([
    apiServerFetch<HomeSummary>("/v1/me/summary"),
    apiServerFetch<WeekSummary>("/v1/me/week"),
    apiServerFetch<Task[]>(`/v1/tasks?date=${todayKeyParis()}`),
    apiServerFetch<Task[]>("/v1/tasks/backlog"),
    apiServerFetch<DossierUsage[]>("/v1/dossiers"),
    apiServerFetch<BrainInsight[]>("/v1/me/insights"),
    apiServerFetch<SourceSettings>("/v1/me/sources"),
    // Help is a convenience: if this one call fails, the dashboard still renders, without the welcome (D-021).
    apiServerFetch<OnboardingState>("/v1/me/onboarding").catch(() => null),
  ]);

  return (
    <Shell
      initial={{
        member,
        summary: summary!,
        week: week!,
        tasks: tasks!,
        backlog: backlog!,
        dossiers: dossiers!,
        insights: insights!,
        sources: sources!,
      }}
      onboarding={onboarding}
      complianceClaimsEnabled={process.env.COMPLIANCE_CLAIMS_ENABLED === "true"}
      companionUiEnabled={process.env.COMPANION_UI_ENABLED === "true"}
    />
  );
}

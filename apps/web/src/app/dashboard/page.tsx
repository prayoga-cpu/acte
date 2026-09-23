import { redirect } from "next/navigation";
import type { BrainInsight, DossierUsage, HomeSummary, Member, Task, WeekSummary } from "@acte/contracts";
import { apiServerFetch } from "@/lib/api-server";
import { todayKeyParis } from "@/lib/time";
import { Shell } from "@/components/shell";

export default async function DashboardPage() {
  const member = await apiServerFetch<Member>("/v1/me/profile");
  if (!member) {
    redirect("/login");
  }

  const [summary, week, tasks, dossiers, insights] = await Promise.all([
    apiServerFetch<HomeSummary>("/v1/me/summary"),
    apiServerFetch<WeekSummary>("/v1/me/week"),
    apiServerFetch<Task[]>(`/v1/tasks?date=${todayKeyParis()}`),
    apiServerFetch<DossierUsage[]>("/v1/dossiers"),
    apiServerFetch<BrainInsight[]>("/v1/me/insights"),
  ]);

  return (
    <Shell
      initial={{
        member,
        summary: summary!,
        week: week!,
        tasks: tasks!,
        dossiers: dossiers!,
        insights: insights!,
      }}
      complianceClaimsEnabled={process.env.COMPLIANCE_CLAIMS_ENABLED === "true"}
    />
  );
}

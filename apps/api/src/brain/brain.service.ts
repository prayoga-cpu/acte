import { Inject, Injectable } from "@nestjs/common";
import { fmtMin, type BrainInsight } from "@acte/contracts";
import { TasksRepository } from "../data-access/tasks.repository.js";
import type { FirmContext } from "../data-access/firm-context.js";

/**
 * "Le Cerveau d'ACTE" (PROTOTYPE_MAP.md): deterministic templated insights
 * from the member's own activity. No LLM before stage 5, and no P0/P1 data
 * (filenames, addresses) — only aggregate counts and durations.
 */
@Injectable()
export class BrainService {
  constructor(@Inject(TasksRepository) private readonly tasks: TasksRepository) {}

  async insights(ctx: FirmContext): Promise<BrainInsight[]> {
    const all = await this.tasks.listForMember(ctx);
    const pending = all.filter((t) => t.status === "pending");
    const now = new Date().toISOString();
    const insights: BrainInsight[] = [];

    if (pending.length > 0) {
      const pendingMin = pending.reduce((s, t) => s + t.durationMin, 0);
      insights.push({
        id: "pending-summary",
        message: `${pending.length} tâche${pending.length > 1 ? "s" : ""} en attente de validation, soit ${fmtMin(pendingMin)}.`,
        createdAt: now,
      });
    } else {
      insights.push({ id: "all-clear", message: "Journal à jour : aucune tâche en attente.", createdAt: now });
    }

    const lowConfidence = pending.filter((t) => (t.confidence ?? 100) < 80);
    if (lowConfidence.length > 0) {
      insights.push({
        id: "low-confidence",
        message: `${lowConfidence.length} tâche${lowConfidence.length > 1 ? "s" : ""} à vérifier (confiance sous 80 %).`,
        createdAt: now,
      });
    }

    return insights;
  }
}

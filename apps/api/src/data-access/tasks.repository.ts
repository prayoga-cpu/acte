import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import type { TaskSource, TaskStatus } from "@acte/contracts";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { corrections, dossiers, members, tasks } from "../db/schema/index.js";
import { decryptField, encryptField } from "../crypto/field-encryption.js";
import { FirmKeyService } from "../crypto/firm-key.service.js";
import { parisDateKey, parisMonthKey } from "../lib/time.js";
import type { FirmContext } from "./firm-context.js";

export interface TaskRecord {
  id: string;
  firmId: string;
  memberId: string;
  dossierId: string | null;
  source: TaskSource;
  title: string;
  startedAt: string;
  endedAt: string;
  durationMin: number;
  confidence: number | null;
  status: TaskStatus;
  validatedAt: string | null;
  rateCents: number | null;
  invoiceId: string | null;
  corrected: boolean;
}

type TaskRow = typeof tasks.$inferSelect;

/**
 * The only place that reads or writes the `task` and `correction` tables
 * (one exception: ClientInvoicesRepository stamps `invoice_id` inside the
 * transaction that creates the invoice). Scoped to `ctx.firmId`, and to
 * `ctx.memberId` for anything that touches a single lawyer's own tasks
 * (docs/03-security/PRIVACY_MODEL.md rule 4: an admin sees aggregates, never
 * another member's task detail). Discarded tasks are never returned or
 * counted anywhere.
 */
@Injectable()
export class TasksRepository {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(FirmKeyService) private readonly firmKeys: FirmKeyService,
  ) {}

  private decrypt(row: TaskRow, dataKey: Buffer, corrected = false): TaskRecord {
    return {
      id: row.id,
      firmId: row.firmId,
      memberId: row.memberId,
      dossierId: row.dossierId,
      source: row.source,
      title: decryptField(row.title, dataKey),
      startedAt: row.startedAt.toISOString(),
      endedAt: row.endedAt.toISOString(),
      durationMin: row.durationMin,
      confidence: row.confidence,
      status: row.status,
      validatedAt: row.validatedAt ? row.validatedAt.toISOString() : null,
      rateCents: row.rateCents,
      invoiceId: row.invoiceId,
      corrected,
    };
  }

  /** Ids of the member's tasks that were moved to another dossier at least once. */
  private async correctedTaskIds(ctx: FirmContext): Promise<Set<string>> {
    const rows = await this.db.selectDistinct({ taskId: corrections.taskId }).from(corrections).where(eq(corrections.memberId, ctx.memberId));
    return new Set(rows.map((r) => r.taskId));
  }

  private own(ctx: FirmContext) {
    return and(eq(tasks.firmId, ctx.firmId), eq(tasks.memberId, ctx.memberId), ne(tasks.status, "discarded"));
  }

  async listForMember(ctx: FirmContext, date?: string): Promise<TaskRecord[]> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const [rows, corrected] = await Promise.all([
      this.db.select().from(tasks).where(this.own(ctx)).orderBy(asc(tasks.startedAt)),
      this.correctedTaskIds(ctx),
    ]);
    const decrypted = rows.map((r) => this.decrypt(r, dataKey, corrected.has(r.id)));
    if (!date) return decrypted;
    return decrypted.filter((t) => parisDateKey(new Date(t.startedAt)) === date);
  }

  /** Still-pending tasks from before `todayKey` (a Paris date) — the Journal's carry-over list. */
  async listBacklog(ctx: FirmContext, todayKey: string): Promise<TaskRecord[]> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const [rows, corrected] = await Promise.all([
      this.db.select().from(tasks).where(and(this.own(ctx), eq(tasks.status, "pending"))).orderBy(asc(tasks.startedAt)),
      this.correctedTaskIds(ctx),
    ]);
    return rows
      .filter((r) => parisDateKey(r.startedAt) < todayKey)
      .map((r) => this.decrypt(r, dataKey, corrected.has(r.id)));
  }

  async findOwnedById(ctx: FirmContext, id: string): Promise<TaskRecord | null> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const [row] = await this.db.select().from(tasks).where(and(this.own(ctx), eq(tasks.id, id)));
    if (!row) return null;
    return this.decrypt(row, dataKey, (await this.correctedTaskIds(ctx)).has(row.id));
  }

  /** Edits a still-pending task's title, start or duration. Null when it isn't the caller's, or isn't pending. */
  async updatePending(
    ctx: FirmContext,
    id: string,
    patch: { title?: string; startedAt?: string; durationMin?: number },
  ): Promise<TaskRecord | null> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    return this.db.transaction(async (tx) => {
      const [current] = await tx.select().from(tasks).where(and(this.own(ctx), eq(tasks.id, id), eq(tasks.status, "pending")));
      if (!current) return null;
      const startedAt = patch.startedAt ? new Date(patch.startedAt) : current.startedAt;
      const durationMin = patch.durationMin ?? current.durationMin;
      const [row] = await tx
        .update(tasks)
        .set({
          ...(patch.title !== undefined ? { title: encryptField(patch.title, dataKey) } : {}),
          startedAt,
          durationMin,
          endedAt: new Date(startedAt.getTime() + durationMin * 60_000),
        })
        .where(and(this.own(ctx), eq(tasks.id, id), eq(tasks.status, "pending")))
        .returning();
      return row ? this.decrypt(row, dataKey) : null;
    });
  }

  /** "Supprimer" — a soft delete: the row stays for the audit trail, but nothing lists or counts it again. */
  async discardPending(ctx: FirmContext, id: string): Promise<boolean> {
    const rows = await this.db
      .update(tasks)
      .set({ status: "discarded" })
      .where(and(this.own(ctx), eq(tasks.id, id), eq(tasks.status, "pending")))
      .returning({ id: tasks.id });
    return rows.length > 0;
  }

  async createManual(
    ctx: FirmContext,
    input: { dossierId: string | null; title: string; startedAt: string; durationMin: number },
  ): Promise<TaskRecord> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const startedAt = new Date(input.startedAt);
    const endedAt = new Date(startedAt.getTime() + input.durationMin * 60_000);
    const [row] = await this.db
      .insert(tasks)
      .values({
        firmId: ctx.firmId,
        memberId: ctx.memberId,
        dossierId: input.dossierId,
        source: "manual",
        title: encryptField(input.title, dataKey),
        startedAt,
        endedAt,
        durationMin: input.durationMin,
        confidence: null,
        status: "pending",
      })
      .returning();
    return this.decrypt(row!, dataKey);
  }

  /** Reassigns a task to a different dossier and logs a correction, atomically. */
  async reassign(ctx: FirmContext, taskId: string, toDossierId: string): Promise<TaskRecord | null> {
    return this.db.transaction(async (tx) => {
      // Time already on an invoice draft stays on the dossier it was billed to.
      const [current] = await tx.select().from(tasks).where(and(this.own(ctx), eq(tasks.id, taskId), isNull(tasks.invoiceId)));
      if (!current) return null;

      const [target] = await tx.select({ id: dossiers.id }).from(dossiers).where(and(eq(dossiers.firmId, ctx.firmId), eq(dossiers.id, toDossierId)));
      if (!target) throw new Error("Unknown dossier");

      const [updated] = await tx
        .update(tasks)
        .set({ dossierId: toDossierId })
        .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.id, taskId)))
        .returning();

      await tx.insert(corrections).values({
        taskId,
        memberId: ctx.memberId,
        fromDossierId: current.dossierId,
        toDossierId,
      });

      const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
      return this.decrypt(updated!, dataKey, true);
    });
  }

  /** Stamps the member's current rate on the task, so later rate changes don't re-price it. */
  async validate(ctx: FirmContext, taskId: string, rateCents: number): Promise<TaskRecord | null> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const [row] = await this.db
      .update(tasks)
      .set({ status: "validated", validatedAt: new Date(), rateCents })
      .where(and(this.own(ctx), eq(tasks.id, taskId), eq(tasks.status, "pending")))
      .returning();
    return row ? this.decrypt(row, dataKey) : null;
  }

  /** Back to pending — refused (null) once the time is on an invoice draft. */
  async unvalidate(ctx: FirmContext, taskId: string): Promise<TaskRecord | null> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const [row] = await this.db
      .update(tasks)
      .set({ status: "pending", validatedAt: null, rateCents: null })
      .where(and(this.own(ctx), eq(tasks.id, taskId), eq(tasks.status, "validated"), isNull(tasks.invoiceId)))
      .returning();
    return row ? this.decrypt(row, dataKey) : null;
  }

  /** Validates exactly `taskIds` (the caller's own, still pending) — never "everything pending". */
  async validateMany(ctx: FirmContext, taskIds: string[], rateCents: number): Promise<TaskRecord[]> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const rows = await this.db
      .update(tasks)
      .set({ status: "validated", validatedAt: new Date(), rateCents })
      .where(and(this.own(ctx), inArray(tasks.id, taskIds), eq(tasks.status, "pending")))
      .returning();
    return rows.map((r) => this.decrypt(r, dataKey));
  }

  /**
   * Firm-wide (not member-scoped) validated time on one dossier that is not
   * yet on an invoice, for a billing draft. Durations, dates and rates only —
   * no task titles are read, so this never exposes another member's task
   * detail (PRIVACY_MODEL rule 4). A task validated before rates were
   * stamped falls back to its author's current rate.
   */
  async listUninvoicedForDossier(firmId: string, dossierId: string): Promise<{ id: string; durationMin: number; rateCents: number; startedAt: Date }[]> {
    const rows = await this.db
      .select({
        id: tasks.id,
        durationMin: tasks.durationMin,
        rateCents: tasks.rateCents,
        memberRateCents: members.hourlyRateCents,
        startedAt: tasks.startedAt,
      })
      .from(tasks)
      .innerJoin(members, eq(tasks.memberId, members.id))
      .where(and(eq(tasks.firmId, firmId), eq(tasks.dossierId, dossierId), eq(tasks.status, "validated"), isNull(tasks.invoiceId)));
    return rows.map((r) => ({ id: r.id, durationMin: r.durationMin, rateCents: r.rateCents ?? r.memberRateCents, startedAt: r.startedAt }));
  }

  /** Firm-wide minute totals per dossier, for the Dossiers and Billing views. `monthMin` is the current Paris month. */
  async minutesByDossier(
    firmId: string,
  ): Promise<{ dossierId: string; validatedMin: number; pendingMin: number; monthMin: number; uninvoicedMin: number }[]> {
    const rows = await this.db
      .select({
        dossierId: tasks.dossierId,
        status: tasks.status,
        durationMin: tasks.durationMin,
        startedAt: tasks.startedAt,
        invoiceId: tasks.invoiceId,
      })
      .from(tasks)
      .where(and(eq(tasks.firmId, firmId), isNotNull(tasks.dossierId)));

    const monthKey = parisMonthKey(new Date());
    const byDossier = new Map<string, { validatedMin: number; pendingMin: number; monthMin: number; uninvoicedMin: number }>();
    for (const row of rows) {
      const key = row.dossierId as string;
      const entry = byDossier.get(key) ?? { validatedMin: 0, pendingMin: 0, monthMin: 0, uninvoicedMin: 0 };
      if (row.status === "validated") {
        entry.validatedMin += row.durationMin;
        if (parisMonthKey(row.startedAt) === monthKey) entry.monthMin += row.durationMin;
        if (!row.invoiceId) entry.uninvoicedMin += row.durationMin;
      }
      if (row.status === "pending") entry.pendingMin += row.durationMin;
      byDossier.set(key, entry);
    }
    return [...byDossier.entries()].map(([dossierId, v]) => ({ dossierId, ...v }));
  }

  /**
   * Firm-wide per-member captured/validated minutes for the current Paris
   * month, plus the pending count and the oldest still-pending task's date
   * (any month) — for the admin console team table and the "team validation
   * lagging" notification rule. Durations and status only, no task titles
   * (PRIVACY_MODEL rule 4: an admin sees aggregates, never another member's
   * task detail).
   */
  async taskStatsByMember(
    firmId: string,
  ): Promise<Map<string, { capturedMin: number; validatedMin: number; pendingCount: number; oldestPendingAt: string | null }>> {
    const monthKey = parisMonthKey(new Date());
    const rows = await this.db
      .select({ memberId: tasks.memberId, status: tasks.status, durationMin: tasks.durationMin, startedAt: tasks.startedAt })
      .from(tasks)
      .where(and(eq(tasks.firmId, firmId), ne(tasks.status, "discarded")));

    const byMember = new Map<
      string,
      { capturedMin: number; validatedMin: number; pendingCount: number; oldestPendingAt: string | null }
    >();
    for (const row of rows) {
      const entry = byMember.get(row.memberId) ?? {
        capturedMin: 0,
        validatedMin: 0,
        pendingCount: 0,
        oldestPendingAt: null,
      };
      if (parisMonthKey(row.startedAt) === monthKey) {
        entry.capturedMin += row.durationMin;
        if (row.status === "validated") entry.validatedMin += row.durationMin;
      }
      if (row.status === "pending") {
        entry.pendingCount += 1;
        const iso = row.startedAt.toISOString();
        if (!entry.oldestPendingAt || iso < entry.oldestPendingAt) entry.oldestPendingAt = iso;
      }
      byMember.set(row.memberId, entry);
    }
    return byMember;
  }

  /** All validated tasks for the firm, decrypted, for CSV export. Firm-wide by design (export is an admin/lawyer action on their own validated time). */
  async listValidatedForExport(ctx: FirmContext): Promise<TaskRecord[]> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const rows = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.memberId, ctx.memberId), eq(tasks.status, "validated")))
      .orderBy(asc(tasks.startedAt));
    return rows.map((r) => this.decrypt(r, dataKey));
  }
}

import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import type { TaskSource, TaskStatus } from "@acte/contracts";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { corrections, dossiers, members, tasks } from "../db/schema/index.js";
import { decryptField, encryptField } from "../crypto/field-encryption.js";
import { FirmKeyService } from "../crypto/firm-key.service.js";
import { parisDateKey } from "../lib/time.js";
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
}

type TaskRow = typeof tasks.$inferSelect;

/**
 * The only place that reads or writes the `task` and `correction` tables.
 * Scoped to `ctx.firmId`, and to `ctx.memberId` for anything that touches a
 * single lawyer's own tasks (docs/03-security/PRIVACY_MODEL.md rule 4: an
 * admin sees aggregates, never another member's task detail).
 */
@Injectable()
export class TasksRepository {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(FirmKeyService) private readonly firmKeys: FirmKeyService,
  ) {}

  private decrypt(row: TaskRow, dataKey: Buffer): TaskRecord {
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
    };
  }

  async listForMember(ctx: FirmContext, date?: string): Promise<TaskRecord[]> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const rows = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.memberId, ctx.memberId)))
      .orderBy(asc(tasks.startedAt));
    const decrypted = rows.map((r) => this.decrypt(r, dataKey));
    if (!date) return decrypted;
    return decrypted.filter((t) => parisDateKey(new Date(t.startedAt)) === date);
  }

  async findOwnedById(ctx: FirmContext, id: string): Promise<TaskRecord | null> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const [row] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.memberId, ctx.memberId), eq(tasks.id, id)));
    return row ? this.decrypt(row, dataKey) : null;
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
      const [current] = await tx
        .select()
        .from(tasks)
        .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.memberId, ctx.memberId), eq(tasks.id, taskId)));
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
      return this.decrypt(updated!, dataKey);
    });
  }

  async validate(ctx: FirmContext, taskId: string): Promise<TaskRecord | null> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const [row] = await this.db
      .update(tasks)
      .set({ status: "validated", validatedAt: new Date() })
      .where(
        and(
          eq(tasks.firmId, ctx.firmId),
          eq(tasks.memberId, ctx.memberId),
          eq(tasks.id, taskId),
          eq(tasks.status, "pending"),
        ),
      )
      .returning();
    return row ? this.decrypt(row, dataKey) : null;
  }

  async validateAllPending(ctx: FirmContext): Promise<TaskRecord[]> {
    const dataKey = await this.firmKeys.getDataKey(ctx.firmId);
    const rows = await this.db
      .update(tasks)
      .set({ status: "validated", validatedAt: new Date() })
      .where(and(eq(tasks.firmId, ctx.firmId), eq(tasks.memberId, ctx.memberId), eq(tasks.status, "pending")))
      .returning();
    return rows.map((r) => this.decrypt(r, dataKey));
  }

  /**
   * Firm-wide (not member-scoped) validated total for one dossier, for a
   * billing draft. Durations and rates only — no task titles are read, so
   * this never exposes another member's task detail (PRIVACY_MODEL rule 4).
   */
  async sumValidatedForDossier(firmId: string, dossierId: string): Promise<{ minutes: number; amountCents: number }> {
    const rows = await this.db
      .select({ durationMin: tasks.durationMin, hourlyRateCents: members.hourlyRateCents })
      .from(tasks)
      .innerJoin(members, eq(tasks.memberId, members.id))
      .where(and(eq(tasks.firmId, firmId), eq(tasks.dossierId, dossierId), eq(tasks.status, "validated")));

    return rows.reduce(
      (acc, r) => ({
        minutes: acc.minutes + r.durationMin,
        amountCents: acc.amountCents + Math.round((r.durationMin / 60) * r.hourlyRateCents),
      }),
      { minutes: 0, amountCents: 0 },
    );
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

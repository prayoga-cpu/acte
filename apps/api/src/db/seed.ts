/**
 * Reproduces the prototype's demo firm (docs/01-product/PROTOTYPE_MAP.md
 * "Mock data → entities") from packages/contracts fixtures, so the Home,
 * Journal and Dossiers views show the same shapes as prototype/acte-dashboard-v16.html.
 *
 * Historical dossier minutes (`usedMin`) and this-month revenue are seeded
 * as plausible synthetic data, not reproduced to the exact euro — the
 * prototype's mock totals were never meant to survive contact with a real,
 * computed backend. What IS reproduced exactly is today's Journal: the six
 * INITIAL_TASKS with their original titles, times, confidence and dossier,
 * plus the "3 h 10 already validated this morning" baseline, so Home's KPIs
 * match the prototype (6 h 20 captured / 3 h 10 validated / 3 h 10 pending).
 */
import { demoDossiers, demoTasks, demoTeam } from "@acte/contracts";
import { eq } from "drizzle-orm";
import { auth } from "../auth/auth.config.js";
import { DossiersRepository } from "../data-access/dossiers.repository.js";
import { FirmKeyService, masterKeyProvider } from "../crypto/firm-key.service.js";
import type { FirmContext } from "../data-access/firm-context.js";
import { db, queryClient } from "./client.js";
import { encryptField } from "../crypto/field-encryption.js";
import { firms, members, tasks } from "./schema/index.js";
import { parisDateKey } from "../lib/time.js";

const DEV_PASSWORD = "acte-dev-2026";
const EMAIL_DOMAIN = "charpentier-associes.fr";

function emailFor(initials: string): string {
  return `${initials.toLowerCase()}@${EMAIL_DOMAIN}`;
}

/** "09h15" -> a Date for today (Europe/Paris) at that local time, as a UTC instant. */
function todayAtParisTime(hhmm: string): Date {
  const [h, m] = hhmm.replace("h", ":").split(":").map(Number) as [number, number];
  const todayKey = parisDateKey(new Date());
  // Paris is UTC+1 (winter) or UTC+2 (summer); approximate with the offset
  // implied by comparing local formatting, good enough for seed data.
  const naiveUtc = new Date(`${todayKey}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`);
  const parisLabel = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    hour12: false,
  }).format(naiveUtc);
  const offsetHours = h - Number(parisLabel);
  naiveUtc.setUTCHours(naiveUtc.getUTCHours() + offsetHours);
  return naiveUtc;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

async function main() {
  console.log("Seeding demo firm...");
  const firmKeys = new FirmKeyService(db, masterKeyProvider());

  let canonicalFirmId: string | null = null;
  const memberIdByInitials = new Map<string, string>();

  for (const person of demoTeam) {
    const email = emailFor(person.initials);
    const signUp = await auth.api.signUpEmail({
      body: { email, password: DEV_PASSWORD, name: person.displayName },
    });
    const authUserId = signUp.user.id;

    const [memberRow] = await db.select().from(members).where(eq(members.authUserId, authUserId));
    if (!memberRow) throw new Error(`Signup hook did not create a member row for ${email}`);

    if (canonicalFirmId === null) {
      canonicalFirmId = memberRow.firmId;
    } else if (memberRow.firmId !== canonicalFirmId) {
      // The signup hook gives every new user their own firm; fold this one
      // into the founder's firm so the seed matches "one demo firm, five members".
      await db.update(members).set({ firmId: canonicalFirmId }).where(eq(members.id, memberRow.id));
      await db.delete(firms).where(eq(firms.id, memberRow.firmId));
    }

    await db
      .update(members)
      .set({
        role: person.role,
        isPartner: person.isPartner,
        isAdmin: person.initials === "VC",
        status: person.status,
        hourlyRateCents: person.rateEur * 100,
      })
      .where(eq(members.id, memberRow.id));

    memberIdByInitials.set(person.initials, memberRow.id);
  }

  if (!canonicalFirmId) throw new Error("No firm was created");
  const firmId = canonicalFirmId;
  const ctx: FirmContext = { firmId, memberId: memberIdByInitials.get("VC")!, isAdmin: true };

  const dossierRepo = new DossiersRepository(db, firmKeys);
  const dossierIdByKey = new Map<string, string>();

  for (const d of demoDossiers) {
    const isBillable = !("billable" in d && d.billable === false);
    const dossier = await dossierRepo.create(ctx, {
      name: d.name,
      clientLabel: d.client,
      budgetMinutes: d.budgetMin,
      isBillable,
      status: d.status,
    });
    dossierIdByKey.set(d.key, dossier.id);

    if (d.usedMin > 0) {
      const dataKey = await firmKeys.getDataKey(firmId);
      const assignedTo = demoTeam[demoDossiers.indexOf(d) % demoTeam.length]!;
      const startedAt = daysAgo(3 + demoDossiers.indexOf(d) * 2);
      const endedAt = new Date(startedAt.getTime() + d.usedMin * 60_000);
      await db.insert(tasks).values({
        firmId,
        memberId: memberIdByInitials.get(assignedTo.initials)!,
        dossierId: dossier.id,
        source: (["word", "outlook", "web"] as const)[demoDossiers.indexOf(d) % 3]!,
        title: encryptField(`Diligences — ${d.name}`, dataKey),
        startedAt,
        endedAt,
        durationMin: d.usedMin,
        confidence: 90,
        status: "validated",
        validatedAt: endedAt,
      });
      await dossierRepo.touchActivity(ctx, dossier.id, endedAt);
    }
  }

  // The "3 h 10 already validated this morning" baseline (prototype BASE.validated).
  {
    const dataKey = await firmKeys.getDataKey(firmId);
    const startedAt = todayAtParisTime("07:30");
    await db.insert(tasks).values({
      firmId,
      memberId: ctx.memberId,
      dossierId: dossierIdByKey.get("Delcourt") ?? null,
      source: "word",
      title: encryptField("Suivi matinal — dossiers en cours", dataKey),
      startedAt,
      endedAt: new Date(startedAt.getTime() + 190 * 60_000),
      durationMin: 190,
      confidence: 96,
      status: "validated",
      validatedAt: new Date(startedAt.getTime() + 190 * 60_000),
    });
    const delcourtId = dossierIdByKey.get("Delcourt");
    if (delcourtId) await dossierRepo.touchActivity(ctx, delcourtId, new Date(startedAt.getTime() + 190 * 60_000));
  }

  // Today's Journal — the six INITIAL_TASKS, pending, exactly as in the prototype.
  {
    const dataKey = await firmKeys.getDataKey(firmId);
    for (const t of demoTasks) {
      const startedAt = todayAtParisTime(t.start);
      const endedAt = todayAtParisTime(t.end);
      await db.insert(tasks).values({
        firmId,
        memberId: ctx.memberId,
        dossierId: dossierIdByKey.get(t.dossier) ?? null,
        source: t.source,
        title: encryptField(t.title, dataKey),
        startedAt,
        endedAt,
        durationMin: t.min,
        confidence: t.conf,
        status: "pending",
      });
      const dossierId = dossierIdByKey.get(t.dossier);
      if (dossierId) await dossierRepo.touchActivity(ctx, dossierId, endedAt);
    }
  }

  console.log(`Seeded firm ${firmId} with ${demoTeam.length} members, ${demoDossiers.length} dossiers.`);
  console.log(`Dev login: any of ${demoTeam.map((p) => emailFor(p.initials)).join(", ")} / password "${DEV_PASSWORD}"`);
  await queryClient.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { ActivationKeyCreated, ActivationKeySummary, parisDateKey, parisDateTimeToIso, shiftDateKey } from "@acte/contracts";
import type { INestApplication } from "@nestjs/common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type Agent, createApp, del, inviteAndAccept, isoHoursAgo, newAgent, outboxFor, patch, post, signUpFirm } from "./helpers";

const today = () => parisDateKey(new Date());
const at = (dateKey: string, hhmm: string) => parisDateTimeToIso(dateKey, hhmm);

describe("tasks, dossiers, billing, keys", () => {
  let app: INestApplication;
  let owner: Agent;
  let ownerEmail: string;
  let dossierId: string;

  beforeAll(async () => {
    app = await createApp();
    ({ agent: owner, email: ownerEmail } = await signUpFirm(app, "owner"));
    dossierId = (await post(owner, "/v1/dossiers", { name: "Dupont c/ Durand", clientLabel: "Dupont SA", budgetMinutes: 600 })).body.id;
  });
  afterAll(async () => {
    await app.close();
  });

  const createTask = async (agent: Agent, over: Partial<{ dossierId: string | null; title: string; startedAt: string; durationMin: number }> = {}) => {
    const res = await post(agent, "/v1/tasks", { dossierId, title: "Rédaction", startedAt: at(today(), "09:00"), durationMin: 30, ...over });
    expect(res.status).toBe(201);
    return res.body as { id: string; status: string; rateCents: number | null };
  };

  it("every guarded route answers 401 without a session", async () => {
    const anon = newAgent(app);
    const id = "00000000-0000-7000-8000-000000000000";
    for (const [method, path] of [
      ["get", "/v1/me/profile"], ["get", "/v1/me/summary"], ["get", "/v1/me/week"], ["get", "/v1/me/stats"], ["get", "/v1/me/sources"],
      ["patch", "/v1/me/sources"], ["patch", "/v1/me/preferences"], ["get", "/v1/me/insights"], ["get", "/v1/me/activity"], ["post", "/v1/me/chat"],
      ["get", "/v1/me/keys"], ["post", "/v1/me/keys"], ["delete", `/v1/me/keys/${id}`],
      ["get", "/v1/tasks"], ["get", "/v1/tasks/backlog"], ["post", "/v1/tasks"], ["patch", `/v1/tasks/${id}`], ["delete", `/v1/tasks/${id}`],
      ["post", `/v1/tasks/${id}/validate`], ["post", `/v1/tasks/${id}/unvalidate`], ["post", "/v1/tasks/validate-all"],
      ["get", "/v1/dossiers"], ["post", "/v1/dossiers"], ["patch", `/v1/dossiers/${id}`],
      ["get", "/v1/billing/invoices"], ["post", "/v1/billing/invoices"], ["get", "/v1/exports/validated.csv"], ["get", "/v1/exports/my-data.json"],
      ["get", "/v1/devices"], ["get", "/v1/notifications"], ["post", "/v1/notifications/read-all"], ["post", "/v1/feedback"],
    ] as const) {
      const res = await anon[method](path).set("Origin", "http://localhost:3000").send({});
      expect(res.status, `${method} ${path}`).toBe(401);
      expect(res.body.error.code, `${method} ${path}`).toBe("unauthorized");
    }
  });

  it("errors always use the {error:{code,message}} envelope and never echo the body", async () => {
    const unknown = await owner.get("/v1/does-not-exist");
    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual({ error: { code: "not_found", message: "Not found" } });

    const invalid = await patch(owner, `/v1/dossiers/${dossierId}`, { status: "SECRET-CANARY-VALUE" });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe("invalid_body");
    expect(JSON.stringify(invalid.body)).not.toContain("SECRET-CANARY-VALUE");

    expect((await owner.get("/v1/tasks?date=garbage")).status).toBe(400);
  });

  it("manual entry late in the evening stays on its Paris day (BUG-1) and can be edited while pending", async () => {
    const task = await createTask(owner, { title: "Soirée", startedAt: at(today(), "23:30"), durationMin: 20 });
    const listed = (await owner.get(`/v1/tasks?date=${today()}`)).body as { id: string }[];
    expect(listed.some((t) => t.id === task.id)).toBe(true);

    const edited = await patch(owner, `/v1/tasks/${task.id}`, { title: "Soirée — conclusions", durationMin: 45 });
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ title: "Soirée — conclusions", durationMin: 45, status: "pending" });
    expect(new Date(edited.body.endedAt).getTime() - new Date(edited.body.startedAt).getTime()).toBe(45 * 60_000);

    expect((await patch(owner, `/v1/tasks/${task.id}`, {})).status).toBe(400);
    expect((await del(owner, `/v1/tasks/${task.id}`)).status).toBe(204);
    expect(((await owner.get(`/v1/tasks?date=${today()}`)).body as { id: string }[]).some((t) => t.id === task.id)).toBe(false);
    expect((await del(owner, `/v1/tasks/${task.id}`)).status).toBe(404);
  });

  it("validate-all only validates the listed tasks; earlier pending days stay pending and show in the backlog (BUG-2)", async () => {
    const yesterday = shiftDateKey(today(), -1);
    const old = await createTask(owner, { title: "Hier", startedAt: at(yesterday, "10:00") });
    const a = await createTask(owner, { title: "A" });
    const b = await createTask(owner, { title: "B" });

    const backlog = (await owner.get("/v1/tasks/backlog")).body as { id: string }[];
    expect(backlog.map((t) => t.id)).toEqual([old.id]);

    const res = await post(owner, "/v1/tasks/validate-all", { taskIds: [a.id, b.id] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(((await owner.get("/v1/tasks/backlog")).body as { id: string }[]).map((t) => t.id)).toEqual([old.id]);
    expect((await post(owner, "/v1/tasks/validate-all", {})).status).toBe(400);
    await del(owner, `/v1/tasks/${old.id}`);
  });

  it("a validated task keeps the rate it was validated at; a later rate change prices new time only (D-020)", async () => {
    const me = (await owner.get("/v1/me/profile")).body;
    const before = await createTask(owner, { title: "Avant", durationMin: 60 });
    const validated = await post(owner, `/v1/tasks/${before.id}/validate`);
    expect(validated.status).toBe(200);
    expect(validated.body.rateCents).toBe(28_000);

    const revenueBefore = (await owner.get("/v1/me/summary")).body.securedRevenueMonthCents;
    expect((await patch(owner, `/v1/firm/members/${me.id}`, { hourlyRateCents: 40_000 })).status).toBe(200);
    expect((await owner.get("/v1/me/summary")).body.securedRevenueMonthCents).toBe(revenueBefore);

    const after = await createTask(owner, { title: "Après", durationMin: 60 });
    expect((await post(owner, `/v1/tasks/${after.id}/validate`)).body.rateCents).toBe(40_000);
    expect((await owner.get("/v1/me/summary")).body.securedRevenueMonthCents).toBe(revenueBefore + 40_000);
  });

  it("un-validate puts a task back to pending; editing a validated task is refused", async () => {
    const task = await createTask(owner, { title: "Aller-retour" });
    await post(owner, `/v1/tasks/${task.id}/validate`);
    expect((await patch(owner, `/v1/tasks/${task.id}`, { title: "x" })).status).toBe(409);
    const back = await post(owner, `/v1/tasks/${task.id}/unvalidate`);
    expect(back.status).toBe(200);
    expect(back.body).toMatchObject({ status: "pending", validatedAt: null, rateCents: null });
    expect((await post(owner, `/v1/tasks/${task.id}/unvalidate`)).status).toBe(404);
    await del(owner, `/v1/tasks/${task.id}`);
  });

  it("reassigning logs a correction and refuses an archived dossier", async () => {
    const other = (await post(owner, "/v1/dossiers", { name: "Autre dossier", clientLabel: "", budgetMinutes: null })).body.id;
    const archived = (await post(owner, "/v1/dossiers", { name: "Archive", clientLabel: "", budgetMinutes: null })).body.id;
    await patch(owner, `/v1/dossiers/${archived}`, { status: "archived" });
    const task = await createTask(owner, { title: "À corriger" });
    expect(task).toMatchObject({ corrected: false });

    const moved = await patch(owner, `/v1/tasks/${task.id}`, { dossierId: other });
    expect(moved.status).toBe(200);
    expect(moved.body).toMatchObject({ dossierId: other, corrected: true });
    expect((await patch(owner, `/v1/tasks/${task.id}`, { dossierId: archived })).status).toBe(400);
    expect((await post(owner, "/v1/tasks", { dossierId: archived, title: "x", startedAt: isoHoursAgo(1), durationMin: 5 })).status).toBe(400);
    await del(owner, `/v1/tasks/${task.id}`);
  });

  it("a dossier can be renamed; figures separate all-time, this month and un-invoiced", async () => {
    const renamed = await patch(owner, `/v1/dossiers/${dossierId}`, { name: "Dupont c/ Durand (appel)", clientLabel: "Dupont SAS" });
    expect(renamed.status).toBe(200);
    expect(renamed.body).toMatchObject({ name: "Dupont c/ Durand (appel)", clientLabel: "Dupont SAS" });
    const row = ((await owner.get("/v1/dossiers")).body as { id: string }[]).find((d) => d.id === dossierId);
    expect(row).toMatchObject({ usedMinutes: 180, monthMinutes: 180, uninvoicedMinutes: 180 });
  });

  it("an invoice draft bills only un-invoiced time, once (BUG-5)", async () => {
    const first = await post(owner, "/v1/billing/invoices", { dossierId });
    expect(first.status).toBe(201);
    const draft = (first.body as { dossierId: string; number: string; minutes: number; amountCents: number }[]).find((i) => i.dossierId === dossierId)!;
    // 30 min + 30 min + 60 min at 280 €/h, then 60 min at 400 €/h.
    expect(draft).toMatchObject({ number: `FA-${today().slice(0, 4)}-001`, minutes: 180, amountCents: 14_000 + 14_000 + 28_000 + 40_000 });

    const again = await post(owner, "/v1/billing/invoices", { dossierId });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("nothing_to_invoice");

    // Invoiced time can't be un-validated or moved to another dossier.
    const invoicedTask = ((await owner.get(`/v1/tasks?date=${today()}`)).body as { id: string; invoiceId: string | null }[]).find((t) => t.invoiceId);
    expect((await post(owner, `/v1/tasks/${invoicedTask!.id}/unvalidate`)).status).toBe(409);

    // New validated time gets its own draft, with only the new minutes.
    const extra = await createTask(owner, { title: "Suite", durationMin: 15 });
    await post(owner, `/v1/tasks/${extra.id}/validate`);
    const second = await post(owner, "/v1/billing/invoices", { dossierId });
    expect(second.status).toBe(201);
    const drafts = (second.body as { dossierId: string; number: string; minutes: number }[]).filter((i) => i.dossierId === dossierId);
    expect(drafts.map((d) => [d.number.slice(-3), d.minutes])).toEqual([["001", 180], ["002", 15]]);
    const row = ((await owner.get("/v1/dossiers")).body as { id: string; uninvoicedMinutes: number }[]).find((d) => d.id === dossierId);
    expect(row!.uninvoicedMinutes).toBe(0);
  });

  it("activation keys: the hash never leaves the API (BUG-6)", async () => {
    const created = await post(owner, "/v1/me/keys");
    expect(created.status).toBe(201);
    expect(ActivationKeyCreated.strict().safeParse(created.body).success).toBe(true);
    const list = await owner.get("/v1/me/keys");
    expect(ActivationKeySummary.strict().array().safeParse(list.body).success).toBe(true);
    expect(JSON.stringify(list.body)).not.toMatch(/keyHash|memberId|[a-f0-9]{64}/);
    const revoked = await del(owner, `/v1/me/keys/${created.body.id}`);
    expect(revoked.status).toBe(200);
    expect(ActivationKeySummary.strict().safeParse(revoked.body).success).toBe(true);
    expect(revoked.body.revokedAt).toBeTruthy();
  });

  it("preferences: theme and alert emails are saved per member", async () => {
    expect((await owner.get("/v1/me/profile")).body).toMatchObject({ theme: "dark", alertEmails: true });
    const res = await patch(owner, "/v1/me/preferences", { theme: "light", alertEmails: false });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ theme: "light", alertEmails: false });
    expect((await patch(owner, "/v1/me/preferences", { theme: "blue" })).status).toBe(400);
    await patch(owner, "/v1/me/preferences", { alertEmails: true });
  });

  it("stats: this month's captured time, billable share and highlights", async () => {
    const stats = (await owner.get("/v1/me/stats")).body;
    expect(stats.months).toHaveLength(6);
    expect(stats.capturedMonthMin).toBe(195);
    expect(stats.billableMonthPct).toBe(100);
    expect(stats.highlights.topDossier).toMatchObject({ name: "Dupont c/ Durand (appel)", pct: 100 });
    expect(stats.highlights.bestDay).toMatchObject({ date: today(), minutes: 195 });
  });

  it("my-data export contains the member's own tasks only", async () => {
    const { agent: colleague } = await inviteAndAccept(app, owner, "colleague");
    await post(colleague, "/v1/tasks", { dossierId, title: "Tâche du collègue", startedAt: at(today(), "11:00"), durationMin: 10 });
    const mine = await owner.get("/v1/exports/my-data.json");
    expect(mine.status).toBe(200);
    expect(mine.body.member.email).toBe(ownerEmail);
    expect(JSON.stringify(mine.body)).not.toContain("Tâche du collègue");
    expect((mine.body.tasks as unknown[]).length).toBeGreaterThan(0);
  });

  it("another firm can't see or touch this firm's tasks, dossiers, invoices or keys", async () => {
    const { agent: stranger } = await signUpFirm(app, "stranger");
    const task = await createTask(owner, { title: "Privé" });
    const key = (await post(owner, "/v1/me/keys")).body.id;

    expect((await stranger.get("/v1/dossiers")).body).toEqual([]);
    expect((await stranger.get("/v1/tasks")).body).toEqual([]);
    expect((await stranger.get("/v1/billing/invoices")).body).toEqual([]);
    expect((await patch(stranger, `/v1/dossiers/${dossierId}`, { budgetMinutes: 1 })).status).toBe(404);
    expect((await post(stranger, "/v1/tasks", { dossierId, title: "x", startedAt: isoHoursAgo(1), durationMin: 5 })).status).toBe(400);
    expect((await patch(stranger, `/v1/tasks/${task.id}`, { title: "x" })).status).toBe(404);
    expect((await del(stranger, `/v1/tasks/${task.id}`)).status).toBe(404);
    expect((await post(stranger, `/v1/tasks/${task.id}/validate`)).status).toBe(404);
    expect((await post(stranger, "/v1/tasks/validate-all", { taskIds: [task.id] })).body).toEqual([]);
    expect((await post(stranger, "/v1/billing/invoices", { dossierId })).status).toBe(404);
    expect((await del(stranger, `/v1/me/keys/${key}`)).status).toBe(404);
    await del(owner, `/v1/tasks/${task.id}`);
  });

  it("alert digest: closed without the secret; emails counts only, once per alert (D-019)", async () => {
    const anon = newAgent(app);
    expect((await anon.post("/v1/internal/alert-digest")).status).toBe(401);
    expect((await anon.post("/v1/internal/alert-digest").set("Authorization", "Bearer wrong")).status).toBe(401);

    // Push a dossier over 80 % of its budget so the owner has one open budget alert.
    const tight = (await post(owner, "/v1/dossiers", { name: "Nom Confidentiel Budget", clientLabel: "", budgetMinutes: 60 })).body.id;
    const t = await createTask(owner, { dossierId: tight, title: "Budget", durationMin: 55 });
    await post(owner, `/v1/tasks/${t.id}/validate`);

    const before = outboxFor(ownerEmail).filter((m) => m.subject.includes("alertes")).length;
    const run = await anon.post("/v1/internal/alert-digest").set("Authorization", "Bearer route-tests-cron");
    expect(run.status).toBe(200);
    expect(run.body.sent).toBeGreaterThanOrEqual(1);
    const mails = outboxFor(ownerEmail).filter((m) => m.subject.includes("alertes"));
    expect(mails.length).toBe(before + 1);

    // Nothing new to say: a second run sends this member nothing.
    await anon.post("/v1/internal/alert-digest").set("Authorization", "Bearer route-tests-cron");
    expect(outboxFor(ownerEmail).filter((m) => m.subject.includes("alertes")).length).toBe(before + 1);

    // A member who opted out gets no digest.
    await patch(owner, "/v1/me/preferences", { alertEmails: false });
    const tight2 = (await post(owner, "/v1/dossiers", { name: "Deuxième budget", clientLabel: "", budgetMinutes: 60 })).body.id;
    const t2 = await createTask(owner, { dossierId: tight2, title: "Budget 2", durationMin: 55 });
    await post(owner, `/v1/tasks/${t2.id}/validate`);
    await anon.post("/v1/internal/alert-digest").set("Authorization", "Bearer route-tests-cron");
    expect(outboxFor(ownerEmail).filter((m) => m.subject.includes("alertes")).length).toBe(before + 1);
  });
});

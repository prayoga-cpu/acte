import type { INestApplication } from "@nestjs/common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OUTBOX_DIR } from "./env";
import { type Agent, createApp, del, inviteAndAccept, lastLinkPath, newAgent, patch, post, signUpFirm, uniqueEmail } from "./helpers";

describe("admin console routes", () => {
  let app: INestApplication;
  let admin: Agent;
  let member: Agent;
  let memberId: string;
  let adminId: string;

  beforeAll(async () => {
    app = await createApp();
    ({ agent: admin } = await signUpFirm(app, "admin"));
    ({ agent: member, memberId } = await inviteAndAccept(app, admin, "collab"));
    adminId = (await admin.get("/v1/me/profile")).body.id;
  });
  afterAll(async () => {
    await app.close();
  });

  it("refuses every /v1/firm route to a non-admin and to a signed-out caller", async () => {
    const anon = newAgent(app);
    for (const [method, path] of [
      ["get", "/v1/firm/members"],
      ["patch", `/v1/firm/members/${memberId}`],
      ["post", `/v1/firm/members/${memberId}/remind`],
      ["post", `/v1/firm/members/${memberId}/suspend`],
      ["post", `/v1/firm/members/${memberId}/reactivate`],
      ["post", "/v1/firm/invitations"],
      ["patch", "/v1/firm"],
      ["get", "/v1/feedback"],
    ] as const) {
      expect((await member[method](path).set("Origin", "http://localhost:3000").send({})).status, `${method} ${path} as member`).toBe(403);
      expect((await anon[method](path).set("Origin", "http://localhost:3000").send({})).status, `${method} ${path} signed out`).toBe(401);
    }
  });

  it("an invitee is signed in after accepting, verified, at the role's default rate", async () => {
    const profile = await member.get("/v1/me/profile");
    expect(profile.status).toBe(200);
    expect(profile.body).toMatchObject({ isAdmin: false, role: "collaborateur", hourlyRateCents: 20_000 });
  });

  it("a failed resend leaves the invitee's current link working (BUG-8)", async () => {
    const email = uniqueEmail("resend");
    const invited = await post(admin, "/v1/firm/invitations", { email, role: "collaborateur" });
    expect(invited.status).toBe(201);
    const linkBefore = lastLinkPath(email, "Invitation");
    const token = decodeURIComponent(linkBefore.split("/invite/")[1]!);
    expect((await newAgent(app).get(`/v1/invitations/${encodeURIComponent(token)}`)).status).toBe(200);

    // Make the send fail: point the dev outbox somewhere that can't be created.
    process.env.EMAIL_DEV_OUTBOX = "/dev/null/outbox";
    const failed = await post(admin, `/v1/firm/invitations/${invited.body.id}/resend`);
    process.env.EMAIL_DEV_OUTBOX = OUTBOX_DIR;
    expect(failed.status).toBe(502);
    expect(failed.body.error.code).toBe("email_unavailable");

    // The link the invitee already holds still opens the invitation.
    expect((await newAgent(app).get(`/v1/invitations/${encodeURIComponent(token)}`)).status).toBe(200);

    // A successful resend then does rotate it.
    expect((await post(admin, `/v1/firm/invitations/${invited.body.id}/resend`)).status).toBe(201);
    expect((await newAgent(app).get(`/v1/invitations/${encodeURIComponent(token)}`)).status).toBe(404);
    const fresh = decodeURIComponent(lastLinkPath(email, "Rappel").split("/invite/")[1]!);
    expect((await newAgent(app).get(`/v1/invitations/${encodeURIComponent(fresh)}`)).status).toBe(200);
    expect((await del(admin, `/v1/firm/invitations/${invited.body.id}`)).status).toBe(204);
  });

  it("an invitation for an address that already has an account is refused, and stays usable", async () => {
    const { email: taken } = await signUpFirm(app, "already-here");
    const invited = await post(admin, "/v1/firm/invitations", { email: taken, role: "collaborateur" });
    expect(invited.status).toBe(201);
    const token = decodeURIComponent(lastLinkPath(taken, "Invitation").split("/invite/")[1]!);

    const accept = await post(newAgent(app), `/v1/invitations/${encodeURIComponent(token)}/accept`, { name: "Quelqu'un", password: "another-pass-9" });
    expect(accept.status).toBe(409);
    expect(accept.body.error.code).toBe("account_exists");
    // Nothing was consumed or created: the invitation is still pending and the team is unchanged.
    expect((await newAgent(app).get(`/v1/invitations/${encodeURIComponent(token)}`)).status).toBe(200);
    const team = (await admin.get("/v1/firm/members")).body as { email: string; status: string }[];
    expect(team.filter((m) => m.email === taken).map((m) => m.status)).toEqual(["invited"]);
    await del(admin, `/v1/firm/invitations/${invited.body.id}`);
  });

  it("admin rights: grant, the last admin can't be removed, revoke (D-019)", async () => {
    // The founder is the only admin: removing their own rights is refused.
    const last = await patch(admin, `/v1/firm/members/${adminId}`, { isAdmin: false });
    expect(last.status).toBe(409);
    expect(last.body.error.code).toBe("last_admin");

    const granted = await patch(admin, `/v1/firm/members/${memberId}`, { isAdmin: true });
    expect(granted.status).toBe(200);
    expect(granted.body.isAdmin).toBe(true);
    expect((await member.get("/v1/firm/members")).status).toBe(200);

    // With two admins, one can step down — and loses access at once.
    const revoked = await patch(member, `/v1/firm/members/${memberId}`, { isAdmin: false });
    expect(revoked.status).toBe(200);
    expect((await member.get("/v1/firm/members")).status).toBe(403);
  });

  it("an admin can't change a member of another firm", async () => {
    const { agent: other } = await signUpFirm(app, "other-admin");
    expect((await patch(other, `/v1/firm/members/${memberId}`, { isAdmin: true })).status).toBe(404);
    expect((await patch(other, `/v1/firm/members/${memberId}`, { hourlyRateCents: 1 })).status).toBe(404);
    expect((await post(other, `/v1/firm/members/${memberId}/suspend`)).status).toBe(404);
  });

  it("renames the firm", async () => {
    const res = await patch(admin, "/v1/firm", { name: "Cabinet Renommé" });
    expect(res.status).toBe(200);
    expect((await admin.get("/v1/me/profile")).body.firmName).toBe("Cabinet Renommé");
    expect((await patch(admin, "/v1/firm", { name: "" })).status).toBe(400);
  });

  it("team figures are for the current month", async () => {
    const lastMonth = new Date();
    lastMonth.setUTCDate(1);
    lastMonth.setUTCMonth(lastMonth.getUTCMonth() - 1, 10);
    const old = await post(member, "/v1/tasks", { dossierId: null, title: "Mois dernier", startedAt: lastMonth.toISOString(), durationMin: 50 });
    const now = await post(member, "/v1/tasks", { dossierId: null, title: "Ce mois", startedAt: new Date().toISOString(), durationMin: 30 });
    expect(old.status).toBe(201);
    await post(member, "/v1/tasks/validate-all", { taskIds: [now.body.id] });
    const row = (await admin.get("/v1/firm/members")).body.find((m: { id: string }) => m.id === memberId);
    expect(row).toMatchObject({ capturedMin: 30, validationRate: 100 });
  });

  it("feedback: any member can send, admins read their own firm's only (D-019)", async () => {
    expect((await post(member, "/v1/feedback", { category: "idea", message: "Un export par dossier serait utile." })).status).toBe(201);
    expect((await post(member, "/v1/feedback", { category: "nope", message: "x" })).status).toBe(400);
    const list = await admin.get("/v1/feedback");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ category: "idea", message: "Un export par dossier serait utile." });

    const { agent: other } = await signUpFirm(app, "other-feedback");
    expect((await other.get("/v1/feedback")).body).toHaveLength(0);
  });
});

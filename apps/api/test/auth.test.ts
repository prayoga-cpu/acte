import type { INestApplication } from "@nestjs/common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OUTBOX_DIR } from "./env";
import { createApp, lastLink, lastLinkPath, newAgent, ORIGIN, outboxFor, PASSWORD, post, signUpFirm, uniqueEmail } from "./helpers";

describe("auth: email verification, magic link, password reset", () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it("signup sends a verification link and opens no session until it is followed (B5)", async () => {
    const agent = newAgent(app);
    const email = uniqueEmail("verify");
    const res = await post(agent, "/v1/auth/sign-up/email", { email, password: PASSWORD, name: "Me Verify Test", callbackURL: `${ORIGIN}/dashboard` });
    expect(res.status).toBe(200);
    expect((await agent.get("/v1/me/profile")).status).toBe(401);

    const blocked = await post(agent, "/v1/auth/sign-in/email", { email, password: PASSWORD });
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe("EMAIL_NOT_VERIFIED");

    const verify = await agent.get(lastLinkPath(email, "Confirmez")).redirects(0);
    expect(verify.status).toBe(302);
    expect(verify.headers.location).toBe(`${ORIGIN}/dashboard`);
    // The link signs the new user in, and the firm exists with them as admin founder at the role's default rate (BUG-7).
    const profile = await agent.get("/v1/me/profile");
    expect(profile.status).toBe(200);
    expect(profile.body).toMatchObject({ email, isAdmin: true, role: "associe", hourlyRateCents: 28_000 });

    expect((await post(newAgent(app), "/v1/auth/sign-in/email", { email, password: PASSWORD })).status).toBe(200);
  });

  it("a magic link keeps a verified account's password (BUG-3) and lands on the web app (BUG-4)", async () => {
    const { email } = await signUpFirm(app, "magic");
    const agent = newAgent(app);
    expect((await post(agent, "/v1/auth/sign-in/magic-link", { email, callbackURL: `${ORIGIN}/dashboard` })).status).toBe(200);
    const res = await agent.get(lastLinkPath(email, "lien de connexion")).redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${ORIGIN}/dashboard`);
    expect((await agent.get("/v1/me/profile")).status).toBe(200);
    // The password still works afterwards.
    expect((await post(newAgent(app), "/v1/auth/sign-in/email", { email, password: PASSWORD })).status).toBe(200);
  });

  it("emailed auth links open on the web origin, so the session cookie is set for the app's host", async () => {
    const { email } = await signUpFirm(app, "links");
    await post(newAgent(app), "/v1/auth/sign-in/magic-link", { email, callbackURL: `${ORIGIN}/dashboard` });
    await post(newAgent(app), "/v1/auth/request-password-reset", { email, redirectTo: `${ORIGIN}/reset-password` });
    for (const subject of ["Confirmez", "lien de connexion", "Réinitialisation"]) {
      const link = new URL(lastLink(email, subject));
      expect(link.origin, subject).toBe(ORIGIN);
      expect(link.pathname.startsWith("/v1/auth/"), subject).toBe(true);
    }
  });

  it("a magic-link request answers the same whether or not the account exists, even when the email can't be sent", async () => {
    const { email } = await signUpFirm(app, "uniform");
    const unknown = await post(newAgent(app), "/v1/auth/sign-in/magic-link", { email: uniqueEmail("ghost"), callbackURL: `${ORIGIN}/dashboard` });

    process.env.EMAIL_DEV_OUTBOX = "/dev/null/outbox"; // the send fails
    const known = await post(newAgent(app), "/v1/auth/sign-in/magic-link", { email, callbackURL: `${ORIGIN}/dashboard` });
    process.env.EMAIL_DEV_OUTBOX = OUTBOX_DIR;

    expect(known.status).toBe(unknown.status);
    expect(known.body).toEqual(unknown.body);
  });

  it("a magic link does not create an account for an unknown address", async () => {
    const email = uniqueEmail("stranger");
    await post(newAgent(app), "/v1/auth/sign-in/magic-link", { email, callbackURL: `${ORIGIN}/dashboard` });
    expect(outboxFor(email)).toHaveLength(0);
  });

  it("password reset: emailed link sets a new password and the old one stops working", async () => {
    const { email } = await signUpFirm(app, "reset");
    const agent = newAgent(app);
    expect((await post(agent, "/v1/auth/request-password-reset", { email, redirectTo: `${ORIGIN}/reset-password` })).status).toBe(200);

    const link = lastLinkPath(email, "Réinitialisation");
    const redirect = await agent.get(link).redirects(0);
    expect(redirect.status).toBe(302);
    const target = new URL(redirect.headers.location as string);
    expect(`${target.origin}${target.pathname}`).toBe(`${ORIGIN}/reset-password`);
    const token = target.searchParams.get("token");
    expect(token).toBeTruthy();

    expect((await post(agent, "/v1/auth/reset-password", { newPassword: "a-brand-new-pass-2", token })).status).toBe(200);
    expect((await post(newAgent(app), "/v1/auth/sign-in/email", { email, password: PASSWORD })).status).toBe(401);
    expect((await post(newAgent(app), "/v1/auth/sign-in/email", { email, password: "a-brand-new-pass-2" })).status).toBe(200);
  });

  it("password reset for an unknown address answers the same and sends nothing", async () => {
    const email = uniqueEmail("nobody");
    const res = await post(newAgent(app), "/v1/auth/request-password-reset", { email, redirectTo: `${ORIGIN}/reset-password` });
    expect(res.status).toBe(200);
    expect(outboxFor(email)).toHaveLength(0);
  });

  it("a signed-in member can change their password", async () => {
    const { agent, email } = await signUpFirm(app, "change");
    const res = await post(agent, "/v1/auth/change-password", { currentPassword: PASSWORD, newPassword: "changed-pass-3", revokeOtherSessions: true });
    expect(res.status).toBe(200);
    expect((await post(newAgent(app), "/v1/auth/sign-in/email", { email, password: "changed-pass-3" })).status).toBe(200);
    expect((await post(newAgent(app), "/v1/auth/sign-in/email", { email, password: PASSWORD })).status).toBe(401);
  });
});

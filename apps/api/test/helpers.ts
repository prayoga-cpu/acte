import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import request from "supertest";
import { OUTBOX_DIR } from "./env";

export const ORIGIN = "http://localhost:3000";
export const PASSWORD = "route-test-pass-1";

let seq = 0;
export const uniqueEmail = (label = "user") => `${label}-${Date.now()}-${++seq}@routes.example.com`;

export async function createApp(): Promise<INestApplication> {
  const [{ AppModule }, { ApiExceptionFilter }] = await Promise.all([
    import("../src/app.module.js"),
    import("../src/common/api-exception.filter.js"),
  ]);
  const app = await NestFactory.create(AppModule, { logger: false });
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.init();
  return app;
}

export type Agent = ReturnType<typeof request.agent>;
export const newAgent = (app: INestApplication): Agent => request.agent(app.getHttpServer());

interface OutboxMail {
  to: string;
  subject: string;
  link: string | null;
}

export function outboxFor(to: string): OutboxMail[] {
  return readdirSync(OUTBOX_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(OUTBOX_DIR, f), "utf8")) as OutboxMail)
    .filter((m) => m.to === to);
}

/** The newest emailed link to `to`, exactly as sent. */
export function lastLink(to: string, subjectIncludes?: string): string {
  const mail = outboxFor(to)
    .filter((m) => m.link && (!subjectIncludes || m.subject.includes(subjectIncludes)))
    .pop();
  if (!mail?.link) throw new Error(`No emailed link to ${to}${subjectIncludes ? ` (${subjectIncludes})` : ""}`);
  return mail.link;
}

/** The newest emailed link to `to`, as a path + query the test agent can request. */
export function lastLinkPath(to: string, subjectIncludes?: string): string {
  const url = new URL(lastLink(to, subjectIncludes));
  return url.pathname + url.search;
}

export const post = (agent: Agent, path: string, body?: object) => agent.post(path).set("Origin", ORIGIN).send(body ?? {});
export const patch = (agent: Agent, path: string, body?: object) => agent.patch(path).set("Origin", ORIGIN).send(body ?? {});
export const del = (agent: Agent, path: string) => agent.delete(path).set("Origin", ORIGIN);

/** Signs up, follows the emailed verification link, and returns a signed-in agent for the new firm's founder. */
export async function signUpFirm(app: INestApplication, label = "founder"): Promise<{ agent: Agent; email: string }> {
  const agent = newAgent(app);
  const email = uniqueEmail(label);
  const res = await post(agent, "/v1/auth/sign-up/email", { email, password: PASSWORD, name: `Me ${label} Test`, callbackURL: `${ORIGIN}/dashboard` });
  if (res.status !== 200) throw new Error(`sign-up failed: ${res.status} ${JSON.stringify(res.body)}`);
  await agent.get(lastLinkPath(email, "Confirmez")).redirects(0);
  const signIn = await post(agent, "/v1/auth/sign-in/email", { email, password: PASSWORD });
  if (signIn.status !== 200) throw new Error(`sign-in failed: ${signIn.status} ${JSON.stringify(signIn.body)}`);
  return { agent, email };
}

/** Invites `email` from an admin agent and accepts it; returns the invitee's signed-in agent. */
export async function inviteAndAccept(app: INestApplication, admin: Agent, label = "invitee"): Promise<{ agent: Agent; email: string; memberId: string }> {
  const email = uniqueEmail(label);
  const invite = await post(admin, "/v1/firm/invitations", { email, role: "collaborateur" });
  if (invite.status !== 201) throw new Error(`invite failed: ${invite.status} ${JSON.stringify(invite.body)}`);
  const token = decodeURIComponent(lastLinkPath(email, "Invitation").split("/invite/")[1]!);
  const agent = newAgent(app);
  const accept = await post(agent, `/v1/invitations/${encodeURIComponent(token)}/accept`, { name: `Me ${label} Test`, password: PASSWORD });
  if (accept.status !== 204) throw new Error(`accept failed: ${accept.status} ${JSON.stringify(accept.body)}`);
  const profile = await agent.get("/v1/me/profile");
  return { agent, email, memberId: profile.body.id as string };
}

export const isoHoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

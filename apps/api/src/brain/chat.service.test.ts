import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpException } from "@nestjs/common";
import type { DossierUsage, HomeSummary, WeekSummary } from "@acte/contracts";
import type { DossiersService } from "../dossiers/dossiers.service.js";
import type { MeService } from "../me/me.service.js";
import type { TasksRepository } from "../data-access/tasks.repository.js";
import { ChatService, orderForContext, toPlainText } from "./chat.service.js";
import { LlmClient } from "./llm.client.js";

// ChatService only needs these as injection tokens; the real modules open a DB connection on import.
vi.mock("../me/me.service.js", () => ({ MeService: class {} }));
vi.mock("../dossiers/dossiers.service.js", () => ({ DossiersService: class {} }));
vi.mock("../data-access/tasks.repository.js", () => ({ TasksRepository: class {} }));

// Canary values (PRIVACY_MODEL "Privacy tests"). Each one is typed into a message or history turn
// below, so a pseudonymizer that ignored it would fail these tests.
const CANARY_DOSSIER = "Quetzalcoatl c/ Zéphyrine Holding";
const CANARY_CLIENT = "Mme Xanthippe Quetzalcoatl";
const CANARY_ARCHIVED = "Dvořák c/ Şahin Nguyễn";
const CANARY_TASK_TITLE = "Échanges confrère (Me Ybarra) sur le protocole Wyvern";
const CANARY_TITLE_WITH_FILE = "Relire Conclusions_Quaresma_v3.docx pour Me Oberon";
const CANARY_FILE = "Assignation_Quetzalcoatl_v3.docx";
const CANARY_EMAIL = "quetzal@example.fr";
const CANARY_LINK = "https://intranet.example.fr/quetzal-dossier";
const CANARY_PHONE = "+33 (0)6 12 34 56 78";
const CANARY_PHONE_2 = "06.98.76.54.32";
const CANARY_NUMBER = "RG 2400987";
const CANARIES = ["Quetzalcoatl", "Zéphyrine", "Xanthippe", "Dvořák", "Şahin", "Nguyễn", "Ybarra", "Wyvern", "Quaresma", "Oberon", "Assignation_", "quetzal", "12 34 56", "98.76", "2400987"];
/** Every canary, as a member might type it. Sent in the message and in both history roles. */
const ALL_TYPED = `Où en est ${CANARY_DOSSIER} pour ${CANARY_CLIENT} ? Et Quetzalcoatl, Xanthippe, ${CANARY_ARCHIVED} ? « ${CANARY_TASK_TITLE} » et « ${CANARY_TITLE_WITH_FILE} » ? Relire ${CANARY_FILE}, écrire à ${CANARY_EMAIL}, voir ${CANARY_LINK}, appeler le ${CANARY_PHONE} ou le ${CANARY_PHONE_2}, ${CANARY_NUMBER}.`;

const ctx = { firmId: "f", memberId: "m", isAdmin: false };

const summary: HomeSummary = {
  capturedTodayMin: 380, validatedTodayMin: 190, pendingTodayMin: 190,
  securedRevenueMonthCents: 88_667, averageRateCents: 28_000, roiMinutesToday: 0,
};
const week: WeekSummary = {
  days: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((label, i) => ({ label, minutes: i === 0 ? 190 : 0 })),
  totalMin: 190,
};
const dossier = (over: Partial<DossierUsage> & { name: string }): DossierUsage => ({
  id: crypto.randomUUID(), firmId: "f", clientLabel: "", budgetMinutes: null, status: "progress", isBillable: true,
  lastActivityAt: null, usedMinutes: 0, pendingMinutes: 0, ...over,
});
const dossiers: DossierUsage[] = [
  dossier({ name: CANARY_DOSSIER, clientLabel: CANARY_CLIENT, budgetMinutes: 2100, usedMinutes: 1233, pendingMinutes: 77 }),
  dossier({ name: CANARY_ARCHIVED, clientLabel: "M. Dvořák", status: "archived", budgetMinutes: 1000, usedMinutes: 1100 }),
];
const tasks = [
  { status: "pending", durationMin: 77, confidence: 97, title: CANARY_TASK_TITLE },
  { status: "pending", durationMin: 27, confidence: 76, title: "Relecture bail" },
  { status: "validated", durationMin: 30, confidence: 90, title: CANARY_TITLE_WITH_FILE },
];

function makeService(llm: LlmClient, list: DossierUsage[] = dossiers) {
  const me = { summary: async () => summary, week: async () => week } as unknown as MeService;
  const dossierService = { list: async () => list } as unknown as DossiersService;
  const taskRepo = { listForMember: async () => tasks } as unknown as TasksRepository;
  return new ChatService(me, dossierService, taskRepo, llm);
}

function fakeProvider(answer: { status: number; body: unknown }) {
  const calls: { url: string; body: string; auth: string }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: String(init.body), auth: (init.headers as Record<string, string>).authorization ?? "" });
    return new Response(JSON.stringify(answer.body), { status: answer.status });
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

const config = { enabled: true, apiKey: "test-key", baseUrl: "https://llm.test/v1", model: "mistral-small-latest", timeoutMs: 1000 };
const ok = (content: string) => ({ status: 200, body: { choices: [{ message: { content } }] } });
const sentMessages = (call: { body: string }) => (JSON.parse(call.body) as { messages: { role: string; content: string }[] }).messages;
const contextOf = (call: { body: string }) => {
  const system = sentMessages(call)[0]!.content;
  return JSON.parse(system.slice(system.indexOf("{"))) as { dossiers: { ref: string }[] } & Record<string, unknown>;
};

afterEach(() => vi.restoreAllMocks());

describe("ChatService (D-015)", () => {
  it("sends no known name, task title, filename, e-mail, link or phone to the provider, from the message or either history role", async () => {
    const logged = [vi.spyOn(console, "error"), vi.spyOn(console, "log"), vi.spyOn(console, "warn")];
    const provider = fakeProvider(ok("[D1] : 20 h 33 validées."));
    const service = makeService(new LlmClient(config, provider.fetchImpl));

    await service.reply(ctx, {
      message: ALL_TYPED,
      history: [
        { role: "user", content: ALL_TYPED },
        // What the panel sends back: a previous reply with names already restored, emoji included.
        { role: "assistant", content: `📊 ${CANARY_DOSSIER} : 20 h 33 validées ; ${CANARY_ARCHIVED} est archivé. ${ALL_TYPED}` },
      ],
    });

    expect(provider.calls).toHaveLength(1);
    const sent = provider.calls[0]!.body;
    for (const canary of CANARIES) expect(sent).not.toContain(canary);
    const turns = sentMessages(provider.calls[0]!).slice(1);
    expect(turns.map((t) => t.role)).toEqual(["user", "assistant", "user"]);
    for (const turn of turns) {
      for (const token of ["[D1]", "[D2]", "[e-mail]", "[fichier]", "[tâche]", "[lien]", "[téléphone]", "[numéro]"]) expect(turn.content).toContain(token);
    }
    const logs = logged.flatMap((spy) => spy.mock.calls.flat()).join(" ");
    for (const canary of CANARIES) expect(logs).not.toContain(canary);
    expect(provider.calls[0]!.url).toBe("https://llm.test/v1/chat/completions");
    expect(provider.calls[0]!.auth).toBe("Bearer test-key");
  });

  it("refuses to call the provider when there are more names than it can mask", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const provider = fakeProvider(ok("unused"));
    const huge = Array.from({ length: 6000 }, (_, i) => dossier({ name: `N${i} ${"mot ".repeat(39)}`, clientLabel: `L${i} ${"mot ".repeat(39)}` }));
    await expect(makeService(new LlmClient(config, provider.fetchImpl), huge).reply(ctx, { message: "Bonjour", history: [] })).rejects.toMatchObject({
      response: { error: { code: "llm_unavailable" } },
    });
    expect(provider.calls).toHaveLength(0);
  });

  it("truncates history turns only after pseudonymizing them", async () => {
    const provider = fakeProvider(ok("ok"));
    // Cutting first would leave "Qu", which no mask knows.
    const turn = `${"x".repeat(997)} ${CANARY_DOSSIER}`;
    await makeService(new LlmClient(config, provider.fetchImpl)).reply(ctx, { message: "Et ensuite ?", history: [{ role: "assistant", content: turn }] });
    const sentTurn = sentMessages(provider.calls[0]!)[1]!.content;
    expect(sentTurn).toBe(`${"x".repeat(997)} [D`);
  });

  it("sends the member's aggregates, pre-split for display", async () => {
    const provider = fakeProvider(ok("ok"));
    await makeService(new LlmClient(config, provider.fetchImpl)).reply(ctx, { message: "Résumé de ma journée", history: [] });

    const data = contextOf(provider.calls[0]!);
    expect(data.today).toEqual({ captured: { h: 6, min: 20 }, validated: { h: 3, min: 10 }, pending: { h: 3, min: 10 } });
    expect(data.journal).toEqual({ pendingCount: 2, pendingTotal: { h: 1, min: 44 }, lowConfidenceCount: 1 });
    expect(data.month).toEqual({ securedRevenueEur: 887, hourlyRateEur: 280 });
  });

  it("gives the model figures for active dossiers only, capped at 40, while still masking the rest", async () => {
    const provider = fakeProvider(ok("ok"));
    const list = [
      ...dossiers,
      ...Array.from({ length: 45 }, (_, i) => dossier({ name: `Dossier Actif${i}`, budgetMinutes: 1000, usedMinutes: i * 10 })),
    ];
    await makeService(new LlmClient(config, provider.fetchImpl), list).reply(ctx, { message: "Et Dvořák ?", history: [] });

    const refs = contextOf(provider.calls[0]!).dossiers.map((d) => d.ref);
    expect(refs).toHaveLength(40);
    expect(refs).toEqual(Array.from({ length: 40 }, (_, i) => `D${i + 1}`));
    const lastUser = sentMessages(provider.calls[0]!).at(-1)!.content;
    expect(lastUser).toMatch(/^Et \[D\d+\] \?$/);
    expect(Number(lastUser.match(/D(\d+)/)![1])).toBeGreaterThan(40); // archived: masked, but not in the figures
  });

  it("restores only refs the model was shown", async () => {
    const list = Array.from({ length: 15 }, (_, i) => dossier({ name: `Dossier${i} Zorg${i}`, budgetMinutes: 100, usedMinutes: 50 }));
    const archived = dossier({ name: "Affaire905 Qwx905", status: "archived" });
    const provider = fakeProvider(ok("[D16] : rien. [D1] avance."));
    const res = await makeService(new LlmClient(config, provider.fetchImpl), [...list, archived]).reply(ctx, { message: "Et la D906 ?", history: [] });
    expect(res.reply).toBe("[D16] : rien. Dossier0 Zorg0 avance."); // D16 is archived: masked, never shown, not restored
    expect(sentMessages(provider.calls[0]!).at(-1)!.content).toBe("Et la D906 ?");
  });

  it("swaps dossier refs back to names in the reply", async () => {
    const provider = fakeProvider(ok("[D1] : 20 h 33 validées."));
    const res = await makeService(new LlmClient(config, provider.fetchImpl)).reply(ctx, { message: "Et ce dossier ?", history: [] });
    expect(res.reply).toBe(`${CANARY_DOSSIER} : 20 h 33 validées.`);
  });

  it("answers llm_unavailable when the reply is only Markdown", async () => {
    const provider = fakeProvider(ok("**"));
    await expect(makeService(new LlmClient(config, provider.fetchImpl)).reply(ctx, { message: "Bonjour", history: [] })).rejects.toMatchObject({
      response: { error: { code: "llm_unavailable" } },
    });
  });

  it("answers llm_disabled without calling the provider when the flag is off", async () => {
    const provider = fakeProvider(ok("unused"));
    const service = makeService(new LlmClient({ ...config, enabled: false }, provider.fetchImpl));
    await expect(service.reply(ctx, { message: "Bonjour", history: [] })).rejects.toMatchObject({
      response: { error: { code: "llm_disabled" } },
    });
    expect(provider.calls).toHaveLength(0);
  });

  it("maps a provider failure to llm_unavailable and logs only the status", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const provider = fakeProvider({ status: 500, body: { detail: `echo: ${CANARY_DOSSIER}` } });
    const service = makeService(new LlmClient(config, provider.fetchImpl));

    await expect(service.reply(ctx, { message: "Quetzalcoatl ?", history: [] })).rejects.toMatchObject({
      response: { error: { code: "llm_unavailable" } },
    });
    const logged = errors.mock.calls.flat().join(" ");
    expect(logged).toContain("500");
    for (const canary of CANARIES) expect(logged).not.toContain(canary);
  });

  it("maps a network failure to llm_unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    await expect(makeService(new LlmClient(config, failing)).reply(ctx, { message: "Bonjour", history: [] })).rejects.toMatchObject({
      response: { error: { code: "llm_unavailable" } },
    });
  });

  it("rate-limits a member after 20 questions in 10 minutes", async () => {
    const provider = fakeProvider(ok("ok"));
    const service = makeService(new LlmClient(config, provider.fetchImpl));
    for (let i = 0; i < 20; i++) await service.reply(ctx, { message: "Bonjour", history: [] });

    const blocked = service.reply(ctx, { message: "Bonjour", history: [] });
    await expect(blocked).rejects.toBeInstanceOf(HttpException);
    await expect(blocked).rejects.toMatchObject({ response: { error: { code: "rate_limited" } } });
    // Another member is unaffected.
    await expect(service.reply({ ...ctx, memberId: "other" }, { message: "Bonjour", history: [] })).resolves.toEqual({ reply: "ok" });
  });

  it("answers one question at a time per member", async () => {
    let release!: () => void;
    const slow = (async () => {
      await new Promise<void>((resolve) => (release = resolve));
      return new Response(JSON.stringify({ choices: [{ message: { content: "ok" } }] }), { status: 200 });
    }) as unknown as typeof fetch;
    const service = makeService(new LlmClient(config, slow));
    const first = service.reply(ctx, { message: "Bonjour", history: [] });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await expect(service.reply(ctx, { message: "Encore", history: [] })).rejects.toMatchObject({ response: { error: { code: "rate_limited" } } });
    release();
    await expect(first).resolves.toEqual({ reply: "ok" });
  });

  it("caps the whole instance at 300 questions in 10 minutes", async () => {
    const provider = fakeProvider(ok("ok"));
    const service = makeService(new LlmClient(config, provider.fetchImpl));
    for (let m = 0; m < 15; m++) {
      for (let i = 0; i < 20; i++) await service.reply({ ...ctx, memberId: `m${m}` }, { message: "Bonjour", history: [] });
    }
    await expect(service.reply({ ...ctx, memberId: "fresh" }, { message: "Bonjour", history: [] })).rejects.toMatchObject({
      response: { error: { code: "rate_limited" } },
    });
  });
});

describe("toPlainText", () => {
  it("strips the Markdown small models add, keeping the words", () => {
    expect(toPlainText("Vous avez **6 h 20** capturées, statut *en cours*.")).toBe("Vous avez 6 h 20 capturées, statut en cours.");
    expect(toPlainText("- [D1] : 59 %\n- [D2] : 12 %")).toBe("[D1] : 59 %\n[D2] : 12 %");
  });
  it("leaves underscores inside words alone", () => {
    expect(toPlainText("le fichier conclusions_v3 est prêt")).toBe("le fichier conclusions_v3 est prêt");
  });
});

describe("orderForContext", () => {
  it("keeps active dossiers only, most-consumed budget first, those without a budget last", () => {
    const list = [
      dossier({ name: "none", usedMinutes: 900 }),
      dossier({ name: "59%", budgetMinutes: 2100, usedMinutes: 1233 }),
      dossier({ name: "archived 110%", budgetMinutes: 1000, usedMinutes: 1100, status: "archived" }),
      dossier({ name: "73%", budgetMinutes: 600, usedMinutes: 438 }),
    ];
    const { inContext, rest } = orderForContext(list);
    expect(inContext.map((d) => d.name)).toEqual(["73%", "59%", "none"]);
    expect(rest.map((d) => d.name)).toEqual(["archived 110%"]);
  });
});

describe("LlmClient.fromEnv", () => {
  it("stays off unless both the flag and a key are set", () => {
    expect(LlmClient.fromEnv({}).enabled).toBe(false);
    expect(LlmClient.fromEnv({ LLM_CHAT_ENABLED: "true" }).enabled).toBe(false);
    expect(LlmClient.fromEnv({ LLM_API_KEY: "k" }).enabled).toBe(false);
    expect(LlmClient.fromEnv({ LLM_CHAT_ENABLED: "true", LLM_API_KEY: "k" }).enabled).toBe(true);
  });
});

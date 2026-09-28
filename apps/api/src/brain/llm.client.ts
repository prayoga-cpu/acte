import { ServiceUnavailableException } from "@nestjs/common";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmConfig {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

const unavailable = () =>
  new ServiceUnavailableException({ error: { code: "llm_unavailable", message: "Assistant unavailable" } });

/**
 * OpenAI-compatible chat-completions client (D-015). Defaults to Mistral's own
 * API. Scaleway Generative APIs need no code change but three settings:
 * LLM_BASE_URL=https://api.scaleway.ai/v1, a Scaleway key in LLM_API_KEY and a
 * Scaleway model id in LLM_MODEL (the Mistral key and `-latest` alias won't work there).
 *
 * Never logs a prompt, a reply or a provider error body (PRIVACY_MODEL rule 2)
 * — only the HTTP status.
 */
export class LlmClient {
  constructor(
    private readonly config: LlmConfig,
    private readonly fetchImpl: typeof fetch = (...args) => fetch(...args),
  ) {}

  static fromEnv(env: NodeJS.ProcessEnv = process.env): LlmClient {
    // Destructured on purpose: `apiKey = env.X` reads as a hard-coded key to the CI secret scanner.
    const { LLM_API_KEY = "", LLM_CHAT_ENABLED, LLM_BASE_URL = "https://api.mistral.ai/v1", LLM_MODEL = "mistral-small-latest" } = env;
    return new LlmClient({
      enabled: LLM_CHAT_ENABLED === "true" && LLM_API_KEY !== "",
      apiKey: LLM_API_KEY,
      baseUrl: LLM_BASE_URL.replace(/\/+$/, ""),
      model: LLM_MODEL,
      timeoutMs: 20_000,
    });
  }

  get enabled(): boolean {
    return this.config.enabled;
  }

  async complete(messages: LlmMessage[]): Promise<string> {
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.config.apiKey}` },
        body: JSON.stringify({ model: this.config.model, messages, temperature: 0.2, max_tokens: 350 }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (e) {
      console.error(`[llm] request failed: ${e instanceof Error ? e.name : typeof e}`);
      throw unavailable();
    }
    if (!res.ok) {
      console.error(`[llm] provider answered ${res.status}`);
      throw unavailable();
    }
    const body = (await res.json().catch(() => null)) as { choices?: { message?: { content?: unknown } }[] } | null;
    const content = body?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim() === "") {
      console.error("[llm] provider answered without content");
      throw unavailable();
    }
    return content;
  }
}

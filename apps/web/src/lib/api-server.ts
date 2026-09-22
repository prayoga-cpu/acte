import "server-only";
import { cookies } from "next/headers";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";

/**
 * Server Component / Server Action fetch. The Next.js dev-server rewrite in
 * next.config.mjs only rewrites requests that arrive over HTTP from the
 * browser, so a server-side `fetch` needs the API's real origin and must
 * forward the incoming request's cookies itself.
 */
export async function apiServerFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${API_ORIGIN}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), cookie: cookieHeader },
    cache: "no-store",
  });
  if (res.status === 401) return null;
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

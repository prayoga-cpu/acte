import "server-only";
import { cookies, headers } from "next/headers";
import type { Locale } from "@/i18n/locale-context";

const SUPPORTED: Locale[] = ["fr", "en"];
const COOKIE_NAME = "acte-locale";

function parseAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  // "en-US,en;q=0.9,fr;q=0.8" -> first supported tag by descending q.
  const tags = header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      return { tag: tag?.trim().slice(0, 2).toLowerCase(), q: qPart ? Number(qPart) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of tags) {
    if (SUPPORTED.includes(tag as Locale)) return tag as Locale;
  }
  return null;
}

/**
 * Device-language detection with zero flash on the very first visit: the
 * browser already sends Accept-Language on every request, so we don't need
 * client-side `navigator.language` (which would only apply after hydration,
 * flashing the wrong language first). A manual switch is remembered via the
 * `acte-locale` cookie, which takes priority on every later visit.
 */
export async function detectLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(COOKIE_NAME)?.value;
  if (cookieValue && SUPPORTED.includes(cookieValue as Locale)) {
    return cookieValue as Locale;
  }

  const headerList = await headers();
  const detected = parseAcceptLanguage(headerList.get("accept-language"));
  return detected ?? "fr";
}

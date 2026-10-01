"use client";

import { helpEn } from "./help.en";
import { helpFr, type HelpCopy } from "./help.fr";
import { useI18n, type Locale } from "./locale-context";

const HELP: Record<Locale, HelpCopy> = { fr: helpFr, en: helpEn };

/** Help-centre copy for the current locale — follows the same FR/EN toggle as the rest of the app. */
export function useHelpCopy(): HelpCopy {
  return HELP[useI18n().locale];
}

export type { HelpCopy };

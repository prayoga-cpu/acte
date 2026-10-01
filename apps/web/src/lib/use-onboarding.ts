"use client";

import { useCallback, useState } from "react";
import type { OnboardingState } from "@acte/contracts";
import { api } from "./api-client";

/**
 * First-run welcome state and the "Premiers pas" checklist (D-021).
 * `initial` is null when the server could not provide it: the dashboard then
 * behaves as if the welcome had been seen, rather than failing over help.
 */
export function useOnboarding(initial: OnboardingState | null) {
  const [state, setState] = useState(initial);

  // Both calls are background conveniences: a failure must never surface as an error in the dashboard.
  const refresh = useCallback(async () => {
    try {
      setState(await api.get<OnboardingState>("/v1/me/onboarding"));
    } catch {
      /* keep the last good state */
    }
  }, []);

  const complete = useCallback(async () => {
    try {
      setState(await api.post<OnboardingState>("/v1/me/onboarding/complete"));
    } catch {
      /* the welcome will simply be offered again on the next visit */
    }
  }, []);

  return { state, refresh, complete };
}

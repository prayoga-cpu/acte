import type { MemberRole } from "@acte/contracts";

/** Partner flag follows the role — one definition, used on invite, accept and role change. */
export function isPartnerRole(role: MemberRole): boolean {
  return role === "associe" || role === "associee";
}

/** Default hourly rate by role (PRODUCT_SPEC.md "invite (role pre-fills default rate)"), from the prototype's TEAM fixtures. */
export function defaultRateCents(role: MemberRole): number {
  switch (role) {
    case "associe":
    case "associee":
      return 280_00;
    case "collaborateur":
    case "collaboratrice":
      return 200_00;
    case "juriste_stagiaire":
      return 120_00;
  }
}

export function initialsOf(displayName: string): string {
  const words = displayName
    .replace(/^Me\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  const letters = words.map((w) => w[0]!.toUpperCase());
  return (letters[0] ?? "") + (letters[letters.length - 1] ?? "");
}

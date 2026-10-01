import type { ActivationKeySummary } from "@acte/contracts";

/** Exactly the contract's fields: the hash and the member id never leave the data-access layer (BUG-6). */
export function toKeySummary(row: { id: string; prefix: string; createdAt: Date; revokedAt: Date | null }): ActivationKeySummary {
  return {
    id: row.id,
    prefix: row.prefix,
    createdAt: row.createdAt.toISOString(),
    revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
  };
}

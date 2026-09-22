import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import type { MemberRole, MemberStatus } from "@acte/contracts";
import { DB } from "../db/db.module.js";
import type { Database } from "../db/client.js";
import { members } from "../db/schema/index.js";
import type { FirmContext } from "./firm-context.js";

export function initialsOf(displayName: string): string {
  const words = displayName
    .replace(/^Me\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean);
  const letters = words.map((w) => w[0]!.toUpperCase());
  return (letters[0] ?? "") + (letters[letters.length - 1] ?? "");
}

@Injectable()
export class MembersRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Creates the firm-founding member: partner, admin, on first signup. */
  async createFounder(input: { authUserId: string; email: string; displayName: string; firmId: string }) {
    const [row] = await this.db
      .insert(members)
      .values({
        firmId: input.firmId,
        authUserId: input.authUserId,
        email: input.email.toLowerCase(),
        displayName: input.displayName,
        initials: initialsOf(input.displayName),
        role: "associe",
        isPartner: true,
        isAdmin: true,
        status: "active",
      })
      .returning();
    return row;
  }

  async findByAuthUserId(authUserId: string) {
    const [row] = await this.db.select().from(members).where(eq(members.authUserId, authUserId));
    return row ?? null;
  }

  async toFirmContext(authUserId: string): Promise<FirmContext | null> {
    const member = await this.findByAuthUserId(authUserId);
    if (!member) return null;
    return { firmId: member.firmId, memberId: member.id, isAdmin: member.isAdmin };
  }

  async listByFirm(firmId: string) {
    return this.db.select().from(members).where(eq(members.firmId, firmId));
  }

  async findById(firmId: string, memberId: string) {
    const rows = await this.db.select().from(members).where(eq(members.firmId, firmId));
    return rows.find((r) => r.id === memberId) ?? null;
  }

  async insertDemoMember(input: {
    authUserId: string;
    email: string;
    displayName: string;
    firmId: string;
    role: MemberRole;
    isPartner: boolean;
    status: MemberStatus;
    hourlyRateCents: number;
  }) {
    const [row] = await this.db
      .insert(members)
      .values({
        firmId: input.firmId,
        authUserId: input.authUserId,
        email: input.email.toLowerCase(),
        displayName: input.displayName,
        initials: initialsOf(input.displayName),
        role: input.role,
        isPartner: input.isPartner,
        isAdmin: false,
        status: input.status,
        hourlyRateCents: input.hourlyRateCents,
      })
      .returning();
    return row;
  }
}

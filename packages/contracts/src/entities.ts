import { z } from "zod";
import { DeviceStatus, DossierStatus, MemberRole, MemberStatus, NotificationType, TaskSource, TaskStatus } from "./enums";

const id = z.string().uuid();
const ts = z.string().datetime();

export const Firm = z.object({
  id, name: z.string().min(1), seatCount: z.number().int().nonnegative(),
});

export const Member = z.object({
  id, firmId: id,
  email: z.string().email(),
  displayName: z.string().min(1),
  initials: z.string().min(1).max(3),
  role: MemberRole,
  isPartner: z.boolean(),
  isAdmin: z.boolean(),
  hourlyRateCents: z.number().int().nonnegative(),
  status: MemberStatus,
});

export const Dossier = z.object({
  id, firmId: id,
  name: z.string().min(1),
  clientLabel: z.string(),
  budgetMinutes: z.number().int().positive().nullable(),
  status: DossierStatus,
  isBillable: z.boolean(),
  lastActivityAt: ts.nullable(),
});

export const Task = z.object({
  id, firmId: id, memberId: id,
  dossierId: id.nullable(),
  source: TaskSource,
  title: z.string().min(1),
  startedAt: ts, endedAt: ts,
  durationMin: z.number().int().positive(),
  confidence: z.number().int().min(0).max(100).nullable(),
  status: TaskStatus,
  validatedAt: ts.nullable(),
  // The "why" explanation is intentionally absent until decision D-003 is taken.
});

export const Device = z.object({
  id, memberId: id, name: z.string(), os: z.enum(["windows", "macos"]),
  companionVersion: z.string(), lastSyncAt: ts.nullable(), status: DeviceStatus,
});

export const Notification = z.object({
  id, memberId: id, type: NotificationType, refId: id.nullable(),
  createdAt: ts, readAt: ts.nullable(),
});

export type Firm = z.infer<typeof Firm>;
export type Member = z.infer<typeof Member>;
export type Dossier = z.infer<typeof Dossier>;
export type Task = z.infer<typeof Task>;
export type Device = z.infer<typeof Device>;
export type Notification = z.infer<typeof Notification>;

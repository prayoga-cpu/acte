import { pgEnum } from "drizzle-orm/pg-core";

export const memberRoleEnum = pgEnum("member_role", [
  "associe",
  "associee",
  "collaborateur",
  "collaboratrice",
  "juriste_stagiaire",
]);
export const memberStatusEnum = pgEnum("member_status", ["active", "in_court", "suspended", "invited"]);
export const dossierStatusEnum = pgEnum("dossier_status", ["progress", "ready", "archived"]);
export const taskSourceEnum = pgEnum("task_source", ["word", "outlook", "web", "manual"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "validated", "discarded"]);
export const deviceOsEnum = pgEnum("device_os", ["windows", "macos"]);
export const deviceStatusEnum = pgEnum("device_status", ["online", "offline", "unlinked"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "issued"]);
export const notificationTypeEnum = pgEnum("notification_type", ["low_confidence", "budget", "validation_lag", "health"]);

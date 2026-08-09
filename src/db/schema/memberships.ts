import { pgEnum, pgTable, text, timestamp, uuid, unique, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenancy";
import { users } from "./identity";

export const membershipRoleEnum = pgEnum("membership_role", ["OWNER", "NUTRITIONIST", "ASSISTANT"]);

export const membershipStatusEnum = pgEnum("membership_status", ["ACTIVE", "SUSPENDED", "PENDING"]);

// Users and tenants are many-to-many through memberships. Protecting the
// last remaining OWNER of a tenant is an application-level rule, not a DB
// constraint — see docs/architecture/multi-tenancy.md.
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull(),
    status: membershipStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("memberships_tenant_user_unique").on(table.tenantId, table.userId)],
);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "PENDING",
  "ACCEPTED",
  "EXPIRED",
  "REVOKED",
]);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: membershipRoleEnum("role").notNull(),
    status: invitationStatusEnum("status").notNull().default("PENDING"),
    token: text("token").notNull().unique(),
    invitedByUserId: uuid("invited_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Not a unique constraint: the same email can be re-invited after a prior
  // invitation was revoked or expired, so uniqueness is enforced in the
  // application layer against PENDING invitations only.
  (table) => [index("invitations_tenant_email_idx").on(table.tenantId, table.email)],
);

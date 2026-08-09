import { pgTable, text, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";

/**
 * Core identity tables, shaped to be compatible with the Auth.js Drizzle
 * adapter (see `src/lib/auth.ts`). The `identity` domain module never
 * imports Auth.js directly — these tables are infrastructure, not the
 * domain contract. `accounts` is unused by the current magic-link-only
 * flow; its column names follow Auth.js's OAuth token-storage convention
 * for when a real OAuth provider is added.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  // JS property named `emailVerified` (not `emailVerifiedAt`) to match the
  // Auth.js Drizzle adapter's expected column key; the DB column name is
  // unaffected, so this is not a migration.
  emailVerified: timestamp("email_verified_at", { withTimezone: true }),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    type: text("type").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // JS property named `expires` (not `expiresAt`) to match the Auth.js
  // Drizzle adapter's expected column key; the DB column name is unaffected.
  expires: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Backs the Auth.js magic-link login flow: a single-use token tied to an
// identifier (the email address).
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    // JS property named `expires` (not `expiresAt`) to match the Auth.js
    // Drizzle adapter's expected column key; the DB column name is unaffected.
    expires: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

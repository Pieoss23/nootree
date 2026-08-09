import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  bigint,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenancy";

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Stable business key (STARTER / PROFESSIONAL / STUDIO) — used by the
  // entitlements module instead of scattering string checks in app code.
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const features = pgTable("features", {
  id: uuid("id").primaryKey().defaultRandom(),
  // e.g. "patients.management", "future.appointments".
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const planFeatures = pgTable(
  "plan_features",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("plan_features_plan_feature_unique").on(table.planId, table.featureId)],
);

export const entitlementKindEnum = pgEnum("entitlement_kind", ["FEATURE", "LIMIT"]);

// Resolved per-tenant entitlements: normally mirrors the tenant's plan, but
// exists as its own table so a single tenant can be granted an override
// (e.g. a temporary higher patient limit) without inventing a new plan.
export const tenantEntitlements = pgTable(
  "tenant_entitlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    kind: entitlementKindEnum("kind").notNull(),
    // Feature key ("patients.management") or resource key ("activePatients").
    key: text("key").notNull(),
    // Set when kind = FEATURE.
    enabled: boolean("enabled"),
    // Set when kind = LIMIT. Null means "unlimited". bigint because
    // storageBytes-style limits can exceed the int4 range.
    limitValue: bigint("limit_value", { mode: "number" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("tenant_entitlements_tenant_key_unique").on(table.tenantId, table.key)],
);

export const billingCustomers = pgTable("billing_customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("stripe"),
  providerCustomerId: text("provider_customer_id").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "INCOMPLETE",
  "UNPAID",
]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  billingCustomerId: uuid("billing_customer_id")
    .notNull()
    .references(() => billingCustomers.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "restrict" }),
  provider: text("provider").notNull().default("stripe"),
  providerSubscriptionId: text("provider_subscription_id").notNull().unique(),
  status: subscriptionStatusEnum("status").notNull(),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  // Last time this row was reconciled against a provider webhook/API call.
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptionItems = pgTable("subscription_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  providerItemId: text("provider_item_id").notNull().unique(),
  providerPriceId: text("provider_price_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  // Minor currency unit (e.g. cents). Never store money as floating point.
  unitAmount: integer("unit_amount").notNull(),
  currency: text("currency").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const webhookEventStatusEnum = pgEnum("webhook_event_status", [
  "PENDING",
  "PROCESSED",
  "FAILED",
]);

// Idempotency ledger for provider webhooks. Payloads are not stored in full
// to avoid retaining sensitive billing data — only what is needed to route
// and audit processing.
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull().default("stripe"),
    providerEventId: text("provider_event_id").notNull(),
    type: text("type").notNull(),
    status: webhookEventStatusEnum("status").notNull().default("PENDING"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("webhook_events_provider_event_unique").on(table.provider, table.providerEventId),
  ],
);

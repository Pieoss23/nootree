import { relations } from "drizzle-orm";
import { users, sessions, accounts } from "./identity";
import { tenants, tenantProfiles } from "./tenancy";
import { memberships, invitations } from "./memberships";
import {
  plans,
  features,
  planFeatures,
  tenantEntitlements,
  billingCustomers,
  subscriptions,
  subscriptionItems,
} from "./billing";
import { patients, patientMeasurements } from "./patients";

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  memberships: many(memberships),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  profile: one(tenantProfiles, {
    fields: [tenants.id],
    references: [tenantProfiles.tenantId],
  }),
  memberships: many(memberships),
  invitations: many(invitations),
  patients: many(patients),
  entitlements: many(tenantEntitlements),
  billingCustomer: one(billingCustomers, {
    fields: [tenants.id],
    references: [billingCustomers.tenantId],
  }),
  subscriptions: many(subscriptions),
}));

export const tenantProfilesRelations = relations(tenantProfiles, ({ one }) => ({
  tenant: one(tenants, { fields: [tenantProfiles.tenantId], references: [tenants.id] }),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  tenant: one(tenants, { fields: [memberships.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  tenant: one(tenants, { fields: [invitations.tenantId], references: [tenants.id] }),
  invitedBy: one(users, { fields: [invitations.invitedByUserId], references: [users.id] }),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  planFeatures: many(planFeatures),
  subscriptions: many(subscriptions),
}));

export const featuresRelations = relations(features, ({ many }) => ({
  planFeatures: many(planFeatures),
}));

export const planFeaturesRelations = relations(planFeatures, ({ one }) => ({
  plan: one(plans, { fields: [planFeatures.planId], references: [plans.id] }),
  feature: one(features, { fields: [planFeatures.featureId], references: [features.id] }),
}));

export const tenantEntitlementsRelations = relations(tenantEntitlements, ({ one }) => ({
  tenant: one(tenants, { fields: [tenantEntitlements.tenantId], references: [tenants.id] }),
}));

export const billingCustomersRelations = relations(billingCustomers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [billingCustomers.tenantId], references: [tenants.id] }),
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  tenant: one(tenants, { fields: [subscriptions.tenantId], references: [tenants.id] }),
  billingCustomer: one(billingCustomers, {
    fields: [subscriptions.billingCustomerId],
    references: [billingCustomers.id],
  }),
  plan: one(plans, { fields: [subscriptions.planId], references: [plans.id] }),
  items: many(subscriptionItems),
}));

export const subscriptionItemsRelations = relations(subscriptionItems, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionItems.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  tenant: one(tenants, { fields: [patients.tenantId], references: [tenants.id] }),
  measurements: many(patientMeasurements),
}));

export const patientMeasurementsRelations = relations(patientMeasurements, ({ one }) => ({
  tenant: one(tenants, { fields: [patientMeasurements.tenantId], references: [tenants.id] }),
  patient: one(patients, { fields: [patientMeasurements.patientId], references: [patients.id] }),
}));

/**
 * Single source of truth for plan/feature/limit keys. The entitlements
 * module, the seed script, and the billing UI all read from here instead of
 * hard-coding plan checks (e.g. `if (plan === "PROFESSIONAL")`) around the
 * codebase.
 */

export const PLAN_KEYS = {
  STARTER: "STARTER",
  PROFESSIONAL: "PROFESSIONAL",
  STUDIO: "STUDIO",
} as const;

export type PlanKey = (typeof PLAN_KEYS)[keyof typeof PLAN_KEYS];

export const FEATURE_KEYS = {
  PATIENTS_MANAGEMENT: "patients.management",
  TEAM_MANAGEMENT: "team.management",
  BILLING_PORTAL: "billing.portal",
  AUDIT_EXTENDED: "audit.extended",
  FUTURE_APPOINTMENTS: "future.appointments",
  FUTURE_NUTRITION_PLANS: "future.nutritionPlans",
  FUTURE_DOCUMENTS: "future.documents",
  FUTURE_ACCOUNTING: "future.accounting",
} as const;

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

export const RESOURCE_KEYS = {
  ACTIVE_PATIENTS: "activePatients",
  TEAM_MEMBERS: "teamMembers",
  STORAGE_BYTES: "storageBytes",
} as const;

export type ResourceKey = (typeof RESOURCE_KEYS)[keyof typeof RESOURCE_KEYS];

export type PlanDefinition = {
  key: PlanKey;
  name: string;
  features: FeatureKey[];
  /** `null` means unlimited. */
  limits: Record<ResourceKey, number | null>;
};

export const PLAN_DEFINITIONS: Record<PlanKey, PlanDefinition> = {
  STARTER: {
    key: "STARTER",
    name: "Starter",
    features: [FEATURE_KEYS.PATIENTS_MANAGEMENT],
    limits: {
      activePatients: 30,
      teamMembers: 1,
      storageBytes: 1_000_000_000,
    },
  },
  PROFESSIONAL: {
    key: "PROFESSIONAL",
    name: "Professional",
    features: [
      FEATURE_KEYS.PATIENTS_MANAGEMENT,
      FEATURE_KEYS.TEAM_MANAGEMENT,
      FEATURE_KEYS.BILLING_PORTAL,
    ],
    limits: {
      activePatients: 150,
      teamMembers: 5,
      storageBytes: 10_000_000_000,
    },
  },
  STUDIO: {
    key: "STUDIO",
    name: "Studio",
    features: [
      FEATURE_KEYS.PATIENTS_MANAGEMENT,
      FEATURE_KEYS.TEAM_MANAGEMENT,
      FEATURE_KEYS.BILLING_PORTAL,
      FEATURE_KEYS.AUDIT_EXTENDED,
    ],
    limits: {
      activePatients: null,
      teamMembers: 20,
      storageBytes: 50_000_000_000,
    },
  },
};

export const FEATURE_DEFINITIONS: Record<FeatureKey, { name: string; description: string }> = {
  "patients.management": {
    name: "Gestione pazienti",
    description: "Anagrafica pazienti dello studio.",
  },
  "team.management": {
    name: "Gestione team",
    description: "Inviti e gestione dei membri dello studio.",
  },
  "billing.portal": {
    name: "Portale di fatturazione",
    description: "Accesso al Customer Portal per gestire l'abbonamento.",
  },
  "audit.extended": {
    name: "Audit esteso",
    description: "Storico eventi applicativi esteso.",
  },
  "future.appointments": {
    name: "Agenda (in arrivo)",
    description: "Gestione appuntamenti — non ancora disponibile.",
  },
  "future.nutritionPlans": {
    name: "Piani alimentari (in arrivo)",
    description: "Creazione piani alimentari — non ancora disponibile.",
  },
  "future.documents": {
    name: "Documenti clinici (in arrivo)",
    description: "Gestione documenti — non ancora disponibile.",
  },
  "future.accounting": {
    name: "Contabilità (in arrivo)",
    description: "Fatturazione e contabilità — non ancora disponibile.",
  },
};

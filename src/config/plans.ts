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
  PRODUCTS_CATALOG: "products.catalog",
  RECIPES_MANAGEMENT: "recipes.management",
  // Attivata il 2026-08-10 (era un placeholder "future.*"): assegnazione di
  // ricette ai pazienti con dosaggio suggerito — vedi docs/audit/decisions.md.
  NUTRITION_PLANS: "nutrition.plans",
  TEAM_MANAGEMENT: "team.management",
  BILLING_PORTAL: "billing.portal",
  AUDIT_EXTENDED: "audit.extended",
  FUTURE_APPOINTMENTS: "future.appointments",
  FUTURE_DOCUMENTS: "future.documents",
  FUTURE_ACCOUNTING: "future.accounting",
} as const;

export type FeatureKey = (typeof FEATURE_KEYS)[keyof typeof FEATURE_KEYS];

export const RESOURCE_KEYS = {
  ACTIVE_PATIENTS: "activePatients",
  TEAM_MEMBERS: "teamMembers",
  STORAGE_BYTES: "storageBytes",
  CUSTOM_PRODUCTS: "customProducts",
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
    features: [
      FEATURE_KEYS.PATIENTS_MANAGEMENT,
      FEATURE_KEYS.PRODUCTS_CATALOG,
      FEATURE_KEYS.RECIPES_MANAGEMENT,
      FEATURE_KEYS.NUTRITION_PLANS,
    ],
    limits: {
      activePatients: 30,
      teamMembers: 1,
      storageBytes: 1_000_000_000,
      customProducts: 50,
    },
  },
  PROFESSIONAL: {
    key: "PROFESSIONAL",
    name: "Professional",
    features: [
      FEATURE_KEYS.PATIENTS_MANAGEMENT,
      FEATURE_KEYS.PRODUCTS_CATALOG,
      FEATURE_KEYS.RECIPES_MANAGEMENT,
      FEATURE_KEYS.NUTRITION_PLANS,
      FEATURE_KEYS.TEAM_MANAGEMENT,
      FEATURE_KEYS.BILLING_PORTAL,
    ],
    limits: {
      activePatients: 150,
      teamMembers: 5,
      storageBytes: 10_000_000_000,
      customProducts: 300,
    },
  },
  STUDIO: {
    key: "STUDIO",
    name: "Studio",
    features: [
      FEATURE_KEYS.PATIENTS_MANAGEMENT,
      FEATURE_KEYS.PRODUCTS_CATALOG,
      FEATURE_KEYS.RECIPES_MANAGEMENT,
      FEATURE_KEYS.NUTRITION_PLANS,
      FEATURE_KEYS.TEAM_MANAGEMENT,
      FEATURE_KEYS.BILLING_PORTAL,
      FEATURE_KEYS.AUDIT_EXTENDED,
    ],
    limits: {
      activePatients: null,
      teamMembers: 20,
      storageBytes: 50_000_000_000,
      customProducts: null,
    },
  },
};

export const FEATURE_DEFINITIONS: Record<FeatureKey, { name: string; description: string }> = {
  "patients.management": {
    name: "Gestione pazienti",
    description: "Anagrafica pazienti dello studio.",
  },
  "products.catalog": {
    name: "Catalogo prodotti",
    description:
      "Consultazione del catalogo alimenti e gestione dei prodotti personalizzati dello studio.",
  },
  "recipes.management": {
    name: "Gestione ricette",
    description:
      "Creazione di ricette dello studio a partire da alimenti e prodotti personalizzati.",
  },
  "nutrition.plans": {
    name: "Piani alimentari",
    description:
      "Assegnazione di ricette ai pazienti con dosaggio suggerito in base al fabbisogno calorico stimato.",
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
  "future.documents": {
    name: "Documenti clinici (in arrivo)",
    description: "Gestione documenti — non ancora disponibile.",
  },
  "future.accounting": {
    name: "Contabilità (in arrivo)",
    description: "Fatturazione e contabilità — non ancora disponibile.",
  },
};

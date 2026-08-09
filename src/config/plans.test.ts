import { describe, expect, it } from "vitest";
import { PLAN_DEFINITIONS, FEATURE_DEFINITIONS, FEATURE_KEYS, RESOURCE_KEYS } from "./plans";

describe("PLAN_DEFINITIONS", () => {
  it("defines all three plans with a name, features and limits", () => {
    for (const plan of Object.values(PLAN_DEFINITIONS)) {
      expect(plan.name).toBeTruthy();
      expect(plan.features.length).toBeGreaterThan(0);
      expect(Object.keys(plan.limits)).toEqual(
        expect.arrayContaining(Object.values(RESOURCE_KEYS)),
      );
    }
  });

  it("grants strictly more features to higher plans", () => {
    expect(PLAN_DEFINITIONS.PROFESSIONAL.features.length).toBeGreaterThan(
      PLAN_DEFINITIONS.STARTER.features.length,
    );
    expect(PLAN_DEFINITIONS.STUDIO.features.length).toBeGreaterThan(
      PLAN_DEFINITIONS.PROFESSIONAL.features.length,
    );
  });

  it("only STUDIO includes the audit.extended feature", () => {
    expect(PLAN_DEFINITIONS.STARTER.features).not.toContain(FEATURE_KEYS.AUDIT_EXTENDED);
    expect(PLAN_DEFINITIONS.PROFESSIONAL.features).not.toContain(FEATURE_KEYS.AUDIT_EXTENDED);
    expect(PLAN_DEFINITIONS.STUDIO.features).toContain(FEATURE_KEYS.AUDIT_EXTENDED);
  });

  it("only STUDIO has an unlimited active-patients limit", () => {
    expect(PLAN_DEFINITIONS.STARTER.limits.activePatients).not.toBeNull();
    expect(PLAN_DEFINITIONS.PROFESSIONAL.limits.activePatients).not.toBeNull();
    expect(PLAN_DEFINITIONS.STUDIO.limits.activePatients).toBeNull();
  });

  it("has a feature definition for every key referenced by a plan", () => {
    const definedKeys = new Set(Object.keys(FEATURE_DEFINITIONS));
    for (const plan of Object.values(PLAN_DEFINITIONS)) {
      for (const featureKey of plan.features) {
        expect(definedKeys.has(featureKey)).toBe(true);
      }
    }
  });
});

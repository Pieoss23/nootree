import { describe, expect, it } from "vitest";
import { computeDailyKcalTarget, suggestRecipePortionGrams } from "./dosage";

const asOf = new Date("2026-01-15T00:00:00.000Z");

const baseInput = {
  sex: "MALE" as const,
  birthDate: "1996-01-10", // 30 years old as of asOf
  activityLevel: "MODERATE" as const,
  nutritionGoal: null,
  dietIntensity: null,
  measuredBmrKcal: null,
  weightKg: 80,
  heightCm: 180,
  asOf,
};

describe("computeDailyKcalTarget", () => {
  it("prefers a measured BMR over estimating one", () => {
    const result = computeDailyKcalTarget({ ...baseInput, measuredBmrKcal: 1900 });
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.bmrSource).toBe("MEASURED");
    expect(result.bmrKcal).toBe(1900);
    expect(result.tdeeKcal).toBeCloseTo(1900 * 1.55);
  });

  it("estimates BMR with Mifflin-St Jeor when no measured value is available", () => {
    const result = computeDailyKcalTarget(baseInput);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.bmrSource).toBe("ESTIMATED_MIFFLIN_ST_JEOR");
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(result.bmrKcal).toBeCloseTo(1780);
    expect(result.tdeeKcal).toBeCloseTo(1780 * 1.55);
    expect(result.dailyKcalTarget).toBeCloseTo(result.tdeeKcal);
  });

  it("estimates a lower BMR for FEMALE than MALE, all else equal", () => {
    const male = computeDailyKcalTarget(baseInput);
    const female = computeDailyKcalTarget({ ...baseInput, sex: "FEMALE" });
    if (male.status !== "ok" || female.status !== "ok") throw new Error("expected ok");
    expect(female.bmrKcal).toBeLessThan(male.bmrKcal);
  });

  it("returns insufficient_data listing exactly what's missing when no BMR can be resolved", () => {
    const result = computeDailyKcalTarget({
      ...baseInput,
      sex: null,
      birthDate: null,
      measuredBmrKcal: null,
    });
    expect(result.status).toBe("insufficient_data");
    if (result.status !== "insufficient_data") return;
    expect(result.missing).toContain("sesso");
    expect(result.missing).toContain("data di nascita");
  });

  it("returns insufficient_data when activity level is missing, even with a measured BMR", () => {
    const result = computeDailyKcalTarget({
      ...baseInput,
      measuredBmrKcal: 1900,
      activityLevel: null,
    });
    expect(result.status).toBe("insufficient_data");
  });

  it("applies a deficit for WEIGHT_LOSS scaled by diet intensity", () => {
    const light = computeDailyKcalTarget({
      ...baseInput,
      measuredBmrKcal: 1800,
      nutritionGoal: "WEIGHT_LOSS",
      dietIntensity: "LIGHT",
    });
    const hard = computeDailyKcalTarget({
      ...baseInput,
      measuredBmrKcal: 1800,
      nutritionGoal: "WEIGHT_LOSS",
      dietIntensity: "HARD",
    });
    if (light.status !== "ok" || hard.status !== "ok") throw new Error("expected ok");
    expect(light.dailyKcalTarget).toBeCloseTo(light.tdeeKcal - 250);
    expect(hard.dailyKcalTarget).toBeCloseTo(hard.tdeeKcal - 750);
    expect(hard.dailyKcalTarget).toBeLessThan(light.dailyKcalTarget);
  });

  it("applies a surplus for WEIGHT_GAIN and defaults to MEDIUM intensity when unset", () => {
    const result = computeDailyKcalTarget({
      ...baseInput,
      measuredBmrKcal: 1800,
      nutritionGoal: "WEIGHT_GAIN",
      dietIntensity: null,
    });
    if (result.status !== "ok") throw new Error("expected ok");
    expect(result.dailyKcalTarget).toBeCloseTo(result.tdeeKcal + 500);
  });

  it("treats MAINTENANCE and no goal the same as no calorie adjustment", () => {
    const noGoal = computeDailyKcalTarget({
      ...baseInput,
      measuredBmrKcal: 1800,
      nutritionGoal: null,
    });
    const maintenance = computeDailyKcalTarget({
      ...baseInput,
      measuredBmrKcal: 1800,
      nutritionGoal: "MAINTENANCE",
      dietIntensity: "HARD",
    });
    if (noGoal.status !== "ok" || maintenance.status !== "ok") throw new Error("expected ok");
    expect(noGoal.dailyKcalTarget).toBeCloseTo(noGoal.tdeeKcal);
    expect(maintenance.dailyKcalTarget).toBeCloseTo(maintenance.tdeeKcal);
  });
});

describe("suggestRecipePortionGrams", () => {
  it("scales the portion so it supplies the default meal fraction of the daily target", () => {
    // 30% of 2000 kcal = 600 kcal; a 200 kcal/100g recipe needs 300g to hit that.
    expect(suggestRecipePortionGrams(2000, 200)).toBeCloseTo(300);
  });

  it("returns null for a recipe with no caloric density", () => {
    expect(suggestRecipePortionGrams(2000, 0)).toBeNull();
  });

  it("accepts a custom meal fraction", () => {
    expect(suggestRecipePortionGrams(2000, 200, 0.5)).toBeCloseTo(500);
  });
});

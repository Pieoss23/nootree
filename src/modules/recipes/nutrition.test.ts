import { describe, expect, it } from "vitest";
import { computeRecipeNutrition } from "./nutrition";

describe("computeRecipeNutrition", () => {
  it("returns zeroed totals for no ingredients", () => {
    const result = computeRecipeNutrition([]);
    expect(result).toEqual({
      totalGrams: 0,
      totalKcal: 0,
      totalProteinG: 0,
      totalCarbsG: 0,
      totalFatG: 0,
      totalFiberG: 0,
      kcalPer100g: 0,
    });
  });

  it("scales a single ingredient by its quantity", () => {
    const result = computeRecipeNutrition([
      {
        quantityGrams: 150,
        kcalPer100g: 165,
        proteinGPer100g: 31,
        carbsGPer100g: 0,
        fatGPer100g: 3.6,
        fiberGPer100g: 0,
      },
    ]);
    expect(result.totalGrams).toBe(150);
    expect(result.totalKcal).toBeCloseTo(247.5);
    expect(result.totalProteinG).toBeCloseTo(46.5);
    expect(result.kcalPer100g).toBeCloseTo(165);
  });

  it("sums multiple ingredients and treats null macros as zero", () => {
    const result = computeRecipeNutrition([
      {
        quantityGrams: 100,
        kcalPer100g: 100,
        proteinGPer100g: 10,
        carbsGPer100g: null,
        fatGPer100g: null,
        fiberGPer100g: null,
      },
      {
        quantityGrams: 100,
        kcalPer100g: 50,
        proteinGPer100g: 5,
        carbsGPer100g: 10,
        fatGPer100g: null,
        fiberGPer100g: 2,
      },
    ]);
    expect(result.totalGrams).toBe(200);
    expect(result.totalKcal).toBeCloseTo(150);
    expect(result.totalProteinG).toBeCloseTo(15);
    expect(result.totalCarbsG).toBeCloseTo(10);
    expect(result.totalFiberG).toBeCloseTo(2);
    expect(result.kcalPer100g).toBeCloseTo(75);
  });
});

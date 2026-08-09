import { describe, expect, it } from "vitest";
import { clinicalInfoFormSchema } from "./clinical-info-validation";

const baseInput = {
  allergiesIntolerances: "",
  pathologies: "",
  medications: "",
  nutritionGoal: "",
  activityLevel: "",
};

describe("clinicalInfoFormSchema", () => {
  it("turns blank fields into null", () => {
    const result = clinicalInfoFormSchema.parse(baseInput);
    expect(result).toEqual({
      allergiesIntolerances: null,
      pathologies: null,
      medications: null,
      nutritionGoal: null,
      activityLevel: null,
    });
  });

  it("trims free-text fields", () => {
    const result = clinicalInfoFormSchema.parse({
      ...baseInput,
      allergiesIntolerances: "  Lattosio  ",
    });
    expect(result.allergiesIntolerances).toBe("Lattosio");
  });

  it("accepts a valid nutritionGoal/activityLevel", () => {
    const result = clinicalInfoFormSchema.parse({
      ...baseInput,
      nutritionGoal: "WEIGHT_LOSS",
      activityLevel: "MODERATE",
    });
    expect(result.nutritionGoal).toBe("WEIGHT_LOSS");
    expect(result.activityLevel).toBe("MODERATE");
  });

  it("rejects an invalid nutritionGoal/activityLevel", () => {
    expect(
      clinicalInfoFormSchema.safeParse({ ...baseInput, nutritionGoal: "NOT_A_GOAL" }).success,
    ).toBe(false);
    expect(
      clinicalInfoFormSchema.safeParse({ ...baseInput, activityLevel: "NOT_A_LEVEL" }).success,
    ).toBe(false);
  });
});

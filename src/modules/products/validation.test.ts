import { describe, expect, it } from "vitest";
import { tenantProductFormSchema } from "./validation";

const baseInput = {
  name: " Insalata dello chef ",
  kcalPer100g: "120",
  proteinGPer100g: "",
  carbsGPer100g: "",
  fatGPer100g: "",
  fiberGPer100g: "",
  notes: "",
};

describe("tenantProductFormSchema", () => {
  it("trims the name and turns blank optional fields into null", () => {
    const result = tenantProductFormSchema.parse(baseInput);
    expect(result).toEqual({
      name: "Insalata dello chef",
      kcalPer100g: 120,
      proteinGPer100g: null,
      carbsGPer100g: null,
      fatGPer100g: null,
      fiberGPer100g: null,
      notes: null,
    });
  });

  it("rejects a missing name", () => {
    expect(tenantProductFormSchema.safeParse({ ...baseInput, name: "" }).success).toBe(false);
  });

  it("rejects a missing kcal value", () => {
    expect(tenantProductFormSchema.safeParse({ ...baseInput, kcalPer100g: "" }).success).toBe(
      false,
    );
  });

  it("accepts a comma decimal separator", () => {
    const result = tenantProductFormSchema.parse({
      ...baseInput,
      kcalPer100g: "84,5",
      proteinGPer100g: "2,3",
    });
    expect(result.kcalPer100g).toBe(84.5);
    expect(result.proteinGPer100g).toBe(2.3);
  });

  it("rejects an out-of-range kcal value", () => {
    expect(tenantProductFormSchema.safeParse({ ...baseInput, kcalPer100g: "5000" }).success).toBe(
      false,
    );
  });

  it("rejects an out-of-range macro percentage", () => {
    expect(
      tenantProductFormSchema.safeParse({ ...baseInput, proteinGPer100g: "150" }).success,
    ).toBe(false);
  });
});

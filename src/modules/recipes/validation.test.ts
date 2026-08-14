import { describe, expect, it } from "vitest";
import {
  recipeFormSchema,
  recipeIngredientFormSchema,
  patientRecipeFormSchema,
} from "./validation";

describe("recipeFormSchema", () => {
  it("trims the name and turns blank instructions into null", () => {
    const result = recipeFormSchema.parse({ name: "  Pollo al forno  ", instructions: "" });
    expect(result).toEqual({ name: "Pollo al forno", instructions: null });
  });

  it("rejects a missing name", () => {
    expect(recipeFormSchema.safeParse({ name: "", instructions: "" }).success).toBe(false);
  });
});

describe("recipeIngredientFormSchema", () => {
  it("parses a food-catalog reference into foodItemId", () => {
    const result = recipeIngredientFormSchema.parse({
      ingredientRef: "food:11111111-1111-1111-1111-111111111111",
      quantityGrams: "150",
    });
    expect(result).toEqual({
      foodItemId: "11111111-1111-1111-1111-111111111111",
      tenantProductId: null,
      quantityGrams: 150,
    });
  });

  it("parses a tenant-product reference into tenantProductId", () => {
    const result = recipeIngredientFormSchema.parse({
      ingredientRef: "product:22222222-2222-2222-2222-222222222222",
      quantityGrams: "80",
    });
    expect(result.foodItemId).toBeNull();
    expect(result.tenantProductId).toBe("22222222-2222-2222-2222-222222222222");
  });

  it("rejects a malformed ingredientRef", () => {
    expect(
      recipeIngredientFormSchema.safeParse({ ingredientRef: "not-a-ref", quantityGrams: "100" })
        .success,
    ).toBe(false);
  });

  it("rejects a missing quantity", () => {
    expect(
      recipeIngredientFormSchema.safeParse({ ingredientRef: "food:abc", quantityGrams: "" })
        .success,
    ).toBe(false);
  });
});

describe("patientRecipeFormSchema", () => {
  it("accepts a portion with a comma decimal and an optional suggested value", () => {
    const result = patientRecipeFormSchema.parse({
      recipeId: "recipe-1",
      portionGrams: "150,5",
      suggestedPortionGrams: "160,2",
      notes: "",
    });
    expect(result.portionGrams).toBeCloseTo(150.5);
    expect(result.suggestedPortionGrams).toBeCloseTo(160.2);
    expect(result.notes).toBeNull();
  });

  it("treats a blank suggested portion as null", () => {
    const result = patientRecipeFormSchema.parse({
      recipeId: "recipe-1",
      portionGrams: "100",
      suggestedPortionGrams: "",
      notes: "",
    });
    expect(result.suggestedPortionGrams).toBeNull();
  });

  it("rejects a missing recipe or portion", () => {
    expect(patientRecipeFormSchema.safeParse({ recipeId: "", portionGrams: "100" }).success).toBe(
      false,
    );
    expect(
      patientRecipeFormSchema.safeParse({ recipeId: "recipe-1", portionGrams: "" }).success,
    ).toBe(false);
  });
});

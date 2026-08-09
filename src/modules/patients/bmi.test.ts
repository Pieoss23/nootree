import { describe, expect, it } from "vitest";
import { calculateBmi } from "./bmi";

describe("calculateBmi", () => {
  it("computes BMI from weight and height", () => {
    expect(calculateBmi(70, 175)).toBeCloseTo(22.9, 1);
  });

  it("returns null when weight is missing", () => {
    expect(calculateBmi(null, 175)).toBeNull();
  });

  it("returns null when height is missing", () => {
    expect(calculateBmi(70, null)).toBeNull();
  });

  it("returns null when height is zero or negative", () => {
    expect(calculateBmi(70, 0)).toBeNull();
    expect(calculateBmi(70, -10)).toBeNull();
  });

  it("rounds to one decimal", () => {
    expect(calculateBmi(68, 170)).toBe(23.5);
  });
});

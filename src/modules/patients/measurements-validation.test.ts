import { describe, expect, it } from "vitest";
import { measurementFormSchema } from "./measurements-validation";

const baseInput = {
  measuredAt: "2026-01-15",
  weightKg: "72.4",
  heightCm: "",
  waistCm: "",
  hipCm: "",
  armCm: "",
  bodyFatPercent: "",
  bodyWaterPercent: "",
  leanMassKg: "",
  cellMassKg: "",
  phaseAngle: "",
  basalMetabolicRateKcal: "",
  notes: "",
};

describe("measurementFormSchema", () => {
  it("parses a minimal measurement (weight + date only)", () => {
    const result = measurementFormSchema.parse(baseInput);
    expect(result).toEqual({
      measuredAt: "2026-01-15",
      weightKg: 72.4,
      heightCm: null,
      waistCm: null,
      hipCm: null,
      armCm: null,
      bodyFatPercent: null,
      bodyWaterPercent: null,
      leanMassKg: null,
      cellMassKg: null,
      phaseAngle: null,
      basalMetabolicRateKcal: null,
      notes: null,
    });
  });

  it("rejects a malformed date", () => {
    expect(
      measurementFormSchema.safeParse({ ...baseInput, measuredAt: "15/01/2026" }).success,
    ).toBe(false);
  });

  it("rejects a missing or out-of-range weight", () => {
    expect(measurementFormSchema.safeParse({ ...baseInput, weightKg: "" }).success).toBe(false);
    expect(measurementFormSchema.safeParse({ ...baseInput, weightKg: "600" }).success).toBe(false);
    expect(measurementFormSchema.safeParse({ ...baseInput, weightKg: "-1" }).success).toBe(false);
  });

  it("parses optional BIA fields when present, accepting a comma decimal separator", () => {
    const result = measurementFormSchema.parse({
      ...baseInput,
      heightCm: "175",
      bodyFatPercent: "23,4",
      phaseAngle: "5.8",
      basalMetabolicRateKcal: "1600",
    });
    expect(result.heightCm).toBe(175);
    expect(result.bodyFatPercent).toBe(23.4);
    expect(result.phaseAngle).toBe(5.8);
    expect(result.basalMetabolicRateKcal).toBe(1600);
  });

  it("rejects an out-of-range optional field", () => {
    expect(measurementFormSchema.safeParse({ ...baseInput, bodyFatPercent: "150" }).success).toBe(
      false,
    );
  });
});

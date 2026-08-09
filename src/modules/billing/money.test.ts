import { describe, expect, it } from "vitest";
import { formatMinorUnits, toMinorUnits } from "./money";

describe("toMinorUnits", () => {
  it("converts a major-unit amount to minor units", () => {
    expect(toMinorUnits(19.99)).toBe(1999);
    expect(toMinorUnits(10)).toBe(1000);
  });

  it("rounds to the nearest minor unit", () => {
    expect(toMinorUnits(19.999)).toBe(2000);
  });
});

describe("formatMinorUnits", () => {
  it("formats EUR cents as a localized currency string", () => {
    const formatted = formatMinorUnits(1999, "EUR", "it-IT");
    expect(formatted).toContain("19,99");
    expect(formatted).toContain("€");
  });

  it("never receives or produces a floating point amount for whole euros", () => {
    expect(formatMinorUnits(2000, "EUR", "it-IT")).toContain("20,00");
  });
});

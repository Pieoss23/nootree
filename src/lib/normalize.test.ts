import { describe, expect, it } from "vitest";
import { normalizeEmail, normalizeFiscalCode } from "./normalize";

describe("normalizeEmail", () => {
  it("lowercases the email", () => {
    expect(normalizeEmail("Anna.Bianchi@Example.COM")).toBe("anna.bianchi@example.com");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeEmail("  anna@example.com  ")).toBe("anna@example.com");
  });
});

describe("normalizeFiscalCode", () => {
  it("uppercases the fiscal code", () => {
    expect(normalizeFiscalCode("rssmra80a01h501u")).toBe("RSSMRA80A01H501U");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeFiscalCode("  RSSMRA80A01H501U  ")).toBe("RSSMRA80A01H501U");
  });
});

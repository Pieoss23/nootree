import { describe, expect, it } from "vitest";
import { patientFormSchema } from "./validation";

const baseInput = {
  firstName: " Anna ",
  lastName: " Bianchi ",
  email: "",
  phone: "",
  birthDate: "",
  sex: "",
  fiscalCode: "",
  internalNotes: "",
};

describe("patientFormSchema", () => {
  it("trims names and turns blank optional fields into null", () => {
    const result = patientFormSchema.parse(baseInput);
    expect(result).toEqual({
      firstName: "Anna",
      lastName: "Bianchi",
      email: null,
      phone: null,
      birthDate: null,
      sex: null,
      fiscalCode: null,
      internalNotes: null,
    });
  });

  it("rejects a missing first or last name", () => {
    expect(patientFormSchema.safeParse({ ...baseInput, firstName: "" }).success).toBe(false);
    expect(patientFormSchema.safeParse({ ...baseInput, lastName: "" }).success).toBe(false);
  });

  it("normalizes a valid email to lowercase", () => {
    const result = patientFormSchema.parse({ ...baseInput, email: "  Anna@Example.COM " });
    expect(result.email).toBe("anna@example.com");
  });

  it("rejects an invalid email", () => {
    expect(patientFormSchema.safeParse({ ...baseInput, email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it("normalizes a fiscal code to uppercase", () => {
    const result = patientFormSchema.parse({ ...baseInput, fiscalCode: " bnchnn80a01f205x " });
    expect(result.fiscalCode).toBe("BNCHNN80A01F205X");
  });

  it("accepts a well-formed birth date", () => {
    const result = patientFormSchema.parse({ ...baseInput, birthDate: "1990-05-12" });
    expect(result.birthDate).toBe("1990-05-12");
  });

  it("rejects a malformed birth date", () => {
    expect(patientFormSchema.safeParse({ ...baseInput, birthDate: "12/05/1990" }).success).toBe(
      false,
    );
  });

  it("accepts a valid sex", () => {
    const result = patientFormSchema.parse({ ...baseInput, sex: "FEMALE" });
    expect(result.sex).toBe("FEMALE");
  });

  it("rejects an invalid sex", () => {
    expect(patientFormSchema.safeParse({ ...baseInput, sex: "OTHER" }).success).toBe(false);
  });
});

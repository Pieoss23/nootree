import { describe, expect, it } from "vitest";
import { appointmentFormSchema } from "./validation";

const baseInput = {
  patientId: "11111111-1111-1111-1111-111111111111",
  staffUserId: "22222222-2222-2222-2222-222222222222",
  date: "2026-08-13",
  startTime: "09:00",
  endTime: "09:30",
  notes: "",
};

describe("appointmentFormSchema", () => {
  it("accepts valid input and combines date+time into Date objects", () => {
    const result = appointmentFormSchema.safeParse(baseInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.startsAt.getHours()).toBe(9);
      expect(result.data.startsAt.getMinutes()).toBe(0);
      expect(result.data.endsAt.getHours()).toBe(9);
      expect(result.data.endsAt.getMinutes()).toBe(30);
      expect(result.data.notes).toBeNull();
    }
  });

  it("rejects when endTime is not after startTime", () => {
    const result = appointmentFormSchema.safeParse({
      ...baseInput,
      startTime: "10:00",
      endTime: "09:30",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when endTime equals startTime", () => {
    const result = appointmentFormSchema.safeParse({
      ...baseInput,
      startTime: "09:00",
      endTime: "09:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing patientId", () => {
    const result = appointmentFormSchema.safeParse({ ...baseInput, patientId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed time string", () => {
    const result = appointmentFormSchema.safeParse({ ...baseInput, startTime: "9:00" });
    expect(result.success).toBe(false);
  });

  it("keeps trimmed notes when provided", () => {
    const result = appointmentFormSchema.safeParse({ ...baseInput, notes: "  Prima visita  " });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.notes).toBe("Prima visita");
  });
});

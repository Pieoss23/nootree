import { describe, expect, it } from "vitest";
import { assertPlatformRole, PlatformAccessDeniedError } from "./authorization";

describe("assertPlatformRole", () => {
  it("does not throw when the role meets the minimum", () => {
    expect(() => assertPlatformRole("SUPERUSER", "USER")).not.toThrow();
    expect(() => assertPlatformRole("USER", "USER")).not.toThrow();
  });

  it("throws PlatformAccessDeniedError when the role is below the minimum", () => {
    expect(() => assertPlatformRole("USER", "SUPERUSER")).toThrow(PlatformAccessDeniedError);
  });
});

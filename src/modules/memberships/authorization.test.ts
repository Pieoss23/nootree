import { describe, expect, it } from "vitest";
import { assertRole, InsufficientRoleError } from "./authorization";

describe("assertRole", () => {
  it("does not throw when the role meets the minimum", () => {
    expect(() => assertRole("OWNER", "ASSISTANT")).not.toThrow();
    expect(() => assertRole("ASSISTANT", "ASSISTANT")).not.toThrow();
  });

  it("throws InsufficientRoleError when the role is below the minimum", () => {
    expect(() => assertRole("ASSISTANT", "OWNER")).toThrow(InsufficientRoleError);
  });
});

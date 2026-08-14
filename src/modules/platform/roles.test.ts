import { describe, expect, it } from "vitest";
import { getPlatformRoleLabel, getPlatformRoleRank, platformRoleAtLeast } from "./roles";

describe("getPlatformRoleLabel", () => {
  it("maps every platform role to an Italian label", () => {
    expect(getPlatformRoleLabel("USER")).toBe("Utente");
    expect(getPlatformRoleLabel("SUPERUSER")).toBe("Superuser");
  });
});

describe("getPlatformRoleRank / platformRoleAtLeast", () => {
  it("ranks SUPERUSER above USER", () => {
    expect(getPlatformRoleRank("SUPERUSER")).toBeGreaterThan(getPlatformRoleRank("USER"));
  });

  it("platformRoleAtLeast is true when role meets or exceeds the minimum", () => {
    expect(platformRoleAtLeast("SUPERUSER", "USER")).toBe(true);
    expect(platformRoleAtLeast("USER", "USER")).toBe(true);
  });

  it("platformRoleAtLeast is false when role is below the minimum", () => {
    expect(platformRoleAtLeast("USER", "SUPERUSER")).toBe(false);
  });
});

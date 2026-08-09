import { describe, expect, it } from "vitest";
import { getRoleLabel, getRoleRank, roleAtLeast } from "./roles";

describe("getRoleLabel", () => {
  it("maps every membership role to an Italian label", () => {
    expect(getRoleLabel("OWNER")).toBe("Titolare");
    expect(getRoleLabel("NUTRITIONIST")).toBe("Nutrizionista");
    expect(getRoleLabel("ASSISTANT")).toBe("Assistente");
  });
});

describe("getRoleRank / roleAtLeast", () => {
  it("ranks OWNER above NUTRITIONIST above ASSISTANT", () => {
    expect(getRoleRank("OWNER")).toBeGreaterThan(getRoleRank("NUTRITIONIST"));
    expect(getRoleRank("NUTRITIONIST")).toBeGreaterThan(getRoleRank("ASSISTANT"));
  });

  it("roleAtLeast is true when role meets or exceeds the minimum", () => {
    expect(roleAtLeast("OWNER", "ASSISTANT")).toBe(true);
    expect(roleAtLeast("NUTRITIONIST", "NUTRITIONIST")).toBe(true);
  });

  it("roleAtLeast is false when role is below the minimum", () => {
    expect(roleAtLeast("ASSISTANT", "OWNER")).toBe(false);
  });
});

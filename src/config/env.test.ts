import { describe, expect, it } from "vitest";
import { validateServerEnv } from "./env";

const baseEnv = {
  NODE_ENV: "development",
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
};

describe("validateServerEnv", () => {
  it("accepts a minimal valid development environment", () => {
    const env = validateServerEnv(baseEnv);
    expect(env.DATABASE_URL).toBe(baseEnv.DATABASE_URL);
    expect(env.NODE_ENV).toBe("development");
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => validateServerEnv({ NODE_ENV: "development" })).toThrow(/DATABASE_URL/);
  });

  it("rejects a malformed DATABASE_URL", () => {
    expect(() => validateServerEnv({ ...baseEnv, DATABASE_URL: "not-a-url" })).toThrow();
  });

  it("leaves Resend and Stripe variables optional in development", () => {
    expect(() => validateServerEnv(baseEnv)).not.toThrow();
  });

  it("requires AUTH_SECRET to be at least 32 characters when present", () => {
    expect(() => validateServerEnv({ ...baseEnv, AUTH_SECRET: "too-short" })).toThrow(
      /AUTH_SECRET/,
    );
  });

  it("requires AUTH_SECRET when NODE_ENV=production", () => {
    expect(() => validateServerEnv({ ...baseEnv, NODE_ENV: "production" })).toThrow(
      /AUTH_SECRET is required/,
    );
  });

  it("accepts production when AUTH_SECRET is set", () => {
    const env = validateServerEnv({
      ...baseEnv,
      NODE_ENV: "production",
      AUTH_SECRET: "a".repeat(32),
    });
    expect(env.NODE_ENV).toBe("production");
  });

  it("defaults NODE_ENV to development when unset", () => {
    const env = validateServerEnv({ DATABASE_URL: baseEnv.DATABASE_URL });
    expect(env.NODE_ENV).toBe("development");
  });
});

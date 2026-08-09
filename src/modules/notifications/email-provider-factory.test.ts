import { describe, expect, it } from "vitest";
import { getEmailProvider } from "./email-provider-factory";
import { ConsoleEmailProvider } from "./console-email-provider";
import { ResendEmailProvider } from "./resend-email-provider";

describe("getEmailProvider", () => {
  it("returns ConsoleEmailProvider in development when Resend isn't configured", () => {
    const provider = getEmailProvider({ NODE_ENV: "development" });
    expect(provider).toBeInstanceOf(ConsoleEmailProvider);
  });

  it("returns ResendEmailProvider when both Resend variables are set", () => {
    const provider = getEmailProvider({
      NODE_ENV: "development",
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM_EMAIL: "login@example.com",
    });
    expect(provider).toBeInstanceOf(ResendEmailProvider);
  });

  it("returns ResendEmailProvider in production when configured", () => {
    const provider = getEmailProvider({
      NODE_ENV: "production",
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM_EMAIL: "login@example.com",
    });
    expect(provider).toBeInstanceOf(ResendEmailProvider);
  });

  it("throws in production when Resend isn't configured", () => {
    expect(() => getEmailProvider({ NODE_ENV: "production" })).toThrow(/Resend is not configured/);
  });

  it("throws in production when only one Resend variable is set", () => {
    expect(() =>
      getEmailProvider({ NODE_ENV: "production", RESEND_API_KEY: "re_test_key" }),
    ).toThrow(/Resend is not configured/);
  });
});

import "server-only";
import { z } from "zod";

/**
 * Server-side environment schema.
 *
 * Variables tied to a provider that is not yet wired up (Resend, Stripe) stay
 * optional in every environment so the app can boot before those modules are
 * implemented. Each module is responsible for asserting its own variables are
 * present before it performs a real call (see `assertResendConfigured` /
 * `assertStripeConfigured` below) so a missing key fails loudly at the call
 * site instead of silently no-oping.
 */
export const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url({ message: "DATABASE_URL must be a valid PostgreSQL connection string" }),
  // Only used by DB integration tests, so they never touch the dev database.
  TEST_DATABASE_URL: z.url().optional(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters long").optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.email().optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

/** Pure validation function, kept separate from the process.env singleton below so it's unit-testable with fixtures. */
export function validateServerEnv(raw: Record<string, string | undefined>): ServerEnv {
  const parsed = serverSchema.safeParse(raw);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration. Check your .env file against .env.example:\n${issues}`,
    );
  }

  if (parsed.data.NODE_ENV === "production" && !parsed.data.AUTH_SECRET) {
    throw new Error("AUTH_SECRET is required when NODE_ENV=production.");
  }

  return parsed.data;
}

export const env = validateServerEnv(process.env);

export function assertResendConfigured(
  value: Pick<ServerEnv, "RESEND_API_KEY" | "RESEND_FROM_EMAIL">,
): asserts value is { RESEND_API_KEY: string; RESEND_FROM_EMAIL: string } {
  if (!value.RESEND_API_KEY || !value.RESEND_FROM_EMAIL) {
    throw new Error(
      "Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL to send real emails.",
    );
  }
}

export function assertStripeConfigured(
  value: Pick<ServerEnv, "STRIPE_SECRET_KEY">,
): asserts value is { STRIPE_SECRET_KEY: string } {
  if (!value.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY to enable billing calls.");
  }
}

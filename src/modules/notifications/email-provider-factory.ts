import "server-only";
import type { EmailProvider } from "./provider";
import { ConsoleEmailProvider } from "./console-email-provider";
import { ResendEmailProvider } from "./resend-email-provider";

export type EmailProviderEnv = {
  NODE_ENV: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
};

/**
 * Takes `env` as a parameter (rather than importing the `@/config/env`
 * singleton) so the selection logic is unit-testable without a live
 * environment — mirrors `validateServerEnv` in src/config/env.ts.
 *
 * Picks the real Resend-backed provider when configured; otherwise falls
 * back to the dev-only console provider — except in production, where a
 * missing Resend config is a hard failure instead of a silent no-op.
 */
export function getEmailProvider(env: EmailProviderEnv): EmailProvider {
  if (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL) {
    return new ResendEmailProvider(env.RESEND_API_KEY, env.RESEND_FROM_EMAIL);
  }

  if (env.NODE_ENV === "production") {
    throw new Error(
      "Resend is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL before deploying to production.",
    );
  }

  return new ConsoleEmailProvider();
}

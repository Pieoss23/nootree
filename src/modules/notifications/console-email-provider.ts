import type { EmailProvider, SendEmailInput, SendEmailResult } from "./provider";

/**
 * Development-only stand-in for a real email provider: logs to the server
 * console instead of sending anything. Never wire this into a production
 * code path — it exists so the login screen can be exercised locally before
 * Resend is configured (see docs/architecture/authentication-boundary.md).
 */
export class ConsoleEmailProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const id = `dev-${Date.now()}`;
    console.warn(
      `[notifications] DEV MODE — email not actually sent.\n  to: ${input.to}\n  subject: ${input.subject}\n  id: ${id}\n  html: ${input.html}`,
    );
    return { id };
  }
}

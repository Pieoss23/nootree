import "server-only";
import { Resend } from "resend";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "./provider";

/** Real transactional email, backed by Resend. See ConsoleEmailProvider for the dev-only stand-in. */
export class ResendEmailProvider implements EmailProvider {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    this.client = new Resend(apiKey);
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    if (error) {
      throw new Error(`Resend failed to send email: ${error.message}`);
    }

    return { id: data.id };
  }
}

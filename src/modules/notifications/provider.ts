/**
 * The notifications domain never imports Resend directly. A
 * `ResendEmailProvider` implementing this interface will be injected from
 * infrastructure once real sending is implemented (out of scope for
 * Milestone 1).
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type SendEmailResult = {
  id: string;
};

export interface EmailProvider {
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

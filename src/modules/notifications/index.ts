export type { EmailProvider, SendEmailInput, SendEmailResult } from "./provider";
export { ConsoleEmailProvider } from "./console-email-provider";
export { ResendEmailProvider } from "./resend-email-provider";
export { getEmailProvider } from "./email-provider-factory";
export type { EmailProviderEnv } from "./email-provider-factory";

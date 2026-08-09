"use server";

import { ConsoleEmailProvider } from "@/modules/notifications";

export type RequestMagicLinkState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

/**
 * Placeholder for the passwordless login flow (Milestone 1.1). Uses the
 * dev-only console email adapter — no real email is sent, no session is
 * created. See docs/architecture/authentication-boundary.md.
 */
export async function requestMagicLink(
  _prevState: RequestMagicLinkState,
  formData: FormData,
): Promise<RequestMagicLinkState> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email.includes("@")) {
    return { status: "error", message: "Inserisci un indirizzo email valido." };
  }

  const provider = new ConsoleEmailProvider();
  await provider.send({
    to: email,
    subject: "Il tuo link di accesso a nootree",
    html: "<p>Link di accesso (modalità sviluppo).</p>",
  });

  return {
    status: "sent",
    message:
      "Modalità sviluppo: nessuna email è stata realmente inviata. Controlla la console del server.",
  };
}

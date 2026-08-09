"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export type RequestMagicLinkState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

/**
 * Starts the real Auth.js magic-link flow. In development the link is sent
 * through `ConsoleEmailProvider` (logs to the server console instead of
 * actually sending) — see docs/architecture/authentication-boundary.md.
 */
export async function requestMagicLink(
  _prevState: RequestMagicLinkState,
  formData: FormData,
): Promise<RequestMagicLinkState> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email.includes("@")) {
    return { status: "error", message: "Inserisci un indirizzo email valido." };
  }

  try {
    await signIn("email", { email, redirect: false, redirectTo: "/app" });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        status: "error",
        message: "Non è stato possibile inviare il link di accesso. Riprova.",
      };
    }
    throw error;
  }

  return {
    status: "sent",
    message:
      "Modalità sviluppo: nessuna email è stata realmente inviata. Controlla la console del server per il link di accesso.",
  };
}

import "server-only";
import NextAuth, { type NextAuthConfig, type DefaultSession } from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { ConsoleEmailProvider } from "@/modules/notifications";
import { env } from "@/config/env";
import { isAppRouteAuthorized } from "./auth-authorization";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

/**
 * `accounts` is unused by the current magic-link-only flow (Auth.js never
 * calls `linkAccount`/`getUserByAccount` for `type: "email"` sign-ins), and
 * its columns don't yet follow Auth.js's exact OAuth token-storage shape
 * (e.g. `expires_at` as an epoch integer). Cast until a real OAuth provider
 * is added and the table is reshaped to match.
 */
const adapterSchema = {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
};

export const config = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: DrizzleAdapter(db, adapterSchema as any),
  session: { strategy: "database" },
  secret: env.AUTH_SECRET,
  pages: { signIn: "/login" },
  providers: [
    Nodemailer({
      id: "email",
      name: "Email",
      from: "login@nootree.local",
      // Required by the Nodemailer provider factory even though it's never
      // used: `sendVerificationRequest` below is fully overridden and never
      // calls `createTransport`.
      server: { host: "localhost", port: 1025 },
      async sendVerificationRequest({ identifier, url }) {
        // Dev-only: swap for the real Resend-backed EmailProvider once
        // notifications go live (see docs/architecture/authentication-boundary.md).
        const provider = new ConsoleEmailProvider();
        await provider.send({
          to: identifier,
          subject: "Il tuo link di accesso a nootree",
          html: `<p>Clicca sul link per accedere a nootree: <a href="${url}">${url}</a></p>`,
        });
      },
    }),
  ],
  callbacks: {
    authorized({ request, auth }) {
      return isAppRouteAuthorized(request.nextUrl.pathname, !!auth?.user);
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);

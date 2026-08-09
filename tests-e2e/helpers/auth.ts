import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { Page } from "@playwright/test";
import { users, sessions } from "../../src/db/schema";

// Matches DEMO_OWNER_EMAIL in src/db/seed-core.ts. Not imported directly:
// that module pulls in `@/config/plans` via the `@` alias, which Playwright's
// runner doesn't resolve the way Vitest/Next.js do.
const DEMO_OWNER_EMAIL = "owner@demo.nootree.dev";

// Matches the Auth.js v5 default (non-secure, http) session cookie name —
// see src/lib/auth.ts and the "database" session strategy.
const SESSION_COOKIE_NAME = "authjs.session-token";

async function setSessionCookie(page: Page, sessionToken: string): Promise<void> {
  await page.context().addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      url: "http://localhost:3000",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

function connectToDevDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — required by the e2e sign-in helpers.");
  }
  const sql = postgres(connectionString);
  return { sql, db: drizzle(sql) };
}

/**
 * Signs a Playwright page in as the seeded demo owner by inserting a real
 * Auth.js database session row directly, then setting the session cookie.
 * Bypasses the magic-link email step, which requires reading the dev
 * server's console output — not available to the test process.
 */
export async function signInAsDemoOwner(page: Page): Promise<void> {
  const { sql, db } = connectToDevDatabase();
  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, DEMO_OWNER_EMAIL))
      .limit(1);
    if (!user) {
      throw new Error(
        `Seeded demo owner (${DEMO_OWNER_EMAIL}) not found — run \`pnpm db:seed\` first.`,
      );
    }

    const sessionToken = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({ sessionToken, userId: user.id, expires });
    await setSessionCookie(page, sessionToken);
  } finally {
    await sql.end();
  }
}

/**
 * Signs a Playwright page in as a brand-new user with no membership in any
 * tenant, to exercise the "no active tenant" state (src/lib/active-tenant.ts).
 */
export async function signInAsUserWithNoMembership(page: Page): Promise<void> {
  const { sql, db } = connectToDevDatabase();
  try {
    const [user] = await db
      .insert(users)
      .values({ email: `e2e-no-membership-${randomUUID()}@example.test` })
      .returning();

    const sessionToken = randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({ sessionToken, userId: user.id, expires });
    await setSessionCookie(page, sessionToken);
  } finally {
    await sql.end();
  }
}

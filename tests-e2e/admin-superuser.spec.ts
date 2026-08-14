import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { tenants } from "../src/db/schema";
import {
  signInAsDemoOwner,
  signInAsPlatformAdmin,
  signInAsUserWithNoMembership,
} from "./helpers/auth";

/** A second tenant beyond the single seeded demo one, to prove the admin
 * overview is genuinely cross-tenant, not just "shows the one seed tenant". */
async function createExtraTenant(): Promise<string> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set.");
  const sql = postgres(connectionString);
  try {
    const db = drizzle(sql);
    const name = `Studio Extra ${randomUUID().slice(0, 8)}`;
    await db.insert(tenants).values({ name, slug: `extra-${randomUUID()}` });
    return name;
  } finally {
    await sql.end();
  }
}

test.describe("platform admin (/admin)", () => {
  test("unauthenticated visitors are redirected to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("an authenticated non-superuser is redirected to /app", async ({ page }) => {
    await signInAsUserWithNoMembership(page);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/app$/);
  });

  test("a tenant member (not a superuser) is also redirected to /app", async ({ page }) => {
    await signInAsDemoOwner(page);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/app$/);
  });

  test("the superuser sees tenants across more than one tenant, not just their own", async ({
    page,
  }) => {
    const extraTenantName = await createExtraTenant();

    await signInAsPlatformAdmin(page);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Cross-tenant" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Studio Nutrizionale Demo" })).toBeVisible();
    await expect(page.getByRole("cell", { name: extraTenantName })).toBeVisible();
  });
});

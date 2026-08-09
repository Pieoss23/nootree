import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("landing page renders and links to login", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "nootree" })).toBeVisible();
    await page.getByRole("link", { name: "Accedi" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("login page accepts an email and shows the dev-mode notice", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Accedi", { exact: true })).toBeVisible();
    await page.getByLabel("Email").fill("owner@demo.nootree.dev");
    await page.getByRole("button", { name: "Invia link di accesso" }).click();
    await expect(page.getByText(/modalità sviluppo/i)).toBeVisible();
  });

  test("dashboard (Oggi) shows the demo tenant and greeting", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("heading", { name: /^Ciao,/ })).toBeVisible();
    await expect(page.getByText("Studio Nutrizionale Demo")).toBeVisible();
  });

  test("patients page lists the seeded demo patients", async ({ page }) => {
    await page.goto("/app/patients");
    await expect(page.getByRole("heading", { name: "Pazienti" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Anna Bianchi" })).toBeVisible();
  });

  test("not-found page is shown for an unknown route", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByText("Pagina non trovata")).toBeVisible();
  });
});

test.describe("navigation", () => {
  test("desktop: sidebar navigation switches pages", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/app");
    await page
      .getByRole("navigation", { name: "Navigazione principale" })
      .getByRole("link", { name: "Pazienti" })
      .click();
    await expect(page).toHaveURL(/\/app\/patients$/);
    await expect(page.getByRole("heading", { name: "Pazienti" })).toBeVisible();
  });

  test("mobile: menu sheet opens and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/app");
    await page.getByRole("button", { name: "Apri navigazione" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Team" }).click();
    await expect(page).toHaveURL(/\/app\/team$/);
    await expect(page.getByRole("heading", { name: "Team" })).toBeVisible();
  });
});

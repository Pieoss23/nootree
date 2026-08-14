import { test, expect } from "@playwright/test";
import { signInAsDemoOwner } from "./helpers/auth";

test.describe("products catalog", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemoOwner(page);
  });

  test("shows the shared food catalog and creates/archives a custom product", async ({ page }) => {
    await page.goto("/app/products");

    // Catalogo condiviso: verifica che il seed sia visibile.
    await expect(page.getByRole("cell", { name: "Pasta di semola (secca)" })).toBeVisible();

    const uniqueSuffix = Date.now();
    const productName = `Insalata dello chef ${uniqueSuffix}`;

    // Create
    await page.getByRole("button", { name: "Nuovo prodotto" }).click();
    await page.getByLabel("Nome", { exact: true }).fill(productName);
    await page.getByLabel("Kcal / 100g").fill("120");
    await page.getByRole("button", { name: "Crea prodotto" }).click();

    const row = page.getByRole("row", { name: new RegExp(productName) });
    await expect(row).toBeVisible();
    await expect(row.getByText("Attivo")).toBeVisible();

    // Archive
    await row.getByRole("button", { name: /Azioni per/ }).click();
    await page.getByText("Archivia", { exact: true }).click();
    await expect(row.getByText("Archiviato")).toBeVisible();
  });

  test("blocks creating a product without a kcal value", async ({ page }) => {
    await page.goto("/app/products");
    await page.getByRole("button", { name: "Nuovo prodotto" }).click();
    await page.getByLabel("Nome", { exact: true }).fill("Prodotto senza kcal");
    await page.getByLabel("Kcal / 100g").fill("");
    await page.getByRole("button", { name: "Crea prodotto" }).click();
    await expect(page.getByText("Controlla i campi evidenziati.")).toBeVisible();
  });
});

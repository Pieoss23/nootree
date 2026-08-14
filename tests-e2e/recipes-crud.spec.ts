import { test, expect } from "@playwright/test";
import { signInAsDemoOwner } from "./helpers/auth";

test.describe("recipes panel", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemoOwner(page);
  });

  test("shows seeded recipes and creates a recipe with an ingredient", async ({ page }) => {
    await page.goto("/app/recipes");

    await expect(page.getByRole("link", { name: "Pollo con riso e zucchine" })).toBeVisible();

    const uniqueSuffix = Date.now();
    const recipeName = `Ricetta E2E ${uniqueSuffix}`;

    await page.getByRole("button", { name: "Nuova ricetta" }).click();
    await page.getByLabel("Nome", { exact: true }).fill(recipeName);
    await page.getByRole("button", { name: "Crea ricetta" }).click();

    await page.getByRole("link", { name: recipeName }).click();
    await expect(page.getByRole("heading", { name: recipeName })).toBeVisible();

    const main = page.getByRole("main");
    await main.getByRole("button", { name: "Aggiungi ingrediente" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Ingrediente").click();
    await page.getByRole("option", { name: "Mele" }).click();
    await dialog.getByLabel("Quantità (g)").fill("100");
    await dialog.getByRole("button", { name: "Aggiungi", exact: true }).click();

    await expect(main.getByText("Mele")).toBeVisible();
    await expect(main.getByRole("cell", { name: "52", exact: true })).toBeVisible(); // kcal for 100g of Mele
  });
});

import { test, expect } from "@playwright/test";
import { signInAsDemoOwner } from "./helpers/auth";

test.describe("patients CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemoOwner(page);
  });

  test("create, edit and archive a patient", async ({ page }) => {
    const uniqueSuffix = Date.now();
    const firstName = "E2E";
    const lastName = `Patient${uniqueSuffix}`;
    const editedLastName = `Patient${uniqueSuffix}Edited`;

    await page.goto("/app/patients");

    // Create
    await page.getByRole("button", { name: "Nuovo paziente" }).click();
    await page.getByLabel("Nome", { exact: true }).fill(firstName);
    await page.getByLabel("Cognome").fill(lastName);
    await page.getByLabel("Email").fill(`e2e-${uniqueSuffix}@example.test`);
    await page.getByRole("button", { name: "Crea paziente" }).click();

    const row = page.getByRole("row", { name: new RegExp(`${firstName} ${lastName}$`) });
    await expect(row).toBeVisible();
    await expect(row.getByText("Attivo")).toBeVisible();

    // Edit
    await row.getByRole("button", { name: /Azioni per/ }).click();
    await page.getByText("Modifica", { exact: true }).click();
    await page.getByLabel("Cognome").fill(editedLastName);
    await page.getByRole("button", { name: "Salva modifiche" }).click();

    const editedRow = page.getByRole("row", {
      name: new RegExp(`${firstName} ${editedLastName}$`),
    });
    await expect(editedRow).toBeVisible();

    // Archive
    await editedRow.getByRole("button", { name: /Azioni per/ }).click();
    await page.getByText("Archivia", { exact: true }).click();
    await expect(editedRow.getByText("Archiviato")).toBeVisible();

    // Reactivate
    await editedRow.getByRole("button", { name: /Azioni per/ }).click();
    await page.getByText("Riattiva", { exact: true }).click();
    await expect(editedRow.getByText("Attivo")).toBeVisible();
  });

  test("blocks creating a patient with an invalid email", async ({ page }) => {
    await page.goto("/app/patients");
    await page.getByRole("button", { name: "Nuovo paziente" }).click();
    await page.getByLabel("Nome", { exact: true }).fill("Invalid");
    await page.getByLabel("Cognome").fill("Email");
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByRole("button", { name: "Crea paziente" }).click();
    await expect(page.getByText("Controlla i campi evidenziati.")).toBeVisible();
  });
});

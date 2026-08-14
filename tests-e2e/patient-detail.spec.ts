import { test, expect } from "@playwright/test";
import { signInAsDemoOwner } from "./helpers/auth";

test.describe("patient detail", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemoOwner(page);
  });

  test("opens from the list, edits anamnesi and tracks measurements", async ({ page }) => {
    const uniqueSuffix = Date.now();
    const firstName = "E2EDetail";
    const lastName = `Patient${uniqueSuffix}`;

    await page.goto("/app/patients");

    await page.getByRole("button", { name: "Nuovo paziente" }).click();
    await page.getByLabel("Nome", { exact: true }).fill(firstName);
    await page.getByLabel("Cognome").fill(lastName);
    await page.getByRole("button", { name: "Crea paziente" }).click();

    await page.getByRole("link", { name: `${firstName} ${lastName}` }).click();
    await expect(page.getByRole("heading", { name: `${firstName} ${lastName}` })).toBeVisible();

    // Edit anamnesi
    await page.getByRole("button", { name: "Modifica", exact: true }).click();
    await page.getByLabel("Allergie / intolleranze").fill("Lattosio");
    await page
      .getByRole("checkbox", { name: "Consenso al trattamento dei dati sanitari (GDPR art. 9)" })
      .click();
    await page.getByRole("button", { name: "Salva" }).click();
    const main = page.getByRole("main");
    await expect(main.getByText("Lattosio")).toBeVisible();
    await expect(main.getByText("Registrato il")).toBeVisible();

    // Add first measurement
    await main.getByRole("button", { name: "Aggiungi misurazione" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Data").fill("2026-01-01");
    await dialog.getByLabel("Peso (kg)").fill("82");
    await dialog.getByRole("button", { name: "Aggiungi misurazione" }).click();
    await expect(main.getByText("82 kg")).toBeVisible();

    // Add second (more recent) measurement
    await main.getByRole("button", { name: "Aggiungi misurazione" }).click();
    await dialog.getByLabel("Data").fill("2026-02-01");
    await dialog.getByLabel("Peso (kg)").fill("80");
    await dialog.getByRole("button", { name: "Aggiungi misurazione" }).click();
    await expect(main.getByText("80 kg")).toBeVisible();

    await expect(main.getByText("Prima pesata")).toBeVisible();
    await expect(main.getByText("Ultima pesata")).toBeVisible();
  });

  test("assigns a recipe with a suggested dosage from the Ricette tab", async ({ page }) => {
    const uniqueSuffix = Date.now();
    const firstName = "E2ERecipe";
    const lastName = `Patient${uniqueSuffix}`;

    await page.goto("/app/patients");
    await page.getByRole("button", { name: "Nuovo paziente" }).click();
    await page.getByLabel("Nome", { exact: true }).fill(firstName);
    await page.getByLabel("Cognome").fill(lastName);
    await page.getByLabel("Data di nascita").fill("1990-05-12");
    await page.getByLabel("Sesso").click();
    await page.getByRole("option", { name: "Femmina" }).click();
    await page.getByRole("button", { name: "Crea paziente" }).click();

    await page.getByRole("link", { name: `${firstName} ${lastName}` }).click();
    const main = page.getByRole("main");

    // Attività fisica, necessaria per il calcolo del fabbisogno giornaliero.
    await main.getByRole("button", { name: "Modifica", exact: true }).click();
    await page.getByLabel("Attività fisica").click();
    await page.getByRole("option", { name: "Moderata" }).click();
    await page.getByRole("button", { name: "Salva" }).click();

    // Peso/altezza, necessari per la stima Mifflin-St Jeor (nessun BMR misurato).
    await main.getByRole("button", { name: "Aggiungi misurazione" }).click();
    const measurementDialog = page.getByRole("dialog");
    await measurementDialog.getByLabel("Data").fill("2026-02-01");
    await measurementDialog.getByLabel("Peso (kg)").fill("65");
    await measurementDialog.getByLabel("Altezza (cm)").fill("165");
    await measurementDialog.getByRole("button", { name: "Aggiungi misurazione" }).click();
    await expect(main.getByText("65 kg")).toBeVisible();

    await page.getByRole("tab", { name: "Ricette" }).click();
    await expect(main.getByText("Fabbisogno giornaliero stimato")).toBeVisible();
    await expect(main.getByText("BMR stimato")).toBeVisible();

    await main.getByRole("button", { name: "Assegna ricetta" }).click();
    const assignDialog = page.getByRole("dialog");
    await assignDialog.getByLabel("Ricetta").click();
    await page.getByRole("option", { name: "Pollo con riso e zucchine" }).click();
    await expect(assignDialog.getByText("Porzione suggerita")).toBeVisible();
    await assignDialog.getByRole("button", { name: "Assegna" }).click();

    await expect(main.getByText("Pollo con riso e zucchine")).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";
import { signInAsDemoOwner } from "./helpers/auth";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

test.describe("appointments (agenda)", () => {
  test.beforeEach(async ({ page }) => {
    await signInAsDemoOwner(page);
  });

  test("creates an appointment, sees it in agenda/settimana/mese, marks completed, then deletes it", async ({
    page,
  }) => {
    const today = todayIsoDate();

    await page.goto("/app/appointments");
    await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();

    await page.getByRole("button", { name: "Nuovo appuntamento" }).click();
    const createDialog = page.getByRole("dialog");
    await createDialog.getByLabel("Paziente").click();
    await page.getByRole("option", { name: "Anna Bianchi" }).click();
    await createDialog.getByLabel("Membro dello studio").click();
    await page.getByRole("option", { name: "Demo Owner" }).click();
    await createDialog.getByLabel("Data").fill(today);
    await createDialog.getByLabel("Inizio").fill("10:00");
    await createDialog.getByLabel("Fine").fill("10:30");
    await createDialog.getByRole("button", { name: "Crea appuntamento" }).click();

    // Vista agenda (default)
    const agendaRow = page.getByTestId("appointment-row").filter({ hasText: "Anna Bianchi" });
    await expect(agendaRow).toBeVisible();
    await expect(agendaRow.getByText("10:00 – 10:30")).toBeVisible();

    // Vista settimana
    await page.getByRole("link", { name: "Settimana" }).click();
    await expect(page.getByText(/10:00 Anna Bianchi/)).toBeVisible();

    // Vista mese
    await page.getByRole("link", { name: "Mese" }).click();
    await expect(page.getByText(/Anna Bianchi/)).toBeVisible();

    // Torna in agenda e segna come completato (scoped to the in-page view switcher:
    // "Agenda" also appears in the sidebar nav and the breadcrumb)
    await page.getByRole("main").getByRole("link", { name: "Agenda", exact: true }).click();
    await page.getByRole("button", { name: "Azioni appuntamento" }).click();
    await page.getByRole("menuitem", { name: "Segna come completato" }).click();
    await expect(page.getByText("Completato")).toBeVisible();

    // Elimina dal dialog di modifica
    await page.getByRole("button", { name: "Azioni appuntamento" }).click();
    await page.getByRole("menuitem", { name: "Modifica" }).click();
    const editDialog = page.getByRole("dialog");
    page.once("dialog", (dialog) => dialog.accept());
    await editDialog.getByRole("button", { name: "Elimina" }).click();

    await expect(page.getByText("Nessun appuntamento in questo intervallo")).toBeVisible();
  });

  test("blocks creating an appointment with an end time before the start time", async ({
    page,
  }) => {
    await page.goto("/app/appointments");

    await page.getByRole("button", { name: "Nuovo appuntamento" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Paziente").click();
    await page.getByRole("option", { name: "Anna Bianchi" }).click();
    await dialog.getByLabel("Membro dello studio").click();
    await page.getByRole("option", { name: "Demo Owner" }).click();
    await dialog.getByLabel("Data").fill(todayIsoDate());
    await dialog.getByLabel("Inizio").fill("11:00");
    await dialog.getByLabel("Fine").fill("10:00");
    await dialog.getByRole("button", { name: "Crea appuntamento" }).click();

    await expect(dialog.getByText("Non è stato possibile salvare")).toBeVisible();
  });
});

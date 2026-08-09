/** Trims and lowercases an email address for comparison/storage. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Trims and uppercases an Italian fiscal code (codice fiscale). */
export function normalizeFiscalCode(fiscalCode: string): string {
  return fiscalCode.trim().toUpperCase();
}

/**
 * Money is always stored and passed around as an integer in the currency's
 * minor unit (e.g. cents for EUR) — never as a float. These helpers are the
 * only place that should convert between minor units and a display string.
 */

export function formatMinorUnits(
  amountMinorUnits: number,
  currency: string,
  locale = "it-IT",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountMinorUnits / 100);
}

export function toMinorUnits(amountMajorUnits: number): number {
  return Math.round(amountMajorUnits * 100);
}

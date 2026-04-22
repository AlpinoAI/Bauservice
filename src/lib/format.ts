import type { Example } from "@/lib/types";

export function formatCurrency(
  value: number | undefined,
  locale: string = "de-DE"
): string | null {
  if (typeof value !== "number") return null;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function betragOf(it: Example): number | undefined {
  if ("betrag" in it && typeof it.betrag === "number") return it.betrag;
  if ("geschaetzterBetrag" in it && typeof it.geschaetzterBetrag === "number")
    return it.geschaetzterBetrag;
  return undefined;
}

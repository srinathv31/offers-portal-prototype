import type { CreditCardProduct } from "@/lib/db/schema";

// Credit card product branded colors
export const creditCardProductColors: Record<CreditCardProduct, string> = {
  FLEXPAY:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  DOUBLE_UP:
    "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  CASH_CREDIT:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  FIRST_CLASS:
    "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  CLEAR:
    "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600",
};

export const creditCardProductNames: Record<CreditCardProduct, string> = {
  FLEXPAY: "FlexPay",
  DOUBLE_UP: "Double Up",
  CASH_CREDIT: "Cash Credit",
  FIRST_CLASS: "First Class",
  CLEAR: "Clear",
};

export const creditCardProductDescriptions: Record<CreditCardProduct, string> =
  {
    FLEXPAY: "Flexible payment options",
    DOUBLE_UP: "2x points on everything",
    CASH_CREDIT: "Cash back rewards",
    FIRST_CLASS: "Premium travel benefits",
    CLEAR: "Simple, no-fee card",
  };

export function getCreditCardProductName(product: CreditCardProduct): string {
  return creditCardProductNames[product];
}

export function getCreditCardProductDescription(
  product: CreditCardProduct
): string {
  return creditCardProductDescriptions[product];
}

export function getCreditCardProductColor(product: CreditCardProduct): string {
  return creditCardProductColors[product];
}

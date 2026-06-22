export const DEFAULT_DISPLAY_CURRENCY = "EUR";

const toFiniteNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeCurrencyCode = (
  currency?: string | null,
  fallback = DEFAULT_DISPLAY_CURRENCY
) => {
  const normalized = currency?.trim().toUpperCase();
  return normalized || fallback;
};

export const formatMoney = (
  amount: unknown,
  currency?: string | null,
  options?: Intl.NumberFormatOptions
) => {
  const numericAmount = toFiniteNumber(amount, 0);
  const resolvedCurrency = normalizeCurrencyCode(currency);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: resolvedCurrency,
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits:
        options?.maximumFractionDigits ??
        (Number.isInteger(numericAmount) ? 0 : 2),
      ...options,
    }).format(numericAmount);
  } catch {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: DEFAULT_DISPLAY_CURRENCY,
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits:
        options?.maximumFractionDigits ??
        (Number.isInteger(numericAmount) ? 0 : 2),
      ...options,
    }).format(numericAmount);
  }
};

const getNestedCurrency = (source: unknown, keys: string[]) => {
  let current = source;

  for (const key of keys) {
    if (typeof current !== "object" || current === null || Array.isArray(current)) {
      return null;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" && current.trim() ? current : null;
};

export const resolveCustomerCurrency = ({
  moneyCurrency,
  configCurrency,
  restaurant,
  fallback = DEFAULT_DISPLAY_CURRENCY,
}: {
  moneyCurrency?: string | null;
  configCurrency?: string | null;
  restaurant?: unknown;
  fallback?: string;
}) =>
  normalizeCurrencyCode(
    moneyCurrency ||
      configCurrency ||
      getNestedCurrency(restaurant, ["settings", "currency"]) ||
      getNestedCurrency(restaurant, ["settings", "customerApp", "currency"]) ||
      getNestedCurrency(restaurant, ["settings", "checkout", "currency"]) ||
      getNestedCurrency(restaurant, ["settings", "payments", "currency"]) ||
      getNestedCurrency(restaurant, ["settings", "defaultCurrency"]) ||
      fallback,
    fallback
  );

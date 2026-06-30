export type DomainContext = {
  tenantId?: string | null;
  restaurantId?: string | null;
  restaurantName?: string | null;
  restaurantSlug?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  host?: string | null;
  subdomain?: string | null;
  customDomain?: string | null;
  logoUrl?: string | null;
  branding?: unknown;
};

const STORAGE_KEY = "deliveryway-domain-context";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) => (typeof value === "string" ? value : null);

export const normalizeDomainHost = (value: string) => {
  const trimmedValue = value.trim().toLowerCase();

  if (!trimmedValue) return "";

  try {
    const url = trimmedValue.includes("://") ? new URL(trimmedValue) : new URL(`https://${trimmedValue}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return trimmedValue.split("/")[0].split(":")[0].replace(/^www\./, "");
  }
};

export const normalizeDomainContext = (value: unknown): DomainContext | null => {
  const data = isRecord(value) && isRecord(value.data) ? value.data : value;

  if (!isRecord(data)) return null;

  const restaurantId = getString(data.restaurantId);

  if (!restaurantId) return null;

  return {
    tenantId: getString(data.tenantId),
    restaurantId,
    restaurantName: getString(data.restaurantName),
    restaurantSlug: getString(data.restaurantSlug),
    branchId: getString(data.branchId),
    branchName: getString(data.branchName),
    host: getString(data.host),
    subdomain: getString(data.subdomain),
    customDomain: getString(data.customDomain),
    logoUrl: getString(data.logoUrl),
    branding: data.branding,
  };
};

export const readStoredDomainContext = (): DomainContext | null => {
  if (typeof window === "undefined") return null;

  try {
    return normalizeDomainContext(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null"));
  } catch {
    return null;
  }
};

export const writeStoredDomainContext = (context: DomainContext | null) => {
  if (typeof window === "undefined") return;

  if (!context) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
};

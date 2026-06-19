import { getRequest } from "@/services/http";

type LegalAddress = {
  street?: string;
  shopNumber?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
};

export type LegalProfile = {
  ownerName?: string;
  legalBusinessName?: string;
  taxNumber?: string;
  businessAddress?: LegalAddress;
  contractText?: string;
};

export type PrivacyPolicyContent = {
  restaurantId?: string;
  restaurantCoverImage?: string;
  title: string;
  content: string;
  legalProfile?: LegalProfile | null;
  policyLink?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

const looksLikePostalCode = (value: unknown) =>
  typeof value === "string" && /[0-9]/.test(value) && /^[A-Za-z0-9][A-Za-z0-9 -]{2,10}$/.test(value.trim());

const normalizeLegalAddress = (value: unknown): LegalAddress | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const explicitPostalCode = getString(value.postalCode) ?? getString(value.zipCode) ?? getString(value.zip);
  const state = getString(value.state);
  const stateAsPostalCode = !explicitPostalCode && looksLikePostalCode(state) ? state : undefined;
  const address = {
    street: getString(value.street),
    shopNumber:
      getString(value.shopNumber) ??
      getString(value.houseNumber) ??
      getString(value.area) ??
      getString(value.addressLine2) ??
      getString(value.line2),
    postalCode: explicitPostalCode ?? stateAsPostalCode,
    city: getString(value.city),
    state: stateAsPostalCode ? undefined : state,
    country: getString(value.country),
  };

  return Object.values(address).some(Boolean) ? address : undefined;
};

const normalizeLegalProfile = (value: unknown): LegalProfile | null => {
  if (!isRecord(value)) {
    return null;
  }

  const profile = {
    ownerName: getString(value.ownerName),
    legalBusinessName: getString(value.legalBusinessName),
    taxNumber: getString(value.taxNumber),
    businessAddress: normalizeLegalAddress(value.businessAddress),
    contractText: getString(value.contractText),
  };

  return Object.values(profile).some(Boolean) ? profile : null;
};

export const normalizePrivacyPolicyContent = (value: unknown): PrivacyPolicyContent => {
  const record = isRecord(value) ? value : {};

  return {
    restaurantId: getString(record.restaurantId),
    restaurantCoverImage: getString(record.restaurantCoverImage),
    title: getString(record.title) ?? "Privacy Policy",
    content: getString(record.content) ?? "",
    legalProfile: normalizeLegalProfile(record.legalProfile),
    policyLink: getString(record.policyLink),
  };
};

export const fetchPrivacyPolicyContent = async (restaurantId: string) => {
  const response = await getRequest(
    `/v1/public-content/privacy-policy?restaurantId=${encodeURIComponent(restaurantId)}`
  );

  if (response.error) {
    throw new Error(typeof response.error === "string" ? response.error : "Failed to load privacy policy");
  }

  return normalizePrivacyPolicyContent(response.data);
};

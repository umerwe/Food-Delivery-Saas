import { getRequest } from "@/services/http";

type LegalAddress = {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
};

export type LegalProfile = {
  legalBusinessName?: string;
  taxNumber?: string;
  businessAddress?: LegalAddress;
  contractText?: string;
};

export type PrivacyPolicyContent = {
  restaurantId?: string;
  title: string;
  content: string;
  legalProfile?: LegalProfile | null;
  policyLink?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined);

const normalizeLegalAddress = (value: unknown): LegalAddress | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const address = {
    street: getString(value.street),
    city: getString(value.city),
    state: getString(value.state),
    country: getString(value.country),
  };

  return Object.values(address).some(Boolean) ? address : undefined;
};

const normalizeLegalProfile = (value: unknown): LegalProfile | null => {
  if (!isRecord(value)) {
    return null;
  }

  const profile = {
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

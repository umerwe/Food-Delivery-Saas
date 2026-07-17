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

const ALLOWED_LEGAL_TAGS = new Set([
  "a", "b", "br", "div", "em", "font", "h1", "h2", "h3", "h4", "i", "li", "ol", "p", "strong", "u", "ul",
]);

const ALLOWED_LEGAL_ATTRIBUTES = new Set(["color", "href", "rel", "size", "target"]);

export const sanitizeLegalHtml = (value: string) => {
  let sanitized = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|svg|math|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\/?(script|style|iframe|object|embed|svg|math|form|input|button|textarea|select|meta|link)[^>]*>/gi, "")
    .replace(/\s(on[a-z]+|style|src|srcset)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(href)\s*=\s*(["'])\s*(javascript:|data:)[^"']*\2/gi, "");

  sanitized = sanitized.replace(/<\/?([a-z][a-z0-9-]*)([^>]*)>/gi, (match, tagName: string, rawAttributes: string) => {
    const tag = tagName.toLowerCase();

    if (!ALLOWED_LEGAL_TAGS.has(tag)) return "";
    if (match.startsWith("</")) return `</${tag}>`;

    const attributes = Array.from(rawAttributes.matchAll(/\s([a-z-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi))
      .map(([, name, doubleQuotedValue, singleQuotedValue, unquotedValue]) => {
        const attributeName = name.toLowerCase();
        const attributeValue = doubleQuotedValue ?? singleQuotedValue ?? unquotedValue ?? "";

        if (!ALLOWED_LEGAL_ATTRIBUTES.has(attributeName)) return null;
        if (attributeName === "href" && /^(javascript:|data:)/i.test(attributeValue.trim())) return null;
        if (attributeName === "color" && !/^#[0-9a-f]{3,8}$/i.test(attributeValue.trim())) return null;
        if (attributeName === "size" && !/^[1-7]$/.test(attributeValue.trim())) return null;

        return `${attributeName}="${attributeValue.replace(/"/g, "&quot;")}"`;
      })
      .filter(Boolean)
      .join(" ");
    const safeAttributes = attributes ? ` ${attributes}` : "";

    if (tag === "a") {
      const hasTarget = /\starget=/.test(safeAttributes);
      const hasRel = /\srel=/.test(safeAttributes);
      return `<${tag}${safeAttributes}${hasTarget ? "" : ' target="_blank"'}${hasRel ? "" : ' rel="noopener noreferrer"'}>`;
    }

    return `<${tag}${safeAttributes}>`;
  });

  return sanitized;
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

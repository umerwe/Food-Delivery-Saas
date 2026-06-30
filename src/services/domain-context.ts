import { API_BASE_URL } from "@/lib/axios";
import { buildApiUrl } from "@/lib/api-endpoint";
import { normalizeDomainContext, normalizeDomainHost, type DomainContext } from "@/lib/domain-context";

const getMessage = (value: unknown, fallback: string) => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const message = (value as Record<string, unknown>).message;
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
};

export const resolveDomainContext = async (host: string): Promise<DomainContext> => {
  const normalizedHost = normalizeDomainHost(host);

  if (!normalizedHost) {
    throw new Error("Host is required");
  }

  const endpoint = `/customer-app/domain-context?host=${encodeURIComponent(normalizedHost)}`;
  const response = await fetch(buildApiUrl(API_BASE_URL, endpoint), {
    headers: { "Content-Type": "application/json" },
  });
  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(getMessage(payload, "Failed to resolve restaurant domain"));
  }

  const context = normalizeDomainContext(payload);

  if (!context) {
    throw new Error("Invalid restaurant domain response");
  }

  return context;
};

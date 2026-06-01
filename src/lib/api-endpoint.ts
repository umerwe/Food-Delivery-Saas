export const normalizeApiEndpoint = (endpoint: string, baseUrl: string) => {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  if (/\/v1$/i.test(normalizedBaseUrl) && normalizedEndpoint.startsWith("/v1/")) {
    return normalizedEndpoint.slice("/v1".length);
  }

  return normalizedEndpoint;
};

export const buildApiUrl = (baseUrl: string, endpoint: string) =>
  `${baseUrl.replace(/\/+$/, "")}${normalizeApiEndpoint(endpoint, baseUrl)}`;

import { afterEach, describe, expect, it, vi } from "vitest";

import { LOCALE_STORAGE_KEY } from "@/config/i18n";

import { buildApiUrl, normalizeApiEndpoint } from "./api-endpoint";
import { httpClient } from "./axios";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizeApiEndpoint", () => {
  it("removes duplicate v1 when the base URL already includes v1", () => {
    expect(normalizeApiEndpoint("/v1/branches", "https://deliveryway.dcodax.co/api/v1")).toBe("/branches");
    expect(normalizeApiEndpoint("v1/branches", "https://deliveryway.dcodax.co/api/v1/")).toBe("/branches");
  });

  it("keeps v1 when the base URL does not include v1", () => {
    expect(normalizeApiEndpoint("/v1/branches", "https://deliveryway.dcodax.co/api")).toBe("/v1/branches");
  });

  it("keeps customer app endpoints under the configured API base", () => {
    expect(normalizeApiEndpoint("/customer-app/home", "https://deliveryway.dcodax.co/api/v1")).toBe("/customer-app/home");
  });

  it("builds absolute API URLs without duplicating v1", () => {
    expect(buildApiUrl("https://deliveryway.dcodax.co/api/v1", "/v1/branches")).toBe(
      "https://deliveryway.dcodax.co/api/v1/branches"
    );
    expect(buildApiUrl("https://deliveryway.dcodax.co/api", "/v1/branches")).toBe(
      "https://deliveryway.dcodax.co/api/v1/branches"
    );
  });
});

describe("httpClient request context", () => {
  it("adds the persisted locale to first-party API requests", async () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn((key: string) =>
          key === LOCALE_STORAGE_KEY ? "de" : null,
        ),
      },
    });
    let acceptLanguage: string | undefined;

    await httpClient.get("/customer-app/home", {
      adapter: async (config) => {
        acceptLanguage = config.headers.get("Accept-Language")?.toString();

        return {
          config,
          data: {},
          headers: {},
          status: 200,
          statusText: "OK",
        };
      },
    });

    expect(acceptLanguage).toBe("de");
  });
});

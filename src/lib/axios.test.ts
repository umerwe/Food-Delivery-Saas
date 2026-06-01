import { describe, expect, it } from "vitest";

import { buildApiUrl, normalizeApiEndpoint } from "./api-endpoint";

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

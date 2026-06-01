import { describe, expect, it } from "vitest";

import { buildLoginRoute, getSafeRedirectPath } from "./auth-routes";

describe("auth route helpers", () => {
  it("keeps safe internal redirects", () => {
    expect(getSafeRedirectPath("/checkout?step=payment")).toBe("/checkout?step=payment");
    expect(buildLoginRoute("/checkout")).toBe("/auth/login?redirect=%2Fcheckout");
  });

  it("rejects external urls", () => {
    expect(getSafeRedirectPath("https://evil.example/login")).toBe("/");
    expect(buildLoginRoute("https://evil.example/login")).toBe("/auth/login");
  });

  it("rejects protocol-relative and javascript urls", () => {
    expect(getSafeRedirectPath("//evil.example/login")).toBe("/");
    expect(getSafeRedirectPath("javascript:alert(1)")).toBe("/");
  });
});

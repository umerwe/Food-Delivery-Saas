import { describe, expect, it } from "vitest";

import { cleanParams } from "./params";

describe("cleanParams", () => {
  it("removes null, undefined, and empty strings", () => {
    expect(
      cleanParams({
        name: "pizza",
        empty: "",
        nullable: null,
        missing: undefined,
      })
    ).toEqual({ name: "pizza" });
  });

  it("preserves zero and false", () => {
    expect(cleanParams({ page: 0, active: false })).toEqual({ page: 0, active: false });
  });

  it("cleans arrays while preserving valid values", () => {
    expect(cleanParams({ ids: ["1", "", null, undefined, 0, false] })).toEqual({
      ids: ["1", 0, false],
    });
  });
});

import { describe, expect, it } from "vitest";

import { getArrayData, getMeta, unwrapData } from "./response";

describe("response helpers", () => {
  it("unwraps nested data responses", () => {
    expect(unwrapData({ data: { data: { id: "1" } } })).toEqual({ id: "1" });
  });

  it("returns arrays from common response shapes", () => {
    expect(getArrayData({ data: [{ id: "1" }] })).toEqual([{ id: "1" }]);
    expect(getArrayData({ data: { items: [{ id: "2" }] } })).toEqual([{ id: "2" }]);
  });

  it("returns empty array for non-array payloads", () => {
    expect(getArrayData({ data: { id: "1" } })).toEqual([]);
  });

  it("extracts meta from wrapped responses", () => {
    expect(getMeta({ data: { items: [], meta: { page: 2 } } })).toEqual({ page: 2 });
  });

  it("extracts pagination from wrapped responses", () => {
    expect(getMeta({ data: { items: [], pagination: { totalPages: 3 } } })).toEqual({ totalPages: 3 });
  });
});

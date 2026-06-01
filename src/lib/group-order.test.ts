import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildGroupOrderInviteLink,
  clearStoredGroupOrderCode,
  getStoredGroupOrderCode,
  isClosedGroupOrder,
  setStoredGroupOrderCode,
} from "./group-order";

const storage = new Map<string, string>();

class StorageMock {}

const windowMock = {} as Window & typeof globalThis;

vi.stubGlobal("window", windowMock);
vi.stubGlobal("Storage", StorageMock);

const localStorageMock = new StorageMock() as Storage;
Object.assign(localStorageMock, {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
  removeItem: vi.fn((key: string) => storage.delete(key)),
});

Object.defineProperty(windowMock, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

describe("group order helpers", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("stores, reads, and clears the group order code", () => {
    setStoredGroupOrderCode("ABC123");
    expect(getStoredGroupOrderCode()).toBe("ABC123");

    clearStoredGroupOrderCode();
    expect(getStoredGroupOrderCode()).toBe("");
  });

  it("detects closed group order statuses", () => {
    expect(isClosedGroupOrder({ id: "1", status: "CHECKED_OUT" })).toBe(true);
    expect(isClosedGroupOrder({ id: "1", status: "open" })).toBe(false);
  });

  it("builds invite links without changing the route", () => {
    expect(buildGroupOrderInviteLink({ origin: "https://demo.test", inviteCode: "ABC123" })).toBe(
      "https://demo.test/items?code=ABC123"
    );
  });
});

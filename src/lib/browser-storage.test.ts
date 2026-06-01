import { beforeEach, describe, expect, it, vi } from "vitest";

import { safeGetLocalStorageItem, safeRemoveLocalStorageItem, safeSetLocalStorageItem } from "./browser-storage";

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

describe("browser storage helpers", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("safely gets, sets, and removes local storage items", () => {
    safeSetLocalStorageItem("demo", "value");
    expect(safeGetLocalStorageItem("demo")).toBe("value");

    safeRemoveLocalStorageItem("demo");
    expect(safeGetLocalStorageItem("demo")).toBeNull();
  });

  it("returns null when local storage read throws", () => {
    vi.mocked(window.localStorage.getItem).mockImplementationOnce(() => {
      throw new Error("blocked");
    });

    expect(safeGetLocalStorageItem("demo")).toBeNull();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readCachedCuisineImage,
  removeCachedCuisineImage,
  writeCachedCuisineImage,
} from "./cuisine-image-cache";

class StorageMock {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("cuisine image cache", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: new StorageMock() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restores a recently decoded cuisine image", () => {
    writeCachedCuisineImage(
      "cuisine-1",
      "https://cdn.example.com/cuisine.webp",
      1_000,
    );

    expect(readCachedCuisineImage("cuisine-1", 2_000)).toBe(
      "https://cdn.example.com/cuisine.webp",
    );
  });

  it("removes expired cuisine images", () => {
    writeCachedCuisineImage(
      "cuisine-1",
      "https://cdn.example.com/cuisine.webp",
      1_000,
    );

    expect(
      readCachedCuisineImage("cuisine-1", 24 * 60 * 60 * 1000 + 1_001),
    ).toBeNull();
  });

  it("can discard an image that fails to render", () => {
    writeCachedCuisineImage(
      "cuisine-1",
      "https://cdn.example.com/cuisine.webp",
      1_000,
    );
    removeCachedCuisineImage("cuisine-1");

    expect(readCachedCuisineImage("cuisine-1", 2_000)).toBeNull();
  });
});

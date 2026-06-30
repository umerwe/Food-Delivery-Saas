import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildGroupOrderInviteLink,
  canMutateGroupOrder,
  canParticipantEditGroupOrderItems,
  clearStoredGroupOrderCode,
  findCurrentGroupOrderParticipant,
  getStoredGroupOrderCode,
  isClosedGroupOrder,
  isGroupOrderParticipantCompleted,
  resolveGroupOrderDeliveryAddressId,
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

  it("allows group order mutation only before checkout", () => {
    expect(canMutateGroupOrder({ id: "1", status: "OPEN" })).toBe(true);
    expect(canMutateGroupOrder({ id: "1", status: "LOCKED" })).toBe(true);
    expect(canMutateGroupOrder({ id: "1", status: "CHECKED_OUT" })).toBe(false);
    expect(canMutateGroupOrder({ id: "1", status: "CANCELLED" })).toBe(false);
  });

  it("blocks completed participants from editing group order items", () => {
    const order = {
      id: "1",
      status: "OPEN",
      participants: [
        { id: "p1", userId: "user-1", status: "COMPLETED" },
        { id: "p2", userId: "user-2", status: "ACTIVE" },
      ],
    };
    const completedParticipant = findCurrentGroupOrderParticipant({ order, userId: "user-1" });
    const activeParticipant = findCurrentGroupOrderParticipant({ order, userId: "user-2" });

    expect(isGroupOrderParticipantCompleted(completedParticipant)).toBe(true);
    expect(canParticipantEditGroupOrderItems({ order, participant: completedParticipant })).toBe(false);
    expect(canParticipantEditGroupOrderItems({ order, participant: activeParticipant })).toBe(true);
  });

  it("builds invite links without changing the route", () => {
    expect(buildGroupOrderInviteLink({ origin: "https://demo.test", inviteCode: "ABC123" })).toBe(
      "https://demo.test/items?code=ABC123"
    );
  });

  it("prefers the selected delivery address when it still exists", () => {
    expect(
      resolveGroupOrderDeliveryAddressId({
        selectedAddressId: "address-2",
        addresses: [
          { id: "address-1", isDefault: true },
          { id: "address-2" },
        ],
      })
    ).toBe("address-2");
  });

  it("falls back to the default delivery address when selection is missing", () => {
    expect(
      resolveGroupOrderDeliveryAddressId({
        selectedAddressId: "",
        addresses: [
          { id: "address-1" },
          { id: "address-2", isDefault: true },
        ],
      })
    ).toBe("address-2");
  });
});

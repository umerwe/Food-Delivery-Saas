import {
  safeGetLocalStorageItem,
  safeRemoveLocalStorageItem,
  safeSetLocalStorageItem,
} from "@/lib/browser-storage";
import type { AddressRecord } from "@/services/profile";
import type {
  GroupOrder,
  GroupOrderParticipant,
  GroupOrderStatus,
} from "@/types/group-order";

export const GROUP_ORDER_CODE_KEY = "***";
export const GROUP_ORDER_ID_KEY = "deliveryway:group-order-id";
export const GROUP_ORDER_COMPLETED_KEY = "deliveryway:completed-group-orders";
export const GROUP_ORDER_LAST_LOBBY_ID_KEY =
  "deliveryway:last-group-order-lobby-id";
export const GROUP_ORDER_LOBBY_CHANGED_EVENT =
  "deliveryway:group-order:lobby-changed";

export const GROUP_ORDER_CLOSED_STATUSES: GroupOrderStatus[] = [
  "CHECKED_OUT",
  "CANCELLED",
  "EXPIRED",
];

export const GROUP_ORDER_MUTABLE_STATUSES: GroupOrderStatus[] = [
  "OPEN",
  "LOCKED",
];

export const getStoredGroupOrderCode = () =>
  safeGetLocalStorageItem(GROUP_ORDER_CODE_KEY) || "";

export const getStoredGroupOrderId = () =>
  safeGetLocalStorageItem(GROUP_ORDER_ID_KEY) || "";

export const setStoredGroupOrderCode = (inviteCode: string) => {
  safeSetLocalStorageItem(GROUP_ORDER_CODE_KEY, inviteCode);
};

export const setStoredGroupOrderId = (orderId: string | number) => {
  safeSetLocalStorageItem(GROUP_ORDER_ID_KEY, String(orderId));
};

export const getStoredGroupOrderLobbyId = () =>
  safeGetLocalStorageItem(GROUP_ORDER_LAST_LOBBY_ID_KEY) || "";

const dispatchGroupOrderLobbyChanged = () => {
  if (typeof window === "undefined") return;
  if (typeof window.dispatchEvent !== "function") return;

  window.dispatchEvent(new Event(GROUP_ORDER_LOBBY_CHANGED_EVENT));
};

export const setStoredGroupOrderLobbyId = (orderId: string | number) => {
  safeSetLocalStorageItem(GROUP_ORDER_LAST_LOBBY_ID_KEY, String(orderId));
  dispatchGroupOrderLobbyChanged();
};

export const clearStoredGroupOrderCode = () => {
  safeRemoveLocalStorageItem(GROUP_ORDER_CODE_KEY);
  safeRemoveLocalStorageItem(GROUP_ORDER_ID_KEY);
};

type CompletedGroupOrderStore = {
  ids: string[];
  codes: string[];
};

const emptyCompletedGroupOrderStore = (): CompletedGroupOrderStore => ({
  ids: [],
  codes: [],
});

const normalizeStorageValue = (value?: string | number | null) =>
  String(value ?? "").trim();

const readCompletedGroupOrderStore = (): CompletedGroupOrderStore => {
  const raw = safeGetLocalStorageItem(GROUP_ORDER_COMPLETED_KEY);

  if (!raw) return emptyCompletedGroupOrderStore();

  try {
    const parsed = JSON.parse(raw) as Partial<CompletedGroupOrderStore>;

    return {
      ids: Array.isArray(parsed.ids) ? parsed.ids.map(String) : [],
      codes: Array.isArray(parsed.codes) ? parsed.codes.map(String) : [],
    };
  } catch {
    return emptyCompletedGroupOrderStore();
  }
};

const writeCompletedGroupOrderStore = (store: CompletedGroupOrderStore) => {
  safeSetLocalStorageItem(GROUP_ORDER_COMPLETED_KEY, JSON.stringify(store));
};

export const markStoredGroupOrderCompleted = ({
  orderId,
  inviteCode,
}: {
  orderId?: string | number | null;
  inviteCode?: string | number | null;
}) => {
  const normalizedOrderId = normalizeStorageValue(orderId);
  const normalizedInviteCode = normalizeStorageValue(inviteCode);

  if (!normalizedOrderId && !normalizedInviteCode) return;

  if (normalizedOrderId) {
    setStoredGroupOrderLobbyId(normalizedOrderId);
  }

  const store = readCompletedGroupOrderStore();

  writeCompletedGroupOrderStore({
    ids: normalizedOrderId
      ? Array.from(new Set([...store.ids, normalizedOrderId]))
      : store.ids,
    codes: normalizedInviteCode
      ? Array.from(new Set([...store.codes, normalizedInviteCode]))
      : store.codes,
  });
};

export const isStoredGroupOrderCompleted = ({
  orderId,
  inviteCode,
}: {
  orderId?: string | number | null;
  inviteCode?: string | number | null;
}) => {
  const normalizedOrderId = normalizeStorageValue(orderId);
  const normalizedInviteCode = normalizeStorageValue(inviteCode);
  const store = readCompletedGroupOrderStore();

  return Boolean(
    (normalizedOrderId && store.ids.includes(normalizedOrderId)) ||
    (normalizedInviteCode && store.codes.includes(normalizedInviteCode)),
  );
};

export const unmarkStoredGroupOrderCompleted = ({
  orderId,
  inviteCode,
}: {
  orderId?: string | number | null;
  inviteCode?: string | number | null;
}) => {
  const normalizedOrderId = normalizeStorageValue(orderId);
  const normalizedInviteCode = normalizeStorageValue(inviteCode);

  if (!normalizedOrderId && !normalizedInviteCode) return;

  const store = readCompletedGroupOrderStore();

  writeCompletedGroupOrderStore({
    ids: normalizedOrderId
      ? store.ids.filter((id) => id !== normalizedOrderId)
      : store.ids,
    codes: normalizedInviteCode
      ? store.codes.filter((code) => code !== normalizedInviteCode)
      : store.codes,
  });
};

export const isClosedGroupOrder = (order: GroupOrder | null | undefined) => {
  const status = String(order?.status || "").toUpperCase();

  return GROUP_ORDER_CLOSED_STATUSES.includes(status);
};

export const canMutateGroupOrder = (order: GroupOrder | null | undefined) => {
  const status = String(order?.status || "").toUpperCase();

  return GROUP_ORDER_MUTABLE_STATUSES.includes(status);
};

export const isGroupOrderParticipantCompleted = (
  participant: GroupOrderParticipant | null | undefined,
) => String(participant?.status || "").toUpperCase() === "COMPLETED";

export const canParticipantEditGroupOrderItems = ({
  order,
  participant,
}: {
  order: GroupOrder | null | undefined;
  participant: GroupOrderParticipant | null | undefined;
}) =>
  Boolean(participant) &&
  canMutateGroupOrder(order) &&
  !isGroupOrderParticipantCompleted(participant);

export const findCurrentGroupOrderParticipant = ({
  order,
  userId,
}: {
  order: Pick<GroupOrder, "participants"> | null | undefined;
  userId?: string | number | null;
}) => {
  const normalizedUserId = String(userId || "");

  if (!normalizedUserId) return null;

  return (
    order?.participants?.find((participant) => {
      return (
        String(participant.userId || "") === normalizedUserId ||
        String(participant.user?.id || "") === normalizedUserId
      );
    }) ?? null
  );
};

export const buildGroupOrderInviteLink = ({
  origin,
  inviteCode,
}: {
  origin: string;
  inviteCode?: string | null;
}) => `${origin}/items?code=${inviteCode || ""}`;

export const resolveGroupOrderDeliveryAddressId = ({
  addresses,
  selectedAddressId,
}: {
  addresses: AddressRecord[];
  selectedAddressId?: string | null;
}) => {
  const normalizedSelectedAddressId = String(selectedAddressId || "").trim();

  if (
    normalizedSelectedAddressId &&
    addresses.some((address) => address.id === normalizedSelectedAddressId)
  ) {
    return normalizedSelectedAddressId;
  }

  return (
    addresses.find((address) => address.isDefault)?.id || addresses[0]?.id || ""
  );
};

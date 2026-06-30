import { safeGetLocalStorageItem, safeRemoveLocalStorageItem, safeSetLocalStorageItem } from "@/lib/browser-storage";
import type { AddressRecord } from "@/services/profile";
import type { GroupOrder, GroupOrderParticipant, GroupOrderStatus } from "@/types/group-order";

export const GROUP_ORDER_CODE_KEY = "***";

export const GROUP_ORDER_CLOSED_STATUSES: GroupOrderStatus[] = [
  "CHECKED_OUT",
  "CANCELLED",
  "EXPIRED",
];

export const GROUP_ORDER_MUTABLE_STATUSES: GroupOrderStatus[] = [
  "OPEN",
  "LOCKED",
];

export const getStoredGroupOrderCode = () => safeGetLocalStorageItem(GROUP_ORDER_CODE_KEY) || "";

export const setStoredGroupOrderCode = (inviteCode: string) => {
  safeSetLocalStorageItem(GROUP_ORDER_CODE_KEY, inviteCode);
};

export const clearStoredGroupOrderCode = () => {
  safeRemoveLocalStorageItem(GROUP_ORDER_CODE_KEY);
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
  participant: GroupOrderParticipant | null | undefined
) => String(participant?.status || "").toUpperCase() === "COMPLETED";

export const canParticipantEditGroupOrderItems = ({
  order,
  participant,
}: {
  order: GroupOrder | null | undefined;
  participant: GroupOrderParticipant | null | undefined;
}) => Boolean(participant) && canMutateGroupOrder(order) && !isGroupOrderParticipantCompleted(participant);

export const findCurrentGroupOrderParticipant = ({
  order,
  userId,
}: {
  order: Pick<GroupOrder, "participants"> | null | undefined;
  userId?: string | number | null;
}) => {
  const normalizedUserId = String(userId || "");

  if (!normalizedUserId) return null;

  return order?.participants?.find((participant) => {
    return String(participant.userId || "") === normalizedUserId;
  }) ?? null;
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
    addresses.find((address) => address.isDefault)?.id ||
    addresses[0]?.id ||
    ""
  );
};

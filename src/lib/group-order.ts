import { safeGetLocalStorageItem, safeRemoveLocalStorageItem, safeSetLocalStorageItem } from "@/lib/browser-storage";
import type { GroupOrder, GroupOrderStatus } from "@/types/group-order";

export const GROUP_ORDER_CODE_KEY = "***";

export const GROUP_ORDER_CLOSED_STATUSES: GroupOrderStatus[] = [
  "CHECKED_OUT",
  "CANCELLED",
  "EXPIRED",
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

export const buildGroupOrderInviteLink = ({
  origin,
  inviteCode,
}: {
  origin: string;
  inviteCode?: string | null;
}) => `${origin}/items?code=${inviteCode || ""}`;

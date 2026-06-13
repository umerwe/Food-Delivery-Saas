import type { BranchRecord } from "@/types/branch-selector";

export type GroupOrderStatus = "OPEN" | "LOCKED" | "CHECKED_OUT" | "CANCELLED" | "EXPIRED" | string;
export type GroupOrderParticipantStatus = "ACTIVE" | "PENDING" | string;
export type GroupOrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY" | string;
export type GroupOrderPaymentMethod = "COD" | "PAYPAL" | "STRIPE";

export type GroupOrderUser = {
  id?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
};

export type GroupOrderMenuItem = {
  id?: string | number | null;
  name?: string | null;
  imageUrl?: string | null;
};

export type GroupOrderItem = {
  id: string | number;
  quantity: number;
  menuItem?: GroupOrderMenuItem | null;
};

export type GroupOrderParticipant = {
  id: string | number;
  userId?: string | number | null;
  isHost?: boolean;
  status?: GroupOrderParticipantStatus;
  user?: GroupOrderUser | null;
  items?: GroupOrderItem[];
};

export type GroupOrderRestaurant = {
  id?: string | number | null;
  name?: string | null;
};

export type GroupOrderSummary = {
  itemCount?: number;
  subtotal?: number;
  deliveryFee?: number;
  totalAmount?: number;
};

export type GroupOrder = {
  id: string | number;
  inviteCode?: string | null;
  status?: GroupOrderStatus;
  hostUserId?: string | number | null;
  participantCount?: number;
  participants?: GroupOrderParticipant[];
  restaurant?: GroupOrderRestaurant | null;
  summary?: GroupOrderSummary | null;
  restaurantMenuId?: string | number | null;
  orderTime?: string | null;
  orderType?: GroupOrderType;
  branch?: BranchRecord | null;
};

export type CreateGroupOrderPayload = {
  branchId: string | number;
  orderType: GroupOrderType;
  deliveryAddressId: string | number | null;
  orderTime: string;
  hostNote: string | null;
};

export type CheckoutGroupOrderPayload = {
  paymentMethod: GroupOrderPaymentMethod;
  orderTime?: string | null;
  customerNote: string;
  couponCode: string;
};

export type GroupOrderSuccessData = {
  order?: {
    totalAmount?: number | null;
    orderTime?: string | null;
    isScheduled?: boolean | null;
  } | null;
  session?: {
    finalOrder?: {
      totalAmount?: number | null;
    } | null;
    deliveryAddress?: string | number | Record<string, unknown> | null;
    participants?: GroupOrderParticipant[];
  } | null;
};

export type UseGroupOrderResult = {
  order: GroupOrder | null;
  loading: boolean;
  redirecting: boolean;
  refetch: () => Promise<void>;
  isHost: boolean;
  isParticipant: boolean;
  participant: GroupOrderParticipant | undefined;
  canEditItems: boolean;
  canCheckout: boolean;
  canMutateGroupOrder: boolean;
};

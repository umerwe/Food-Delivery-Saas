import type { BranchRecord } from "@/types/branch-selector";

export type GroupOrderStatus = "OPEN" | "LOCKED" | "CHECKED_OUT" | "CANCELLED" | "EXPIRED" | string;
export type GroupOrderParticipantStatus = "ACTIVE" | "PENDING" | "COMPLETED" | string;
export type GroupOrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY" | string;
export type GroupOrderPaymentMethod =
  | "COD"
  | "CARD_ON_DELIVERY"
  | "PAYPAL"
  | "STRIPE"
  | "WALLET"
  | string;

export type GroupOrderUser = {
  id?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
};

export type GroupOrderModifier = {
  id?: string | number | null;
  modifierId?: string | number | null;
  name?: string | null;
  price?: number | string | null;
  priceDelta?: number | string | null;
  unitPrice?: number | string | null;
};

export type GroupOrderModifierLink = {
  id?: string | number | null;
  modifierId?: string | number | null;
  modifier?: GroupOrderModifier | null;
};

export type GroupOrderModifierGroupLink = {
  id?: string | number | null;
  modifierGroup?: {
    id?: string | number | null;
    modifierLinks?: GroupOrderModifierLink[];
  } | null;
};

export type GroupOrderMenuItem = {
  id?: string | number | null;
  name?: string | null;
  imageUrl?: string | null;
  price?: number | string | null;
  modifierLinks?: GroupOrderModifierGroupLink[];
};

export type GroupOrderSelectedOption = {
  id?: string | number | null;
  modifierId?: string | number | null;
  name?: string | null;
  quantity?: number | string | null;
  price?: number | string | null;
  priceDelta?: number | string | null;
  unitPrice?: number | string | null;
  total?: number | string | null;
  totalPrice?: number | string | null;
  modifier?: GroupOrderSelectedOption | null;
  addOn?: GroupOrderSelectedOption | null;
  addon?: GroupOrderSelectedOption | null;
};

export type GroupOrderItem = {
  id: string | number;
  quantity: number;
  unitPrice?: number | string | null;
  price?: number | string | null;
  totalPrice?: number | string | null;
  lineTotal?: number | string | null;
  modifiersTotal?: number | string | null;
  pricing?: {
    modifiers?: GroupOrderSelectedOption[];
    lineTotal?: number | string | null;
    totalPrice?: number | string | null;
    total?: number | string | null;
    unitPrice?: number | string | null;
    modifiersTotal?: number | string | null;
  } | null;
  menuItem?: GroupOrderMenuItem | null;
  selectedAddons?: GroupOrderSelectedOption[];
  selectedAddOns?: GroupOrderSelectedOption[];
  addOns?: GroupOrderSelectedOption[];
  addons?: GroupOrderSelectedOption[];
  selectedModifiers?: GroupOrderSelectedOption[];
  modifiers?: GroupOrderSelectedOption[];
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
  orderTime?: string | null;
  isScheduled?: boolean | null;
  subtotal?: number;
  deliveryFee?: number;
  tipAmount?: number;
  loyaltyDiscountAmount?: number;
  loyaltyPointsRedeemed?: number;
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
  expiresAt?: string | null;
  expiryAt?: string | null;
  expiresOn?: string | null;
  isScheduled?: boolean | null;
  orderType?: GroupOrderType;
  branch?: BranchRecord | null;
};

export type CreateGroupOrderPayload = {
  branchId: string | number;
  orderType: GroupOrderType;
  deliveryAddressId: string | number | null;
  orderTime: string | null;
  hostNote: string | null;
};

export type CheckoutGroupOrderPayload = {
  paymentMethod: GroupOrderPaymentMethod;
  orderTime?: string | null;
  customerNote: string;
  couponCode: string;
  loyaltyPoints?: number;
};

export type GroupOrderSuccessModifier = GroupOrderSelectedOption & {
  id?: string | number | null;
  modifierId?: string | number | null;
  name?: string | null;
  quantity?: number | string | null;
  unitPrice?: number | string | null;
  price?: number | string | null;
  priceDelta?: number | string | null;
  modifier?: GroupOrderSelectedOption | null;
  addOn?: GroupOrderSelectedOption | null;
  addon?: GroupOrderSelectedOption | null;
};

export type GroupOrderSuccessItem = {
  id?: string | number | null;
  menuItemId?: string | number | null;
  menuItemName?: string | null;
  name?: string | null;
  menuItem?: GroupOrderMenuItem | null;
  variationId?: string | number | null;
  variationName?: string | null;
  unitPrice?: number | string | null;
  quantity?: number | string | null;
  lineTotal?: number | string | null;
  totalPrice?: number | string | null;
  snapshotModifiers?: GroupOrderSuccessModifier[];
  addOns?: GroupOrderSuccessModifier[];
  addons?: GroupOrderSuccessModifier[];
  selectedAddons?: GroupOrderSuccessModifier[];
  selectedAddOns?: GroupOrderSuccessModifier[];
};

export type GroupOrderSuccessPricing = {
  subtotal?: number | string | null;
  taxAmount?: number | string | null;
  deliveryFee?: number | string | null;
  discountAmount?: number | string | null;
  totalAmount?: number | string | null;
  payableAmount?: number | string | null;
};

export type GroupOrderSuccessPayment = {
  selectedMethod?: string | null;
  status?: string | null;
  statusLabel?: string | null;
};

export type GroupOrderSuccessCoupon = {
  code?: string | null;
  title?: string | null;
  discountType?: string | null;
  discountValue?: number | string | null;
};

export type GroupOrderSuccessData = {
  order?: {
    id?: string | number | null;
    displayId?: string | null;
    orderType?: string | null;
    paymentMethod?: string | null;
    paymentStatus?: string | null;
    payment?: GroupOrderSuccessPayment | null;
    status?: string | null;
    subtotal?: number | string | null;
    taxAmount?: number | string | null;
    deliveryFee?: number | string | null;
    discountAmount?: number | string | null;
    payableAmount?: number | string | null;
    totalAmount?: number | string | null;
    orderTime?: string | null;
    scheduledFor?: string | null;
    isScheduled?: boolean | null;
    pricing?: GroupOrderSuccessPricing | null;
    items?: GroupOrderSuccessItem[];
    coupon?: GroupOrderSuccessCoupon | null;
  } | null;
  session?: {
    finalOrder?: {
      id?: string | number | null;
      totalAmount?: number | string | null;
    } | null;
    finalOrderId?: string | number | null;
    deliveryAddress?: string | number | Record<string, unknown> | null;
    participants?: GroupOrderParticipant[];
  } | null;
};

export type UseGroupOrderResult = {
  order: GroupOrder | null;
  updateOrder: (updater: GroupOrder | null | ((order: GroupOrder | null) => GroupOrder | null)) => void;
  loading: boolean;
  redirecting: boolean;
  refetch: () => Promise<void>;
  isHost: boolean;
  isParticipant: boolean;
  participant: GroupOrderParticipant | undefined;
  canEditItems: boolean;
  isParticipantCompleted: boolean;
  canCheckout: boolean;
  canMutateGroupOrder: boolean;
};

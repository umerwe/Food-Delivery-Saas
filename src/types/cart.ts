export type CartSelectedVariation = {
  id?: string;
  name?: string;
  displayText?: string;
  price?: number | string | null;
  pickupPrice?: number | string | null;
};

export type {
  MenuItemGroupedModifier,
  MenuItemVariationModifierPriceOverride,
  MenuItemVariationPriceOverride,
} from "@/components/pages/Items/types";

export type CartSelectedModifier = {
  id?: string;
  modifierId?: string;
  modifierGroupId?: string;
  groupName?: string;
  name?: string;
  quantity?: number;
  unitPrice?: number;
  priceDelta?: number | string | null;
  total?: number;
  modifier?: {
    id?: string;
    name?: string;
    priceDelta?: number | string | null;
  } | null;
  modifiers?: CartSelectedModifier[];
};

export type CartItem = {
  id: string;
  menuItemId?: string;
  quantity: number;
  unitPrice?: number;
  modifiersTotal?: number;
  unitPriceWithModifiers?: number;
  lineTotal?: number;
  selectedVariation?: CartSelectedVariation | null;
  selectedModifiers?: CartSelectedModifier[];
  dealId?: string | null;
};

export type CartAppliedPromotion = {
  id: string;
  title: string;
  applyMode?: string;
  autoApply?: boolean;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
};

export type ServiceChargeType = "PERCENTAGE" | "AMOUNT" | string;

export type CartQuote = {
  subtotal: number;
  taxAmount?: number;
  deliveryFee?: number;
  serviceChargeType?: ServiceChargeType | null;
  serviceChargeValue?: number | null;
  serviceChargeAmount?: number;
  tipAmount?: number;
  discountAmount?: number;
  couponCode?: string;
  loyaltyDiscountAmount?: number;
  loyaltyPointsRedeemed?: number;
  walletAppliedAmount?: number;
  totalAmount: number;
  payableAmount?: number;
  appliedPromotion?: CartAppliedPromotion | null;
};

export type CartModifierSelectionInput = {
  modifierGroupId: string;
  modifiers: Array<{
    modifierId: string;
    quantity: number;
  }>;
};

export type AddCartItemPayload = {
  branchId: string;
  menuItemId: string;
  restaurantMenuId?: string;
  dealId?: string;
  variationId?: string;
  quantity: number;
  modifiers?: Array<{ modifierId: string; quantity: number }>;
  modifierSelections?: CartModifierSelectionInput[];
  note?: string;
};

export type {
  CartPayload,
} from "@/components/pages/Items/types";
export type { CartUpdatePayload } from "@/services/cart";

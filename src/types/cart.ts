export type CartSelectedVariation = {
  id?: string;
  name?: string;
  displayText?: string;
  price?: number | string | null;
  pickupPrice?: number | string | null;
};

export type CartSelectedModifier = {
  id?: string;
  modifierId?: string;
  name?: string;
  quantity?: number;
  priceDelta?: number | string | null;
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

export type CartQuote = {
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  appliedPromotion?: CartAppliedPromotion | null;
};

export type {
  CartModifierSelectionInput,
  CartPayload,
} from "@/components/pages/Items/types";
export type { CartUpdatePayload } from "@/services/cart";

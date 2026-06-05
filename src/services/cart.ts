import { createDomainApiService } from "@/services/domain-api";
import { normalizeApiList, normalizeArray } from "@/components/pages/Items/utils/product-normalizers";
import type { ApiRecord } from "@/components/pages/Items/types";
import type { CartItemRecord } from "@/components/pages/Items/components/signature-selection/types";
import type { CartAppliedPromotion, CartQuote } from "@/types/cart";

type CartMutationPayload = Record<string, unknown>;

export type CartUpdatePayload = CartMutationPayload & {
  scheduledDeliveryAt?: string | null;
  orderTime?: string | null;
  tipAmount?: number | null;
};

const cartService = createDomainApiService();

export const getCart = cartService.get;
export const postCart = cartService.post;
export const patchCart = cartService.patch;
export const deleteCart = cartService.del;

const getRecord = (value: unknown): ApiRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value) ? value as ApiRecord : null;

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getString = (value: unknown) => (typeof value === "string" ? value : "");

const getServiceChargeType = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : null;

export const normalizeCartAppliedPromotion = (value: unknown): CartAppliedPromotion | null => {
  const promotion = getRecord(value);

  if (!promotion) {
    return null;
  }

  const id = getString(promotion.id);
  const title = getString(promotion.title);

  if (!id && !title) {
    return null;
  }

  return {
    id,
    title,
    applyMode: getString(promotion.applyMode) || undefined,
    autoApply: typeof promotion.autoApply === "boolean" ? promotion.autoApply : undefined,
    discountType: getString(promotion.discountType) || undefined,
    discountValue: toNumber(promotion.discountValue, 0),
    discountAmount: toNumber(promotion.discountAmount, 0),
  };
};

export const normalizeCartQuote = (value: unknown): CartQuote | null => {
  const quote = getRecord(value);

  if (!quote) {
    return null;
  }

  return {
    subtotal: toNumber(quote.subtotal, 0),
    taxAmount: toNumber(quote.taxAmount, 0),
    deliveryFee: toNumber(quote.deliveryFee, 0),
    serviceChargeType: getServiceChargeType(quote.serviceChargeType),
    serviceChargeValue: quote.serviceChargeValue === null || quote.serviceChargeValue === undefined
      ? null
      : toNumber(quote.serviceChargeValue, 0),
    serviceChargeAmount: toNumber(quote.serviceChargeAmount, 0),
    tipAmount: toNumber(quote.tipAmount, 0),
    discountAmount: toNumber(quote.discountAmount, 0),
    totalAmount: toNumber(quote.totalAmount, 0),
    payableAmount: toNumber(quote.payableAmount, toNumber(quote.totalAmount, 0)),
    appliedPromotion: normalizeCartAppliedPromotion(quote.appliedPromotion),
  };
};

const resolveCartRecord = (responseData: unknown) => {
  const resData = getRecord(responseData);
  const nestedData = getRecord(resData?.data);
  return resData?.items || resData?.quote ? resData : nestedData?.items || nestedData?.quote ? nestedData : resData;
};

export const fetchCustomerCart = async ({
  customerId,
  token,
}: {
  customerId: string;
  token?: string | null;
}) => {
  const response = await getCart(`/v1/cart?customerId=${customerId}`, token);

  if (!response || response.error) {
    return { response, items: [] as CartItemRecord[], quote: null as CartQuote | null };
  }

  const cart = resolveCartRecord(response.data);

  return {
    response,
    items: normalizeArray<CartItemRecord>(cart?.items),
    quote: normalizeCartQuote(cart?.quote),
  };
};

export const fetchCustomerCartItem = async ({
  customerId,
  cartItemId,
  token,
}: {
  customerId: string;
  cartItemId: string;
  token?: string | null;
}) => {
  const response = await getCart(`/v1/cart?customerId=${customerId}`, token);
  const cart = resolveCartRecord(response.data);
  const items = normalizeArray<ApiRecord>(cart?.items);

  return items.find(({ id }) => String(id || "") === String(cartItemId)) ?? null;
};

export const addCustomerCartItem = ({
  customerId,
  payload,
  token,
}: {
  customerId: string;
  payload: CartMutationPayload;
  token?: string | null;
}) => postCart(`/v1/cart/items?customerId=${customerId}`, cleanAddCartItemPayload(payload), token);

export const cleanAddCartItemPayload = (payload: CartMutationPayload): CartMutationPayload => {
  if (!payload.dealId) {
    return payload;
  }

  const cleanedPayload: CartMutationPayload = { ...payload };

  delete cleanedPayload.variationId;
  delete cleanedPayload.modifiers;
  delete cleanedPayload.sections;
  delete cleanedPayload.splitPizza;
  delete cleanedPayload.selectedSections;

  if (Array.isArray(cleanedPayload.modifierSelections)) {
    return {
      ...cleanedPayload,
      modifierSelections: cleanedPayload.modifierSelections,
    };
  }

  delete cleanedPayload.modifierSelections;

  return cleanedPayload;
};

export const normalizeCartUpdatePayload = (payload: CartUpdatePayload): CartMutationPayload => {
  const { orderTime, scheduledDeliveryAt, tipAmount, ...rest } = payload;
  const normalizedPayload: CartMutationPayload = { ...rest };

  if (tipAmount !== undefined) {
    const parsedTip = Number(tipAmount);

    if (tipAmount === null) {
      normalizedPayload.tipAmount = 0;
    } else if (Number.isFinite(parsedTip) && parsedTip >= 0) {
      normalizedPayload.tipAmount = parsedTip;
    }
  }

  if (scheduledDeliveryAt !== undefined) {
    return {
      ...normalizedPayload,
      scheduledDeliveryAt,
    };
  }

  if (orderTime !== undefined) {
    return {
      ...normalizedPayload,
      scheduledDeliveryAt: orderTime,
    };
  }

  return normalizedPayload;
};

export const updateCustomerCart = ({
  customerId,
  payload,
  token,
}: {
  customerId: string;
  payload: CartUpdatePayload;
  token?: string | null;
}) => patchCart(`/v1/cart?customerId=${customerId}`, normalizeCartUpdatePayload(payload), token);

export const quoteCustomerCart = ({
  customerId,
  token,
}: {
  customerId: string;
  token?: string | null;
}) => postCart(`/v1/cart/quote?customerId=${customerId}`, {}, token);

export const updateCustomerCartItem = ({
  cartItemId,
  payload,
  token,
}: {
  cartItemId: string;
  payload: CartMutationPayload;
  token?: string | null;
}) => patchCart(`/v1/cart/items/${cartItemId}`, payload, token);

export const clearCustomerCart = ({ customerId, token }: { customerId: string; token?: string | null }) =>
  deleteCart(`/v1/cart?customerId=${customerId}`, token);

export const updateCustomerCartItemQuantity = ({
  customerId,
  cartItemId,
  quantity,
  token,
}: {
  customerId: string;
  cartItemId: string;
  quantity: number;
  token?: string | null;
}) => patchCart(`/v1/cart/items/${cartItemId}?customerId=${customerId}`, { quantity }, token);

export const deleteCustomerCartItem = ({
  customerId,
  cartItemId,
  token,
}: {
  customerId: string;
  cartItemId: string;
  token?: string | null;
}) => deleteCart(`/v1/cart/items/${cartItemId}?customerId=${customerId}`, token);

export const fetchGroupOrders = async (token?: string | null) => {
  const response = await getCart("/v1/group-orders", token);

  return {
    response,
    groupOrders: normalizeApiList<ApiRecord>(response),
  };
};

export const addGroupOrderItem = ({
  groupOrderId,
  payload,
  token,
}: {
  groupOrderId: string;
  payload: CartMutationPayload;
  token?: string | null;
}) => postCart(`/v1/group-orders/${groupOrderId}/items`, payload, token);

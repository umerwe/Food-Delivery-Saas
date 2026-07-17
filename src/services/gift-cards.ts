import axios from "axios";

import { getRequestLocale } from "@/config/i18n";
import { API_BASE_URL } from "@/lib/axios";
import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import {
  buildGiftCardGuestPurchasePayload,
  buildGiftCardPurchasePayload,
  buildGiftCardRedeemPayload,
} from "@/validations/gift-cards";
import {
  normalizeGiftCardAvailabilityResponse,
  normalizeGiftCardGuestPurchaseResponse,
  normalizeGiftCardPurchaseResponse,
  normalizeGiftCardRedeemResponse,
  type GiftCardAvailabilityParams,
  type GiftCardGuestPurchasePayload,
  type GiftCardGuestPurchaseParams,
  type GiftCardGuestPurchaseResponse,
  type GiftCardPurchasePayload,
  type GiftCardPurchaseResponse,
  type GiftCardRedeemParams,
  type GiftCardRedeemPayload,
  type GiftCardRedeemResponse,
  type HomeGiftCards,
} from "@/types/gift-cards";

const publicGiftCardClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const GIFT_CARD_AVAILABLE_ENDPOINT = "/customer-app/gift-cards/available";
const GIFT_CARD_GUEST_PURCHASE_ENDPOINT = "/customer-app/gift-cards/guest-purchase";
const GIFT_CARD_PURCHASE_ENDPOINT = "/customer-app/gift-cards/purchase";
const GIFT_CARD_REDEEM_ENDPOINT = "/customer-app/gift-cards/redeem";

export const getAvailableGiftCards = async ({
  restaurantId,
  branchId,
}: GiftCardAvailabilityParams): Promise<HomeGiftCards> => {
  const response = await publicGiftCardClient.get<unknown>(
    GIFT_CARD_AVAILABLE_ENDPOINT,
    {
      params: cleanParams({
        restaurantId,
        branchId,
      }),
      headers: { "Accept-Language": getRequestLocale() },
    }
  );

  return normalizeGiftCardAvailabilityResponse(response.data);
};

export const guestPurchaseGiftCard = async (
  payload: GiftCardGuestPurchasePayload,
  params: GiftCardGuestPurchaseParams
): Promise<GiftCardGuestPurchaseResponse> => {
  const response = await publicGiftCardClient.post<unknown>(
    GIFT_CARD_GUEST_PURCHASE_ENDPOINT,
    buildGiftCardGuestPurchasePayload(payload),
    {
      params: cleanParams({
        restaurantId: params.restaurantId,
        branchId: params.branchId,
      }),
      headers: { "Accept-Language": getRequestLocale() },
    }
  );

  return normalizeGiftCardGuestPurchaseResponse(response.data);
};

export const purchaseGiftCard = async (
  payload: GiftCardPurchasePayload
): Promise<GiftCardPurchaseResponse> => {
  const response = await httpClient.post<unknown>(
    GIFT_CARD_PURCHASE_ENDPOINT,
    buildGiftCardPurchasePayload(payload)
  );

  return normalizeGiftCardPurchaseResponse(response.data);
};

export const redeemGiftCard = async (
  payload: GiftCardRedeemPayload,
  params?: GiftCardRedeemParams
): Promise<GiftCardRedeemResponse> => {
  const response = await httpClient.post<unknown>(
    GIFT_CARD_REDEEM_ENDPOINT,
    buildGiftCardRedeemPayload(payload),
    {
      params: cleanParams({
        customerId: params?.customerId,
      }),
    }
  );

  return normalizeGiftCardRedeemResponse(response.data);
};

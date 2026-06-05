import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import {
  buildGiftCardPurchasePayload,
  buildGiftCardRedeemPayload,
} from "@/validations/gift-cards";
import {
  normalizeGiftCardPurchaseResponse,
  normalizeGiftCardRedeemResponse,
  type GiftCardPurchasePayload,
  type GiftCardPurchaseResponse,
  type GiftCardRedeemParams,
  type GiftCardRedeemPayload,
  type GiftCardRedeemResponse,
} from "@/types/gift-cards";

const GIFT_CARD_PURCHASE_ENDPOINT = "/customer-app/gift-cards/purchase";
const GIFT_CARD_REDEEM_ENDPOINT = "/customer-app/gift-cards/redeem";

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

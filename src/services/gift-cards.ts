import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import { buildGiftCardRedeemPayload } from "@/validations/gift-cards";
import {
  normalizeGiftCardRedeemResponse,
  type GiftCardRedeemParams,
  type GiftCardRedeemPayload,
  type GiftCardRedeemResponse,
} from "@/types/gift-cards";

const GIFT_CARD_REDEEM_ENDPOINT = "/customer-app/gift-cards/redeem";

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

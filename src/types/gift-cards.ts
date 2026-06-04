export type GiftCardRedeemPayload = {
  code: string;
  branchId?: string;
};

export type GiftCardRedeemParams = {
  customerId?: string;
};

export type GiftCardRedeemResult = {
  customerId: string;
  giftCardId: string;
  code: string;
  walletTransactionId: string;
  creditedAmount: number;
  walletBalance: number;
  currency: string;
};

export type GiftCardRedeemResponse = {
  result: GiftCardRedeemResult;
  message?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const getNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizeGiftCardRedeemResponse = (
  response: unknown
): GiftCardRedeemResponse => {
  const root = isRecord(response) ? response : {};
  const data = isRecord(root.data) ? root.data : root;

  return {
    result: {
      customerId: getString(data.customerId),
      giftCardId: getString(data.giftCardId),
      code: getString(data.code),
      walletTransactionId: getString(data.walletTransactionId),
      creditedAmount: getNumber(data.creditedAmount),
      walletBalance: getNumber(data.walletBalance),
      currency: getString(data.currency, "PKR"),
    },
    message: getString(root.message) || undefined,
  };
};

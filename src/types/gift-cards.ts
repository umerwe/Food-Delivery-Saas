export type GiftCardPurchasePayload = {
  amount: number;
  title?: string;
  message?: string;
  expiresAt?: string;
};

export type GiftCardPurchaseResult = {
  code: string;
  qrPayload: string;
  amount: number;
  walletBalance: number;
};

export type GiftCardPurchaseResponse = {
  result: GiftCardPurchaseResult;
  message?: string;
};

export type GiftCardRedeemPayload = {
  code: string;
};

export type GiftCardRedeemParams = {
  customerId?: string;
};

export type GiftCardRedeemResult = {
  customerId?: string;
  giftCardId?: string;
  code: string;
  walletTransactionId?: string;
  creditedAmount: number;
  walletBalance: number;
  currency?: string;
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

const getEnvelopeRecord = (response: unknown) =>
  isRecord(response) ? response : {};

const getDataRecord = (response: unknown) => {
  const root = getEnvelopeRecord(response);
  return isRecord(root.data) ? root.data : root;
};

const getResultRecord = (response: unknown) => {
  const data = getDataRecord(response);

  if (isRecord(data.result)) {
    return data.result;
  }

  if (isRecord(data.data)) {
    return data.data;
  }

  return data;
};

const getResponseMessage = (response: unknown) => {
  const root = getEnvelopeRecord(response);
  const data = getDataRecord(response);

  return getString(root.message) || getString(data.message) || undefined;
};

export const normalizeGiftCardPurchaseResponse = (
  response: unknown
): GiftCardPurchaseResponse => {
  const result = getResultRecord(response);

  return {
    result: {
      code: getString(result.code),
      qrPayload: getString(result.qrPayload),
      amount: getNumber(result.amount),
      walletBalance: getNumber(result.walletBalance),
    },
    message: getResponseMessage(response),
  };
};

export const normalizeGiftCardRedeemResponse = (
  response: unknown
): GiftCardRedeemResponse => {
  const result = getResultRecord(response);

  return {
    result: {
      customerId: getString(result.customerId) || undefined,
      giftCardId: getString(result.giftCardId) || undefined,
      code: getString(result.code),
      walletTransactionId: getString(result.walletTransactionId) || undefined,
      creditedAmount: getNumber(result.creditedAmount),
      walletBalance: getNumber(result.walletBalance),
      currency: getString(result.currency) || undefined,
    },
    message: getResponseMessage(response),
  };
};

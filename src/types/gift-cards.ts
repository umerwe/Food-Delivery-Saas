export type GiftCardPurchasePayload = {
  amount: number;
  title?: string;
  message?: string;
  expiresAt?: string;
};

export type GiftCardAvailableItem = {
  id: string;
  branchId: string | null;
  title: string;
  description: string | null;
  imageUrl: string | null;
  amount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HomeGiftCards = {
  isEnabled: boolean;
  items: GiftCardAvailableItem[];
};

export type GiftCardAvailabilityParams = {
  restaurantId: string;
  branchId?: string | null;
};

export type GiftCardGuestPurchasePayload = {
  amount: number;
  buyerEmail: string;
  buyerName?: string;
  branchId?: string;
  title?: string;
  message?: string;
  expiresAt?: string;
  currency?: string;
};

export type GiftCardGuestPurchaseParams = {
  restaurantId: string;
  branchId?: string | null;
};

export type GiftCardPaymentSession = {
  provider: "stripe" | string;
  clientSecret: string;
  publishableKey: string;
  paymentIntentId: string;
};

export type GiftCardGuestPurchaseResponse = {
  data: {
    transaction: Record<string, unknown> | null;
    paymentSession: GiftCardPaymentSession | null;
  };
  message?: string;
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

export const normalizeGiftCardItem = (value: unknown): GiftCardAvailableItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);
  const title = getString(value.title);
  const amount = getNumber(value.amount);

  if (!id || amount <= 0) {
    return null;
  }

  return {
    id,
    branchId: getString(value.branchId) || null,
    title: title || "Gift Card",
    description: getString(value.description) || null,
    imageUrl: getString(value.imageUrl) || null,
    amount,
    expiresAt: getString(value.expiresAt) || null,
    createdAt: getString(value.createdAt),
    updatedAt: getString(value.updatedAt),
  };
};

export const normalizeHomeGiftCards = (value: unknown): HomeGiftCards | null => {
  if (!isRecord(value)) {
    return null;
  }

  const rawItems = Array.isArray(value.items) ? value.items : [];

  return {
    isEnabled: value.isEnabled === true,
    items: rawItems
      .map(normalizeGiftCardItem)
      .filter((item): item is GiftCardAvailableItem => item !== null),
  };
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

export const normalizeGiftCardAvailabilityResponse = (
  response: unknown
): HomeGiftCards => {
  const data = getDataRecord(response);

  return normalizeHomeGiftCards(data) ?? { isEnabled: false, items: [] };
};

export const normalizeGiftCardGuestPurchaseResponse = (
  response: unknown
): GiftCardGuestPurchaseResponse => {
  const data = getDataRecord(response);
  const paymentSession = isRecord(data.paymentSession) ? data.paymentSession : {};

  return {
    data: {
      transaction: isRecord(data.transaction) ? data.transaction : null,
      paymentSession: {
        provider: getString(paymentSession.provider, "stripe"),
        clientSecret: getString(paymentSession.clientSecret),
        publishableKey: getString(paymentSession.publishableKey),
        paymentIntentId: getString(paymentSession.paymentIntentId),
      },
    },
    message: getResponseMessage(response),
  };
};

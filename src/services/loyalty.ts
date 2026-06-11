import { createDomainApiService } from "@/services/domain-api";

export type LoyaltyTransactionType = "EARN" | "REDEEM" | "RESTORE" | "ADJUSTMENT" | "EXPIRE" | string;

export type LoyaltyTransaction = {
  id: string;
  type: LoyaltyTransactionType;
  points: number;
  balanceAfter: number;
  monetaryValue: number | null;
  redemptionTarget: string | null;
  orderId: string | null;
  paymentTransactionId: string | null;
  note: string | null;
  createdAt: string | null;
  expiresAt: string | null;
};

export type LoyaltySummary = {
  customerId: string | null;
  availablePoints: number;
  redeemedPoints: number;
  earnedPoints: number;
  minimumRedeemPoints: number;
  redemptionValuePerPoint: number;
  history: LoyaltyTransaction[];
};

export type LoyaltyRedeemResult = {
  customerId: string | null;
  redeemedPoints: number;
  redeemedAmount: number;
  remainingPoints: number;
  walletBalance: number;
  currency: string;
};

type LoyaltyRedeemPayload = {
  points: number;
  target: "WALLET";
  note?: string;
};

const loyaltyService = createDomainApiService();

export const getLoyalty = loyaltyService.get;
export const postLoyalty = loyaltyService.post;
export const patchLoyalty = loyaltyService.patch;
export const deleteLoyalty = loyaltyService.del;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getData = (value: unknown) => {
  if (!isRecord(value)) {
    return {};
  }

  return isRecord(value.data) ? value.data : value;
};

const getString = (value: unknown) => (typeof value === "string" || typeof value === "number" ? String(value) : "");

const getNullableString = (value: unknown) => {
  const text = getString(value).trim();
  return text ? text : null;
};

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeLoyaltyTransaction = (value: unknown): LoyaltyTransaction | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);

  if (!id) {
    return null;
  }

  return {
    id,
    type: getString(value.type),
    points: toNumber(value.points, 0),
    balanceAfter: toNumber(value.balanceAfter, 0),
    monetaryValue: value.monetaryValue === null || value.monetaryValue === undefined
      ? null
      : toNumber(value.monetaryValue, 0),
    redemptionTarget: getNullableString(value.redemptionTarget),
    orderId: getNullableString(value.orderId),
    paymentTransactionId: getNullableString(value.paymentTransactionId),
    note: getNullableString(value.note),
    createdAt: getNullableString(value.createdAt),
    expiresAt: getNullableString(value.expiresAt),
  };
};

export const normalizeLoyaltySummary = (value: unknown): LoyaltySummary => {
  const data = getData(value);
  const history = Array.isArray(data.history)
    ? data.history.map(normalizeLoyaltyTransaction).filter((entry): entry is LoyaltyTransaction => Boolean(entry))
    : [];

  return {
    customerId: getNullableString(data.customerId),
    availablePoints: toNumber(data.availablePoints, 0),
    redeemedPoints: toNumber(data.redeemedPoints, 0),
    earnedPoints: toNumber(data.earnedPoints, 0),
    minimumRedeemPoints: toNumber(data.minimumRedeemPoints, 0),
    redemptionValuePerPoint: toNumber(data.redemptionValuePerPoint, 0),
    history,
  };
};

export const normalizeLoyaltyRedeemResult = (value: unknown): LoyaltyRedeemResult => {
  const data = getData(value);

  return {
    customerId: getNullableString(data.customerId),
    redeemedPoints: toNumber(data.redeemedPoints, 0),
    redeemedAmount: toNumber(data.redeemedAmount, 0),
    remainingPoints: toNumber(data.remainingPoints, 0),
    walletBalance: toNumber(data.walletBalance, 0),
    currency: getString(data.currency) || "USD",
  };
};

export const fetchCustomerLoyaltyPoints = async (token?: string | null) => {
  const response = await getLoyalty("/customer-app/loyalty-points", token);

  return {
    response,
    loyalty: response?.error ? null : normalizeLoyaltySummary(response),
  };
};

export const redeemCustomerLoyaltyPoints = async ({
  payload,
  token,
}: {
  payload: LoyaltyRedeemPayload;
  token?: string | null;
}) => {
  const response = await postLoyalty("/customer-app/loyalty-points/redeem", payload, token);

  return {
    response,
    redemption: response?.error ? null : normalizeLoyaltyRedeemResult(response),
  };
};

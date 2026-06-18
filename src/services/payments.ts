import { createDomainApiService } from "@/services/domain-api";
import type { ApiResult } from "@/services/http";

export type PaymentItem = {
  id: string;
  orderId: string;
  amount: string | number;
  currency?: string | null;
  status: string;
  paymentMethod: string;
  type: string;
  providerData?: PaymentProviderData | null;
  providerRef?: string | null;
  note?: string | null;
  processedAt?: string | null;
  createdAt: string;
  order?: { status?: string };
};

export type PaymentProviderData = {
  provider?: string;
  clientSecret?: string;
  publishableKey?: string;
  paymentIntentId?: string;
};

export type PaymentSession = PaymentProviderData;

export type CreatePaymentAttemptPayload = {
  paymentMethod: "STRIPE" | string;
  currency: string;
  note?: string;
};

export type PaymentAttemptResult = {
  response: ApiResult;
  payment: PaymentItem | null;
  paymentSession: PaymentSession | null;
  clientSecret: string;
  publishableKey: string;
};

export type WalletItem = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string;
  createdAt: string;
};

export type PaymentMeta = {
  page?: number;
  totalPages?: number;
  total?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
};

export type WalletData = {
  history: WalletItem[];
  balance: number;
  currency: string;
};

const paymentsService = createDomainApiService();

export const getPayments = paymentsService.get;
export const postPayments = paymentsService.post;
export const patchPayments = paymentsService.patch;
export const deletePayments = paymentsService.del;

export const fetchPaymentsPage = async ({
  page,
  limit,
  search,
  status,
  restaurantId,
  token,
}: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  restaurantId?: string | null;
  token?: string | null;
}) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (restaurantId) params.set("restaurantId", restaurantId);

  const response = await getPayments(`/v1/payments?${params.toString()}`, token);

  return {
    response,
    payments: response?.error ? [] : response?.data as PaymentItem[] || [],
    meta: response?.meta as PaymentMeta | undefined,
  };
};

export const fetchWallet = async (token?: string | null) => {
  const response = await getPayments("/customer-app/wallet", token);
  const data = response?.data as Partial<WalletData> | undefined;

  return {
    response,
    wallet: response?.error ? [] : data?.history || [],
    balance: response?.error ? 0 : data?.balance || 0,
    currency: response?.error ? "USD" : data?.currency || "USD",
  };
};

const getRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const getString = (value: unknown) => (typeof value === "string" ? value : "");

export const createOrderPaymentAttempt = async ({
  orderId,
  payload,
  token,
}: {
  orderId: string | number;
  payload: CreatePaymentAttemptPayload;
  token?: string | null;
}): Promise<PaymentAttemptResult> => {
  const response = await postPayments(`/v1/payments/orders/${orderId}/attempts`, payload, token);
  const paymentRecord = getRecord(response?.data);
  const paymentSessionRecord = getRecord(response?.paymentSession);
  const providerDataRecord = getRecord(paymentRecord?.providerData);
  const clientSecret =
    getString(paymentSessionRecord?.clientSecret) ||
    getString(providerDataRecord?.clientSecret);
  const publishableKey =
    getString(paymentSessionRecord?.publishableKey) ||
    getString(providerDataRecord?.publishableKey);

  return {
    response,
    payment: paymentRecord as PaymentItem | null,
    paymentSession: paymentSessionRecord as PaymentSession | null,
    clientSecret,
    publishableKey,
  };
};

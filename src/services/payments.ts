import { createDomainApiService } from "@/services/domain-api";
import type { ApiResult } from "@/services/http";

export type PaymentItem = {
  id: string;
  orderId: string;
  amount: string;
  status: string;
  paymentMethod: string;
  type: string;
  createdAt: string;
  order?: { status?: string };
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

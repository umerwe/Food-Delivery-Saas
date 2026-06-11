import { httpClient } from "@/lib/axios";
import { cleanParams } from "@/lib/params";
import {
  normalizeCustomerDealsResponse,
  type CustomerDealsParams,
  type CustomerDealsResponse,
} from "@/types/customer-deals";

const CUSTOMER_DEALS_ENDPOINT = "/customer-app/deals";

export const getCustomerDeals = async (
  params: CustomerDealsParams
): Promise<CustomerDealsResponse> => {
  const response = await httpClient.get<unknown>(CUSTOMER_DEALS_ENDPOINT, {
    params: cleanParams({
      restaurantId: params.restaurantId,
      branchId: params.branchId,
      locale: params.locale,
      limit: params.limit ?? 20,
    }),
  });

  return normalizeCustomerDealsResponse(response.data);
};

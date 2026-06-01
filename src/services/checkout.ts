import { createDomainApiService } from "@/services/domain-api";

const checkoutService = createDomainApiService();

export const getCheckout = checkoutService.get;
export const postCheckout = checkoutService.post;
export const patchCheckout = checkoutService.patch;
export const deleteCheckout = checkoutService.del;

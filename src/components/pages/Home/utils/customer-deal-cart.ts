import type { CustomerDeal } from "@/types/customer-deals";

export type DealCartItemInput = {
  branchId: string;
  menuItemId: string;
  quantity: number;
};

export const buildDealCartItemsInput = (
  deal: CustomerDeal,
  branchId: string
): DealCartItemInput[] => {
  const resolvedBranchId = branchId.trim();

  if (!resolvedBranchId) {
    return [];
  }

  return deal.scopeMenuItems
    .map(({ id }) => id.trim())
    .filter(Boolean)
    .map((menuItemId) => ({
      branchId: resolvedBranchId,
      menuItemId,
      quantity: 1,
    }));
};

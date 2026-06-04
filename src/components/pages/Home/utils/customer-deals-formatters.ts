import { getDealImage } from "@/components/pages/Home/utils/customer-deal-cart";
import type { CustomerDeal, CustomerDealMenuItem } from "@/types/customer-deals";

const toNumber = (value: number | string | null | undefined, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatShortDate = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });

export const formatDealPrice = (value: number | string | null | undefined): string =>
  `$${toNumber(value, 0).toFixed(2)}`;

export const formatDealDateRange = (
  startsAt?: string | null,
  expiresAt?: string | null
): string => {
  const startDate = parseDate(startsAt);
  const expiryDate = parseDate(expiresAt);

  if (startDate && expiryDate) {
    return `${formatShortDate(startDate)} - ${formatShortDate(expiryDate)}`;
  }

  if (expiryDate) {
    return `Until ${formatShortDate(expiryDate)}`;
  }

  if (startDate) {
    return `From ${formatShortDate(startDate)}`;
  }

  return "";
};

export const getDealItemNames = (items: CustomerDealMenuItem[]): string =>
  items
    .map(({ name }) => name.trim())
    .filter(Boolean)
    .join(", ");

export const isDealActive = (deal: CustomerDeal): boolean => {
  const now = Date.now();
  const startDate = parseDate(deal.startsAt);
  const expiryDate = parseDate(deal.expiresAt);

  if (startDate && startDate.getTime() > now) {
    return false;
  }

  if (expiryDate && expiryDate.getTime() < now) {
    return false;
  }

  return true;
};

export { getDealImage };

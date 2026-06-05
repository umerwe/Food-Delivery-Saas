import type { ServiceChargeType } from "@/types/cart";

type TotalsInput = {
  payableAmount?: unknown;
  totalAmount?: unknown;
};

const toNullableNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const shouldShowPositiveAmountLine = (value: unknown) => {
  const parsed = toNullableNumber(value);
  return parsed !== null && parsed > 0;
};

export const getDisplayTotalAmount = (quote: TotalsInput | null | undefined) => {
  return toNullableNumber(quote?.payableAmount) ?? toNullableNumber(quote?.totalAmount) ?? 0;
};

export const getTipAdjustedDisplayTotalAmount = ({
  displayTotal,
  tipAmount,
  totalWithoutTip,
}: {
  displayTotal: number;
  tipAmount: number;
  totalWithoutTip: number;
}) => {
  const normalizedTip = Math.max(0, tipAmount);
  const normalizedDisplayTotal = Math.max(0, displayTotal);
  const normalizedTotalWithoutTip = Math.max(0, totalWithoutTip);

  if (normalizedTip > 0 && normalizedDisplayTotal <= normalizedTotalWithoutTip + 0.01) {
    return normalizedDisplayTotal + normalizedTip;
  }

  return normalizedDisplayTotal;
};

export const getServiceChargeLabel = ({
  serviceChargeType,
  serviceChargeValue,
  serviceChargeLabel,
  serviceChargeWithPercentageLabel,
}: {
  serviceChargeType?: ServiceChargeType | null;
  serviceChargeValue?: number | string | null;
  serviceChargeLabel: string;
  serviceChargeWithPercentageLabel: (value: string) => string;
}) => {
  const value = toNullableNumber(serviceChargeValue);

  if (String(serviceChargeType || "").toUpperCase() === "PERCENTAGE" && value !== null) {
    return serviceChargeWithPercentageLabel(Number.isInteger(value) ? String(value) : String(value));
  }

  return serviceChargeLabel;
};

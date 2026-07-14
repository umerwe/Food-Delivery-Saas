import { getDealImage } from "@/components/pages/Home/utils/customer-deal-cart";
import { formatMoney } from "@/lib/money";
import type {
  CustomerDeal,
  CustomerDealCategoryRule,
  CustomerDealMenuItem,
} from "@/types/customer-deals";

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

export const formatDealPrice = (
  value: number | string | null | undefined,
  currency?: string | null
): string => formatMoney(toNumber(value, 0), currency, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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

export type DealCategoryRequirementHighlight = {
  id: string;
  label: string;
  variationLabel?: string;
};

type DealForcedVariationBadge = {
  id: string;
  label: string;
};

const getVariationLabel = (variation?: CustomerDealCategoryRule["variation"]) =>
  variation?.displayText?.trim() || variation?.name?.trim() || "";

const getCategoryNamesById = (deal: CustomerDeal) =>
  new Map(
    deal.scopeCategories.map((category) => [category.id, category.name.trim()])
  );

export const getDealCategoryRequirementHighlights = (
  deal: CustomerDeal
): DealCategoryRequirementHighlight[] => {
  const categoryNamesById = getCategoryNamesById(deal);

  const seenCategoryIds = new Set<string>();

  return (deal.scopeCategoryRules ?? []).reduce<DealCategoryRequirementHighlight[]>(
    (highlights, rule) => {
      if (!rule.menuCategoryId || rule.itemLimit <= 0 || seenCategoryIds.has(rule.menuCategoryId)) {
        return highlights;
      }

      const categoryName = categoryNamesById.get(rule.menuCategoryId) || "Category";
      const variationLabel = categoryNamesById.has(rule.menuCategoryId)
        ? getVariationLabel(rule.variation)
        : "";

      seenCategoryIds.add(rule.menuCategoryId);
      highlights.push({
        id: rule.menuCategoryId,
        label: `${rule.itemLimit} ${categoryName}`,
        variationLabel: variationLabel || undefined,
      });

      return highlights;
    },
    []
  );
};

export const getDealForcedVariationBadges = (
  deal: CustomerDeal
): DealForcedVariationBadge[] => {
  const categoryNamesById = getCategoryNamesById(deal);
  const categoryRequirementCount = (deal.scopeCategoryRules ?? []).filter(
    (rule) => rule.menuCategoryId && rule.itemLimit > 0
  ).length;
  const rulesWithVariation = (deal.scopeCategoryRules ?? [])
    .map((rule) => ({
      categoryId: rule.menuCategoryId,
      categoryName: categoryNamesById.get(rule.menuCategoryId) || "",
      variationId: rule.variationId ?? rule.variation?.id ?? "",
      variationLabel: getVariationLabel(rule.variation),
    }))
    .filter(({ categoryId, variationId, variationLabel }) =>
      Boolean(categoryId && variationId && variationLabel)
    );

  if (rulesWithVariation.length === 0) {
    return [];
  }

  const includeCategoryName =
    rulesWithVariation.length > 1 || categoryRequirementCount > 1;
  const seenLabels = new Set<string>();

  return rulesWithVariation.reduce<DealForcedVariationBadge[]>((badges, rule) => {
    if (includeCategoryName && !rule.categoryName) {
      return badges;
    }

    const label = includeCategoryName
      ? `${rule.categoryName}: ${rule.variationLabel}`
      : `Size: ${rule.variationLabel}`;

    if (seenLabels.has(label)) {
      return badges;
    }

    seenLabels.add(label);
    badges.push({
      id: `${rule.categoryId}-${rule.variationId}`,
      label,
    });

    return badges;
  }, []);
};

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

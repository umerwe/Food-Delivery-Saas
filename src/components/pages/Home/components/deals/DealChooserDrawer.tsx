"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getDealCategoryRuleForItem,
  getDealTypeLabel,
  isFixedItemDeal,
} from "@/components/pages/Home/utils/customer-deal-cart";
import {
  buildDealCartItemPayload,
  getDealChooserGroupHelperText,
  getDealChooserId,
  getDealChooserModifierGroups,
  getDealChooserModifierName,
  getDealChooserNumber,
  getDealChooserSelectedModifiersTotal,
  getSelectedModifiersByGroup,
  isDealChooserItemConfigurable,
  validateDealChooserItemConfiguration,
  validateDealChooserSelectedCount,
  type DealChooserItemConfiguration,
  type DealChooserModifier,
  type DealChooserModifierGroup,
} from "@/components/pages/Home/utils/deal-chooser-validation";
import { formatDealPrice } from "@/components/pages/Home/utils/customer-deals-formatters";
import { getModifierGroupSelectedQuantity } from "@/components/pages/Items/utils/modifier-selections";
import {
  canSubmitDealSelection,
  getDealRequiredSelectionCount,
  useDealEligibleItems,
} from "@/hooks/useDealEligibleItems";
import { useAddDealToCart } from "@/hooks/useCart";
import { useDealScopedItemsDetails } from "@/hooks/useDealScopedItemsDetails";
import type { CustomerDeal, CustomerDealMenuItem } from "@/types/customer-deals";

type DealChooserDrawerProps = {
  deal: CustomerDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string | null;
  currency?: string | null;
};

const getMenuItemInitial = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

const formatModifierSelectionPrice = (
  unitPrice: number,
  quantity: number,
  currency?: string | null
) => {
  const safeQuantity = Math.max(1, Math.floor(getDealChooserNumber(quantity, 1)));
  const sign = unitPrice < 0 ? "-" : "+";
  const formattedUnitPrice = formatDealPrice(Math.abs(unitPrice), currency);

  if (safeQuantity <= 1) {
    return `${sign}${formattedUnitPrice}`;
  }

  return `${sign}${formattedUnitPrice} * ${safeQuantity} = ${sign}${formatDealPrice(
    Math.abs(unitPrice) * safeQuantity,
    currency
  )}`;
};

const getRequirementText = (
  deal: CustomerDeal | null,
  requiredQuantity: number,
  t: ReturnType<typeof useTranslations>
) => {
  if (!deal) {
    return "";
  }

  if (isFixedItemDeal(deal)) {
    return t("fixedRequirement");
  }

  if (deal.scopeCategories.length > 0) {
    return t("categoryRequirement", { count: requiredQuantity });
  }

  return t("flexibleRequirement", { count: requiredQuantity });
};

export function DealChooserDrawer({
  deal,
  open,
  onOpenChange,
  branchId,
  currency,
}: DealChooserDrawerProps) {
  const t = useTranslations("home.deals");
  const addDealMutation = useAddDealToCart(branchId);
  const { items, isLoading, error } = useDealEligibleItems({ deal, open });
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<string[]>([]);
  const [expandedItemIds, setExpandedItemIds] = useState<string[]>([]);
  const [configurationsByItemId, setConfigurationsByItemId] = useState<Record<string, DealChooserItemConfiguration>>({});
  const [itemErrorsById, setItemErrorsById] = useState<Record<string, string>>({});
  const [groupErrorsByItemId, setGroupErrorsByItemId] = useState<Record<string, Record<string, string>>>({});

  const requiredQuantity = getDealRequiredSelectionCount(deal);
  const selectedCount = selectedMenuItemIds.length;
  const itemIds = useMemo(
    () => items.map((item) => item.id.trim()).filter(Boolean),
    [items]
  );
  const itemDetailsQuery = useDealScopedItemsDetails({
    itemIds,
    items,
    enabled: open && itemIds.length > 0,
  });

  const detailedItems = useMemo(
    () =>
      items.map((item) => {
        const detail = itemDetailsQuery.detailsById[item.id.trim()];

        return detail ? { ...item, ...detail, id: item.id, name: detail.name || item.name } : item;
      }),
    [itemDetailsQuery.detailsById, items]
  );
  const detailedItemsById = useMemo(
    () => new Map(detailedItems.map((item) => [item.id, item])),
    [detailedItems]
  );
  const selectedItems = useMemo(
    () => detailedItems.filter((item) => selectedMenuItemIds.includes(item.id)),
    [detailedItems, selectedMenuItemIds]
  );
  const selectedModifiersTotal = useMemo(() => {
    return selectedItems.reduce((total, item) => {
      return total + getDealChooserSelectedModifiersTotal({
        item,
        configuration: configurationsByItemId[item.id],
      });
    }, 0);
  }, [configurationsByItemId, selectedItems]);
  const displayedDealTotal = Math.max(
    0,
    getDealChooserNumber(deal?.discountValue, 0) + selectedModifiersTotal
  );
  const categoryNamesById = useMemo(
    () => new Map((deal?.scopeCategories ?? []).map((category) => [category.id, category.name])),
    [deal?.scopeCategories]
  );
  const selectedCountByCategoryId = useMemo(() => {
    const counts = new Map<string, number>();

    selectedItems.forEach((item) => {
      const categoryId = item.category?.id?.trim();

      if (categoryId) {
        counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
      }
    });

    return counts;
  }, [selectedItems]);
  const itemSections = useMemo(() => {
    if (!deal?.scopeCategoryRules?.length) {
      return [{
        id: "all",
        title: "",
        helper: "",
        items: detailedItems,
      }];
    }

    return (deal.scopeCategoryRules ?? []).map((rule) => ({
      id: rule.menuCategoryId,
      title: categoryNamesById.get(rule.menuCategoryId) || t("category"),
      helper: t("categoryRuleLimit", {
        selected: selectedCountByCategoryId.get(rule.menuCategoryId) ?? 0,
        count: rule.itemLimit,
      }),
      items: detailedItems.filter((item) => item.category?.id === rule.menuCategoryId),
    }));
  }, [categoryNamesById, deal, detailedItems, selectedCountByCategoryId, t]);
  const canAddSelectedItems = canSubmitDealSelection({
    selectedCount,
    requiredCount: requiredQuantity,
  });

  useEffect(() => {
    if (!open) {
      setSelectedMenuItemIds([]);
      setExpandedItemIds([]);
      setConfigurationsByItemId({});
      setItemErrorsById({});
      setGroupErrorsByItemId({});
    }
  }, [open]);

  const updateItemConfiguration = useCallback(
    (
      menuItemId: string,
      updater: (configuration: DealChooserItemConfiguration) => DealChooserItemConfiguration
    ) => {
      setConfigurationsByItemId((current) => {
        const existing = current[menuItemId] || {
          menuItemId,
          modifierSelections: [],
        };

        return {
          ...current,
          [menuItemId]: updater(existing),
        };
      });
      setItemErrorsById((current) => {
        const next = { ...current };
        delete next[menuItemId];
        return next;
      });
    },
    []
  );

  const clearItemConfiguration = useCallback((menuItemId: string) => {
    setConfigurationsByItemId((current) => {
      const next = { ...current };
      delete next[menuItemId];
      return next;
    });
    setItemErrorsById((current) => {
      const next = { ...current };
      delete next[menuItemId];
      return next;
    });
    setGroupErrorsByItemId((current) => {
      const next = { ...current };
      delete next[menuItemId];
      return next;
    });
  }, []);

  const toggleSelectedItem = useCallback(
    (menuItemId: string, checked: boolean) => {
      if (!checked) {
        setSelectedMenuItemIds((current) => current.filter((id) => id !== menuItemId));
        setExpandedItemIds((current) => current.filter((id) => id !== menuItemId));
        clearItemConfiguration(menuItemId);
        return;
      }

      const selectedItem = detailedItemsById.get(menuItemId);
      const shouldExpand = selectedItem ? isDealChooserItemConfigurable(selectedItem) : true;
      const categoryRule = selectedItem ? getDealCategoryRuleForItem(deal, selectedItem) : null;

      setSelectedMenuItemIds((current) => {
        if (current.includes(menuItemId)) return current;

        if (categoryRule) {
          const selectedInCategory = current.filter((id) => {
            const currentItem = detailedItemsById.get(id);

            return currentItem?.category?.id === categoryRule.menuCategoryId;
          }).length;

          if (selectedInCategory >= categoryRule.itemLimit) {
            toast.error(t("maxCategoryItems", {
              category: categoryNamesById.get(categoryRule.menuCategoryId) || t("category"),
              count: categoryRule.itemLimit,
            }));
            return current;
          }
        }

        if (current.length >= requiredQuantity) {
          if (requiredQuantity === 1) {
            current.forEach(clearItemConfiguration);
            return [menuItemId];
          }

          toast.error(t("maxDealItems", { count: requiredQuantity }));
          return current;
        }

        return [...current, menuItemId];
      });

      if (shouldExpand) {
        setExpandedItemIds((current) =>
          current.includes(menuItemId) ? current : [...current, menuItemId]
        );
      }
      updateItemConfiguration(menuItemId, (configuration) => configuration);
    },
    [
      categoryNamesById,
      clearItemConfiguration,
      deal,
      detailedItemsById,
      requiredQuantity,
      t,
      updateItemConfiguration,
    ]
  );

  const toggleExpandedItem = useCallback((menuItemId: string) => {
    setExpandedItemIds((current) =>
      current.includes(menuItemId)
        ? current.filter((id) => id !== menuItemId)
        : [...current, menuItemId]
    );
  }, []);

  const toggleModifier = useCallback(
    (
      menuItemId: string,
      group: DealChooserModifierGroup,
      modifier: DealChooserModifier,
      checked: boolean
    ) => {
      const groupId = getDealChooserId(group.id);
      const modifierId = getDealChooserId(modifier.id);

      if (!groupId || !modifierId) return;

      updateItemConfiguration(menuItemId, (configuration) => {
        const selectedModifiersByGroup = getSelectedModifiersByGroup([group], configuration);
        const selected = selectedModifiersByGroup[groupId] || [];
        const selectionType = group.selectionType === "SINGLE" ? "SINGLE" : "MULTIPLE";
        const modifiersCount = Array.isArray(group.modifiers) ? group.modifiers.length : 0;
        const rawMaxSelect = getDealChooserNumber(group.maxSelect, modifiersCount);
        const maxSelect = selectionType === "SINGLE"
          ? 1
          : rawMaxSelect > 0
            ? rawMaxSelect
            : modifiersCount;
        const nextModifier = {
          id: modifierId,
          name: getDealChooserModifierName(modifier),
          selectedQuantity: 1,
        };
        let nextSelected = selected;
        const selectedQuantity = getModifierGroupSelectedQuantity(selected);

        if (!checked) {
          nextSelected = selected.filter(({ id }) => id !== modifierId);
        } else if (selectionType === "SINGLE") {
          nextSelected = [nextModifier];
        } else if (!selected.some(({ id }) => id === modifierId)) {
          if (maxSelect > 0 && selectedQuantity >= maxSelect) {
            return configuration;
          }
          nextSelected = [...selected, nextModifier];
        }

        const otherSelections = configuration.modifierSelections.filter(
          (selection) => selection.modifierGroupId !== groupId
        );
        const nextSelection = nextSelected.length > 0
          ? [{
              modifierGroupId: groupId,
              modifiers: nextSelected.map((entry) => ({
                modifierId: entry.id,
                quantity: entry.selectedQuantity,
              })),
            }]
          : [];

        return {
          ...configuration,
          modifierSelections: [...otherSelections, ...nextSelection],
        };
      });
      setGroupErrorsByItemId((current) => {
        const nextItemErrors = { ...(current[menuItemId] || {}) };
        delete nextItemErrors[groupId];

        return {
          ...current,
          [menuItemId]: nextItemErrors,
        };
      });
    },
    [updateItemConfiguration]
  );

  const updateModifierQuantity = useCallback(
    (
      menuItemId: string,
      group: DealChooserModifierGroup,
      modifier: DealChooserModifier,
      nextQuantity: number
    ) => {
      const groupId = getDealChooserId(group.id);
      const modifierId = getDealChooserId(modifier.id);

      if (!groupId || !modifierId || group.selectionType === "SINGLE") return;

      updateItemConfiguration(menuItemId, (configuration) => {
        const selectedModifiersByGroup = getSelectedModifiersByGroup([group], configuration);
        const selected = selectedModifiersByGroup[groupId] || [];
        const currentModifier = selected.find(({ id }) => id === modifierId);

        if (!currentModifier) {
          return configuration;
        }

        const modifiersCount = Array.isArray(group.modifiers) ? group.modifiers.length : 0;
        const rawMaxSelect = getDealChooserNumber(group.maxSelect, modifiersCount);
        const maxSelect = rawMaxSelect > 0 ? rawMaxSelect : modifiersCount;
        const normalizedNextQuantity = Math.max(
          1,
          Math.floor(Number.isFinite(nextQuantity) ? nextQuantity : 1)
        );
        const otherSelectedQuantity = selected.reduce((total, entry) => {
          if (entry.id === modifierId) return total;

          return total + Math.max(1, Math.floor(getDealChooserNumber(entry.selectedQuantity, 1)));
        }, 0);
        const maxAllowedQuantity =
          maxSelect > 0
            ? Math.max(1, maxSelect - otherSelectedQuantity)
            : normalizedNextQuantity;
        const nextSelected = selected.map((entry) =>
          entry.id === modifierId
            ? {
                ...entry,
                selectedQuantity: Math.min(normalizedNextQuantity, maxAllowedQuantity),
              }
            : entry
        );
        const otherSelections = configuration.modifierSelections.filter(
          (selection) => selection.modifierGroupId !== groupId
        );

        return {
          ...configuration,
          modifierSelections: [
            ...otherSelections,
            {
              modifierGroupId: groupId,
              modifiers: nextSelected.map((entry) => ({
                modifierId: entry.id,
                quantity: entry.selectedQuantity,
              })),
            },
          ],
        };
      });
      setGroupErrorsByItemId((current) => {
        const nextItemErrors = { ...(current[menuItemId] || {}) };
        delete nextItemErrors[groupId];

        return {
          ...current,
          [menuItemId]: nextItemErrors,
        };
      });
    },
    [updateItemConfiguration]
  );

  const addSelectedItems = useCallback(() => {
    if (!deal || !branchId) {
      return;
    }

    const countError = validateDealChooserSelectedCount({
      selectedCount,
      requiredQuantity,
    });

    if (countError) {
      toast.error(countError);
      return;
    }

    const ruleCountError = (deal.scopeCategoryRules ?? []).find((rule) => {
      const selectedInCategory = selectedCountByCategoryId.get(rule.menuCategoryId) ?? 0;

      return selectedInCategory !== rule.itemLimit;
    });

    if (ruleCountError) {
      toast.error(t("categoryRuleRequired", {
        category: categoryNamesById.get(ruleCountError.menuCategoryId) || t("category"),
        count: ruleCountError.itemLimit,
      }));
      return;
    }

    if (itemDetailsQuery.isLoading) {
      toast.error(t("loadingItemOptions"));
      return;
    }

    const nextItemErrors: Record<string, string> = {};
    const nextGroupErrors: Record<string, Record<string, string>> = {};
    const cartItemPayloads = selectedMenuItemIds
      .map((menuItemId) => {
        const item = detailedItemsById.get(menuItemId);

        if (!item || itemDetailsQuery.isError) {
          nextItemErrors[menuItemId] = t("unableToLoadItemOptions");
          return null;
        }

        const validation = validateDealChooserItemConfiguration({
          deal,
          item,
          configuration: configurationsByItemId[menuItemId],
        });

        if (validation.itemError) {
          nextItemErrors[menuItemId] = validation.itemError;
        }

        if (Object.keys(validation.groupErrors).length > 0) {
          nextGroupErrors[menuItemId] = validation.groupErrors;
        }

        if (validation.itemError || Object.keys(validation.groupErrors).length > 0) {
          return null;
        }

        return buildDealCartItemPayload({
          deal,
          item,
          branchId,
          configuration: configurationsByItemId[menuItemId],
        });
      })
      .filter((payload): payload is NonNullable<typeof payload> => payload !== null);

    setItemErrorsById(nextItemErrors);
    setGroupErrorsByItemId(nextGroupErrors);

    if (Object.keys(nextItemErrors).length > 0 || Object.keys(nextGroupErrors).length > 0) {
      const erroredItemIds = new Set([
        ...Object.keys(nextItemErrors),
        ...Object.keys(nextGroupErrors),
      ]);
      setExpandedItemIds((current) =>
        Array.from(new Set([...current, ...Array.from(erroredItemIds)]))
      );
      return;
    }

    addDealMutation.mutate(
      {
        deal,
        selectedMenuItemIds,
        eligibleMenuItems: selectedItems,
        cartItemPayloads,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  }, [
    addDealMutation,
    branchId,
    configurationsByItemId,
    deal,
    detailedItemsById,
    itemDetailsQuery.isError,
    itemDetailsQuery.isLoading,
    onOpenChange,
    requiredQuantity,
    selectedCount,
    categoryNamesById,
    selectedCountByCategoryId,
    selectedItems,
    selectedMenuItemIds,
    t,
  ]);

  const canSubmitSelection =
    canAddSelectedItems &&
    !itemDetailsQuery.isLoading &&
    selectedMenuItemIds.every((itemId) => {
      const item = detailedItemsById.get(itemId);

      if (!item || !deal) {
        return false;
      }

      const validation = validateDealChooserItemConfiguration({
        deal,
        item,
        configuration: configurationsByItemId[itemId],
      });

      return !validation.itemError && Object.keys(validation.groupErrors).length === 0;
    });

  const getItemStatus = useCallback(
    (item: CustomerDealMenuItem, checked: boolean) => {
      if (itemErrorsById[item.id]) return t("statusUnsupported");
      if (!checked) return null;

      const groups = getDealChooserModifierGroups(item);

      if (groups.length === 0) return t("statusReady");

      const validation = validateDealChooserItemConfiguration({
        deal: deal || {
          id: "",
          title: "",
          dealSelectionMode: "FLEXIBLE_ITEMS",
          discountValue: 0,
          scopeMenuItems: [],
          scopeCategories: [],
          scopeCategoryRules: [],
        },
        item,
        configuration: configurationsByItemId[item.id],
      });

      return validation.itemError || Object.keys(validation.groupErrors).length > 0
        ? t("statusNeedsChoices")
        : t("statusComplete");
    },
    [configurationsByItemId, deal, itemErrorsById, t]
  );

  const renderItemConfiguration = (item: CustomerDealMenuItem) => {
    const groups = getDealChooserModifierGroups(item);
    const configuration = configurationsByItemId[item.id];
    const selectedModifiersByGroup = getSelectedModifiersByGroup(groups, configuration);
    const itemError = itemErrorsById[item.id];
    const groupErrors = groupErrorsByItemId[item.id] || {};

    if (!expandedItemIds.includes(item.id)) {
      return null;
    }

    return (
      <div className="border-t border-gray-100 bg-gray-50/60 px-3 pb-3 pt-3">
        {itemDetailsQuery.isLoading ? (
          <p className="text-xs font-medium text-gray-500">{t("loadingItemOptions")}</p>
        ) : null}

        {itemError ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
            {itemError}
          </p>
        ) : null}

        {groups.map((group) => {
          const groupId = getDealChooserId(group.id);
          const groupModifiers = Array.isArray(group.modifiers) ? group.modifiers : [];
          const selectedGroupModifiers = selectedModifiersByGroup[groupId] || [];
          const selectedGroupQuantity =
            getModifierGroupSelectedQuantity(selectedGroupModifiers);
          const selectionType = group.selectionType === "SINGLE" ? "SINGLE" : "MULTIPLE";
          const maxSelect = selectionType === "SINGLE"
            ? 1
            : getDealChooserNumber(group.maxSelect, groupModifiers.length);

          return (
            <div key={groupId} className="mb-3 rounded-2xl border border-gray-100 bg-white p-3 last:mb-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {String(group.name || "Options")}
                  </p>
                  <p className="text-xs font-medium text-gray-500">
                    {getDealChooserGroupHelperText(group)}
                  </p>
                </div>
                <span className="text-xs font-medium text-gray-500">
                  {selectionType === "SINGLE" ? t("chooseOne") : t("chooseMultiple")}
                </span>
              </div>

              <div className="space-y-2">
                {groupModifiers.map((modifier) => {
                  const modifierId = getDealChooserId(modifier.id);
                  const selectedModifier = selectedGroupModifiers.find(
                    ({ id }) => id === modifierId
                  );
                  const checked = Boolean(selectedModifier);
                  const selectedModifierQuantity = Math.max(
                    1,
                    Math.floor(getDealChooserNumber(selectedModifier?.selectedQuantity, 1))
                  );
                  const modifierPrice = getDealChooserNumber(modifier.priceDelta, 0);
                  const maxReached =
                    maxSelect > 0 &&
                    selectedGroupQuantity >= maxSelect &&
                    !checked;
                  const canShowQuantitySelector = checked && selectionType !== "SINGLE";

                  return (
                    <div
                      key={modifierId}
                      className={`rounded-xl border px-3 py-2 transition ${
                        checked
                          ? "border-primary/20 bg-primary/5 ring-1 ring-primary/10"
                          : maxReached
                          ? "border-gray-100 bg-gray-100 opacity-70"
                          : "border-gray-100 bg-white"
                      }`}
                    >
                      <label className="flex items-start justify-between gap-3">
                        <span className="min-w-0 text-sm font-medium leading-5 text-gray-700">
                          {getDealChooserModifierName(modifier)}
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          {modifierPrice !== 0 ? (
                            <span className="text-xs font-semibold text-primary">
                              {formatModifierSelectionPrice(
                                modifierPrice,
                                selectedModifierQuantity,
                                currency
                              )}
                            </span>
                          ) : null}
                          <Checkbox
                            className="size-5"
                            checked={checked}
                            disabled={maxReached}
                            onCheckedChange={(value) =>
                              toggleModifier(item.id, group, modifier, value === true)
                            }
                          />
                        </span>
                      </label>

                      {canShowQuantitySelector ? (
                        <div className="mt-2 flex items-center justify-between gap-3 rounded-full border border-primary/10 bg-white/90 px-2 py-1 shadow-sm">
                          <span className="pl-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            Qty
                          </span>

                          <div className="flex items-center rounded-full bg-gray-100 p-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                updateModifierQuantity(
                                  item.id,
                                  group,
                                  modifier,
                                  selectedModifierQuantity - 1
                                )
                              }
                              disabled={selectedModifierQuantity <= 1}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-700 transition hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                              aria-label={`Decrease ${getDealChooserModifierName(modifier)} quantity`}
                            >
                              <Minus size={13} />
                            </button>

                            <span className="min-w-7 text-center text-xs font-bold text-gray-900">
                              {selectedModifierQuantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateModifierQuantity(
                                  item.id,
                                  group,
                                  modifier,
                                  selectedModifierQuantity + 1
                                )
                              }
                              disabled={maxSelect > 0 && selectedGroupQuantity >= maxSelect}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-gray-700 transition hover:bg-white hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
                              aria-label={`Increase ${getDealChooserModifierName(modifier)} quantity`}
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {groupErrors[groupId] ? (
                <p className="mt-2 text-xs font-medium text-red-500">
                  {groupErrors[groupId]}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-auto rounded-[24px] sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>{deal?.title || t("chooseItems")}</DialogTitle>
          <DialogDescription>
            {deal?.description || getRequirementText(deal, requiredQuantity, t)}
          </DialogDescription>
        </DialogHeader>

        {deal ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
              {formatDealPrice(displayedDealTotal, currency)}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1">
              {getDealTypeLabel(deal)}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1">
              {getRequirementText(deal, requiredQuantity, t)}
            </span>
            <span className="ml-auto rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">
              {Math.min(selectedCount, requiredQuantity)}/{requiredQuantity} {t("selected")}
            </span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
            {t("loadingEligibleItems")}
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
            {t("noEligibleItems")}
          </div>
        ) : null}

        {!isLoading && !error && detailedItems.length > 0 ? (
          <div className="space-y-3">
            {itemSections.map((section) => (
              <div key={section.id} className="space-y-2">
                {section.title ? (
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-3 py-2">
                    <p className="text-sm font-semibold text-gray-900">{section.title}</p>
                    <span className="text-xs font-semibold text-primary">{section.helper}</span>
                  </div>
                ) : null}

                {section.items.map((item) => {
              const checked = selectedMenuItemIds.includes(item.id);
              const categoryName = item.category?.name?.trim();
              const description = item.description?.trim();
              const configurable = isDealChooserItemConfigurable(item);
              const status = getItemStatus(item, checked);
              const categoryRule = getDealCategoryRuleForItem(deal, item);
              const categorySelectedCount = categoryRule
                ? selectedCountByCategoryId.get(categoryRule.menuCategoryId) ?? 0
                : 0;
              const disableUnchecked =
                !checked &&
                ((selectedCount >= requiredQuantity && requiredQuantity !== 1) ||
                  Boolean(categoryRule && categorySelectedCount >= categoryRule.itemLimit));

              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-start gap-4 p-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-primary/10 text-primary">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-lg font-bold">
                          {getMenuItemInitial(item.name)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[15px] font-semibold leading-5 text-gray-900">
                        {item.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                        {categoryName ? <span>{categoryName}</span> : null}
                        {categoryRule ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                            {categorySelectedCount}/{categoryRule.itemLimit}
                          </span>
                        ) : null}
                        {status ? (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                            {status}
                          </span>
                        ) : null}
                      </div>
                      {description ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                          {description}
                        </p>
                      ) : null}
                    </div>

                    {configurable || checked ? (
                      <Button
                        className="h-9 shrink-0 rounded-full border border-primary/20 bg-white px-3 text-xs text-primary hover:bg-primary/5"
                        onClick={() => toggleExpandedItem(item.id)}
                      >
                        {expandedItemIds.includes(item.id) ? t("hideOptions") : t("options")}
                      </Button>
                    ) : null}
                    <Checkbox
                      className="size-5"
                      checked={checked}
                      disabled={disableUnchecked}
                      onCheckedChange={(value) => toggleSelectedItem(item.id, value === true)}
                    />
                  </div>
                  {renderItemConfiguration(item)}
                </div>
              );
                })}
              </div>
            ))}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="primary"
            className="h-11 w-full px-6 py-2 sm:w-auto"
            disabled={!canSubmitSelection || addDealMutation.isPending}
            onClick={addSelectedItems}
          >
            {addDealMutation.isPending ? t("adding") : t("addSelectedItems")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

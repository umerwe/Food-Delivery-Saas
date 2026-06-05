"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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
  buildCustomizableDealCartItemPayload,
  canAutoAddDealItem,
  canSendDealIdWithModifierSelections,
  getDealTypeLabel,
  hasUnsupportedDealMenuItemCustomization,
  isDealMenuItemCustomizable,
  isFixedItemDeal,
  requiresCustomizationForDealItem,
} from "@/components/pages/Home/utils/customer-deal-cart";
import {
  buildModifierSelections,
  validateModifierSelections,
} from "@/components/pages/Items/utils/modifier-selections";
import { formatDealPrice } from "@/components/pages/Home/utils/customer-deals-formatters";
import {
  canSubmitDealSelection,
  getDealRequiredSelectionCount,
  useDealEligibleItems,
} from "@/hooks/useDealEligibleItems";
import { useAddDealToCart } from "@/hooks/useCart";
import type { CustomerDeal, CustomerDealMenuItem } from "@/types/customer-deals";

type DealChooserDrawerProps = {
  deal: CustomerDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string | null;
};

const getMenuItemInitial = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

const getMenuItemPrice = (item: CustomerDealMenuItem) =>
  item.discountedBasePrice ?? item.basePrice;

const hasMenuItemPrice = (value: CustomerDealMenuItem["basePrice"]) =>
  value !== null && value !== undefined && value !== "";

type DealModifier = {
  id?: string | number | null;
  name?: string | null;
  modifierGroupId?: string | number | null;
};

type DealModifierGroup = {
  id?: string | number | null;
  name?: string | null;
  selectionType?: "SINGLE" | "MULTIPLE" | string | null;
  minSelect?: string | number | null;
  maxSelect?: string | number | null;
  modifiers?: DealModifier[];
};

type SelectedDealModifier = {
  id: string;
  name: string;
  selectedQuantity: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getId = (value: unknown) => String(value ?? "").trim();

const getModifierName = (modifier: DealModifier) =>
  String(modifier.name || "Option").trim();

const getDealModifierGroups = (item: CustomerDealMenuItem | null): DealModifierGroup[] => {
  if (Array.isArray(item?.modifierGroups) && item.modifierGroups.length > 0) {
    return item.modifierGroups.filter(isRecord).map((group) => ({
        id: group.id as string | number | null | undefined,
        name: typeof group.name === "string" ? group.name : null,
        selectionType: typeof group.selectionType === "string" ? group.selectionType : null,
        minSelect: typeof group.minSelect === "string" || typeof group.minSelect === "number" ? group.minSelect : null,
        maxSelect: typeof group.maxSelect === "string" || typeof group.maxSelect === "number" ? group.maxSelect : null,
        modifiers: Array.isArray(group.modifiers)
          ? group.modifiers.filter(isRecord).map((modifier) => ({
              id: modifier.id as string | number | null | undefined,
              name: typeof modifier.name === "string" ? modifier.name : null,
            }))
          : [],
      }));
  }

  const linkedGroups = new Map<string, DealModifierGroup>();

  if (Array.isArray(item?.modifierLinks)) {
    item.modifierLinks.filter(isRecord).forEach((link) => {
      const groupId = getId(link.modifierGroupId);
      const modifier = isRecord(link.modifier) ? link.modifier : null;
      const modifierId = getId(link.modifierId || modifier?.id);

      if (!groupId || !modifierId) return;

      const currentGroup = linkedGroups.get(groupId) || {
        id: groupId,
        name: "Options",
        selectionType: "MULTIPLE",
        minSelect: 0,
        maxSelect: null,
        modifiers: [],
      };

      currentGroup.modifiers = [
        ...(currentGroup.modifiers || []),
        {
          id: modifierId,
          name: typeof modifier?.name === "string" ? modifier.name : "Option",
          modifierGroupId: groupId,
        },
      ];
      linkedGroups.set(groupId, currentGroup);
    });
  }

  if (linkedGroups.size > 0) {
    return Array.from(linkedGroups.values());
  }

  const directModifiers = Array.isArray(item?.modifiers)
    ? item.modifiers.filter(isRecord)
    : [];
  const directModifierGroups = new Map<string, DealModifierGroup>();

  directModifiers.forEach((modifier) => {
    const groupId = getId(modifier.modifierGroupId);
    const modifierId = getId(modifier.id);

    if (!groupId || !modifierId) return;

    const currentGroup = directModifierGroups.get(groupId) || {
      id: groupId,
      name: "Options",
      selectionType: "MULTIPLE",
      minSelect: 0,
      maxSelect: null,
      modifiers: [],
    };

    currentGroup.modifiers = [
      ...(currentGroup.modifiers || []),
      {
        id: modifierId,
        name: typeof modifier.name === "string" ? modifier.name : "Option",
        modifierGroupId: groupId,
      },
    ];
    directModifierGroups.set(groupId, currentGroup);
  });

  return Array.from(directModifierGroups.values());
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
}: DealChooserDrawerProps) {
  const t = useTranslations("home.deals");
  const router = useRouter();
  const addDealMutation = useAddDealToCart(branchId);
  const { items, isLoading, error } = useDealEligibleItems({ deal, open });
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<string[]>([]);
  const [customizingItem, setCustomizingItem] = useState<CustomerDealMenuItem | null>(null);
  const [selectedModifiersByGroup, setSelectedModifiersByGroup] = useState<Record<string, SelectedDealModifier[]>>({});
  const [modifierErrors, setModifierErrors] = useState<Record<string, string>>({});

  const requiredQuantity = getDealRequiredSelectionCount(deal);
  const selectedCount = selectedMenuItemIds.length;
  const canAddSelectedItems = canSubmitDealSelection({
    selectedCount,
    requiredCount: requiredQuantity,
  });

  const selectedItems = useMemo(
    () => items.filter((item) => selectedMenuItemIds.includes(item.id)),
    [items, selectedMenuItemIds]
  );

  useEffect(() => {
    if (!open) {
      setSelectedMenuItemIds([]);
      setCustomizingItem(null);
      setSelectedModifiersByGroup({});
      setModifierErrors({});
    }
  }, [open]);

  const customizationGroups = useMemo(
    () => getDealModifierGroups(customizingItem),
    [customizingItem]
  );

  const toggleSelectedItem = useCallback((menuItemId: string, checked: boolean) => {
    setSelectedMenuItemIds((current) => {
      if (checked) {
        return current.includes(menuItemId) ? current : [...current, menuItemId];
      }

      return current.filter((id) => id !== menuItemId);
    });
  }, []);

  const customizeItem = useCallback(
    (item: CustomerDealMenuItem) => {
      const params = new URLSearchParams();
      params.set("itemId", item.id);
      params.set("dealContext", "chooser");

      if (item.slug) {
        params.set("slug", item.slug);
      }

      onOpenChange(false);
      router.push(`/items/details?${params.toString()}`);
    },
    [onOpenChange, router]
  );

  const startInlineCustomization = useCallback((item: CustomerDealMenuItem) => {
    setCustomizingItem(item);
    setSelectedModifiersByGroup({});
    setModifierErrors({});
  }, []);

  const toggleModifier = useCallback(
    (group: DealModifierGroup, modifier: DealModifier, checked: boolean) => {
      const groupId = getId(group.id);
      const modifierId = getId(modifier.id);

      if (!groupId || !modifierId) return;

      setSelectedModifiersByGroup((current) => {
        const selected = current[groupId] || [];
        const selectionType = group.selectionType === "SINGLE" ? "SINGLE" : "MULTIPLE";
        const nextModifier = {
          id: modifierId,
          name: getModifierName(modifier),
          selectedQuantity: 1,
        };

        if (!checked) {
          return {
            ...current,
            [groupId]: selected.filter(({ id }) => id !== modifierId),
          };
        }

        if (selectionType === "SINGLE") {
          return {
            ...current,
            [groupId]: [nextModifier],
          };
        }

        if (selected.some(({ id }) => id === modifierId)) {
          return current;
        }

        return {
          ...current,
          [groupId]: [...selected, nextModifier],
        };
      });
    },
    []
  );

  const addCustomizedDealItem = useCallback(() => {
    if (!deal || !customizingItem || !branchId) return;

    const validation = validateModifierSelections(
      customizationGroups,
      selectedModifiersByGroup
    );

    if (!validation.isValid) {
      setModifierErrors(validation.errors);
      return;
    }

    if (!canSendDealIdWithModifierSelections(deal, customizingItem)) {
      setModifierErrors({
        root: t("unsupportedDealCustomization"),
      });
      return;
    }

    const modifierSelections = buildModifierSelections(
      customizationGroups,
      selectedModifiersByGroup
    );

    addDealMutation.mutate(
      {
        deal,
        cartItemPayloads: [
          buildCustomizableDealCartItemPayload({
            deal,
            item: customizingItem,
            branchId,
            modifierSelections,
          }),
        ],
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          router.push("/checkout");
        },
      }
    );
  }, [
    addDealMutation,
    branchId,
    customizationGroups,
    customizingItem,
    deal,
    onOpenChange,
    router,
    selectedModifiersByGroup,
    t,
  ]);

  const addSelectedItems = useCallback(() => {
    if (!deal || !canAddSelectedItems) {
      return;
    }

    addDealMutation.mutate(
      {
        deal: isFixedItemDeal(deal)
          ? { ...deal, dealSelectionMode: "FLEXIBLE_ITEMS", dealRequiredQuantity: requiredQuantity }
          : deal,
        selectedMenuItemIds,
        eligibleMenuItems: selectedItems,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          router.push("/checkout");
        },
      }
    );
  }, [
    addDealMutation,
    canAddSelectedItems,
    deal,
    onOpenChange,
    requiredQuantity,
    router,
    selectedItems,
    selectedMenuItemIds,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-auto rounded-[24px] sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{deal?.title || t("chooseItems")}</DialogTitle>
          <DialogDescription>
            {deal?.description || getRequirementText(deal, requiredQuantity, t)}
          </DialogDescription>
        </DialogHeader>

        {deal ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-600">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">
              {formatDealPrice(deal.discountValue)}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1">
              {getDealTypeLabel(deal)}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-1">
              {getRequirementText(deal, requiredQuantity, t)}
            </span>
            <span className="ml-auto rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">
              {selectedCount}/{requiredQuantity} {t("selected")}
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

        {!isLoading && !error && items.length > 0 && !customizingItem ? (
          <div className="space-y-3">
            {items.map((item) => {
              const checked = selectedMenuItemIds.includes(item.id);
              const itemPrice = getMenuItemPrice(item);
              const categoryName = item.category?.name?.trim();
              const description = item.description?.trim();
              const requiresCustomization = requiresCustomizationForDealItem(item);
              const canSelectInline = canAutoAddDealItem(item);
              const unsupportedDealCustomization = hasUnsupportedDealMenuItemCustomization(item);
              const canCustomizeInline = isDealMenuItemCustomizable(item);

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-primary/10 text-primary">
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
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {item.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                      {hasMenuItemPrice(itemPrice) ? (
                        <span className="text-primary">
                          {formatDealPrice(itemPrice)}
                        </span>
                      ) : null}
                      {categoryName ? <span>{categoryName}</span> : null}
                    </div>
                    {description ? (
                      <p className="mt-1 line-clamp-1 text-xs leading-5 text-gray-500">
                        {description}
                      </p>
                    ) : null}
                  </div>

                  {unsupportedDealCustomization ? (
                    <div className="max-w-[170px] text-right text-xs font-medium text-red-500">
                      {t("unsupportedDealCustomization")}
                    </div>
                  ) : requiresCustomization ? (
                    <Button
                      className="h-9 shrink-0 rounded-full border border-primary/20 bg-white px-3 text-xs text-primary hover:bg-primary/5"
                      onClick={() =>
                        canCustomizeInline
                          ? startInlineCustomization(item)
                          : customizeItem(item)
                      }
                    >
                      {t("customize")}
                    </Button>
                  ) : (
                    <Checkbox
                      className="size-5"
                      checked={checked}
                      disabled={!canSelectInline}
                      onCheckedChange={(value) => toggleSelectedItem(item.id, value === true)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : null}

        {!isLoading && !error && customizingItem ? (
          <div className="space-y-4">
            <button
              type="button"
              className="text-sm font-medium text-primary"
              onClick={() => {
                setCustomizingItem(null);
                setSelectedModifiersByGroup({});
                setModifierErrors({});
              }}
            >
              {t("backToItems")}
            </button>

            <div className="rounded-2xl border border-gray-100 p-3">
              <p className="text-sm font-semibold text-gray-900">
                {customizingItem.name}
              </p>
              {modifierErrors.root ? (
                <p className="mt-2 text-xs font-medium text-red-500">
                  {modifierErrors.root}
                </p>
              ) : null}
            </div>

            {customizationGroups.map((group) => {
              const groupId = getId(group.id);
              const groupModifiers = Array.isArray(group.modifiers) ? group.modifiers : [];
              const selectedGroupModifiers = selectedModifiersByGroup[groupId] || [];
              const selectionType = group.selectionType === "SINGLE" ? "SINGLE" : "MULTIPLE";

              return (
                <div
                  key={groupId}
                  className="rounded-2xl border border-gray-100 p-3"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {String(group.name || "Options")}
                    </p>
                    <span className="text-xs font-medium text-gray-500">
                      {selectionType === "SINGLE" ? t("chooseOne") : t("chooseMultiple")}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {groupModifiers.map((modifier) => {
                      const modifierId = getId(modifier.id);
                      const checked = selectedGroupModifiers.some(({ id }) => id === modifierId);

                      return (
                        <label
                          key={modifierId}
                          className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {getModifierName(modifier)}
                          </span>
                          <Checkbox
                            className="size-5"
                            checked={checked}
                            onCheckedChange={(value) => toggleModifier(group, modifier, value === true)}
                          />
                        </label>
                      );
                    })}
                  </div>

                  {modifierErrors[groupId] ? (
                    <p className="mt-2 text-xs font-medium text-red-500">
                      {modifierErrors[groupId]}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="primary"
            className="h-11 w-full px-6 py-2 sm:w-auto"
            disabled={
              customizingItem
                ? addDealMutation.isPending
                : !canAddSelectedItems || addDealMutation.isPending
            }
            onClick={customizingItem ? addCustomizedDealItem : addSelectedItems}
          >
            {addDealMutation.isPending ? t("adding") : t("addSelectedItems")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

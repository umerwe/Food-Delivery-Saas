type ModifierSelectionInputModifier = {
  id?: string | number | null;
  selectedQuantity?: string | number | null;
};

type ModifierSelectionInputGroup = {
  id?: string | number | null;
  name?: string | null;
  selectionType?: "SINGLE" | "MULTIPLE" | string | null;
  minSelect?: string | number | null;
  maxSelect?: string | number | null;
  modifiers?: unknown[];
};

type ModifierSelectionInputMap = Record<string, ModifierSelectionInputModifier[]>;

export type ModifierSelectionPayloadInput = {
  modifierGroupId: string;
  modifiers: Array<{
    modifierId: string;
    quantity: number;
  }>;
};

const getId = (value: unknown) => String(value ?? "").trim();

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getModifierQuantity = (modifier: ModifierSelectionInputModifier) =>
  Math.max(1, Math.floor(toNumber(modifier?.selectedQuantity, 1)));

export const getModifierGroupSelectedQuantity = (
  selectedModifiers: ModifierSelectionInputModifier[] | undefined
) => {
  return (selectedModifiers || []).reduce(
    (total, modifier) => total + getModifierQuantity(modifier),
    0
  );
};

export const getModifierGroupSelectionError = (
  group: ModifierSelectionInputGroup,
  selectedCount: number
) => {
  const groupName = String(group?.name || "This group").trim();
  const modifiersCount = Array.isArray(group?.modifiers) ? group.modifiers.length : 0;
  const minSelect = Math.max(0, toNumber(group?.minSelect, 0));
  const rawMaxSelect = toNumber(group?.maxSelect, modifiersCount);
  const isSingleSelectionGroup = minSelect === 1 && rawMaxSelect === 1;
  const selectionType =
    group?.selectionType === "SINGLE" || isSingleSelectionGroup
      ? "SINGLE"
      : "MULTIPLE";
  const defaultMaxSelect = modifiersCount > 0 ? modifiersCount : 0;
  const maxSelect = selectionType === "SINGLE"
    ? 1
    : Math.max(minSelect, rawMaxSelect > 0 ? rawMaxSelect : defaultMaxSelect);

  if (selectedCount < minSelect) {
    return `${groupName} requires at least ${minSelect} selection${minSelect === 1 ? "" : "s"}.`;
  }

  if (selectionType === "SINGLE" && selectedCount > 1) {
    return `${groupName} allows only one selection.`;
  }

  if (maxSelect > 0 && selectedCount > maxSelect) {
    return `${groupName} allows at most ${maxSelect} selection${maxSelect === 1 ? "" : "s"}.`;
  }

  return null;
};

export const validateModifierSelections = (
  groups: ModifierSelectionInputGroup[],
  selectedModifiersByGroup: ModifierSelectionInputMap
) => {
  const errors: Record<string, string> = {};

  for (const group of groups) {
    const groupId = getId(group?.id);
    if (!groupId) continue;

    const selectedQuantity = getModifierGroupSelectedQuantity(
      selectedModifiersByGroup[groupId]
    );
    const error = getModifierGroupSelectionError(group, selectedQuantity);

    if (error) {
      errors[groupId] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const buildModifierSelections = (
  groups: ModifierSelectionInputGroup[],
  selectedModifiersByGroup: ModifierSelectionInputMap
): ModifierSelectionPayloadInput[] => {
  const payload: ModifierSelectionPayloadInput[] = [];
  const seenGroups = new Set<string>();

  for (const group of groups) {
    const groupId = getId(group?.id);
    if (!groupId || seenGroups.has(groupId)) continue;

    const modifiersById = new Map<string, number>();

    for (const modifier of selectedModifiersByGroup[groupId] || []) {
      const modifierId = getId(modifier?.id);

      if (!modifierId) continue;

      modifiersById.set(modifierId, getModifierQuantity(modifier));
    }

    const modifiers = Array.from(modifiersById.entries()).map(
      ([modifierId, quantity]) => ({
        modifierId,
        quantity,
      })
    );

    if (!modifiers.length) continue;

    seenGroups.add(groupId);
    payload.push({
      modifierGroupId: groupId,
      modifiers,
    });
  }

  return payload;
};

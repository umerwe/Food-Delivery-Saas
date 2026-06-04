import { describe, expect, it } from "vitest";

import {
  buildModifierSelections,
  getModifierGroupSelectionError,
  validateModifierSelections,
} from "./modifier-selections";
import type { ModifierGroup, ModifierSelectionMap } from "../types";

const modifier = (id: string, name = id) => ({
  id,
  name,
  selectedQuantity: 1,
});

const group = (overrides: Partial<ModifierGroup>): ModifierGroup => ({
  id: "group-1",
  name: "Choose sauce",
  selectionType: "MULTIPLE",
  minSelect: 0,
  maxSelect: 2,
  modifiers: [
    { id: "m1", name: "Garlic", priceDelta: 0 },
    { id: "m2", name: "BBQ", priceDelta: 0 },
  ],
  ...overrides,
});

describe("modifier selections", () => {
  it("validates required single selections", () => {
    const requiredSingle = group({ selectionType: "SINGLE", minSelect: 1, maxSelect: 1 });

    expect(validateModifierSelections([requiredSingle], { "group-1": [modifier("m1")] }).isValid).toBe(true);
    expect(validateModifierSelections([requiredSingle], {}).errors["group-1"]).toContain("requires at least 1");
  });

  it("allows optional single selections to be empty or selected once", () => {
    const optionalSingle = group({ selectionType: "SINGLE", minSelect: 0, maxSelect: 1 });

    expect(validateModifierSelections([optionalSingle], {}).isValid).toBe(true);
    expect(validateModifierSelections([optionalSingle], { "group-1": [modifier("m1")] }).isValid).toBe(true);
  });

  it("validates required multiple selections", () => {
    const requiredMultiple = group({ selectionType: "MULTIPLE", minSelect: 2, maxSelect: 3 });

    expect(validateModifierSelections([requiredMultiple], { "group-1": [modifier("m1"), modifier("m2")] }).isValid).toBe(true);
    expect(validateModifierSelections([requiredMultiple], { "group-1": [modifier("m1")] }).errors["group-1"]).toContain("requires at least 2");
  });

  it("allows optional multiple groups to be empty", () => {
    const optionalMultiple = group({ selectionType: "MULTIPLE", minSelect: 0, maxSelect: 2 });

    expect(validateModifierSelections([optionalMultiple], {}).isValid).toBe(true);
    expect(buildModifierSelections([optionalMultiple], {})).toEqual([]);
  });

  it("returns maxSelect violations", () => {
    const limited = group({ selectionType: "MULTIPLE", minSelect: 0, maxSelect: 1 });

    expect(getModifierGroupSelectionError(limited, 2)).toContain("allows at most 1");
  });

  it("removes duplicate modifiers from payload", () => {
    const selected: ModifierSelectionMap = {
      "group-1": [modifier("m1"), modifier("m1"), modifier("m2")],
    };

    expect(buildModifierSelections([group({})], selected)).toEqual([
      {
        modifierGroupId: "group-1",
        modifiers: [
          { modifierId: "m1", quantity: 1 },
          { modifierId: "m2", quantity: 1 },
        ],
      },
    ]);
  });

  it("builds grouped payload shape", () => {
    expect(buildModifierSelections([group({})], { "group-1": [modifier("m1")] })).toEqual([
      {
        modifierGroupId: "group-1",
        modifiers: [{ modifierId: "m1", quantity: 1 }],
      },
    ]);
  });

  it("returns an error when a required group is missing", () => {
    const validation = validateModifierSelections([group({ minSelect: 1, maxSelect: 2 })], {});

    expect(validation.isValid).toBe(false);
    expect(validation.errors["group-1"]).toContain("requires at least 1");
  });
});

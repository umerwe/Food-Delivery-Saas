export type ApiRecord = Record<string, unknown>;

export type ItemPriceOverride = {
  id?: string;
  menuItemId?: string | number | null;
  modifierId?: string | number | null;
  price?: string | number | null;
  priceDelta?: string | number | null;
  modifier?: Modifier;
  name?: string | null;
  modifierGroup?: ModifierGroup;
  menuItem?: { id?: string | number | null } | null;
};

export type VariationPriceOverride = {
  id?: string;
  menuItemId?: string | number | null;
  variationId?: string | number | null;
  modifierId?: string | number | null;
  price?: string | number | null;
  pickupPrice?: string | number | null;
  displayText?: string | null;
  priceDelta?: string | number | null;
  variation?: MenuVariation | null;
  modifier?: Modifier | null;
  menuItem?: { id?: string | number | null } | null;
  modifierPriceOverrides?: VariationPriceOverride[];
};

export type MenuVariation = {
  id: string;
  categoryId?: string;
  name: string;
  description?: string;
  price?: string | number;
  pickupPrice?: string | number | null;
  displayText?: string | null;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
  modifierPriceOverrides?: VariationPriceOverride[];
  itemPriceOverrides?: VariationPriceOverride[];
};

export type Modifier = {
  id: string;
  modifierGroupId?: string;
  restaurantId?: string;
  name: string;
  displayText?: string | null;
  description?: string | null;
  priceDelta?: string | number;
  sortOrder?: number;
  isActive?: boolean;
  itemPriceOverrides?: ItemPriceOverride[];
  variationPriceOverrides?: VariationPriceOverride[];
};

export type SelectedModifier = Modifier & {
  selectedQuantity: number;
};

export type RawModifierLink = {
  id?: string;
  modifierGroupId?: string;
  modifierId?: string;
  sortOrder?: number;
  modifier?: Modifier;
};

export type ModifierGroup = {
  id: string;
  name: string;
  description?: string;
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  modifiers?: Modifier[];
  modifierLinks?: RawModifierLink[];
};

export type ModifierLink = {
  id: string;
  variationId?: string | null;
  sortOrder?: number;
  modifierGroup: ModifierGroup;
};

export type MenuItem = {
  id: string;
  restaurantId?: string;
  restaurantMenuId?: string;
  menuLinks?: ApiRecord[];
  modifierGroup?: ModifierGroup;
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  basePrice?: string | number;
  unitPrice?: string | number;
  price?: string | number;
  isActive?: boolean;
  supportsSplitPizza?: boolean;
  isRequired?: boolean;
  minSelect?: number;
  maxSelect?: number;
  minQuantity?: number;
  maxQuantity?: number;
  categoryId?: string;
  ingredients?: string | null;
  nutritionalInformation?: string | null;
  allergenCodes?: string[];
  allergenFlags?: string[];
  additiveCodes?: string[];
  additiveFlags?: string[];
  dietaryFlags?: string[];
  allergenPdfUrl?: string | null;
  restaurant?: ApiRecord;
  tenant?: ApiRecord;
  labels?: ApiRecord[];
  allergenAdditives?: ApiRecord[];
  category?: {
    id: string;
    name?: string;
    variations?: MenuVariation[];
    variationLinks?: Array<{ variation?: MenuVariation | null }>;
    modifierLinks?: ModifierLink[];
    modifierGroup?: ModifierGroup;
    modifierGroups?: ModifierGroup[];
    categoryModifierGroups?: ApiRecord[];
  };
  variations?: MenuVariation[];
  variationPriceOverrides?: VariationPriceOverride[];
  modifierLinks?: ModifierLink[];
  modifierGroups?: ModifierGroup[];
  categoryModifierGroups?: ModifierGroup[];
  modifierPriceOverrides?: VariationPriceOverride[];
  modifiers?: Modifier[];
  splitPizza?: {
    enabled?: boolean;
    slots?: string[];
    pricingRule?: string;
    allowedFlavors?: ApiRecord[];
  };
};

export type MenuRecord = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  items?: {
    id: string;
    sortOrder?: number;
    menuItem?: MenuItem;
  }[];
};

export type MenuSection = MenuRecord;
export type MenuCategory = NonNullable<MenuItem["category"]>;

export type ProductCardData = {
  id: string;
  name: string;
  slug?: string;
  price: number;
  image: string;
  description: string;
  variations: MenuVariation[];
  modifierLinks: ModifierLink[];
  raw: MenuItem;
};

export type SelectedModifiersMap = Record<string, SelectedModifier[]>;

export type SplitPizzaSelection = {
  menuItemId?: string;
  menuItemName?: string;
  unitPrice?: string | number;
};

export type CartPayload = {
  customerId?: string;
  menuItemId?: string;
  quantity: number;
  checkoutType?: string;
  modifiers: Array<{ modifierId: string; quantity: number }>;
  note?: string;
  branchId?: string | null;
  variationId?: string | null;
  sections?: Array<{ slot: string; menuItemId: string }>;
  splitPizza?: unknown;
};

export type CartItemRecord = ApiRecord & {
  id?: string | number;
  menuItemId?: string | number;
  quantity?: string | number;
  price?: string | number;
  totalPrice?: string | number;
  modifiers?: Array<{ modifierId?: string | number; quantity?: string | number }>;
  menuItem?: MenuItem & {
    selectedVariation?: MenuVariation;
    modifierGroups?: ModifierGroup[];
  };
};

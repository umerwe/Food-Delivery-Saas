export type PromotionInfo = {
  promotionId?: string;
  title?: string | null;
  description?: string | null;
  applyMode?: "ORDER_TOTAL" | "SCOPED_ITEMS" | string;
  discountType?: "FLAT" | "PERCENTAGE" | string;
  discountValue?: number | string | null;
  maxDiscountAmount?: number | string | null;
  discountAmount?: number | string | null;
  discountedAmount?: number | string | null;
};


export type PromotionPricing = {
  promotion: PromotionInfo | null;
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  hasPromotion: boolean;
  hasDiscount: boolean;
};

export type ItemPriceOverride = {
  id?: string;
  menuItemId?: string | null;
  modifierId?: string | null;
  variationId?: string | null;
  price?: string | number | null;
  priceDelta?: string | number | null;
  modifier?: Modifier;
  menuItem?: { id?: string | number | null } | null;
};

export type MenuItemVariationModifierPriceOverride = {
  modifierId?: string;
  modifier?: {
    id: string;
  };
  priceDelta: number | string;
};

export type VariationPriceOverride = {
  id?: string;
  menuItemId?: string | null;
  variationId?: string | null;
  modifierId?: string | null;
  price?: string | number | null;
  pickupPrice?: string | number | null;
  displayText?: string | null;
  priceDelta?: string | number | null;
  modifier?: Modifier;
  menuItem?: { id?: string | number | null } | null;
  variation?: MenuVariation | null;
  modifierPriceOverrides?: MenuItemVariationModifierPriceOverride[];
  itemPriceOverrides?: VariationPriceOverride[];
  discountedPrice?: string | number | null;
  discountedBasePrice?: string | number | null;
  promotion?: PromotionInfo | null;
};

export type MenuItemVariationPriceOverride = VariationPriceOverride;

export type MenuVariation = {
  id: string;
  categoryId?: string;
  variationId?: string | number | null;
  takeawayPrice?: string | number | null;
  name: string;
  description?: string | null;
  price?: string | number;
  pickupPrice?: string | number | null;
  displayText?: string | null;
  discountedPrice?: string | number | null;
  discountedBasePrice?: string | number | null;
  promotion?: PromotionInfo | null;
  sortOrder?: number;
  isDefault?: boolean;
  isActive?: boolean;
  modifierPriceOverrides?: VariationPriceOverride[];
  itemPriceOverrides?: VariationPriceOverride[];
};

export type Modifier = {
  id: string;
  modifierId?: string | null;
  modifier?: {
    id: string;
  } | null;
  modifierGroupId?: string;
  restaurantId?: string;
  name: string;
  displayText?: string | null;
  description?: string | null;
  priceDelta?: string | number | null;
  sortOrder?: number;
  isActive?: boolean;
  itemPriceOverrides?: ItemPriceOverride[];
  variationPriceOverrides?: VariationPriceOverride[];
};

export type CustomerModifierCategory = {
  id: string;
  name: string;
  slug?: string;
};

export type CustomerGroupedModifier = {
  id: string;
  name: string;
  priceDelta?: string | number | null;
  sortOrder?: number;
  category?: CustomerModifierCategory | null;
};

export type MenuItemGroupedModifier = CustomerGroupedModifier;

export type CustomerModifierGroup = {
  id: string;
  name: string;
  description?: string | null;
  selectionType: "SINGLE" | "MULTIPLE";
  minSelect: number;
  maxSelect: number;
  isRequired?: boolean;
  sortOrder?: number;
  modifiers: CustomerGroupedModifier[];
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
  selectionType?: "SINGLE" | "MULTIPLE";
  minSelect?: number;
  maxSelect?: number;
  isRequired?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  modifiers?: Modifier[];
  modifierLinks?: RawModifierLink[];
  modifierGroups?: ModifierGroup[];
  categoryModifierGroups?: ModifierGroup[];
};

export type ModifierLink = {
  id: string;
  variationId?: string | null;
  sortOrder?: number;
  modifierGroup: ModifierGroup;
};

export type ModifierSelectionMap = Record<string, SelectedModifier[]>;

export type CheckoutType = "delivery" | "pickup";

export type MenuItem = {
  id?: string | number;
  name?: string;
  slug?: string | null;
  description?: string | null;
  price?: string | number | null;
  basePrice?: string | number | null;
  pickupPrice?: string | number | null;
  imageUrl?: string | null;
  categoryId?: string | null;
  category?: Record<string, unknown> & { name?: string | null; variations?: MenuVariation[]; variationLinks?: Array<{ variation?: MenuVariation | null }>; modifierLinks?: ModifierLink[]; modifierGroups?: ModifierGroup[]; categoryModifierGroups?: ModifierGroup[] };
  variations?: MenuVariation[];
  variationPriceOverrides?: VariationPriceOverride[];
  modifierPriceOverrides?: VariationPriceOverride[];
  modifiers?: Modifier[];
  modifierLinks?: RawModifierLink[];
  modifierGroups?: ModifierGroup[];
  categoryModifierGroups?: ModifierGroup[];
  supportsDealIdCartPayload?: boolean | null;
  supportsDealCartPayload?: boolean | null;
  isDealMenuItem?: boolean | null;
  minSelect?: string | number | null;
  maxSelect?: string | number | null;
  isRequired?: boolean | null;
  minQuantity?: string | number | null;
  maxQuantity?: string | number | null;
  depositAmount?: string | number | null;
  promotion?: PromotionInfo | null;
  discountedPrice?: string | number | null;
  discountedBasePrice?: string | number | null;
  settings?: ApiRecord;
  restaurant?: (Record<string, unknown> & { id?: string | number | null });
  restaurantId?: string | number | null;
  restaurantMenuId?: string | number | null;
  restaurantMenu?: { id?: string | number | null } | null;
  menuLinks?: Array<{ restaurantMenuId?: string | number | null; restaurantMenu?: { id?: string | number | null } | null; menuId?: string | number | null }>;
  prepTimeMinutes?: string | number | null;
  unitPrice?: string | number | null;
  takeawayPriceAdjustment?: string | number | null;
  deliveryPriceAdjustment?: string | number | null;
  supportsSplitPizza?: boolean | null;
  tenant?: Record<string, unknown>;
  labels?: unknown[];
  dietaryFlags?: unknown[];
  allergenAdditives?: unknown[];
  allergenCodes?: unknown[];
  allergenFlags?: unknown[];
  additiveCodes?: unknown[];
  additiveFlags?: unknown[];
  ingredients?: string | null;
  nutritionalInformation?: string | null;
  allergenPdfUrl?: string | null;
};

export type SelectedModifiersMap = Record<string, SelectedModifier[]>;

export type CartModifierSelectionInput = {
  modifierGroupId: string;
  modifiers: Array<{
    modifierId: string;
    quantity: number;
  }>;
};

export type CartPayload = {
  customerId?: string;
  menuItemId?: string | number;
  restaurantMenuId?: string | number;
  dealId?: string;
  quantity: number;
  checkoutType?: CheckoutType;
  variationId?: string | null;
  modifierSelections?: CartModifierSelectionInput[];
  modifiers?: Array<{ modifierId: string; quantity: number }>;
  note?: string;
  branchId?: string | null;
  scheduledDeliveryAt?: string | null;
  orderTime?: string | null;
  sections?: Array<{ slot: string; menuItemId?: string | number }>;
  splitPizza?: unknown;
};

export type ApiRecord = Record<string, unknown>;

export type AddressRecord = {
  street?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

export type RestaurantBranch = {
  id?: string | number | null;
  name?: string | null;
  address?: string | AddressRecord | null;
  operatingHours?: string | null;
  openingHours?: string | null;
  businessHours?: string | null;
  openingTime?: string | null;
  opensAt?: string | null;
  closingTime?: string | null;
  closesAt?: string | null;
  isActive?: boolean | null;
};

export type RestaurantInfo = {
  id?: string | number | null;
  name?: string | null;
  restaurantName?: string | null;
  address?: string | AddressRecord | null;
  coverImage?: string | null;
  coverImageUrl?: string | null;
  bannerUrl?: string | null;
  imageUrl?: string | null;
  operatingHours?: string | null;
  openingHours?: string | null;
  businessHours?: string | null;
  openingTime?: string | null;
  opensAt?: string | null;
  closingTime?: string | null;
  closesAt?: string | null;
  rating?: string | number | null;
  averageRating?: string | number | null;
  reviewCount?: string | number | null;
  reviewsCount?: string | number | null;
  stats?: {
    averageRating?: string | number | null;
    reviewCount?: string | number | null;
  } | null;
};

export type AuthRestaurantUser = {
  restaurant?: RestaurantInfo | null;
  restaurantId?: string | number | null;
  restaurantName?: string | null;
  branchId?: string | number | null;
  branch?: RestaurantBranch | null;
  address?: string | AddressRecord | null;
  profile?: {
    restaurantName?: string | null;
    restaurant?: RestaurantInfo | null;
  restaurantId?: string | number | null;
    branch?: RestaurantBranch | null;
    address?: string | AddressRecord | null;
  } | null;
  tenant?: {
    restaurant?: RestaurantInfo | null;
  restaurantId?: string | number | null;
  } | null;
};

export type StoredAuthState = {
  user?: AuthRestaurantUser | null;
};

export type MenuCategory = {
  id?: string | number | null;
  name?: string | null;
  description?: string | null;
  itemsCount?: string | number | null;
  itemCount?: string | number | null;
  items?: unknown[];
  _count?: { items?: string | number | null } | null;
  imageUrl?: string | null;
  coverImage?: string | null;
  bannerUrl?: string | null;
};

export type ItemsCategory = MenuCategory;

export type ApiMeta = {
  hasNext?: boolean;
  hasMore?: boolean;
  page?: string | number;
  totalPages?: string | number;
  pages?: string | number;
  total?: string | number;
};

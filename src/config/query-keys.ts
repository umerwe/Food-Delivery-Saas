export const queryKeys = {
  auth: {
    currentUser: ["auth", "current-user"] as const,
  },
  restaurants: {
    all: ["restaurants"] as const,
    detail: (restaurantId: string) => ["restaurants", restaurantId] as const,
  },
  branches: {
    all: ["branches"] as const,
    list: (restaurantId?: string | null) => ["branches", restaurantId ?? "all"] as const,
    request: (endpoint: string) => ["branches", "request", endpoint] as const,
    nearby: (params: { lat?: number | null; lng?: number | null; page: number; limit: number }) =>
      ["branches", "nearby", params] as const,
  },
  menu: {
    all: ["menu"] as const,
    items: (params?: Record<string, unknown>) => ["menu", "items", params ?? {}] as const,
    categories: (params?: Record<string, unknown>) => ["menu", "categories", params ?? {}] as const,
    request: (endpoint: string) => ["menu", "request", endpoint] as const,
  },
  items: {
    all: ["items"] as const,
    request: (endpoint: string) => ["items", "request", endpoint] as const,
    dealScopedDetails: (
      itemIds: string[],
      itemSearchTermsById?: Record<string, string[]>
    ) => ["items", "deal-scoped-details", itemIds, itemSearchTermsById ?? {}] as const,
  },
  cart: {
    current: ["cart", "current"] as const,
    request: (endpoint: string) => ["cart", "request", endpoint] as const,
  },
  groupOrders: {
    all: ["group-orders"] as const,
    detail: (inviteCode: string) => ["group-orders", inviteCode] as const,
  },
  home: {
    detail: (restaurantId?: string | null, branchId?: string | null) => ["customer-home", restaurantId ?? "", branchId ?? ""] as const,
    categories: (restaurantId?: string | null) => ["customer-home", "categories", restaurantId ?? ""] as const,
    promotions: (restaurantId?: string | null, branchId?: string | null) => ["customer-home", "promotions", restaurantId ?? "", branchId ?? ""] as const,
    branchStats: (restaurantId?: string | null, branchId?: string | null) => ["customer-home", "branch-stats", restaurantId ?? "", branchId ?? ""] as const,
    about: (restaurantId?: string | null) => ["customer-home", "about", restaurantId ?? ""] as const,
    helpSupport: (restaurantId?: string | null, branchId?: string | null) => ["customer-home", "help-support", restaurantId ?? "", branchId ?? ""] as const,
    faqs: (restaurantId?: string | null, branchId?: string | null) => ["customer-home", "faqs", restaurantId ?? "", branchId ?? ""] as const,
  },
  customerDeals: {
    list: (params: Record<string, unknown>) => ["customer-deals", "list", params] as const,
  },
  customerCoupons: {
    list: (params: Record<string, unknown>) => ["customer-coupons", "list", params] as const,
  },
  customerReviews: {
    list: (params: Record<string, unknown>) => ["customer-reviews", "list", params] as const,
  },
  orders: {
    all: ["orders"] as const,
    request: (endpoint: string) => ["orders", "request", endpoint] as const,
  },
  checkout: {
    all: ["checkout"] as const,
    request: (endpoint: string) => ["checkout", "request", endpoint] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    request: (endpoint: string) => ["notifications", "request", endpoint] as const,
  },
  payments: {
    all: ["payments"] as const,
    request: (endpoint: string) => ["payments", "request", endpoint] as const,
  },
  wallet: {
    all: ["wallet"] as const,
    summary: ["wallet", "summary"] as const,
    history: ["wallet", "history"] as const,
  },
  loyalty: {
    all: ["loyalty"] as const,
    request: (endpoint: string) => ["loyalty", "request", endpoint] as const,
  },
  reservations: {
    all: ["reservations"] as const,
    request: (endpoint: string) => ["reservations", "request", endpoint] as const,
  },
  profile: {
    all: ["profile"] as const,
    request: (endpoint: string) => ["profile", "request", endpoint] as const,
  },
  chat: {
    all: ["chat"] as const,
    request: (endpoint: string) => ["chat", "request", endpoint] as const,
  },
};

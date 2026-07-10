"use client";

import Image from "next/image";
import {
  Search,
  ShoppingBag,
  User,
  ChevronDown,
  LogOut,
  HelpCircle,
  Menu,
  X,
  Bell,
  CalendarDays,
  Coffee,
  Heart,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import useMenu from "@/hooks/useMenu";
import { BranchSwitcher } from "@/components/common/branch-selector/BranchSwitcher";
import { BrandLogo } from "@/components/common/BrandLogo";
import { CouponPerkBanner } from "@/components/layout/navbar/CouponPerkBanner";
import { LanguageSelector } from "@/components/layout/navbar/LanguageSelector";
import { useCustomerCoupons } from "@/hooks/useCustomerCoupons";
import { useHome } from "@/hooks/useHome";
import { CART_CHANGED_EVENT, type CartChangedDetail } from "@/lib/cart-events";
import {
  GROUP_ORDER_LOBBY_CHANGED_EVENT,
  getStoredGroupOrderCode,
  getStoredGroupOrderLobbyId,
} from "@/lib/group-order";
import {
  resolveHomeBranchId,
  resolveHomeRestaurantId,
  resolveTableReservationsEnabled,
} from "@/lib/home";
import { formatMoney, resolveCustomerCurrency } from "@/lib/money";
import { fetchCustomerCart } from "@/services/cart";

type MenuItem = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sku: string;
  basePrice: string;
  prepTimeMinutes: number;
  dietaryFlags: string[];
  allergenFlags: string[];
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  restaurant?: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    coverImage?: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string;
  };
  menuLinks?: Array<{
    id: string;
    restaurantMenuId: string;
    menuItemId: string;
    sortOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    restaurantMenu?: {
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
    };
  }>;
  variations?: unknown[];
  modifierLinks?: unknown[];
  _count?: {
    variations: number;
    modifierLinks: number;
    menuLinks: number;
  };
};

type SearchResponse = {
  success: boolean;
  data: MenuItem[];
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
};

const isSearchResponse = (value: unknown): value is SearchResponse =>
  typeof value === "object" && value !== null && "success" in value;

const NAV_LINKS = [
  { href: "/", labelKey: "home" },
  { href: "/items", labelKey: "items" },
  { href: "/group-order", labelKey: "groupOrder" },
  { href: "/reservetable", labelKey: "reservations" },
] as const;

const toCartQuantity = (value: unknown) => {
  const quantity = Number(value);
  return Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0;
};

export const Navbar = () => {
  const { user, logout } = useAuthContext();
  const { token, loading: authLoading, restaurantId } = useAuth();
  const { get } = useMenu(token);
  const homeRestaurantId = resolveHomeRestaurantId(user, restaurantId);
  const branchId = resolveHomeBranchId(user);
  const homeQuery = useHome(
    homeRestaurantId,
    branchId,
    Boolean(!authLoading && homeRestaurantId && branchId),
    {
      staleTime: 0,
      refetchInterval: 15_000,
      refetchOnMount: "always",
      refetchOnReconnect: "always",
      refetchOnWindowFocus: "always",
    },
  );
  const couponsQuery = useCustomerCoupons({
    restaurantId: homeRestaurantId,
    branchId,
  });

  const isAuth = !!user;
  const userId = user?.id;
  const userName =
    `${user?.profile?.firstName || ""} ${user?.profile?.lastName || ""}`.trim();
  const tableReservationsEnabled = resolveTableReservationsEnabled(
    homeQuery.data?.data.branch,
    user?.branch,
  );
  const restaurantLogoUrl = homeQuery.data?.data.restaurant?.logoUrl ?? null;
  const currency = resolveCustomerCurrency({
    configCurrency: homeQuery.data?.data.config?.currency,
    restaurant: homeQuery.data?.data.restaurant,
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<MenuItem[]>([]);
  const [searchMeta, setSearchMeta] = useState<SearchResponse["meta"] | null>(
    null,
  );
  const [cartItemCount, setCartItemCount] = useState(0);
  const [activeGroupOrderCode, setActiveGroupOrderCode] = useState("");
  const [activeGroupOrderLobbyId, setActiveGroupOrderLobbyId] = useState("");

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const navbarWrapRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cartRefreshRequestRef = useRef(0);

  const router = useRouter();
  const pathname = usePathname();
  const tNav = useTranslations("navigation");
  const tCommon = useTranslations("common");
  const hideOnMobileHome = pathname === "/";

  const isNavLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isNavLinkDisabled = (href: string) =>
    href === "/reservetable" && !tableReservationsEnabled;

  const getSafeImageSrc = (src?: string | null) => {
    if (!src || typeof src !== "string") return "/placeholder-food.png";

    const trimmed = src.trim();
    if (!trimmed) return "/placeholder-food.png";

    if (trimmed.startsWith("/")) return trimmed;

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return trimmed;
      }
      return "/placeholder-food.png";
    } catch {
      return "/placeholder-food.png";
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }

      if (navbarWrapRef.current && !navbarWrapRef.current.contains(target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 120);

      return () => clearTimeout(timer);
    }
  }, [searchOpen]);

  const handleLogout = () => {
    logout();
    toast.success(tNav("logoutSuccess"));
    setDropdownOpen(false);
    router.push("/auth/login");
  };

  const clearSearchState = () => {
    setSearchValue("");
    setSearchResults([]);
    setSearchMeta(null);
    setSearchLoading(false);
  };

  const handleToggleSearch = () => {
    setSearchOpen((prev) => {
      const next = !prev;
      if (!next) {
        clearSearchState();
      }
      return next;
    });
  };

  const handleSearchItemClick = (item: MenuItem) => {
    setSearchOpen(false);
    clearSearchState();
    router.push(`/items/details?itemId=${item.id}&slug=${item.slug}`);
  };

  const fetchMenuItems = async (keyword: string) => {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword || !restaurantId || authLoading) {
      setSearchResults([]);
      setSearchMeta(null);
      setSearchLoading(false);
      return;
    }

    try {
      setSearchLoading(true);

      const response = await get(
        `/v1/menu/items?search=${encodeURIComponent(trimmedKeyword)}&restaurantId=${encodeURIComponent(
          restaurantId,
        )}${branchId ? `&branchId=${encodeURIComponent(branchId)}` : ""}`,
      );

      if (isSearchResponse(response) && response.success) {
        setSearchResults(Array.isArray(response.data) ? response.data : []);
        setSearchMeta(response.meta || null);
      } else {
        setSearchResults([]);
        setSearchMeta(null);
      }
    } catch {
      setSearchResults([]);
      setSearchMeta(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const refreshCartItemCount = useCallback(async () => {
    const requestId = cartRefreshRequestRef.current + 1;
    cartRefreshRequestRef.current = requestId;

    if (!userId || authLoading) {
      setCartItemCount(0);
      return;
    }

    try {
      const { items } = await fetchCustomerCart({ customerId: userId, token });

      if (cartRefreshRequestRef.current !== requestId) return;

      setCartItemCount(
        items.reduce((total, item) => total + toCartQuantity(item.quantity), 0),
      );
    } catch {
      if (cartRefreshRequestRef.current !== requestId) return;

      setCartItemCount(0);
    }
  }, [authLoading, token, userId]);

  useEffect(() => {
    refreshCartItemCount();
  }, [refreshCartItemCount]);

  useEffect(() => {
    const refreshActiveGroupOrderCode = () => {
      setActiveGroupOrderCode(getStoredGroupOrderCode());
    };

    refreshActiveGroupOrderCode();
    window.addEventListener("storage", refreshActiveGroupOrderCode);
    window.addEventListener(
      "deliveryway:group-order:item-added",
      refreshActiveGroupOrderCode,
    );

    return () => {
      window.removeEventListener("storage", refreshActiveGroupOrderCode);
      window.removeEventListener(
        "deliveryway:group-order:item-added",
        refreshActiveGroupOrderCode,
      );
    };
  }, []);

  const activeGroupOrderHref = activeGroupOrderLobbyId
    ? `/group-order/lobby?groupOrderId=${encodeURIComponent(activeGroupOrderLobbyId)}`
    : "/group-order/lobby";
  const showActiveGroupOrderLink = Boolean(
    activeGroupOrderCode || activeGroupOrderLobbyId,
  );

  useEffect(() => {
    const handleCartChanged = (event: Event) => {
      const detail =
        event instanceof CustomEvent
          ? (event.detail as CartChangedDetail | undefined)
          : undefined;

      if (typeof detail?.itemCount === "number") {
        cartRefreshRequestRef.current += 1;
        setCartItemCount(toCartQuantity(detail.itemCount));
        return;
      }

      refreshCartItemCount();
    };

    window.addEventListener(CART_CHANGED_EVENT, handleCartChanged);

    return () => {
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChanged);
    };
  }, [refreshCartItemCount]);

  useEffect(() => {
    if (!searchOpen) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchValue.trim()) {
      setSearchResults([]);
      setSearchMeta(null);
      setSearchLoading(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchMenuItems(searchValue);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue, searchOpen, restaurantId, branchId, authLoading]);

  return (
    <>
      <div
        ref={navbarWrapRef}
        className={`relative z-30 ${hideOnMobileHome ? "hidden md:block" : ""}`}
      >
        <CouponPerkBanner coupons={couponsQuery.coupons} currency={currency} />

        {/* NAVBAR */}
        <nav className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 py-5 lg:px-8 2xl:px-10">
          {/* LEFT - LOGO */}
          <Link href="/" className="relative h-[34px] w-[150px] shrink-0">
            <BrandLogo
              alt="Logo"
              fill
              restaurantLogoUrl={restaurantLogoUrl}
              className="object-contain"
            />
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden min-w-0 flex-1 items-center justify-between gap-4 xl:flex">
            <div className="flex min-w-0 items-center gap-8 text-sm font-semibold text-[#20242A]">
              {NAV_LINKS.map((item) => {
                const isActive = isNavLinkActive(item.href);
                const isDisabled = isNavLinkDisabled(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-disabled={isDisabled}
                    tabIndex={isDisabled ? -1 : undefined}
                    onClick={(event) => {
                      if (isDisabled) {
                        event.preventDefault();
                      }
                    }}
                    className={`relative whitespace-nowrap py-2 transition-colors after:absolute after:left-1/2 after:-bottom-1 after:h-[3px] after:-translate-x-1/2 after:rounded-full after:transition-all ${
                      isDisabled
                        ? "pointer-events-none cursor-not-allowed text-gray-300 after:w-0 after:bg-transparent"
                        : isActive
                          ? "text-primary after:w-6 after:bg-primary"
                          : "hover:text-primary after:w-0 after:bg-transparent"
                    }`}
                  >
                    {tNav(item.labelKey)}
                  </Link>
                );
              })}
            </div>

            <div className="flex min-w-0 items-center justify-end gap-2">
              {/* Search */}
              <button
                onClick={handleToggleSearch}
                aria-label={tNav("searchFood")}
                title={tNav("searchFood")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F7F7F8] text-[#7A8088] transition-colors hover:bg-[#F1F2F4] hover:text-primary"
              >
                <Search size={18} className="shrink-0 text-primary" />
              </button>

              <BranchSwitcher presentation="navbar" />
              <LanguageSelector className="h-11 rounded-full border-none bg-[#F7F7F8] px-4 text-[#20242A] shadow-none hover:bg-[#F1F2F4]" />

              {showActiveGroupOrderLink ? (
                <Link
                  href={activeGroupOrderHref}
                  className="relative flex h-11 shrink-0 items-center gap-2 rounded-full bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <Users size={17} />
                  <span>{tNav("activeGroupOrder")}</span>
                </Link>
              ) : null}

              <Link
                href="/checkout"
                className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F7F7F8] text-primary transition-colors hover:bg-[#F1F2F4]"
                aria-label={tNav("cart")}
              >
                <ShoppingBag size={19} />
                {cartItemCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                ) : null}
              </Link>
              {/* USER */}
              {isAuth ? (
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex h-11 max-w-[180px] cursor-pointer items-center gap-2 rounded-full bg-[#F7F7F8] pl-2 pr-3 text-[#20242A] transition-colors hover:bg-[#F1F2F4] 2xl:max-w-[220px]"
                  >
                    <span className="relative h-8 w-8 overflow-hidden rounded-full bg-white">
                      <Image
                        src={
                          user?.profile?.avatarUrl?.startsWith("http")
                            ? user.profile.avatarUrl
                            : "/profile-user.png"
                        }
                        alt={userName || tNav("user")}
                        fill
                        className="object-cover"
                      />
                    </span>
                    <span className="truncate text-sm font-semibold">
                      {userName || tNav("user")}
                    </span>
                    <ChevronDown
                      size={15}
                      className="shrink-0 text-[#7A8088]"
                    />
                  </button>

                  {dropdownOpen && (
                    <div
                      style={{ zIndex: "99999" }}
                      className="absolute right-0 mt-3 w-[320px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#F1E6D9] bg-white shadow-[0_16px_42px_rgba(56,40,24,0.14)]"
                    >
                      <div
                        className="relative flex min-h-[92px] items-center gap-3 border-b border-[#E8C990] bg-[#FBF5EC] bg-cover bg-center px-6 py-4"
                        style={{
                          backgroundImage: "url('/profile-dropdown-bg.svg')",
                        }}
                      >
                        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-[0_7px_18px_rgba(49,34,20,0.16)]">
                          <Image
                            src={
                              user?.profile?.avatarUrl?.startsWith("http")
                                ? user.profile.avatarUrl
                                : "/profile-user.png"
                            }
                            alt={userName || tNav("user")}
                            fill
                            className="object-cover"
                          />
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold leading-5 text-[#1D1712]">
                            {userName || tNav("user")}
                          </p>
                          <p className="mt-0.5 truncate text-[12px] leading-5 text-[#7F7167]">
                            {user?.email}
                          </p>
                        </div>

                        <div className="absolute -bottom-[7px] left-0 right-0 flex items-center justify-center text-[#D8A95D]">
                          <span className="h-px w-[47%] bg-[#E8C990]" />
                          <span className="mx-1 h-2 w-2 rotate-45 rounded-[1px] border border-[#D8A95D] bg-white" />
                          <span className="h-px w-[47%] bg-[#E8C990]" />
                        </div>
                      </div>

                      <div className="space-y-2 px-5 py-4">
                        <Link
                          href="/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="group flex min-h-9 items-center gap-3 rounded-xl text-[#1D1712] transition-colors hover:text-primary"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8F4EF] text-primary shadow-[0_7px_16px_rgba(42,27,14,0.07)] ring-1 ring-[#F1EAE2]">
                            <User size={17} strokeWidth={1.8} />
                          </span>
                          <span className="text-sm font-medium leading-5">
                            {tNav("myProfile")}
                          </span>
                        </Link>

                        <Link
                          href="/orders-history"
                          onClick={() => setDropdownOpen(false)}
                          className="group flex min-h-9 items-center gap-3 rounded-xl text-[#1D1712] transition-colors hover:text-primary"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8F4EF] text-primary shadow-[0_7px_16px_rgba(42,27,14,0.07)] ring-1 ring-[#F1EAE2]">
                            <ShoppingBag size={17} strokeWidth={1.8} />
                          </span>
                          <span className="text-sm font-medium leading-5">
                            {tNav("myOrders")}
                          </span>
                        </Link>

                        <Link
                          href="/favourites"
                          onClick={() => setDropdownOpen(false)}
                          className="group flex min-h-9 items-center gap-3 rounded-xl text-[#1D1712] transition-colors hover:text-primary"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8F4EF] text-primary shadow-[0_7px_16px_rgba(42,27,14,0.07)] ring-1 ring-[#F1EAE2]">
                            <Heart size={17} strokeWidth={1.8} />
                          </span>
                          <span className="text-sm font-medium leading-5">
                            {tNav("myFavourites")}
                          </span>
                        </Link>

                        <Link
                          href="/reservations"
                          onClick={() => setDropdownOpen(false)}
                          className="group flex min-h-9 items-center gap-3 rounded-xl text-[#1D1712] transition-colors hover:text-primary"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8F4EF] text-primary shadow-[0_7px_16px_rgba(42,27,14,0.07)] ring-1 ring-[#F1EAE2]">
                            <CalendarDays size={17} strokeWidth={1.8} />
                          </span>
                          <span className="text-sm font-medium leading-5">
                            {tNav("myReservations")}
                          </span>
                        </Link>

                        <Link
                          href="/notifications"
                          onClick={() => setDropdownOpen(false)}
                          className="group flex min-h-9 items-center gap-3 rounded-xl text-[#1D1712] transition-colors hover:text-primary"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8F4EF] text-primary shadow-[0_7px_16px_rgba(42,27,14,0.07)] ring-1 ring-[#F1EAE2]">
                            <Bell size={17} strokeWidth={1.8} />
                          </span>
                          <span className="text-sm font-medium leading-5">
                            {tNav("notifications")}
                          </span>
                        </Link>

                        <Link
                          href="/contact"
                          onClick={() => setDropdownOpen(false)}
                          className="group flex min-h-9 items-center gap-3 rounded-xl text-[#1D1712] transition-colors hover:text-primary"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8F4EF] text-primary shadow-[0_7px_16px_rgba(42,27,14,0.07)] ring-1 ring-[#F1EAE2]">
                            <HelpCircle size={17} strokeWidth={1.8} />
                          </span>
                          <span className="text-sm font-medium leading-5">
                            {tNav("helpCenter")}
                          </span>
                        </Link>
                      </div>

                      <div className="px-3 pb-3">
                        <button
                          onClick={handleLogout}
                          className="flex min-h-11 w-full items-center gap-3 rounded-xl bg-[#FCF7F6] px-5 text-left text-primary transition-colors hover:bg-[#FCEEEE]"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F7EDED] text-primary ring-1 ring-[#F1DEDE]">
                            <LogOut size={17} strokeWidth={1.8} />
                          </span>
                          <span className="text-sm font-medium leading-5">
                            {tNav("logout")}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex h-11 items-center gap-2 rounded-full bg-[#F7F7F8] px-4 text-sm font-semibold text-primary transition-colors hover:bg-[#F1F2F4]"
                >
                  <User size={18} />
                  {tNav("login")}
                </Link>
              )}
            </div>
          </div>

          {/* MOBILE BUTTON */}
          <button onClick={() => setMobileOpen(true)} className="xl:hidden">
            <Menu />
          </button>
        </nav>

        {/* ABSOLUTE SEARCH INPUT + RESULTS */}
        <div
          className={`absolute left-6 right-6 top-full 2xl:left-40 2xl:right-40 z-40 origin-top transition-all duration-300 ease-out ${
            searchOpen
              ? "pointer-events-auto translate-y-0 scale-y-100 opacity-100"
              : "pointer-events-none -translate-y-2 scale-y-95 opacity-0"
          }`}
        >
          <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-[#eee] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
              <Search size={18} className="text-primary shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={tNav("searchPlaceholder")}
                className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />

              {searchValue && (
                <button
                  onClick={clearSearchState}
                  className="text-sm font-medium text-gray-400 hover:text-primary"
                >
                  {tCommon("clear")}
                </button>
              )}

              <button
                onClick={() => {
                  setSearchOpen(false);
                  clearSearchState();
                }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {searchLoading ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500">
                  {tNav("searchingItems")}
                </div>
              ) : !searchValue.trim() ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500">
                  {tNav("startTyping")}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500">
                  {tNav("noMenuItems")}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSearchItemClick(item)}
                      className="flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-orange-50/40"
                    >
                      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                        <Image
                          src={getSafeImageSrc(item.imageUrl)}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <h4 className="truncate text-sm font-semibold text-gray-900">
                              {item.name}
                            </h4>
                            <p className="mt-1 text-xs font-medium text-primary">
                              {item.category?.name || tNav("uncategorized")}
                            </p>
                          </div>

                          <div className="shrink-0 text-sm font-semibold text-gray-900">
                            {formatMoney(item.basePrice, currency, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </div>

                        {item.description && (
                          <p className="mt-2 text-xs leading-5 text-gray-500 overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
                            {item.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                          {item.prepTimeMinutes ? (
                            <span className="rounded-full bg-gray-100 px-2.5 py-1">
                              {tNav("minutesShort", {
                                count: item.prepTimeMinutes,
                              })}
                            </span>
                          ) : null}

                          {item.menuLinks?.[0]?.restaurantMenu?.name ? (
                            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-primary">
                              {item.menuLinks[0].restaurantMenu.name}
                            </span>
                          ) : null}

                          {!item.isActive ? (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-600">
                              {tCommon("inactive")}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!!searchResults.length && searchMeta && (
              <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
                <span>
                  {tNav("showingResults", {
                    count: searchResults.length,
                    total: searchMeta.total,
                  })}
                </span>
                <span>
                  {tNav("pageOf", {
                    page: searchMeta.page,
                    totalPages: searchMeta.totalPages,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {hideOnMobileHome ? (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed right-16 top-5 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 md:hidden"
          aria-label={tNav("openMenu")}
        >
          <Menu className="h-5 w-5" />
        </button>
      ) : null}

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-50">
          <div className="fixed right-0 top-0 h-full w-[280px] bg-white p-6 shadow-lg flex flex-col gap-6">
            <button onClick={() => setMobileOpen(false)} className="self-end">
              <X />
            </button>

            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((item) => {
                const isActive = isNavLinkActive(item.href);
                const isDisabled = isNavLinkDisabled(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-disabled={isDisabled}
                    tabIndex={isDisabled ? -1 : undefined}
                    onClick={(event) => {
                      if (isDisabled) {
                        event.preventDefault();
                        return;
                      }

                      setMobileOpen(false);
                    }}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                      isDisabled
                        ? "pointer-events-none cursor-not-allowed bg-gray-50 text-gray-300"
                        : isActive
                          ? "bg-primary text-white"
                          : "bg-gray-50 text-gray-800 hover:bg-primary/10"
                    }`}
                  >
                    {tNav(item.labelKey)}
                  </Link>
                );
              })}
            </div>

            <button
              onClick={() => {
                setMobileOpen(false);
                setTimeout(() => setSearchOpen(true), 150);
              }}
              aria-label={tNav("searchFood")}
              title={tNav("searchFood")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 text-primary"
            >
              <Search />
            </button>

            <BranchSwitcher
              presentation="navbar"
              className="w-full justify-between"
            />

            {showActiveGroupOrderLink ? (
              <Link
                href={activeGroupOrderHref}
                className="flex items-center gap-3 text-emerald-700"
              >
                <Users size={20} /> {tNav("activeGroupOrder")}
              </Link>
            ) : null}

            <Link
              href={tableReservationsEnabled ? "/reservetable" : "#"}
              aria-disabled={!tableReservationsEnabled}
              onClick={(event) => {
                if (!tableReservationsEnabled) {
                  event.preventDefault();
                }
              }}
              className={`flex items-center gap-3 text-primary ${
                tableReservationsEnabled ? "" : "cursor-not-allowed opacity-40"
              }`}
            >
              <Coffee size={20} /> {tNav("reserveTable")}
            </Link>

            <Link href="/checkout" className="flex items-center gap-3">
              <span className="relative">
                <ShoppingBag />
                {cartItemCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                ) : null}
              </span>
              {tNav("cart")}
            </Link>

            <LanguageSelector className="w-full justify-between" />

            {!isAuth && (
              <Link href="/auth/login" className="flex items-center gap-3">
                <User /> {tNav("login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
};

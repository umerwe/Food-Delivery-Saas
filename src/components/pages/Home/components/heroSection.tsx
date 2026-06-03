"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Loader2, Search, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import useItems from "@/hooks/useItems";
import { useAuth } from "@/hooks/useAuth";
import { getStoredRestaurantId } from "@/lib/auth";
import { resolveHttpsImageUrl } from "@/lib/image-fallback";

type HeroSectionProps = {
    restaurantName?: string;
    tagline?: string;
    heroImage?: string | null;
};

type SearchMode = "categories" | "items";

type HeroCategoryResult = {
    id: string;
    name: string;
    imageUrl?: string | null;
};

type HeroItemResult = {
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    basePrice?: string | number | null;
    category?: {
        name?: string | null;
    } | null;
};

const SEARCH_DELAY_MS = 400;
const SEARCH_LIMIT = 6;

const getSafeImageSrc = (src?: string | null) => {
    const trimmedSrc = src?.trim();

    if (!trimmedSrc) return null;

    if (trimmedSrc.startsWith("/")) return trimmedSrc;

    try {
        const parsedUrl = new URL(trimmedSrc);

        return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:" ? trimmedSrc : null;
    } catch {
        return null;
    }
};

const getResultInitial = (label?: string | null) => {
    const trimmedLabel = label?.trim();

    return trimmedLabel ? trimmedLabel.charAt(0).toUpperCase() : "?";
};

const getSearchResults = <T,>(response: unknown): T[] => {
    if (
        typeof response === "object" &&
        response !== null &&
        "data" in response &&
        Array.isArray((response as { data?: unknown }).data)
    ) {
        return (response as { data: T[] }).data;
    }

    return [];
};

const HeroSection = ({
    restaurantName,
    tagline,
    heroImage = "/hero.png",
}: HeroSectionProps) => {
    const t = useTranslations("home.hero");
    const router = useRouter();
    const { token, restaurantId: authRestaurantId, user, loading: authLoading } = useAuth();
    const { get } = useItems(token);
    const resolvedHeroImage = resolveHttpsImageUrl(heroImage, "/hero.png");
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const [searchMode, setSearchMode] = useState<SearchMode>("categories");
    const [searchValue, setSearchValue] = useState("");
    const [loadingResults, setLoadingResults] = useState(false);
    const [categoryResults, setCategoryResults] = useState<HeroCategoryResult[]>([]);
    const [itemResults, setItemResults] = useState<HeroItemResult[]>([]);

    const restaurantId = authRestaurantId || user?.restaurantId || getStoredRestaurantId() || "";
    const trimmedSearch = searchValue.trim();
    const activeResults = searchMode === "categories" ? categoryResults : itemResults;
    const displayRestaurantName = restaurantName || t("defaultTitle");
    const displayTagline = tagline || t("defaultTagline");

    const clearResults = () => {
        setCategoryResults([]);
        setItemResults([]);
        setLoadingResults(false);
    };

    const handleModeChange = (mode: SearchMode) => {
        setSearchMode(mode);
        clearResults();
    };

    const handleCategoryClick = (category: HeroCategoryResult) => {
        if (!category.id) return;

        router.push(`/items?categoryId=${encodeURIComponent(category.id)}`);
    };

    const handleItemClick = (item: HeroItemResult) => {
        if (!item.id) return;

        const params = new URLSearchParams({
            itemId: String(item.id),
        });

        if (item.slug) {
            params.set("slug", item.slug);
        }

        router.push(`/items/details?${params.toString()}`);
    };

    const handleFindFood = () => {
        const firstResult = activeResults[0];

        if (searchMode === "categories") {
            if (firstResult) {
                handleCategoryClick(firstResult as HeroCategoryResult);
                return;
            }

            router.push("/items");
            return;
        }

        if (firstResult) {
            handleItemClick(firstResult as HeroItemResult);
            return;
        }

        router.push("/items");
    };

    const renderResultImage = ({
        imageUrl,
        label,
        sizeClassName = "h-12 w-12",
    }: {
        imageUrl?: string | null;
        label: string;
        sizeClassName?: string;
    }) => {
        const safeImageSrc = getSafeImageSrc(imageUrl);

        return (
            <div className={`relative shrink-0 overflow-hidden rounded-xl bg-primary/10 ${sizeClassName}`}>
                {safeImageSrc ? (
                    <Image
                        src={safeImageSrc}
                        alt={label}
                        fill
                        className="object-cover"
                        sizes="48px"
                        unoptimized
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-primary">
                        {getResultInitial(label)}
                    </div>
                )}
            </div>
        );
    };

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (!trimmedSearch || !restaurantId || authLoading) {
            clearResults();
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                setLoadingResults(true);

                const params = new URLSearchParams({
                    restaurantId: String(restaurantId),
                    search: trimmedSearch,
                    page: "1",
                    limit: String(SEARCH_LIMIT),
                });

                const endpoint =
                    searchMode === "categories"
                        ? `/v1/menu/categories?${params.toString()}`
                        : `/v1/menu/items?${params.toString()}`;

                const response = await get(endpoint);

                if (searchMode === "categories") {
                    setCategoryResults(getSearchResults<HeroCategoryResult>(response));
                    setItemResults([]);
                } else {
                    setItemResults(getSearchResults<HeroItemResult>(response));
                    setCategoryResults([]);
                }
            } catch {
                clearResults();
            } finally {
                setLoadingResults(false);
            }
        }, SEARCH_DELAY_MS);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [authLoading, get, restaurantId, searchMode, trimmedSearch]);

    return (
        <main className="relative h-[630px] w-full flex items-center justify-center">
            <div className="absolute inset-0 z-0">
                <Image
                    src={resolvedHeroImage}
                    alt={t("heroImageAlt")}
                    fill
                    className="object-cover brightness-75"
                    priority
                />
            </div>

            <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center ml-0 md:ml-20">
                <h1 className="text-white text-5xl md:text-7xl font-extrabold mb-2 drop-shadow-md">
                    {displayRestaurantName}
                </h1>
                <p className="text-white text-[22px] font-medium mb-8">
                    {displayTagline}
                </p>

                <div className="bg-white rounded-2xl shadow-xl w-full p-6 md:p-8">
                    <div className="flex gap-4 mb-6">
                        <button
                            type="button"
                            onClick={() => handleModeChange("categories")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${searchMode === "categories"
                                ? "bg-primary/10 text-primary"
                                : "text-[#757575] hover:bg-gray-50"
                                }`}
                        >
                            <Coffee size={20} />
                            {t("categories")}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeChange("items")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all ${searchMode === "items"
                                ? "bg-primary/10 text-primary"
                                : "text-[#757575] hover:bg-gray-50"
                                }`}
                        >
                            <ShoppingBag size={20} />
                            {t("items")}
                        </button>
                    </div>

                    <div className="relative flex flex-col md:flex-row gap-3">
                        <div className="relative grow my-auto">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search size={20} className="text-primary" />
                            </div>
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(event) => setSearchValue(event.target.value)}
                                placeholder={searchMode === "categories" ? t("searchCategories") : t("searchItems")}
                                className="w-full bg-[#F5F5F5] border-none rounded-xl h-[49px] pl-12 pr-4 text-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleFindFood}
                            className="bg-primary hover:bg-[#d94e24] text-white px-10 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2"
                        >
                            <Search size={18} strokeWidth={3} />
                            {t("findFood")}
                        </button>

                        {(trimmedSearch || loadingResults) && (
                            <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-20 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.14)]">
                                {loadingResults ? (
                                    <div className="flex items-center justify-center gap-2 px-5 py-8 text-sm text-gray-500">
                                        <Loader2 size={16} className="animate-spin" />
                                        {t("searching", { mode: searchMode === "categories" ? t("categories").toLowerCase() : t("items").toLowerCase() })}
                                    </div>
                                ) : activeResults.length === 0 ? (
                                    <div className="px-5 py-8 text-center text-sm text-gray-500">
                                        {t("noneFound", { mode: searchMode === "categories" ? t("categories").toLowerCase() : t("items").toLowerCase() })}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {searchMode === "categories"
                                            ? categoryResults.map((category) => (
                                                <button
                                                    key={category.id}
                                                    type="button"
                                                    onClick={() => handleCategoryClick(category)}
                                                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-orange-50/50"
                                                >
                                                    {renderResultImage({
                                                        imageUrl: category.imageUrl,
                                                        label: category.name,
                                                    })}
                                                    <div className="min-w-0">
                                                        <h4 className="truncate text-sm font-semibold text-gray-900">
                                                            {category.name}
                                                        </h4>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {t("categoryFallback")}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))
                                            : itemResults.map((item) => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => handleItemClick(item)}
                                                    className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-orange-50/50"
                                                >
                                                    <div className="flex min-w-0 items-start gap-3">
                                                        {renderResultImage({
                                                            imageUrl: item.imageUrl,
                                                            label: item.name,
                                                        })}
                                                        <div className="min-w-0">
                                                            <h4 className="truncate text-sm font-semibold text-gray-900">
                                                                {item.name}
                                                            </h4>
                                                            <p className="mt-1 truncate text-xs text-gray-500">
                                                                {item.category?.name || item.description || t("menuItemFallback")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {item.basePrice ? (
                                                        <span className="shrink-0 text-sm font-semibold text-gray-900">
                                                            ${Number(item.basePrice).toFixed(2)}
                                                        </span>
                                                    ) : null}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}

export default HeroSection

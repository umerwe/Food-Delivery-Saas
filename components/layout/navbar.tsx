"use client"

import Image from "next/image"
import {
  Search,
  ShoppingBag,
  User,
  ChevronDown,
  LogOut,
  HelpCircle,
  ShoppingCart,
  Menu,
  X,
  Bell,
  Coffee,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/context/AuthContext"
import { useAuth } from "@/hooks/useAuth"
import useApi from "@/hooks/useApi"

type MenuItem = {
  id: string
  restaurantId: string
  categoryId: string
  name: string
  slug: string
  description: string
  imageUrl: string
  sku: string
  basePrice: string
  prepTimeMinutes: number
  dietaryFlags: string[]
  allergenFlags: string[]
  isActive: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  restaurant?: {
    id: string
    name: string
    slug: string
    logoUrl?: string
    coverImage?: string | null
  }
  category?: {
    id: string
    name: string
    slug: string
    imageUrl?: string
  }
  menuLinks?: Array<{
    id: string
    restaurantMenuId: string
    menuItemId: string
    sortOrder: number
    isActive: boolean
    createdAt: string
    updatedAt: string
    restaurantMenu?: {
      id: string
      name: string
      slug: string
      isActive: boolean
    }
  }>
  variations?: any[]
  modifierLinks?: any[]
  _count?: {
    variations: number
    modifierLinks: number
    menuLinks: number
  }
}

type SearchResponse = {
  success: boolean
  data: MenuItem[]
  message: string
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

const Navbar = () => {
  const { user, logout } = useAuthContext()
  const { token, loading: authLoading, restaurantId } = useAuth()
  const { get } = useApi(token)

  const isAuth = !!user
  const userName = `${user?.profile?.firstName || ""} ${user?.profile?.lastName || ""}`.trim()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<MenuItem[]>([])
  const [searchMeta, setSearchMeta] = useState<SearchResponse["meta"] | null>(null)

  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const navbarWrapRef = useRef<HTMLDivElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const router = useRouter()

  const getSafeImageSrc = (src?: string | null) => {
    if (!src || typeof src !== "string") return "/placeholder-food.png"

    const trimmed = src.trim()
    if (!trimmed) return "/placeholder-food.png"

    if (trimmed.startsWith("/")) return trimmed

    try {
      const parsed = new URL(trimmed)
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return trimmed
      }
      return "/placeholder-food.png"
    } catch {
      return "/placeholder-food.png"
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false)
      }

      if (navbarWrapRef.current && !navbarWrapRef.current.contains(target)) {
        setSearchOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 120)

      return () => clearTimeout(timer)
    }
  }, [searchOpen])

  const handleLogout = () => {
    logout()
    toast.success("Logged out successfully")
    setDropdownOpen(false)
    router.push("/auth/login")
  }

  const clearSearchState = () => {
    setSearchValue("")
    setSearchResults([])
    setSearchMeta(null)
    setSearchLoading(false)
  }

  const handleToggleSearch = () => {
    setSearchOpen((prev) => {
      const next = !prev
      if (!next) {
        clearSearchState()
      }
      return next
    })
  }

  const handleSearchItemClick = (item: MenuItem) => {
    setSearchOpen(false)
    clearSearchState()
    router.push(`/items/details?itemId=${item.id}&slug=${item.slug}`)
  }

  const fetchMenuItems = async (keyword: string) => {
    const trimmedKeyword = keyword.trim()

    if (!trimmedKeyword || !restaurantId || authLoading) {
      setSearchResults([])
      setSearchMeta(null)
      setSearchLoading(false)
      return
    }

    try {
      setSearchLoading(true)

      const response = (await get(
        `/v1/menu/items?search=${encodeURIComponent(trimmedKeyword)}&restaurantId=${encodeURIComponent(
          restaurantId
        )}`
      )) as SearchResponse

      if (response?.success) {
        setSearchResults(Array.isArray(response.data) ? response.data : [])
        setSearchMeta(response.meta || null)
      } else {
        setSearchResults([])
        setSearchMeta(null)
      }
    } catch (error) {
      console.error("Search menu items error:", error)
      setSearchResults([])
      setSearchMeta(null)
      toast.error("Failed to search menu items")
    } finally {
      setSearchLoading(false)
    }
  }

  useEffect(() => {
    if (!searchOpen) return

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchValue.trim()) {
      setSearchResults([])
      setSearchMeta(null)
      setSearchLoading(false)
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchMenuItems(searchValue)
    }, 400)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchValue, searchOpen, restaurantId, authLoading])

  return (
    <>
      <div ref={navbarWrapRef} className="relative z-30">
        {/* NAVBAR */}
        <nav className="flex items-center justify-between px-6 2xl:px-40 py-6">
          {/* LEFT - LOGO */}
          <Link href="/" className="relative w-[160px] h-[32px]">
            <Image
              src="/nav-logo.png"
              alt="Logo"
              fill
              className="object-contain"
            />
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden md:flex items-center gap-10 font-medium text-[#555]">
            {/* Search */}
            <button
              onClick={handleToggleSearch}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Search size={18} className="text-primary font-semibold" />
              <span className="font-semibold">Search Food</span>
            </button>

            {/* Reserve */}
            <Link href="/reservetable" className="flex items-center gap-2 hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M9.99984 7.91797C14.6022 7.91797 18.3332 6.79868 18.3332 5.41797C18.3332 4.03726 14.6022 2.91797 9.99984 2.91797C5.39746 2.91797 1.6665 4.03726 1.6665 5.41797C1.6665 6.79868 5.39746 7.91797 9.99984 7.91797Z" fill="#CE181B" stroke="#CE181B" strokeWidth="1.25" />
                <path d="M9.99992 17.0859C10.649 17.0906 11.2847 16.9008 11.8249 16.5409C11.9448 16.4565 12.0301 16.3315 12.0652 16.1891C12.1003 16.0467 12.0827 15.8964 12.0158 15.7659C11.7274 15.2176 11.1083 14.5859 9.99992 14.5859C8.89159 14.5859 8.27242 15.2193 7.98409 15.7651C7.91713 15.8956 7.89957 16.0459 7.93464 16.1883C7.9697 16.3307 8.05503 16.4556 8.17492 16.5401C8.67492 16.8818 9.30992 17.0859 9.99992 17.0859Z" fill="#CE181B" stroke="#CE181B" strokeWidth="1.25" strokeLinejoin="round" />
                <path d="M10 14.5846V7.91797" stroke="#CE181B" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-primary font-semibold">Reserve a Table</span>
            </Link>

            {/* Cart */}
            <Link
              href="/checkout"
              className="flex items-center gap-2 hover:text-primary"
            >
              <ShoppingBag size={18} className="text-primary" />
              <span className="text-primary font-semibold">Cart</span>
            </Link>

            {/* USER */}
            {isAuth ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-primary cursor-pointer"
                >
                  <User size={18} fill="currentColor" />
                  <span className="font-semibold">{userName}</span>
                  <ChevronDown size={16} />
                </button>

                {dropdownOpen && (
                  <div
                    style={{ zIndex: "99999" }}
                    className="absolute right-0 mt-4 w-[300px] rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-4 bg-gray-100">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden">
                        <Image
                          src={
                            user?.profile?.avatarUrl?.startsWith("http")
                              ? user.profile.avatarUrl
                              : "/profile-user.png"
                          }
                          alt="avatar"
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {userName || "User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="py-2">
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100">
                            <User size={16} />
                          </div>
                          <span className="text-sm text-gray-700">My Profile</span>
                        </div>
                        <ChevronDown className="rotate-[-90deg]" size={16} />
                      </Link>

                      <Link
                        href="/orders-history"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100">
                            <ShoppingCart size={16} />
                          </div>
                          <span className="text-sm text-gray-700">My Orders</span>
                        </div>
                        <ChevronDown className="rotate-[-90deg]" size={16} />
                      </Link>

                      <Link
                        href="/reservations"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100">
                            <Coffee size={16} />
                          </div>
                          <span className="text-sm text-gray-700">My Reservations</span>
                        </div>
                        <ChevronDown className="rotate-[-90deg]" size={16} />
                      </Link>

                      <Link
                        href="/notifications"
                        onClick={() => setDropdownOpen(false)}
                        className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100">
                            <Bell size={16} />
                          </div>
                          <span className="text-sm text-gray-700">Notifications</span>
                        </div>
                        <ChevronDown className="rotate-[-90deg]" size={16} />
                      </Link>

                      <Link
                        href="/contact"
                        onClick={() => setDropdownOpen(false)}
                        className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100">
                            <HelpCircle size={16} />
                          </div>
                          <span className="text-sm text-gray-700">Help Center</span>
                        </div>
                        <ChevronDown className="rotate-[-90deg]" size={16} />
                      </Link>
                    </div>

                    <div className="border-t border-gray-200" />

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-4 text-sm hover:bg-red-50"
                    >
                      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100">
                        <LogOut size={16} />
                      </div>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 text-primary"
              >
                <User size={18} />
                Login
              </Link>
            )}
          </div>

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden"
          >
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
                placeholder="Search burgers, bowls, drinks..."
                className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />

              {searchValue && (
                <button
                  onClick={clearSearchState}
                  className="text-sm font-medium text-gray-400 hover:text-primary"
                >
                  Clear
                </button>
              )}

              <button
                onClick={() => {
                  setSearchOpen(false)
                  clearSearchState()
                }}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {searchLoading ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500">
                  Searching menu items...
                </div>
              ) : !searchValue.trim() ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500">
                  Start typing to search food items
                </div>
              ) : searchResults.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500">
                  No menu items found
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
                              {item.category?.name || "Uncategorized"}
                            </p>
                          </div>

                          <div className="shrink-0 text-sm font-semibold text-gray-900">
                            ${Number(item.basePrice || 0).toFixed(2)}
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
                              {item.prepTimeMinutes} min
                            </span>
                          ) : null}

                          {item.menuLinks?.[0]?.restaurantMenu?.name ? (
                            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-primary">
                              {item.menuLinks[0].restaurantMenu.name}
                            </span>
                          ) : null}

                          {!item.isActive ? (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-600">
                              Inactive
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
                  Showing {searchResults.length} of {searchMeta.total} results
                </span>
                <span>
                  Page {searchMeta.page} of {searchMeta.totalPages}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-50">
          <div className="fixed right-0 top-0 h-full w-[280px] bg-white p-6 shadow-lg flex flex-col gap-6">
            <button
              onClick={() => setMobileOpen(false)}
              className="self-end"
            >
              <X />
            </button>

            <button
              onClick={() => {
                setMobileOpen(false)
                setTimeout(() => setSearchOpen(true), 150)
              }}
              className="flex items-center gap-3"
            >
              <Search /> Search Food
            </button>

            <Link href="/reservetable" className="flex items-center gap-3 text-primary">
              <span>🍽️</span> Reserve a Table
            </Link>

            <Link href="/checkout" className="flex items-center gap-3">
              <ShoppingBag /> Cart
            </Link>

            {!isAuth && (
              <Link href="/auth/login" className="flex items-center gap-3">
                <User /> Login
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar
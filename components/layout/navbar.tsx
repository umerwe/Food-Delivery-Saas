"use client"

import Image from "next/image"
import {
  Search,
  ShoppingBag,
  User,
  ChevronDown,
  LogOut,
  HelpCircle,
  Settings,
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

const Navbar = () => {
  const { user, logout } = useAuthContext()
  const isAuth = !!user
  const userName = `${user?.profile?.firstName || ""} ${user?.profile?.lastName || ""}`.trim()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    toast.success("Logged out successfully")
    setDropdownOpen(false)
    router.push("/auth/login")
  }

  return (
    <>
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 2xl:px-40 py-6  ">

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
          <button className="flex items-center gap-2 hover:text-primary">
            <Search size={18} className="text-primary font-semibold" />
            <span className="font-semibold">Search Food</span>
          </button>

          {/* Reserve */}
          <Link href="/reservetable" className="flex items-center gap-2 hover:text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M9.99984 7.91797C14.6022 7.91797 18.3332 6.79868 18.3332 5.41797C18.3332 4.03726 14.6022 2.91797 9.99984 2.91797C5.39746 2.91797 1.6665 4.03726 1.6665 5.41797C1.6665 6.79868 5.39746 7.91797 9.99984 7.91797Z" fill="#EC5834" stroke="#EC5834" strokeWidth="1.25"/>
  <path d="M9.99992 17.0859C10.649 17.0906 11.2847 16.9008 11.8249 16.5409C11.9448 16.4565 12.0301 16.3315 12.0652 16.1891C12.1003 16.0467 12.0827 15.8964 12.0158 15.7659C11.7274 15.2176 11.1083 14.5859 9.99992 14.5859C8.89159 14.5859 8.27242 15.2193 7.98409 15.7651C7.91713 15.8956 7.89957 16.0459 7.93464 16.1883C7.9697 16.3307 8.05503 16.4556 8.17492 16.5401C8.67492 16.8818 9.30992 17.0859 9.99992 17.0859Z" fill="#EC5834" stroke="#EC5834" strokeWidth="1.25" strokeLinejoin="round"/>
  <path d="M10 14.5846V7.91797" stroke="#EC5834" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
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

              {/* 🔽 KEEPING YOUR DROPDOWN EXACTLY SAME */}
              {dropdownOpen && (
                <div
                  style={{ zIndex: "99999" }}
                  className="absolute right-0 mt-4 w-[300px] rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden"
                >
                  {/* HEADER */}
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

                    <Link href="/notifications" onClick={() => setDropdownOpen(false)} className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100">
                          <Bell size={16} />
                        </div>
                        <span className="text-sm text-gray-700">Notifications</span>
                      </div>
                      <ChevronDown className="rotate-[-90deg]" size={16} />
                    </Link>

                    <Link href="/contact" onClick={() => setDropdownOpen(false)} className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50">
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

            <button className="flex items-center gap-3">
              <Search /> Search Food
            </button>

            <button className="flex items-center gap-3 text-primary">
              🍽️ Reserve a Table
            </button>

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
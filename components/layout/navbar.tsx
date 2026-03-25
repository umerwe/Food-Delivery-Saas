"use client"

import Image from "next/image"
import { Search, ShoppingBag, User, ChevronDown, LogOut, HelpCircle, Settings } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/context/AuthContext"

const Navbar = () => {
 const { user, logout } = useAuthContext();

const isAuth = !!user;
const userName = `${user?.profile?.firstName || ""} ${user?.profile?.lastName || ""}`.trim();
  const [dropdownOpen, setDropdownOpen] = useState(false)

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
logout();
toast.success("Logged out successfully");

setDropdownOpen(false);
router.push("/auth/login");
  }

  return (
    <nav className="flex items-center justify-between px-6 2xl:px-46 py-4">

      {/* Logo */}
      <div className="flex items-center gap-2">
        <Link href="/" className="relative w-[190px] h-[36.77px]">
          <Image
            src="/nav-logo.png"
            alt="Logo"
            fill
            className="object-contain"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex text-lg items-center gap-8 font-semibold text-[#424242]">

        {/* Search */}
        <button className="flex items-center gap-2 hover:text-primary transition-colors">
          <Search size={20} className="text-primary" strokeWidth={3} />
          Search Food
        </button>

        {/* Cart */}
        <Link
          href="/checkout"
          className="flex items-center text-primary gap-2 hover:text-primary transition-colors"
        >
          <ShoppingBag size={20} strokeWidth={3} />
          Cart
        </Link>

        {/* User */}
        {isAuth ? (
          <div ref={dropdownRef} className="relative">

            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-primary hover:text-primary transition-colors cursor-pointer"
            >
              <User size={20} strokeWidth={3} fill="currentColor" />
              <span>{userName}</span>
              <ChevronDown size={16} />
            </button>

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

    {/* MENU */}
    <div className="py-2">

      <Link
        href="/profile"
        onClick={() => setDropdownOpen(false)}
        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100">
            <User size={16} />
          </div>
          <span className="text-sm text-gray-700">My Profile</span>
        </div>
        <ChevronDown className="rotate-[-90deg]" size={16} />
      </Link>

      <button
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100">
            <Settings size={16} />
          </div>
          <span className="text-sm text-gray-700">Account Settings</span>
        </div>
        <ChevronDown className="rotate-[-90deg]" size={16} />
      </button>

      <button
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100">
            <HelpCircle size={16} />
          </div>
          <span className="text-sm text-gray-700">Help Center</span>
        </div>
        <ChevronDown className="rotate-[-90deg]" size={16} />
      </button>
    </div>

    {/* DIVIDER */}
    <div className="border-t border-gray-200" />

    {/* LOGOUT */}
    <button
      onClick={handleLogout}
      className="flex w-full items-center gap-3 px-4 py-4 text-sm text-gray-700 hover:bg-red-50 transition"
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
            className="flex items-center text-primary gap-2 hover:text-primary transition-colors"
          >
            <User size={20} strokeWidth={3} />
            Login
          </Link>
        )}

      </nav>
    </nav>
  )
}

export default Navbar
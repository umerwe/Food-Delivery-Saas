"use client"

import Image from "next/image"
import { Search, ShoppingBag, User, ChevronDown, LogOut } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const Navbar = () => {
  const [isAuth, setIsAuth] = useState(false)
  const [userName, setUserName] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

const loadUser = () => {
  const authRaw = localStorage.getItem("auth")

  if (!authRaw) {
    setIsAuth(false)
    setUserName("")
    return
  }

  try {
    const auth = JSON.parse(authRaw)

    const firstName = auth?.user?.profile?.firstName || ""
    const lastName = auth?.user?.profile?.lastName || ""

    setUserName(`${firstName} ${lastName}`.trim())
    setIsAuth(true)
  } catch (err) {
    console.error("Invalid auth data", err)
  }
}

useEffect(() => {
  loadUser()

  const handleAuthUpdate = () => loadUser()

  window.addEventListener("authUpdated", handleAuthUpdate)
  window.addEventListener("storage", handleAuthUpdate)

  return () => {
    window.removeEventListener("authUpdated", handleAuthUpdate)
    window.removeEventListener("storage", handleAuthUpdate)
  }
}, [])
  // close dropdown if clicked outside
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
    localStorage.removeItem("auth")

    toast.success("Logged out successfully")

    setDropdownOpen(false)
    setIsAuth(false)

    router.push("/auth/login")
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
              <div  style={{zIndex:'99999'}} className="absolute right-0 mt-3 w-[180px] rounded-xl bg-white shadow-lg border border-gray-100 overflow-hidden">

                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50 transition"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User size={16} />
                  Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-red-50 text-red-600 transition"
                >
                  <LogOut size={16} />
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
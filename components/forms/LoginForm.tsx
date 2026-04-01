"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook } from "react-icons/fa"
import { roboto } from "@/lib/fonts"
import { toast } from "sonner"
import { API_BASE_URL } from "@/lib/constants"
import { Checkbox } from "../ui/checkbox"
import { useAuthContext } from "@/context/AuthContext"

export default function LoginForm() {
  const router = useRouter()
  const { login } = useAuthContext()

  const [isLoading, setIsLoading] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(false)

  // Normal Login State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    restaurantId: "",
  })

  // Guest State
  const [guestData, setGuestData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    restaurantId: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (isGuestMode) {
      setGuestData((prev) => ({
        ...prev,
        [name]: value,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  // ================= NORMAL LOGIN =================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password || !formData.restaurantId) {
      toast.error("Please fill all fields")
      return
    }

    try {
      setIsLoading(true)

      const res = await fetch(`${API_BASE_URL}/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Login failed")
      }

      login(data.data)

      toast.success("Login successful")

      setTimeout(() => router.push("/"), 1000)
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  // ================= GUEST LOGIN =================
  const handleGuestLogin = async () => {
    if (
      !guestData.firstName ||
      !guestData.lastName ||
      !guestData.phone ||
      !guestData.restaurantId
    ) {
      toast.error("Please fill all guest fields")
      return
    }

    try {
      setIsLoading(true)

      const res = await fetch(`${API_BASE_URL}/v1/auth/register-guest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(guestData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Guest login failed")
      }

      login(data.data)

      toast.success("Guest session started")

      setTimeout(() => router.push("/"), 1000)
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full lg:mr-[79px]">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-headline-sm font-bold font-roboto text-primary">
          {isGuestMode ? "Guest Login" : "Login"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isGuestMode
            ? "Continue as guest"
            : "Please, fill in this form to login"}
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="space-y-[16px] mt-[35px] mb-[19px]"
      >
        {isGuestMode ? (
          <>
            <Input
              name="firstName"
              placeholder="First Name"
              value={guestData.firstName}
              onChange={handleChange}
            />
            <Input
              name="lastName"
              placeholder="Last Name"
              value={guestData.lastName}
              onChange={handleChange}
            />
            <Input
              name="phone"
              placeholder="Phone"
              value={guestData.phone}
              onChange={handleChange}
            />
            <Input
              name="restaurantId"
              placeholder="Restaurant Id"
              value={guestData.restaurantId}
              onChange={handleChange}
            />

            <Button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full h-[50px] text-lg font-semibold bg-primary text-white"
            >
              {isLoading ? "Starting..." : "Sign in as Guest"}
            </Button>
          </>
        ) : (
          <>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
            <Input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
            <Input
              name="restaurantId"
              placeholder="Restaurant Id"
              value={formData.restaurantId}
              onChange={handleChange}
            />

            <div className="flex items-center justify-between text-sm my-7">
              <label className="flex items-center gap-2 cursor-pointer text-gray-500">
                <Checkbox checked />
                Remember me
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-[50px] text-lg font-semibold bg-primary text-white"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </>
        )}
      </form>

      {/* SOCIAL + GUEST TOGGLE */}
      <div className="space-y-5 flex flex-col items-center">
        <button
          type="button"
          className="w-[345px] flex items-center justify-center h-[54px] bg-blue text-white rounded-[10px]"
        >
          <FaFacebook className="w-[23px] h-[23px] mr-[15px]" />
          <span className={`${roboto.className} text-xl`}>
            Sign In with Facebook
          </span>
        </button>

        <button
          type="button"
        className="w-[345px] flex items-center justify-center h-[54px] font-medium bg-transparent rounded-[10px] hover:bg-gray-100 shadow-sm border border-gray-200"
        >
          <FcGoogle className="w-[24px] h-[24px] mr-[15px]" />
          <span className={`${roboto.className} text-xl text-gray-500`}>
            Sign In with Google
          </span>
        </button>

        {/* ✅ GUEST BUTTON */}
        <button
          type="button"
          onClick={() => setIsGuestMode(true)}
          className="text-primary underline text-sm"
        >
          Sign in as Guest
        </button>

        {/* BACK TO LOGIN */}
        {isGuestMode && (
          <button
            type="button"
            onClick={() => setIsGuestMode(false)}
            className="text-gray-500 text-sm underline"
          >
            Back to Login
          </button>
        )}
      </div>

      {/* SIGNUP */}
      <p className="text-center text-sm text-muted-foreground mt-[40px]">
        Don't have an account?{" "}
        <Link href="/auth/signup" className="text-blue hover:underline">
          Sign up now
        </Link>
      </p>
    </div>
  )
}
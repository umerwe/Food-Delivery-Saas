"use client"

import type React from "react"
import { toast } from "sonner"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook } from "react-icons/fa"
import { roboto } from "@/lib/fonts"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/constants"

export default function SignUpForm() {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [accessToken, setAccessToken] = useState("")
  const [otp, setOtp] = useState("")
  const [showOtpField, setShowOtpField] = useState(false)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    restaurantId: "",
    tenantId: "",
    acceptTerms: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  /* ================= REGISTER ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (!formData.acceptTerms) {
      toast.error("Please accept the terms and privacy policy")
      return
    }

    try {
      setIsLoading(true)

      const res = await fetch(`${API_BASE_URL}/v1/auth/register-customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          restaurantId: formData.restaurantId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "Registration failed")
      }

      const token = data?.data?.accessToken

      if (!token) {
        throw new Error("Access token not received")
      }

      /* ===== SAVE TOKEN ===== */

      setAccessToken(token)
      localStorage.setItem("signupAccessToken", token)

      toast.success("Account created! Please verify your email")

      /* ===== SWITCH TO OTP MODE ===== */

      setShowOtpField(true)

    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  /* ================= VERIFY EMAIL ================= */

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    const token = accessToken || localStorage.getItem("signupAccessToken")

    if (!otp) {
      toast.error("Please enter OTP")
      return
    }

    if (!token) {
      toast.error("Missing access token")
      return
    }

    try {
      setIsVerifying(true)

      const res = await fetch(`${API_BASE_URL}/v1/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          otp: otp,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.message || "OTP verification failed")
      }

      toast.success("Email verified successfully!")

      localStorage.removeItem("signupAccessToken")

      setTimeout(() => {
        router.push("/auth/login")
      }, 1200)

    } catch (error: any) {
      toast.error(error.message || "Verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="w-full lg:mr-[79px]">

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-headline-sm font-bold font-roboto text-primary">
          {showOtpField ? "Verify Email" : "Sign Up"}
        </h1>

        <p className="text-sm text-muted-foreground">
          {showOtpField
            ? "Enter the OTP sent to your email"
            : "Please, fill in this form to sign up"}
        </p>
      </div>

      {/* ================= OTP VIEW ================= */}

      {showOtpField ? (
        <form onSubmit={handleVerifyOtp} className="space-y-6 my-6">

          <Input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          <Button
            type="submit"
            disabled={isVerifying}
            className="w-full h-[50px] text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-base"
          >
            {isVerifying ? "Verifying..." : "Verify Email"}
          </Button>

        </form>
      ) : (

      /* ================= SIGNUP VIEW ================= */

      <form onSubmit={handleSubmit} className="space-y-4 my-6">

        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            name="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
          <Input
            name="lastName"
            placeholder="Last name"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        {/* Email */}
        <Input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        {/* Phone */}
        <Input
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
        />

        {/* Restaurant */}
        <Input
          name="restaurantId"
          placeholder="Restaurant ID"
          value={formData.restaurantId}
          onChange={handleChange}
          required
        />

        {/* Password */}
        <Input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {/* Confirm Password */}
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        />

        {/* Terms */}
        <div className="flex items-center gap-2 py-[9.5px]">
          <Checkbox
            checked={formData.acceptTerms}
            className="border-gray-400 border-2 rounded-none"
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, acceptTerms: checked as boolean }))
            }
          />
          <label className="text-sm text-gray-500">
            I accept the{" "}
            <Link href="#" className="hover:underline">Terms</Link>
            {" & "}
            <Link href="#" className="hover:underline">Privacy Policy</Link>
          </label>
        </div>

        {/* Signup */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-[50px] text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-base"
        >
          {isLoading ? "Signing up..." : "Sign Up"}
        </Button>

      </form>
      )}

      {/* Social Buttons */}
      {!showOtpField && (
        <div className="space-y-9 flex flex-col items-center">

          <Link
            href="/auth/login"
            className="w-[345px] flex items-center justify-center h-[54px] font-medium bg-blue rounded-[10px] hover:bg-blue/90 text-white shadow-lg"
          >
            <FaFacebook className="w-[23px] h-[23px] mr-[15px]" />
            <span className={`${roboto.className} font-medium text-xl`}>
              SignIn with Facebook
            </span>
          </Link>

          <Link
            href="/auth/login"
            className="w-[345px] flex items-center justify-center h-[54px] font-medium bg-transparent rounded-[10px] hover:bg-gray-100 shadow-sm border border-gray-200"
          >
            <FcGoogle className="w-[24px] h-[24px] mr-[15px]" />
            <p className={`${roboto.className} font-medium text-xl text-gray-500`}>
              Sign In with Google
            </p>
          </Link>

        </div>
      )}

      {/* Login Link */}
      {!showOtpField && (
        <p className="text-center text-sm text-muted-foreground mt-2">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue hover:underline">
            Login now
          </Link>
        </p>
      )}
    </div>
  )
}
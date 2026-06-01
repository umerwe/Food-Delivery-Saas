"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { FaFacebook } from "react-icons/fa"
import { FcGoogle } from "react-icons/fc"
import { toast } from "sonner"

import { MUTED_TEXT_CLASS } from "@/components/common/common-classes"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { getAuthErrorMessage } from "@/lib/auth"
import { clearSignupAccessToken, getSignupAccessToken, setSignupAccessToken } from "@/lib/cart"
import { roboto } from "@/lib/fonts"
import { signupCustomer, verifySignupOtp } from "@/services/auth"
import {
  signupSchema,
  type SignupFormValues,
} from "@/validations/auth"

export default function SignUpForm() {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [accessToken, setAccessToken] = useState("")
  const [otp, setOtp] = useState("")
  const [showOtpField, setShowOtpField] = useState(false)

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      restaurantId: "",
      tenantId: "",
      acceptTerms: false,
    },
  })

  /* ================= REGISTER ================= */

  const handleSubmit = async (values: SignupFormValues) => {
    try {
      setIsLoading(true)

      const data = await signupCustomer({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        restaurantId: values.restaurantId,
      })

      const token = data.accessToken

      if (!token) {
        throw new Error("Access token not received")
      }

      /* ===== SAVE TOKEN ===== */

      setAccessToken(token)
      setSignupAccessToken(token)

      toast.success("Account created! Please verify your email")

      /* ===== SWITCH TO OTP MODE ===== */

      setShowOtpField(true)

    } catch (error) {
      toast.error(getAuthErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  /* ================= VERIFY EMAIL ================= */

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()

    const token = accessToken || getSignupAccessToken()

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

      await verifySignupOtp({
        otp: otp,
      }, token)

      toast.success("Email verified successfully!")

      clearSignupAccessToken()

      setTimeout(() => {
        router.push("/auth/login")
      }, 1200)

    } catch (error) {
      toast.error(getAuthErrorMessage(error, "Verification failed"))
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="w-full lg:mr-[79px]">


      <div className="space-y-1">
        <h1 className="text-headline-sm font-bold font-roboto text-primary">
          {showOtpField ? "Verify Email" : "Sign Up"}
        </h1>

        <p className={MUTED_TEXT_CLASS}>
          {showOtpField
            ? "Enter the OTP sent to your email"
            : "Please, fill in this form to sign up"}
        </p>
      </div>

      {/* ================= OTP VIEW ================= */}

      {showOtpField ? (
        <form onSubmit={handleVerifyOtp} className="space-y-6 my-6">

          <Input
            id="otp"
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

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 my-6" noValidate>

        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="firstName"
            placeholder="First name"
            required
            {...form.register("firstName")}
          />
          <Input
            id="lastName"
            placeholder="Last name"
            required
            {...form.register("lastName")}
          />
        </div>

        {/* Email */}
        <Input
          id="email"
          type="email"
          placeholder="Email"
          required
          {...form.register("email")}
        />

        {/* Phone */}
        <Input
          id="phone"
          placeholder="Phone"
          {...form.register("phone")}
        />

        {/* Restaurant */}
        <Input
          id="restaurantId"
          placeholder="Restaurant ID"
          required
          {...form.register("restaurantId")}
        />

        {/* Password */}
        <Input
          id="password"
          type="password"
          placeholder="Password"
          required
          {...form.register("password")}
        />

        {/* Confirm Password */}
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          required
          {...form.register("confirmPassword")}
        />

        {/* Terms */}
        <div className="flex items-center gap-2 py-[9.5px]">
          <Checkbox
            checked={form.watch("acceptTerms")}
            className="border-gray-400 border-2 rounded-none"
            onCheckedChange={(checked) =>
              form.setValue("acceptTerms", checked === true, { shouldValidate: true })
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
